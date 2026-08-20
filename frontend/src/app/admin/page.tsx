'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  adminListStores,
  adminCreateStore,
  adminUpdateStore,
  adminDeleteStore,
  adminImportCSV,
  getExportCSVUrl,
  adminReindex,
  adminGetStats,
  getBrands,
} from '../../lib/api';
import { AdminStoreItem, Brand, AdminStats } from '../../lib/types';
import { Toast } from '../../components/Toast';
import { AppLogo } from '../../components/AppLogo';

import {
  ArrowLeft,
  Plus,
  Upload,
  Download,
  RefreshCw,
  Edit2,
  Trash2,
  Lock,
  Search,
  CheckCircle,
  AlertTriangle,
  Building,
  Phone,
  Layers,
  MapPin,
  Store as StoreIcon,
  Tag,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
} from 'lucide-react';

const ADMIN_PAGE_SIZE = 20;

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authInput, setAuthInput] = useState('admin123456');

  const [stores, setStores] = useState<AdminStoreItem[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [page, setPage] = useState(1);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<AdminStoreItem | null>(null);
  const [formData, setFormData] = useState({
    store_name: '',
    brand_id: 1,
    mall_name: '',
    province: '上海市',
    city: '上海市',
    district: '',
    address: '',
    floor: '',
    phone: '',
    business_hours: '10:00 - 22:00',
    latitude: '',
    longitude: '',
    source_url: '',
    tags: '',
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Read adminKey from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('store_finder_admin_key');
    if (saved) {
      setAdminKey(saved);
      setIsAuthorized(true);
    }
  }, []);

  const loadData = async (key: string) => {
    setIsLoading(true);
    try {
      const [storesData, brandsData, statsData] = await Promise.all([
        adminListStores(key),
        getBrands(),
        adminGetStats(key),
      ]);
      setStores(storesData);
      setBrands(brandsData);
      setStats(statsData);
    } catch (err: any) {
      showToast(err.message || '加载后台数据失败', 'error');
      setIsAuthorized(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthorized && adminKey) {
      loadData(adminKey);
    }
  }, [isAuthorized, adminKey]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authInput.trim()) return;
    setAdminKey(authInput.trim());
    localStorage.setItem('store_finder_admin_key', authInput.trim());
    setIsAuthorized(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('store_finder_admin_key');
    setAdminKey('');
    setIsAuthorized(false);
    setStores([]);
  };

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage(msg);
    setToastType(type);
  };

  // Handle Create / Edit Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingStore) {
        // Update
        await adminUpdateStore(
          editingStore.id,
          {
            store_name: formData.store_name,
            brand_id: Number(formData.brand_id),
            mall_name: formData.mall_name,
            province: formData.province,
            city: formData.city,
            district: formData.district,
            address: formData.address,
            floor: formData.floor,
            phone: formData.phone,
            business_hours: formData.business_hours,
            source_url: formData.source_url,
            tags: formData.tags,
            latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
            longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
          },
          adminKey
        );
        showToast('门店信息更新成功');
      } else {
        // Create store with dynamic mall
        await adminCreateStore(
          {
            store_name: formData.store_name,
            brand_id: Number(formData.brand_id),
            mall_name: formData.mall_name || '默认商场',
            province: formData.province,
            city: formData.city,
            district: formData.district,
            address: formData.address,
            floor: formData.floor,
            phone: formData.phone,
            business_hours: formData.business_hours,
            source_url: formData.source_url,
            tags: formData.tags,
            latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
            longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
          },
          adminKey
        );
        showToast('门店创建成功');
      }
      setIsModalOpen(false);
      loadData(adminKey);
    } catch (err: any) {
      showToast(err.message || '操作失败', 'error');
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (store: AdminStoreItem) => {
    setEditingStore(store);
    setFormData({
      store_name: store.store_name,
      brand_id: store.brand_id,
      mall_name: store.mall?.name || '',
      province: store.mall?.province || '上海市',
      city: store.mall?.city || '上海市',
      district: store.mall?.district || '',
      address: store.mall?.address || '',
      floor: store.floor || '',
      phone: store.phone || '',
      business_hours: store.business_hours || '10:00 - 22:00',
      latitude: store.latitude?.toString() || '',
      longitude: store.longitude?.toString() || '',
      source_url: store.source_url || '',
      tags: store.tags || '',
    });
    setIsModalOpen(true);
  };

  // Toggle Active Status
  const handleToggleActive = async (store: AdminStoreItem) => {
    try {
      const newStatus = !store.is_active;
      await adminUpdateStore(store.id, { is_active: newStatus }, adminKey);
      setStores((prev) =>
        prev.map((s) => (s.id === store.id ? { ...s, is_active: newStatus } : s))
      );
      showToast(
        `门店【${store.store_name}】已设置为: ${newStatus ? '营业中' : '暂停营业'}`
      );
    } catch (err: any) {
      showToast(err.message || '修改状态失败', 'error');
    }
  };

  // Delete Store
  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`确定要删除门店 "${name}" 吗？此操作将同步从搜索引擎中移除。`)) return;
    try {
      await adminDeleteStore(id, adminKey);
      showToast(`已删除门店: ${name}`);
      setStores((prev) => prev.filter((s) => s.id !== id));
      if (stats) setStats({ ...stats, total_stores: stats.total_stores - 1 });
    } catch (err: any) {
      showToast(err.message || '删除失败', 'error');
    }
  };

  // Handle CSV Import
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      showToast('正在解析并批量导入 CSV 数据...', 'info');
      const res = await adminImportCSV(file, adminKey);
      showToast(
        `成功导入/更新 ${res.imported_or_updated} 家门店 (错误数: ${res.errors_count})`
      );
      loadData(adminKey);
    } catch (err: any) {
      showToast(err.message || 'CSV 导入失败', 'error');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Handle CSV Export
  const handleExportCSV = () => {
    const url = getExportCSVUrl(adminKey);
    window.open(url, '_blank');
    showToast('正在导出 CSV 文件...');
  };

  // Handle Reindex
  const handleReindex = async () => {
    try {
      showToast('正在重建 Meilisearch 搜索引擎索引...', 'info');
      const res = await adminReindex(adminKey);
      showToast(res.message || '全量重建索引完成！');
    } catch (err: any) {
      showToast(err.message || '重建索引失败', 'error');
    }
  };

  const filteredStores = stores.filter(
    (s) =>
      s.store_name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      s.mall?.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      s.mall?.city.toLowerCase().includes(searchFilter.toLowerCase()) ||
      (s.phone && s.phone.includes(searchFilter)) ||
      (s.tags && s.tags.toLowerCase().includes(searchFilter.toLowerCase()))
  );

  const totalPages = Math.ceil(filteredStores.length / ADMIN_PAGE_SIZE) || 1;
  const paginatedStores = filteredStores.slice(
    (page - 1) * ADMIN_PAGE_SIZE,
    page * ADMIN_PAGE_SIZE
  );

  // ---------------- Render Login Screen if not authorized ----------------
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-zinc-200 p-8 shadow-elevated text-center space-y-6">
          <div className="flex justify-center">
            <AppLogo size="xl" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-zinc-900">管理后台鉴权</h2>
            <p className="text-xs text-zinc-500 mt-1">请输入 Admin API Key 以进入管理面板</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4 text-left">
            <div>
              <label className="text-xs font-medium text-zinc-700">API Key / 管理密钥</label>
              <input
                type="password"
                value={authInput}
                onChange={(e) => setAuthInput(e.target.value)}
                placeholder="请输入管理密钥 (默认 admin123456)"
                className="w-full mt-1.5 px-3.5 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-medium transition-colors shadow-sm"
            >
              验证并进入管理后台
            </button>
            <div className="text-center pt-2">
              <Link href="/" className="text-xs text-zinc-500 hover:text-zinc-800 underline">
                返回前台搜索主页
              </Link>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ---------------- Render Admin Dashboard ----------------
  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      {/* Admin Header */}
      <header className="w-full border-b border-zinc-200 bg-white sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link
              href="/"
              className="p-2 rounded-lg hover:bg-zinc-100 text-zinc-600 transition-colors"
              title="返回前台主页"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <AppLogo size="sm" />
            <div>
              <h1 className="font-bold text-base text-zinc-900">门店数据治理中心</h1>
              <p className="text-[11px] text-zinc-400">
                支持品牌专柜维护、商场自动绑定、CSV 导入导出与搜索引擎实时同步
              </p>
            </div>
          </div>


          {/* Action Toolbar */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleReindex}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-50 text-zinc-700 text-xs font-medium transition-colors"
              title="全量同步到 Meilisearch"
            >
              <RefreshCw className="w-3.5 h-3.5 text-zinc-500" />
              <span className="hidden sm:inline">重构索引</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-50 text-zinc-700 text-xs font-medium transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-zinc-500" />
              <span className="hidden sm:inline">导出 CSV</span>
            </button>

            <label className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-medium cursor-pointer transition-colors">
              <Upload className="w-3.5 h-3.5 text-zinc-600" />
              <span>导入 CSV</span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            <button
              onClick={handleLogout}
              className="text-xs text-rose-600 hover:underline px-2 font-medium"
            >
              退出
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 flex-1 space-y-6">
        {/* Metric Cards Dashboard */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-zinc-200/80 p-4 shadow-subtle flex items-center space-x-3.5">
              <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <StoreIcon className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] font-medium text-zinc-400">收录门店总数</div>
                <div className="text-xl font-bold text-zinc-900">
                  {stats.total_stores}{' '}
                  <span className="text-xs font-normal text-emerald-600">
                    ({stats.active_stores} 营业中)
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-zinc-200/80 p-4 shadow-subtle flex items-center space-x-3.5">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Tag className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] font-medium text-zinc-400">入驻品牌数</div>
                <div className="text-xl font-bold text-zinc-900">{stats.total_brands}</div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-zinc-200/80 p-4 shadow-subtle flex items-center space-x-3.5">
              <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <Building className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] font-medium text-zinc-400">覆盖商场/商圈</div>
                <div className="text-xl font-bold text-zinc-900">{stats.total_malls}</div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-zinc-200/80 p-4 shadow-subtle flex items-center space-x-3.5">
              <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] font-medium text-zinc-400">覆盖城市数</div>
                <div className="text-xl font-bold text-zinc-900">{stats.total_cities}</div>
              </div>
            </div>
          </div>
        )}

        {/* Filter & Search Bar */}
        <div className="bg-white rounded-xl border border-zinc-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-subtle">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => {
                setSearchFilter(e.target.value);
                setPage(1);
              }}
              placeholder="快速过滤门店、商场、城市、电话或标签..."
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-zinc-200 text-xs focus:outline-none focus:ring-2 focus:ring-zinc-900"
            />
          </div>

          <div className="flex items-center space-x-3 text-xs text-zinc-500 w-full sm:w-auto justify-between">
            <span>
              匹配 <strong className="text-zinc-800 font-semibold">{filteredStores.length}</strong> 家门店
            </span>
            <button
              onClick={() => {
                setEditingStore(null);
                setFormData({
                  store_name: '',
                  brand_id: brands[0]?.id || 1,
                  mall_name: '',
                  province: '上海市',
                  city: '上海市',
                  district: '',
                  address: '',
                  floor: '',
                  phone: '',
                  business_hours: '10:00 - 22:00',
                  latitude: '',
                  longitude: '',
                  source_url: '',
                  tags: '',
                });
                setIsModalOpen(true);
              }}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>新建门店</span>
            </button>
          </div>
        </div>

        {/* Stores Table */}
        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden shadow-subtle">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-600 font-semibold">
                <tr>
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">品牌</th>
                  <th className="py-3 px-4">门店全称</th>
                  <th className="py-3 px-4">所属商场 & 城市</th>
                  <th className="py-3 px-4">楼层</th>
                  <th className="py-3 px-4">联系电话</th>
                  <th className="py-3 px-4">状态</th>
                  <th className="py-3 px-4">更新时间</th>
                  <th className="py-3 px-4 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-zinc-400">
                      正在加载门店数据...
                    </td>
                  </tr>
                ) : paginatedStores.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-zinc-400">
                      暂无匹配门店数据
                    </td>
                  </tr>
                ) : (
                  paginatedStores.map((s) => (
                    <tr key={s.id} className="hover:bg-zinc-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono text-zinc-400">#{s.id}</td>
                      <td className="py-3 px-4 font-medium text-brand-700">
                        {s.brand?.name || 'New Balance'}
                      </td>
                      <td className="py-3 px-4 font-semibold text-zinc-900 max-w-[200px] truncate">
                        {s.store_name}
                      </td>
                      <td className="py-3 px-4 text-zinc-600">
                        <div className="font-medium text-zinc-800">{s.mall?.name || '-'}</div>
                        <div className="text-[11px] text-zinc-400">
                          {s.mall?.province} · {s.mall?.city} {s.mall?.district ? `(${s.mall.district})` : ''}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-zinc-700 font-medium">
                        {s.floor || '-'}
                      </td>
                      <td className="py-3 px-4 font-mono text-zinc-600">
                        {s.phone || '-'}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleToggleActive(s)}
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold transition-colors border ${
                            s.is_active
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-zinc-100 text-zinc-500 border-zinc-200 hover:bg-zinc-200'
                          }`}
                          title="点击切换营业状态"
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full mr-1 ${
                              s.is_active ? 'bg-emerald-500' : 'bg-zinc-400'
                            }`}
                          />
                          <span>{s.is_active ? '营业中' : '已暂停'}</span>
                        </button>
                      </td>
                      <td className="py-3 px-4 text-zinc-400 text-[11px]">
                        {s.updated_at ? s.updated_at.split('T')[0] : '-'}
                      </td>
                      <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => handleOpenEdit(s)}
                          className="p-1.5 rounded-md hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900 transition-colors"
                          title="编辑"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(s.id, s.store_name)}
                          className="p-1.5 rounded-md hover:bg-rose-50 text-rose-600 transition-colors"
                          title="删除"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Table Pagination Footer */}
          {totalPages > 1 && (
            <div className="p-3.5 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500 bg-zinc-50/50">
              <div>
                显示第 {(page - 1) * ADMIN_PAGE_SIZE + 1} - {Math.min(page * ADMIN_PAGE_SIZE, filteredStores.length)} 条，共 {filteredStores.length} 家门店
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="p-1 rounded-md border border-zinc-200 bg-white hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span>
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="p-1 rounded-md border border-zinc-200 bg-white hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Edit / Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-zinc-200 max-w-xl w-full p-6 shadow-elevated space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h3 className="font-bold text-base text-zinc-900">
                {editingStore ? '编辑门店数据' : '新建品牌门店'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-zinc-700">所属品牌 *</label>
                  <select
                    value={formData.brand_id}
                    onChange={(e) => setFormData({ ...formData, brand_id: Number(e.target.value) })}
                    className="w-full mt-1 px-3 py-2 rounded-lg border border-zinc-200 bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900 text-xs cursor-pointer font-medium"
                  >
                    {brands.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-medium text-zinc-700">门店全称 *</label>
                  <input
                    type="text"
                    required
                    value={formData.store_name}
                    onChange={(e) => setFormData({ ...formData, store_name: e.target.value })}
                    placeholder="例如：上海静安嘉里中心概念店"
                    className="w-full mt-1 px-3 py-2 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900 text-xs"
                  />
                </div>
              </div>

              {/* Mall & Location Info */}
              <div className="p-3.5 bg-zinc-50 rounded-xl border border-zinc-200/80 space-y-3">
                <div className="font-semibold text-zinc-800 text-[11px]">所属商圈与商场信息</div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-medium text-zinc-600">商场名称 *</label>
                    <input
                      type="text"
                      required
                      value={formData.mall_name}
                      onChange={(e) => setFormData({ ...formData, mall_name: e.target.value })}
                      placeholder="例如：静安嘉里中心"
                      className="w-full mt-1 px-3 py-1.5 rounded-lg border border-zinc-200 bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900 text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-medium text-zinc-600">省份 *</label>
                    <input
                      type="text"
                      required
                      value={formData.province}
                      onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                      placeholder="例如：上海市"
                      className="w-full mt-1 px-3 py-1.5 rounded-lg border border-zinc-200 bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-medium text-zinc-600">城市 *</label>
                    <input
                      type="text"
                      required
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="例如：上海市"
                      className="w-full mt-1 px-3 py-1.5 rounded-lg border border-zinc-200 bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900 text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-medium text-zinc-600">行政区 / 县</label>
                    <input
                      type="text"
                      value={formData.district}
                      onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                      placeholder="例如：静安区"
                      className="w-full mt-1 px-3 py-1.5 rounded-lg border border-zinc-200 bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-medium text-zinc-600">详细地址</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="例如：南京西路1515号"
                    className="w-full mt-1 px-3 py-1.5 rounded-lg border border-zinc-200 bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-zinc-700">楼层铺位</label>
                  <input
                    type="text"
                    value={formData.floor}
                    onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                    placeholder="例如：南区3层 L3-08"
                    className="w-full mt-1 px-3 py-2 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900 text-xs"
                  />
                </div>
                <div>
                  <label className="font-medium text-zinc-700">联系电话</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="例如：021-62885990"
                    className="w-full mt-1 px-3 py-2 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-zinc-700">营业时间</label>
                  <input
                    type="text"
                    value={formData.business_hours}
                    onChange={(e) => setFormData({ ...formData, business_hours: e.target.value })}
                    placeholder="例如：10:00 - 22:00"
                    className="w-full mt-1 px-3 py-2 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900 text-xs"
                  />
                </div>
                <div>
                  <label className="font-medium text-zinc-700">特色标签 (逗号分隔)</label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="例如：概念店,跑步专营,限量发售"
                    className="w-full mt-1 px-3 py-2 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-zinc-700">纬度 (Latitude)</label>
                  <input
                    type="text"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                    placeholder="例如：31.2263"
                    className="w-full mt-1 px-3 py-2 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900 text-xs"
                  />
                </div>
                <div>
                  <label className="font-medium text-zinc-700">经度 (Longitude)</label>
                  <input
                    type="text"
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                    placeholder="例如：121.4518"
                    className="w-full mt-1 px-3 py-2 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="font-medium text-zinc-700">官方来源链接 (URL)</label>
                <input
                  type="url"
                  value={formData.source_url}
                  onChange={(e) => setFormData({ ...formData, source_url: e.target.value })}
                  placeholder="https://..."
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900 text-xs"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-zinc-200 hover:bg-zinc-50 text-zinc-700 font-medium"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-medium shadow-sm transition-colors"
                >
                  {editingStore ? '保存修改' : '立即创建'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Component */}
      {toastMessage && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setToastMessage(null)}
        />
      )}
    </div>
  );
}

