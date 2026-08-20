'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from '../components/Header';
import { SearchBar } from '../components/SearchBar';
import { FilterBar } from '../components/FilterBar';
import { ActiveFilterChips } from '../components/ActiveFilterChips';
import { StoreCard } from '../components/StoreCard';
import { StoreDetailModal } from '../components/StoreDetailModal';
import { Toast } from '../components/Toast';
import { searchStores, getLocationMeta, getBrands, getHealthStatus } from '../lib/api';
import { StoreItem, LocationMetaResponse, Brand } from '../lib/types';
import { requestUserLocation, GeoLocation } from '../lib/geo';
import { Search, MapPinOff, Layers, Compass, ChevronLeft, ChevronRight } from 'lucide-react';

const PAGE_SIZE = 24;

export default function HomePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [selectedProvince, setSelectedProvince] = useState('全部');
  const [selectedCity, setSelectedCity] = useState('全部');
  const [selectedDistrict, setSelectedDistrict] = useState('全部');

  // Geo Proximity State
  const [userGeo, setUserGeo] = useState<GeoLocation | null>(null);
  const [isNearbyMode, setIsNearbyMode] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);

  const [stores, setStores] = useState<StoreItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [processingTime, setProcessingTime] = useState(0);
  const [engine, setEngine] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  const [locationMeta, setLocationMeta] = useState<LocationMetaResponse | null>(null);
  const [brands, setBrands] = useState<Brand[]>([]);

  // Modal & Toast State
  const [activeDetailStore, setActiveDetailStore] = useState<StoreItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const isInitialUrlHydrated = useRef(false);

  // Read URL query params on mount for deep-linking
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q') || '';
    const b = params.get('brand') || 'all';
    const p = params.get('province') || '全部';
    const c = params.get('city') || '全部';
    const d = params.get('district') || '全部';
    const pageParam = parseInt(params.get('page') || '1', 10);

    if (q) setSearchTerm(q);
    if (b) setSelectedBrand(b);
    if (p) setSelectedProvince(p);
    if (c) setSelectedCity(c);
    if (d) setSelectedDistrict(d);
    if (pageParam > 1) setCurrentPage(pageParam);

    isInitialUrlHydrated.current = true;
  }, []);

  // Debounce search input (150ms for instant feel)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchTerm);
      setCurrentPage(1); // Reset page on new search
    }, 150);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Initial metadata fetch (Brands and Health status)
  useEffect(() => {
    Promise.all([getBrands(), getHealthStatus()])
      .then(([brandData, healthData]) => {
        setBrands(brandData);
        if (healthData?.meilisearch?.status?.includes('online')) {
          setEngine('meilisearch');
        } else {
          setEngine('database_fallback');
        }
      })
      .catch((err) => console.error('Failed to load initial metadata', err));
  }, []);

  // Dynamically update location metadata and store counts whenever selectedBrand changes
  useEffect(() => {
    getLocationMeta(selectedBrand)
      .then((locData) => {
        setLocationMeta(locData);
        // Check if previously selected province/city/district is still valid
        if (selectedProvince !== '全部') {
          const provExists = locData.provinces.some((p) => p.name === selectedProvince);
          if (!provExists) {
            setSelectedProvince('全部');
            setSelectedCity('全部');
            setSelectedDistrict('全部');
          } else if (selectedCity !== '全部') {
            const currentProv = locData.provinces.find((p) => p.name === selectedProvince);
            const cityObj = currentProv?.cities.find((c) => c.name === selectedCity);
            if (!cityObj) {
              setSelectedCity('全部');
              setSelectedDistrict('全部');
            } else if (selectedDistrict !== '全部') {
              if (!cityObj.districts.includes(selectedDistrict)) {
                setSelectedDistrict('全部');
              }
            }
          }
        }
      })
      .catch((err) => console.error('Failed to load brand location metadata', err));
  }, [selectedBrand]);

  // Keep browser URL query params updated
  useEffect(() => {
    if (!isInitialUrlHydrated.current || typeof window === 'undefined') return;
    const params = new URLSearchParams();
    if (debouncedQuery.trim()) params.set('q', debouncedQuery.trim());
    if (selectedBrand !== 'all') params.set('brand', selectedBrand);
    if (selectedProvince !== '全部') params.set('province', selectedProvince);
    if (selectedCity !== '全部') params.set('city', selectedCity);
    if (selectedDistrict !== '全部') params.set('district', selectedDistrict);
    if (currentPage > 1) params.set('page', currentPage.toString());

    const queryString = params.toString();
    const newUrl = queryString ? `?${queryString}` : window.location.pathname;
    window.history.replaceState(null, '', newUrl);
  }, [debouncedQuery, selectedBrand, selectedProvince, selectedCity, selectedDistrict, currentPage]);

  // Handle Nearby Proximity Toggle
  const handleToggleNearby = async () => {
    if (isNearbyMode) {
      setIsNearbyMode(false);
      return;
    }

    if (userGeo) {
      setIsNearbyMode(true);
      setToastMessage('📍 已按距您当前位置由近到远排序');
      return;
    }

    setIsLocating(true);
    try {
      const geo = await requestUserLocation();
      setUserGeo(geo);
      setIsNearbyMode(true);
      setToastMessage('📍 定位成功！已为您按距离优先展示附近门店');
    } catch (err: any) {
      setToastMessage(err.message || '定位失败，请在浏览器中开启定位权限');
    } finally {
      setIsLocating(false);
    }
  };

  // Fetch search results whenever filters, query, or nearby mode changes
  const executeSearch = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await searchStores({
        q: debouncedQuery,
        brand: selectedBrand,
        province: selectedProvince,
        city: selectedCity,
        district: selectedDistrict,
        lat: userGeo?.lat,
        lng: userGeo?.lng,
        sort_by_distance: isNearbyMode,
        page: currentPage,
        limit: PAGE_SIZE,
      });
      setStores(res.items);
      setTotalCount(res.total);
      setProcessingTime(res.processing_time_ms);
      setEngine(res.engine);
    } catch (err) {
      console.error('Search request failed', err);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedQuery, selectedBrand, selectedProvince, selectedCity, selectedDistrict, isNearbyMode, userGeo, currentPage]);

  useEffect(() => {
    executeSearch();
  }, [executeSearch]);

  const handleCopyPhone = (phone: string) => {
    navigator.clipboard.writeText(phone);
    setToastMessage(`已复制电话: ${phone}`);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setDebouncedQuery('');
    setSelectedBrand('all');
    setSelectedProvince('全部');
    setSelectedCity('全部');
    setSelectedDistrict('全部');
    setIsNearbyMode(false);
    setCurrentPage(1);
  };

  const isFiltered = Boolean(
    searchTerm ||
      selectedBrand !== 'all' ||
      selectedProvince !== '全部' ||
      selectedCity !== '全部' ||
      selectedDistrict !== '全部' ||
      isNearbyMode
  );

  const totalPages = Math.ceil(totalCount / PAGE_SIZE) || 1;

  return (
    <div className="flex flex-col min-h-screen">
      <Header engine={engine} totalStores={locationMeta?.total_stores} />

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 flex flex-col space-y-7">
        {/* Hero Area: Minimal Title & Search */}
        <section className="text-center space-y-4 max-w-3xl mx-auto w-full">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-zinc-100 border border-zinc-200 text-xs font-medium text-zinc-700 mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>已收录 New Balance · Nike · Adidas · 始祖鸟 · Lululemon · Salomon · On 昂跑 官方实体专柜</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900">
            品牌实体门店与专柜搜索引擎
          </h1>
          <p className="text-sm sm:text-base text-zinc-500 max-w-lg mx-auto">
            毫秒级检索商场铺位、楼层、官方直线电话与导航，告别地图 App 冗余信息。
          </p>

          {/* Search Bar */}
          <div className="pt-2">
            <SearchBar
              value={searchTerm}
              onChange={(v) => {
                setSearchTerm(v);
                setCurrentPage(1);
              }}
              onClear={() => {
                setSearchTerm('');
                setCurrentPage(1);
              }}
              isLoading={isLoading}
            />
          </div>

          {/* Cascading Filter Bar */}
          <FilterBar
            brands={brands}
            selectedBrand={selectedBrand}
            onSelectBrand={(b) => {
              setSelectedBrand(b);
              setCurrentPage(1);
            }}
            locationMeta={locationMeta}
            selectedProvince={selectedProvince}
            onSelectProvince={(p) => {
              setSelectedProvince(p);
              setCurrentPage(1);
            }}
            selectedCity={selectedCity}
            onSelectCity={(c) => {
              setSelectedCity(c);
              setCurrentPage(1);
            }}
            selectedDistrict={selectedDistrict}
            onSelectDistrict={(d) => {
              setSelectedDistrict(d);
              setCurrentPage(1);
            }}
            isNearbyMode={isNearbyMode}
            onToggleNearby={handleToggleNearby}
            isLocating={isLocating}
            onReset={handleResetFilters}
            isFiltered={isFiltered}
          />

          {/* Active Filter Chips */}
          <ActiveFilterChips
            searchTerm={searchTerm}
            onClearSearch={() => setSearchTerm('')}
            selectedBrand={selectedBrand}
            onClearBrand={() => setSelectedBrand('all')}
            brands={brands}
            selectedProvince={selectedProvince}
            onClearProvince={() => {
              setSelectedProvince('全部');
              setSelectedCity('全部');
              setSelectedDistrict('全部');
            }}
            selectedCity={selectedCity}
            onClearCity={() => {
              setSelectedCity('全部');
              setSelectedDistrict('全部');
            }}
            selectedDistrict={selectedDistrict}
            onClearDistrict={() => setSelectedDistrict('全部')}
            isNearbyMode={isNearbyMode}
            onToggleNearby={handleToggleNearby}
            onResetAll={handleResetFilters}
          />
        </section>

        {/* Results Metadata Header */}
        <section className="w-full flex items-center justify-between text-xs text-zinc-500 border-b border-zinc-200/80 pb-3 pt-2">
          <div className="flex items-center space-x-2 font-medium">
            <span className="text-zinc-800">找到 {totalCount} 家门店</span>
            {processingTime > 0 && (
              <span className="text-zinc-400 font-mono text-[11px]">
                (耗时 {processingTime} ms)
              </span>
            )}
            {isNearbyMode && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 font-medium text-[11px] border border-amber-200">
                <Compass className="w-3 h-3 mr-1" />
                已按距您最近排序
              </span>
            )}
          </div>
          <div className="flex items-center space-x-1.5 text-zinc-400">
            <Layers className="w-3.5 h-3.5" />
            <span>实时索引流</span>
          </div>
        </section>

        {/* Store Grid or Empty States */}
        {isLoading && stores.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pt-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-zinc-200 p-5 space-y-4 animate-pulse h-48"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-zinc-100 rounded-xl" />
                  <div className="space-y-1.5 flex-1">
                    <div className="w-16 h-3 bg-zinc-100 rounded" />
                    <div className="w-32 h-4 bg-zinc-100 rounded" />
                  </div>
                </div>
                <div className="space-y-2 pt-2">
                  <div className="w-48 h-3 bg-zinc-100 rounded" />
                  <div className="w-24 h-3 bg-zinc-100 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : stores.length > 0 ? (
          <div className="space-y-7">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {stores.map((store) => (
                <StoreCard
                  key={store.id}
                  store={store}
                  onCopyPhone={handleCopyPhone}
                  onShowToast={setToastMessage}
                  onSelectStore={(s) => setActiveDetailStore(s)}
                />
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-zinc-200/80 pt-5 text-xs text-zinc-500">
                <div>
                  第 <span className="font-semibold text-zinc-800">{currentPage}</span> / {totalPages} 页 (共 {totalCount} 条)
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setCurrentPage((p) => Math.max(1, p - 1));
                      window.scrollTo({ top: 220, behavior: 'smooth' });
                    }}
                    disabled={currentPage <= 1}
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-700 font-medium transition-colors"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>上一页</span>
                  </button>

                  <button
                    onClick={() => {
                      setCurrentPage((p) => Math.min(totalPages, p + 1));
                      window.scrollTo({ top: 220, behavior: 'smooth' });
                    }}
                    disabled={currentPage >= totalPages}
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-700 font-medium transition-colors"
                  >
                    <span>下一页</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Empty State with Helpful Fallbacks */
          <div className="text-center py-16 space-y-3 bg-white rounded-2xl border border-dashed border-zinc-300 p-8 max-w-xl mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-zinc-100 text-zinc-400 flex items-center justify-center mx-auto">
              <MapPinOff className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-zinc-800 text-base">未找到符合条件的门店</h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              试试缩短搜索词、重置省市筛选，或切换其他品牌试试看。
            </p>
            <div className="pt-2">
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
              >
                重置所有筛选
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Store Detail Modal */}
      {activeDetailStore && (
        <StoreDetailModal
          store={activeDetailStore}
          onClose={() => setActiveDetailStore(null)}
          onShowToast={setToastMessage}
        />
      )}

      {/* Footer */}
      <footer className="w-full border-t border-zinc-200/80 py-6 text-center text-xs text-zinc-400 mt-auto bg-white/50">
        <p>Store Finder © 2026 品牌专柜精准导航系统 · 极简版</p>
        <p className="mt-1 text-[11px] text-zinc-400">
          Powered by Next.js + FastAPI + Meilisearch
        </p>
      </footer>

      {/* Global Toast Notification */}
      {toastMessage && (
        <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
      )}
    </div>
  );
}

