'use client';

import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Sparkles, MessageCircle, Send, Phone, UserCheck, Shield } from 'lucide-react';
import { StoreItem, StoreContact } from '../lib/types';
import { getStoreContact } from '../lib/contactStorage';
import { copyToClipboard } from '../lib/clipboard';

interface InquiryScriptModalProps {
  store: StoreItem | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenContactModal?: () => void;
  onOpenNewTask?: (store: StoreItem, sku: string, size: string) => void;
}

const COMMON_SIZES = ['36', '37', '37.5', '38', '39', '40', '40.5', '41', '42', '42.5', '43', '44', '44.5', '45', '全码现货'];

const POPULAR_SKUS: Record<string, string[]> = {
  'new-balance': ['M2002RDA', 'U990GR6', 'M1906RRA', 'BB550WT1', 'U9060ECA', 'M991GL'],
  'nike': ['FD0736-001 (Dunk)', 'DZ5485-612 (AJ1)', 'FZ5049-001', 'Pegasus 41', 'Alphafly 3'],
  'adidas': ['B41680 (Samba OG)', 'IH2748 (Gazelle)', 'ID2064 (Campus 00s)', 'Adizero Adios Pro 3'],
};

export function InquiryScriptModal({
  store,
  isOpen,
  onClose,
  onOpenContactModal,
  onOpenNewTask,
}: InquiryScriptModalProps) {
  const [contact, setContact] = useState<StoreContact | null>(null);
  const [sku, setSku] = useState('');
  const [size, setSize] = useState('42.5');
  const [recipient, setRecipient] = useState('店长好！');
  const [deliveryMethod, setDeliveryMethod] = useState('顺丰直寄得物华东仓');
  const [paymentMethod, setPaymentMethod] = useState('微信转账/小程序远程开单');
  const [askDiscount, setAskDiscount] = useState(true);
  const [extraRemarks, setExtraRemarks] = useState('');
  const [copied, setCopied] = useState(false);
  const [wechatCopied, setWechatCopied] = useState(false);

  useEffect(() => {
    if (store && isOpen) {
      const c = getStoreContact(store.id);
      setContact(c);
      if (c?.contactName) {
        setRecipient(`${c.contactName}好！`);
      } else {
        setRecipient('店长老师好！');
      }

      // Pre-fill suggested default SKU based on brand
      const brandCode = store.brand.code;
      const suggestions = POPULAR_SKUS[brandCode] || POPULAR_SKUS['new-balance'];
      if (!sku && suggestions.length > 0) {
        setSku(suggestions[0]);
      }
      setCopied(false);
      setWechatCopied(false);
    }
  }, [store, isOpen]);

  if (!isOpen || !store) return null;

  // Generate standardized inquiry text
  const buildScript = () => {
    const skuText = sku.trim() || '【请填写货号】';
    const sizeText = size.trim() || '【请选择尺码】';
    const discountText = askDiscount ? '目前店里有活动件折、商场满减或会员扣点吗？' : '';
    const reserveText = '如果有货麻烦先帮我留一下，';
    const settlementText = `我走${paymentMethod}，配${deliveryMethod}发货。`;
    const extraText = extraRemarks.trim() ? ` 备注：${extraRemarks.trim()}` : '';

    return `${recipient}请问店里目前有【${skuText}】、尺码【${sizeText}】的现货吗？${discountText}${reserveText}${settlementText}${extraText} 麻烦帮忙查下库存并报个到手底价，非常感谢！`;
  };

  const generatedScript = buildScript();

  const handleCopyScript = async () => {
    await copyToClipboard(generatedScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCopyWechat = async (wx: string) => {
    await copyToClipboard(wx);
    setWechatCopied(true);
    setTimeout(() => setWechatCopied(false), 2000);
  };

  const brandSuggestions = POPULAR_SKUS[store.brand.code] || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-zinc-200 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-zinc-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">得物专柜一键查货话术</h3>
              <p className="text-xs text-zinc-400 truncate max-w-sm">{store.store_name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 text-sm">
          {/* Store & Contact Summary Banner */}
          <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-full bg-zinc-900 text-white flex items-center justify-center font-bold text-xs">
                {contact ? contact.contactName.charAt(0) : '专'}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-zinc-900 text-sm">
                    {contact ? `${contact.contactName} (${contact.role || '店长'})` : '暂未绑定专属柜员'}
                  </span>
                  {contact?.discountNote && (
                    <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-medium text-[11px]">
                      {contact.discountNote}
                    </span>
                  )}
                </div>
                <div className="text-xs text-zinc-500 flex items-center space-x-2 mt-0.5">
                  <span>专柜座机: {store.phone || '无'}</span>
                  {contact?.wechatId && <span>· 微信: {contact.wechatId}</span>}
                </div>
              </div>
            </div>

            {onOpenContactModal && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenContactModal();
                }}
                className="px-3 py-1.5 rounded-lg bg-white border border-zinc-300 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 transition-colors shrink-0 flex items-center space-x-1"
              >
                <UserCheck className="w-3.5 h-3.5 text-zinc-600" />
                <span>{contact ? '修改名片' : '+ 绑定柜员'}</span>
              </button>
            )}
          </div>

          {/* SKU / Model Input & Quick Pills */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              求购货号 / SKU 型号 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="输入待查货号 (如: M2002RDA / FD0736-001)"
              className="w-full px-3 py-2 rounded-xl border border-zinc-200 focus:outline-hidden focus:ring-2 focus:ring-zinc-900 text-sm font-medium uppercase tracking-wide"
            />
            {brandSuggestions.length > 0 && (
              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                <span className="text-[11px] text-zinc-400">热销快速选:</span>
                {brandSuggestions.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setSku(item.split(' ')[0])}
                    className="px-2 py-0.5 rounded-md bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs transition-colors"
                  >
                    {item}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Size Selector */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              尺码选择: <span className="text-zinc-900 font-bold">{size}</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_SIZES.map((sz) => {
                const active = size === sz;
                return (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => setSize(sz)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                      active
                        ? 'bg-zinc-900 text-white shadow-xs scale-105'
                        : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                    }`}
                  >
                    {sz}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Delivery & Settlement Formats */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">得物交货 / 寄件方式</label>
              <select
                value={deliveryMethod}
                onChange={(e) => setDeliveryMethod(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-zinc-200 focus:outline-hidden focus:ring-2 focus:ring-zinc-900 text-xs bg-white font-medium"
              >
                <option value="顺丰直寄得物华东仓(昆山/嘉兴)">顺丰直寄得物华东仓</option>
                <option value="顺丰直寄得物华南仓(东莞)">顺丰直寄得物华南仓</option>
                <option value="顺丰直寄得物西南仓(成都)">顺丰直寄得物西南仓</option>
                <option value="顺丰直寄得物华北仓(廊坊)">顺丰直寄得物华北仓</option>
                <option value="同城闪送/自提">同城闪送 / 亲自到店自提</option>
                <option value="先留货稍后来取">先留货，稍后来店取</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">开单结算方式</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-zinc-200 focus:outline-hidden focus:ring-2 focus:ring-zinc-900 text-xs bg-white font-medium"
              >
                <option value="微信转账/小程序远程开单">微信转账/小程序开单</option>
                <option value="商场官方小程序线上开单">商场官方小程序开单</option>
                <option value="到店刷卡/微信扫码支付">到店刷卡/扫码支付</option>
                <option value="顺丰货到付款/到付">顺丰代收/到付</option>
              </select>
            </div>
          </div>

          {/* Inquiry Options Checkbox */}
          <div className="flex items-center space-x-2 pt-1">
            <input
              type="checkbox"
              id="askDiscountCheck"
              checked={askDiscount}
              onChange={(e) => setAskDiscount(e.target.checked)}
              className="w-4 h-4 rounded text-zinc-900 focus:ring-zinc-900 border-zinc-300 cursor-pointer"
            />
            <label htmlFor="askDiscountCheck" className="text-xs text-zinc-700 font-medium cursor-pointer">
              主动询问活动件折、商场满减或会员扣点（争取最大调货利润空间）
            </label>
          </div>

          {/* Generated Text Box */}
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-zinc-800 flex items-center space-x-1">
                <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>实时生成同行查货微信文案</span>
              </label>
              <span className="text-[11px] text-zinc-400">已智能适配同行礼貌口吻</span>
            </div>
            <div className="p-3.5 rounded-xl bg-zinc-900 text-zinc-100 text-xs leading-relaxed font-mono relative border border-zinc-800 shadow-inner select-all">
              {generatedScript}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-zinc-50 border-t border-zinc-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {contact?.wechatId && (
              <button
                type="button"
                onClick={() => handleCopyWechat(contact.wechatId!)}
                className="px-3 py-2 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-semibold transition-colors flex items-center space-x-1.5"
              >
                {wechatCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{wechatCopied ? '已复制微信' : `复制柜员微信 (${contact.wechatId})`}</span>
              </button>
            )}

            {onOpenNewTask && store && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenNewTask(store, sku, size);
                }}
                className="px-3 py-2 bg-purple-50 border border-purple-200 hover:bg-purple-100 text-purple-800 rounded-xl text-xs font-bold transition-colors"
                title="建立调货进度跟踪工单"
              >
                <span>📊 转为调货工单</span>
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-200 rounded-xl transition-colors"
            >
              关闭
            </button>
            <button
              type="button"
              onClick={handleCopyScript}
              className={`px-6 py-2.5 text-xs font-bold rounded-xl shadow-md transition-all flex items-center space-x-2 ${
                copied
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                  : 'bg-zinc-900 text-white hover:bg-zinc-800'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  <span>已复制！可直接去微信粘贴</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-amber-400" />
                  <span>一键复制查货话术</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
