'use client';

import React, { useState, useEffect } from 'react';
import { X, UserCheck, MessageSquare, Phone, Tag, Save, Trash2, ShieldCheck, Sparkles } from 'lucide-react';
import { StoreItem, StoreContact } from '../lib/types';
import { COMMON_CONTACT_TAGS, getStoreContact, saveStoreContact, removeStoreContact } from '../lib/contactStorage';

interface StoreContactModalProps {
  store: StoreItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function StoreContactModal({ store, isOpen, onClose, onSaved }: StoreContactModalProps) {
  const [contactName, setContactName] = useState('');
  const [role, setRole] = useState('店长');
  const [wechatId, setWechatId] = useState('');
  const [phone, setPhone] = useState('');
  const [discountNote, setDiscountNote] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (store && isOpen) {
      const existing = getStoreContact(store.id);
      if (existing) {
        setContactName(existing.contactName || '');
        setRole(existing.role || '店长');
        setWechatId(existing.wechatId || '');
        setPhone(existing.phone || '');
        setDiscountNote(existing.discountNote || '');
        setSelectedTags(existing.tags || []);
        setNotes(existing.notes || '');
      } else {
        setContactName('');
        setRole('店长');
        setWechatId('');
        setPhone(store.phone || '');
        setDiscountNote('');
        setSelectedTags(['支持远程开单', '可直寄得物仓']);
        setNotes('');
      }
    }
  }, [store, isOpen]);

  if (!isOpen || !store) return null;

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSave = () => {
    if (!contactName.trim()) {
      alert('请填写联系人称呼（如：张店长 / 小李SA）');
      return;
    }
    const contactData: StoreContact = {
      storeId: store.id,
      contactName: contactName.trim(),
      role,
      wechatId: wechatId.trim(),
      phone: phone.trim(),
      discountNote: discountNote.trim(),
      tags: selectedTags,
      notes: notes.trim(),
    };
    saveStoreContact(contactData);
    onSaved();
    onClose();
  };

  const handleDelete = () => {
    if (confirm('确定删除该门店的私域联系人备注吗？')) {
      removeStoreContact(store.id);
      onSaved();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-zinc-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-zinc-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-brand-400">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">专柜私域联系人 & 调货备忘</h3>
              <p className="text-xs text-zinc-400 truncate max-w-xs">{store.store_name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 text-sm">
          {/* Privacy Alert */}
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/80 flex items-start space-x-2.5 text-xs text-amber-800">
            <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>私密安全保护：所有店长微信与私域备忘均仅保存在您的本地浏览器中，绝不上报或公开。</span>
          </div>

          {/* Contact Name & Role */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                联系人姓名 / 称呼 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="例如: 张店长 / 小李(资深导购)"
                className="w-full px-3 py-2 rounded-xl border border-zinc-200 focus:outline-hidden focus:ring-2 focus:ring-zinc-900 text-sm font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">店内身份</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-zinc-200 focus:outline-hidden focus:ring-2 focus:ring-zinc-900 text-sm bg-white"
              >
                <option value="店长">店长</option>
                <option value="副店长">副店长</option>
                <option value="资深导购/SA">资深导购/SA</option>
                <option value="库房管货">库房管货</option>
                <option value="渠道经理">渠道经理</option>
              </select>
            </div>
          </div>

          {/* WeChat ID & Direct Mobile */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1 flex items-center space-x-1">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                <span>微信号 / 企微号</span>
              </label>
              <input
                type="text"
                value={wechatId}
                onChange={(e) => setWechatId(e.target.value)}
                placeholder="微信号 (支持一键复制)"
                className="w-full px-3 py-2 rounded-xl border border-zinc-200 focus:outline-hidden focus:ring-2 focus:ring-zinc-900 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1 flex items-center space-x-1">
                <Phone className="w-3.5 h-3.5 text-blue-600" />
                <span>手机号 / 专线</span>
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="手机号 (用于快捷拨打)"
                className="w-full px-3 py-2 rounded-xl border border-zinc-200 focus:outline-hidden focus:ring-2 focus:ring-zinc-900 text-sm"
              />
            </div>
          </div>

          {/* Exclusive Discount & Policy */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              专属调货折扣 / 会员权限说明
            </label>
            <input
              type="text"
              value={discountNote}
              onChange={(e) => setDiscountNote(e.target.value)}
              placeholder="例如: 熟人件折 7折 / 可走商场黑金卡 8.5折 / 支持包邮"
              className="w-full px-3 py-2 rounded-xl border border-zinc-200 focus:outline-hidden focus:ring-2 focus:ring-zinc-900 text-sm"
            />
          </div>

          {/* Quick Capability Tags */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5 flex items-center space-x-1">
              <Tag className="w-3.5 h-3.5 text-zinc-500" />
              <span>调货配合特性标签 (点击选择)</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_CONTACT_TAGS.map((tag) => {
                const active = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                      active
                        ? 'bg-zinc-900 text-white shadow-xs'
                        : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                    }`}
                  >
                    {active ? '✓ ' : '+ '}
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">调货配合与避坑备忘录</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="例如: 晚上20:00后店长管库查货最快；支持顺丰当晚发货直寄得物仓。"
              className="w-full px-3 py-2 rounded-xl border border-zinc-200 focus:outline-hidden focus:ring-2 focus:ring-zinc-900 text-sm resize-none"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-zinc-50 border-t border-zinc-200 flex items-center justify-between">
          <div>
            {getStoreContact(store.id) && (
              <button
                type="button"
                onClick={handleDelete}
                className="px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors flex items-center space-x-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>清除名片</span>
              </button>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-200 rounded-xl transition-colors"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 text-xs font-bold text-white bg-zinc-900 hover:bg-zinc-800 rounded-xl shadow-xs transition-all flex items-center space-x-1.5"
            >
              <Save className="w-4 h-4" />
              <span>保存私域名片</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
