'use client';

import { StoreContact } from './types';

const STORAGE_KEY = 'store_finder_contacts_v1';

export function getAllContacts(): Record<number, StoreContact> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to read store contacts from localStorage', err);
    return {};
  }
}

export function getStoreContact(storeId: number): StoreContact | null {
  const all = getAllContacts();
  return all[storeId] || null;
}

export function saveStoreContact(contact: StoreContact): void {
  if (typeof window === 'undefined') return;
  try {
    const all = getAllContacts();
    all[contact.storeId] = {
      ...contact,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch (err) {
    console.error('Failed to save store contact', err);
  }
}

export function removeStoreContact(storeId: number): void {
  if (typeof window === 'undefined') return;
  try {
    const all = getAllContacts();
    delete all[storeId];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch (err) {
    console.error('Failed to remove store contact', err);
  }
}

export const COMMON_CONTACT_TAGS = [
  '支持远程开单',
  '可直寄得物仓',
  '留货配合度高',
  '常年有件折',
  '支持微信转账',
  '支持小程序开单',
  '支持顺丰到付',
  '秒回微信',
  '老牌店长熟人',
  '奥莱深度特惠',
];
