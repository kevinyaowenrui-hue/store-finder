'use client';

export type TaskStatus = 'inquiring' | 'reserved' | 'paid' | 'shipped' | 'completed' | 'cancelled';

export interface SourcingTask {
  id: string;
  storeId: string;
  storeName: string;
  brandName: string;
  contactName?: string;
  sku: string;
  size: string;
  quantity: number;
  tagPrice?: number;
  purchaseCost?: number;
  dewuPrice?: number;
  expectedProfit?: number;
  dewuWarehouse?: string;
  sfTrackingNumber?: string;
  status: TaskStatus;
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

export const STATUS_COLUMNS: { id: TaskStatus; title: string; color: string; badgeColor: string }[] = [
  { id: 'inquiring', title: '1. 待询价/已询价', color: 'border-zinc-300', badgeColor: 'bg-zinc-100 text-zinc-700' },
  { id: 'reserved', title: '2. 店长已留货', color: 'border-amber-400', badgeColor: 'bg-amber-100 text-amber-800' },
  { id: 'paid', title: '3. 已付款开单', color: 'border-blue-400', badgeColor: 'bg-blue-100 text-blue-800' },
  { id: 'shipped', title: '4. 顺丰直寄得物', color: 'border-purple-400', badgeColor: 'bg-purple-100 text-purple-800' },
  { id: 'completed', title: '5. 已过验完结', color: 'border-emerald-400', badgeColor: 'bg-emerald-100 text-emerald-800' },
];

const KANBAN_STORAGE_KEY = 'store_finder_kanban_v1';

export function getAllTasks(): SourcingTask[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KANBAN_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to parse kanban tasks', err);
    return [];
  }
}

export function saveTask(task: Omit<SourcingTask, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): SourcingTask {
  const all = getAllTasks();
  const now = Date.now();
  let savedTask: SourcingTask;

  if (task.id) {
    const idx = all.findIndex((t) => t.id === task.id);
    if (idx >= 0) {
      savedTask = {
        ...all[idx],
        ...task,
        updatedAt: now,
      };
      all[idx] = savedTask;
    } else {
      savedTask = {
        ...task,
        id: task.id,
        createdAt: now,
        updatedAt: now,
      } as SourcingTask;
      all.unshift(savedTask);
    }
  } else {
    savedTask = {
      ...task,
      id: 'task_' + now + '_' + Math.random().toString(36).substring(2, 7),
      createdAt: now,
      updatedAt: now,
    } as SourcingTask;
    all.unshift(savedTask);
  }

  try {
    localStorage.setItem(KANBAN_STORAGE_KEY, JSON.stringify(all));
  } catch (err) {
    console.error('Failed to save kanban tasks', err);
  }

  return savedTask;
}

export function updateTaskStatus(taskId: string, newStatus: TaskStatus): boolean {
  const all = getAllTasks();
  const idx = all.findIndex((t) => t.id === taskId);
  if (idx >= 0) {
    all[idx].status = newStatus;
    all[idx].updatedAt = Date.now();
    try {
      localStorage.setItem(KANBAN_STORAGE_KEY, JSON.stringify(all));
      return true;
    } catch (err) {
      console.error('Failed to update task status', err);
    }
  }
  return false;
}

export function deleteTask(taskId: string): boolean {
  let all = getAllTasks();
  all = all.filter((t) => t.id !== taskId);
  try {
    localStorage.setItem(KANBAN_STORAGE_KEY, JSON.stringify(all));
    return true;
  } catch (err) {
    console.error('Failed to delete task', err);
  }
  return false;
}

export function getTaskSummary() {
  const all = getAllTasks();
  let inTransitCapital = 0; // 已付款、在途中的资金锁定
  let pendingProfit = 0; // 预估待结算利润
  let completedProfit = 0; // 已过验完结利润
  let activeCount = 0;

  for (const t of all) {
    if (t.status === 'paid' || t.status === 'shipped') {
      inTransitCapital += (t.purchaseCost || 0) * (t.quantity || 1);
      pendingProfit += (t.expectedProfit || 0) * (t.quantity || 1);
      activeCount++;
    } else if (t.status === 'reserved' || t.status === 'inquiring') {
      pendingProfit += (t.expectedProfit || 0) * (t.quantity || 1);
      activeCount++;
    } else if (t.status === 'completed') {
      completedProfit += (t.expectedProfit || 0) * (t.quantity || 1);
    }
  }

  return {
    totalTasks: all.length,
    activeCount,
    inTransitCapital: Math.round(inTransitCapital * 10) / 10,
    pendingProfit: Math.round(pendingProfit * 10) / 10,
    completedProfit: Math.round(completedProfit * 10) / 10,
  };
}
