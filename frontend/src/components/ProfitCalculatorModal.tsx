'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Calculator,
  TrendingUp,
  TrendingDown,
  Percent,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Store,
  DollarSign,
  Truck,
  Sparkles,
  Info,
} from 'lucide-react';
import { StoreItem, StoreContact } from '../lib/types';
import { getStoreContact } from '../lib/contactStorage';
import { copyToClipboard } from '../lib/clipboard';

interface ProfitCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialStore?: StoreItem | null;
  initialSku?: string;
  initialTagPrice?: number;
  onOpenNewTask?: (
    store: StoreItem | null,
    sku: string,
    cost: number,
    dewuPrice: number,
    profit: number
  ) => void;
}

const COMMON_DISCOUNTS = [
  { label: '正价', rate: 1.0 },
  { label: '9折', rate: 0.9 },
  { label: '85折', rate: 0.85 },
  { label: '8折', rate: 0.8 },
  { label: '75折', rate: 0.75 },
  { label: '7折', rate: 0.7 },
  { label: '65折', rate: 0.65 },
  { label: '6折', rate: 0.6 },
  { label: '55折', rate: 0.55 },
  { label: '5折', rate: 0.5 },
  { label: '4折', rate: 0.4 },
];

export function ProfitCalculatorModal({
  isOpen,
  onClose,
  initialStore,
  initialSku = '',
  initialTagPrice = 899,
  onOpenNewTask,
}: ProfitCalculatorModalProps) {
  const [sku, setSku] = useState(initialSku || 'M2002RDA');
  const [tagPrice, setTagPrice] = useState<number>(initialTagPrice || 899);
  const [discountRate, setDiscountRate] = useState<number>(0.7); // 默认 7折
  const [isManualCost, setIsManualCost] = useState(false);
  const [manualCost, setManualCost] = useState<number>(629.3);

  const [dewuPrice, setDewuPrice] = useState<number>(850);
  const [shippingFee, setShippingFee] = useState<number>(12); // 顺丰运费

  // Advanced Fee Settings (Dewu Standard)
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [serviceFeeRate, setServiceFeeRate] = useState<number>(5.0); // 平台技术服务费 5%
  const [paymentFeeRate, setPaymentFeeRate] = useState<number>(1.0); // 转账手续费 1%
  const [inspectFee, setInspectFee] = useState<number>(10.0); // 查验质检包装费 10元

  const [copied, setCopied] = useState(false);
  const [contact, setContact] = useState<StoreContact | null>(null);

  useEffect(() => {
    if (initialStore && isOpen) {
      const c = getStoreContact(initialStore.id);
      setContact(c);
      // Auto parse discount from notes if available (e.g. "7折" -> 0.7)
      if (c?.discountNote) {
        const match = c.discountNote.match(/([1-9](\.[0-9])?)折/);
        if (match) {
          const parsedRate = parseFloat(match[1]) / 10;
          if (parsedRate > 0 && parsedRate <= 1) {
            setDiscountRate(parsedRate);
          }
        }
      }
    } else {
      setContact(null);
    }
  }, [initialStore, isOpen]);

  if (!isOpen) return null;

  // 1. Calculate Store Cost
  const storeCost = isManualCost ? manualCost : Math.round(tagPrice * discountRate * 10) / 10;
  const totalPurchaseCost = storeCost + shippingFee;

  // 2. Calculate Dewu Fee Deductions
  const dewuServiceFee = Math.round(((dewuPrice * serviceFeeRate) / 100) * 10) / 10;
  const dewuPaymentFee = Math.round(((dewuPrice * paymentFeeRate) / 100) * 10) / 10;
  const totalDewuDeduction = Math.round((dewuServiceFee + dewuPaymentFee + inspectFee) * 10) / 10;
  const dewuPayout = Math.round((dewuPrice - totalDewuDeduction) * 10) / 10;

  // 3. Profit & Margin
  const netProfit = Math.round((dewuPayout - totalPurchaseCost) * 10) / 10;
  const profitMargin =
    totalPurchaseCost > 0
      ? Math.round((netProfit / totalPurchaseCost) * 1000) / 10
      : 0;

  // Status judgement
  let statusColor = 'text-emerald-600 bg-emerald-50 border-emerald-200';
  let statusText = '🟢 利润丰厚 · 建议调货';
  if (netProfit < 0) {
    statusColor = 'text-red-600 bg-red-50 border-red-200';
    statusText = '🔴 亏损风险 · 建议放弃';
  } else if (netProfit < 50 || profitMargin < 10) {
    statusColor = 'text-amber-600 bg-amber-50 border-amber-200';
    statusText = '🟡 微利薄销 · 谨慎调货';
  }

  // Copy structured report to clipboard
  const handleCopyReport = async () => {
    const statusText = netProfit > 100 ? '🟢 利润丰厚' : netProfit > 30 ? '🟡 微利薄销' : '🔴 利润偏薄/亏损';
    const report = [
      `💰 【得物调货利润测算简报】`,
      `📦 货号/尺码：${sku || '通用款'}`,
      initialStore ? `🏪 专柜：${initialStore.brand.name} (${initialStore.store_name})` : null,
      `🏷️ 专柜吊牌价：¥${tagPrice}`,
      `🏷️ 采购进货价：¥${storeCost} (${(discountRate * 10).toFixed(1)}折)`,
      `📈 得物售价：¥${dewuPrice}`,
      `💸 平台服务费(5%)：-¥${dewuServiceFee.toFixed(1)}`,
      `💸 支付手续费(1%)：-¥${dewuPaymentFee.toFixed(1)}`,
      `📦 质检+运费：-¥${(inspectFee + shippingFee).toFixed(1)}`,
      `------------------------`,
      `💎 单双纯利润：${netProfit >= 0 ? '+' : ''}¥${netProfit}`,
      `📈 利润率(ROI)：${profitMargin >= 0 ? '+' : ''}${profitMargin}% (${statusText})`,
    ]
      .filter(Boolean)
      .join('\n');

    await copyToClipboard(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-zinc-200 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-zinc-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">得物专柜调货利润计算器</h3>
              <p className="text-xs text-zinc-400">
                {initialStore ? `已关联: ${initialStore.store_name}` : '专柜进价 vs 得物扣费净利润秒算'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 text-sm">
          {/* Top Real-time Profit Banner */}
          <div className={`p-4 rounded-2xl border ${statusColor} transition-all`}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold tracking-wide uppercase">单双净利润 (预估到手)</span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-white/80 border border-current">
                {statusText}
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <div className="text-3xl font-extrabold tracking-tight">
                {netProfit >= 0 ? `+¥${netProfit}` : `-¥${Math.abs(netProfit)}`}
              </div>
              <div className="text-right">
                <div className="text-xs opacity-75 font-medium">投资利润率 (ROI)</div>
                <div className="text-lg font-bold">
                  {profitMargin >= 0 ? `+${profitMargin}%` : `${profitMargin}%`}
                </div>
              </div>
            </div>
          </div>

          {/* Sourcing Store & SKU info */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                求购货号 / SKU 型号
              </label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="例如: M2002RDA / Samba"
                className="w-full px-3 py-2 rounded-xl border border-zinc-200 focus:outline-hidden focus:ring-2 focus:ring-zinc-900 text-xs font-medium uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                顺丰寄得物仓运费 (¥)
              </label>
              <div className="flex items-center space-x-1.5">
                <input
                  type="number"
                  value={shippingFee}
                  onChange={(e) => setShippingFee(parseFloat(e.target.value) || 0)}
                  placeholder="12"
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 focus:outline-hidden focus:ring-2 focus:ring-zinc-900 text-xs font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShippingFee(0)}
                  className="px-2.5 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-600 text-xs font-medium shrink-0"
                  title="包邮/同城自提"
                >
                  自提¥0
                </button>
              </div>
            </div>
          </div>

          {/* Section 1: Store Purchase Cost */}
          <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-900 flex items-center space-x-1">
                <Store className="w-3.5 h-3.5 text-zinc-600" />
                <span>1. 专柜采购成本</span>
              </span>
              <span className="text-xs font-bold text-zinc-800 font-mono">
                到手进价: ¥{storeCost}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-zinc-500 mb-1">
                  专柜官方吊牌正价 (¥)
                </label>
                <input
                  type="number"
                  value={tagPrice}
                  onChange={(e) => setTagPrice(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 rounded-lg border border-zinc-200 focus:outline-hidden focus:ring-2 focus:ring-zinc-900 text-sm font-bold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-zinc-500 mb-1">
                  专柜实付进价 (¥)
                </label>
                <input
                  type="number"
                  value={storeCost}
                  onChange={(e) => {
                    setIsManualCost(true);
                    setManualCost(parseFloat(e.target.value) || 0);
                  }}
                  className="w-full px-3 py-1.5 rounded-lg border border-zinc-200 focus:outline-hidden focus:ring-2 focus:ring-zinc-900 text-sm font-bold bg-white"
                />
              </div>
            </div>

            {/* Quick Discount Buttons */}
            <div>
              <div className="text-[11px] text-zinc-500 mb-1 flex items-center justify-between">
                <span>快捷专柜折扣:</span>
                {contact?.discountNote && (
                  <span className="text-amber-800 text-[10px] font-semibold">
                    ⭐ 柜员特惠: {contact.discountNote}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-1">
                {COMMON_DISCOUNTS.map((d) => {
                  const active = !isManualCost && Math.abs(discountRate - d.rate) < 0.001;
                  return (
                    <button
                      key={d.label}
                      type="button"
                      onClick={() => {
                        setIsManualCost(false);
                        setDiscountRate(d.rate);
                      }}
                      className={`px-2 py-1 rounded-md text-xs font-semibold transition-all ${
                        active
                          ? 'bg-zinc-900 text-white shadow-xs'
                          : 'bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-100'
                      }`}
                    >
                      {d.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Section 2: Dewu Platform Selling Price */}
          <div className="p-3.5 rounded-xl bg-blue-50/50 border border-blue-100 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-900 flex items-center space-x-1">
                <DollarSign className="w-3.5 h-3.5 text-blue-600" />
                <span>2. 得物平台出售与扣费</span>
              </span>
              <span className="text-xs font-bold text-blue-900 font-mono">
                预估净实收: ¥{dewuPayout}
              </span>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-zinc-600 mb-1">
                得物当前挂售价 / 求购出价 (¥)
              </label>
              <input
                type="number"
                value={dewuPrice}
                onChange={(e) => setDewuPrice(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl border border-blue-200 focus:outline-hidden focus:ring-2 focus:ring-blue-600 text-base font-extrabold text-blue-900 bg-white"
              />
            </div>

            {/* Fee Deductions Breakdown */}
            <div className="p-2.5 rounded-lg bg-white border border-blue-100/80 text-[11px] space-y-1 text-zinc-600 font-mono">
              <div className="flex justify-between">
                <span>得物平台技术服务费 ({serviceFeeRate}%):</span>
                <span className="text-red-500 font-medium">-¥{dewuServiceFee}</span>
              </div>
              <div className="flex justify-between">
                <span>支付与转账手续费 ({paymentFeeRate}%):</span>
                <span className="text-red-500 font-medium">-¥{dewuPaymentFee}</span>
              </div>
              <div className="flex justify-between">
                <span>查验质检包装操作费:</span>
                <span className="text-red-500 font-medium">-¥{inspectFee}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-zinc-100 font-bold text-zinc-800">
                <span>得物扣费合计:</span>
                <span className="text-red-600">-¥{totalDewuDeduction}</span>
              </div>
            </div>

            {/* Advanced Fee Accordion */}
            <div>
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-[11px] text-blue-600 hover:underline flex items-center space-x-1"
              >
                <span>自定义得物费率配置</span>
                {showAdvanced ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>

              {showAdvanced && (
                <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-blue-200/50">
                  <div>
                    <label className="block text-[10px] text-zinc-500">服务费率 (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={serviceFeeRate}
                      onChange={(e) => setServiceFeeRate(parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1 rounded border border-zinc-200 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-500">转账费率 (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={paymentFeeRate}
                      onChange={(e) => setPaymentFeeRate(parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1 rounded border border-zinc-200 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-500">质检操作费 (¥)</label>
                    <input
                      type="number"
                      value={inspectFee}
                      onChange={(e) => setInspectFee(parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1 rounded border border-zinc-200 text-xs"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-zinc-50 border-t border-zinc-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-200 rounded-xl transition-colors"
            >
              关闭
            </button>

            {onOpenNewTask && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenNewTask(initialStore || null, sku, storeCost, dewuPrice, netProfit);
                }}
                className="px-3.5 py-2 bg-purple-50 border border-purple-200 hover:bg-purple-100 text-purple-800 rounded-xl text-xs font-bold transition-colors"
                title="一键将测算数据生成调货工单"
              >
                <span>📊 生成调货工单</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={handleCopyReport}
            className={`px-5 py-2.5 text-xs font-bold rounded-xl shadow-md transition-all flex items-center space-x-1.5 ${
              copied
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : 'bg-zinc-900 text-white hover:bg-zinc-800'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-white" />
                <span>已复制利润测算简报！</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-amber-400" />
                <span>一键复制利润简报</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
