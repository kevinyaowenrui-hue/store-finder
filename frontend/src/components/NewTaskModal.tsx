'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  PlusCircle,
  Store,
  DollarSign,
  Tag,
  Truck,
  Check,
  Calendar,
} from 'lucide-react';
import { StoreItem, StoreContact } from '../lib/types';
import { getStoreContact } from '../lib/contactStorage';
import { saveTask, SourcingTask, TaskStatus } from '../lib/kanbanStorage';

interface NewTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (task: SourcingTask) => void;
  store?: StoreItem | null;
  defaultSku?: string;
  defaultSize?: string;
  defaultCost?: number;
  defaultDewuPrice?: number;
  defaultProfit?: number;
}

export function NewTaskModal({
  isOpen,
  onClose,
  onSaved,
  store,
  defaultSku = 'M2002RDA',
  defaultSize = '42.5',
  defaultCost = 629.3,
  defaultDewuPrice = 850,
  defaultProfit = 147.7,
}: NewTaskModalProps) {
  const [sku, setSku] = useState(defaultSku);
  const [size, setSize] = useState(defaultSize);
  const [quantity, setQuantity] = useState(1);
  const [purchaseCost, setPurchaseCost] = useState(defaultCost);
  const [dewuPrice, setDewuPrice] = useState(defaultDewuPrice);
  const [expectedProfit, setExpectedProfit] = useState(defaultProfit);
  const [dewuWarehouse, setDewuWarehouse] = useState('顺丰直寄得物华东仓(昆山)');
  const [status, setStatus] = useState<TaskStatus>('inquiring');
  const [notes, setNotes] = useState('');
  const [contact, setContact] = useState<StoreContact | null>(null);

  useEffect(() => {
    if (store && isOpen) {
      const c = getStoreContact(store.id);
      setContact(c);
    }
  }, [store, isOpen]);

  useEffect(() => {
    setSku(defaultSku);
    setSize(defaultSize);
    setPurchaseCost(defaultCost);
    setDewuPrice(defaultDewuPrice);
    setExpectedProfit(defaultProfit);
  }, [defaultSku, defaultSize, defaultCost, defaultDewuPrice, defaultProfit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sku.trim()) return;

    const saved = saveTask({
      storeId: store?.id ? store.id.toString() : 'manual_store',
      storeName: store?.store_name || '自定义调货门店',
      brandName: store?.brand?.name || '品牌专柜',
      contactName: contact?.contactName,
      sku: sku.trim().toUpperCase(),
      size: size.trim(),
      quantity: Math.max(1, quantity),
      purchaseCost,
      dewuPrice,
      expectedProfit,
      dewuWarehouse,
      status,
      notes: notes.trim(),
    });

    onSaved(saved);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-zinc-200 flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 bg-zinc-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base">发起得物专柜调货任务</h3>
              <p className="text-[11px] text-zinc-400">
                {store ? `调货专柜: ${store.store_name}` : '建立调货进度与资金工单'}
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
          {contact && (
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-900 flex items-center justify-between">
              <span className="font-semibold">
                👤 柜员: {contact.contactName} ({contact.role})
              </span>
              <span className="text-[10px] text-amber-700">{contact.discountNote || '已绑名片'}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-zinc-700 mb-1">
                求购货号 / SKU <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                required
                placeholder="如: M2002RDA"
                className="w-full px-3 py-2 rounded-xl border border-zinc-200 focus:outline-hidden focus:ring-2 focus:ring-zinc-900 font-bold uppercase"
              />
            </div>
            <div>
              <label className="block font-bold text-zinc-700 mb-1">尺码 (EUR)</label>
              <input
                type="text"
                value={size}
                onChange={(e) => setSize(e.target.value)}
                placeholder="如: 42.5"
                className="w-full px-3 py-2 rounded-xl border border-zinc-200 focus:outline-hidden focus:ring-2 focus:ring-zinc-900 font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[11px] font-medium text-zinc-600 mb-1">调货双数</label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 font-bold"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-zinc-600 mb-1">专柜进价(¥)</label>
              <input
                type="number"
                value={purchaseCost}
                onChange={(e) => setPurchaseCost(parseFloat(e.target.value) || 0)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 font-bold"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-zinc-600 mb-1">预期纯利(¥)</label>
              <input
                type="number"
                value={expectedProfit}
                onChange={(e) => setExpectedProfit(parseFloat(e.target.value) || 0)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-emerald-300 bg-emerald-50/50 text-emerald-800 font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-zinc-700 mb-1">得物交货目标仓</label>
            <select
              value={dewuWarehouse}
              onChange={(e) => setDewuWarehouse(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-zinc-200 bg-white"
            >
              <option value="顺丰直寄得物华东仓(昆山/嘉兴)">顺丰直寄得物华东仓 (昆山/嘉兴)</option>
              <option value="顺丰直寄得物华南仓(东莞)">顺丰直寄得物华南仓 (东莞)</option>
              <option value="顺丰直寄得物西南仓(成都)">顺丰直寄得物西南仓 (成都)</option>
              <option value="顺丰直寄得物华北仓(廊坊)">顺丰直寄得物华北仓 (廊坊)</option>
              <option value="同城自提 / 闪送">同城自提 / 闪送</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-zinc-700 mb-1">初始状态</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
              className="w-full px-3 py-2 rounded-xl border border-zinc-200 bg-white"
            >
              <option value="inquiring">1. 待询价 / 已询价 (待专柜查库)</option>
              <option value="reserved">2. 店长已留货 (待转账开单)</option>
              <option value="paid">3. 已付款开单 (待专柜发顺丰)</option>
              <option value="shipped">4. 顺丰直寄得物在途中</option>
              <option value="completed">5. 得物已过验完结</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-zinc-700 mb-1">备忘与留货要求</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="例如: 店长同意留货到今晚20:00，付款走微信转账，附带专柜小票。"
              className="w-full px-3 py-1.5 rounded-xl border border-zinc-200 focus:outline-hidden focus:ring-2 focus:ring-zinc-900 text-xs"
            />
          </div>

          <div className="pt-2 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-zinc-600 hover:bg-zinc-100 font-medium"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-zinc-900 text-white font-bold hover:bg-zinc-800 shadow-md active:scale-95 transition-all"
            >
              创建调货工单
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
