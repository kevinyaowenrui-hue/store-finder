'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  LayoutDashboard,
  Plus,
  Trash2,
  ChevronRight,
  ChevronLeft,
  Truck,
  CheckCircle2,
  Clock,
  ExternalLink,
  DollarSign,
  Store,
  Tag,
  AlertCircle,
  TrendingUp,
  Download,
  Upload,
} from 'lucide-react';
import {
  getAllTasks,
  saveTask,
  updateTaskStatus,
  deleteTask,
  getTaskSummary,
  SourcingTask,
  TaskStatus,
  STATUS_COLUMNS,
} from '../lib/kanbanStorage';

interface SourcingKanbanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenNewTask: () => void;
}

export function SourcingKanbanModal({
  isOpen,
  onClose,
  onOpenNewTask,
}: SourcingKanbanModalProps) {
  const [tasks, setTasks] = useState<SourcingTask[]>([]);
  const [summary, setSummary] = useState(getTaskSummary());
  const [editingSfId, setEditingSfId] = useState<string | null>(null);
  const [sfInput, setSfInput] = useState('');

  const refreshData = () => {
    const list = getAllTasks();
    setTasks(list);
    setSummary(getTaskSummary());
  };

  useEffect(() => {
    if (isOpen) {
      refreshData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleNextStatus = (task: SourcingTask) => {
    const statusOrder: TaskStatus[] = ['inquiring', 'reserved', 'paid', 'shipped', 'completed'];
    const currentIdx = statusOrder.indexOf(task.status);
    if (currentIdx >= 0 && currentIdx < statusOrder.length - 1) {
      const nextStatus = statusOrder[currentIdx + 1];
      updateTaskStatus(task.id, nextStatus);
      refreshData();
    }
  };

  const handlePrevStatus = (task: SourcingTask) => {
    const statusOrder: TaskStatus[] = ['inquiring', 'reserved', 'paid', 'shipped', 'completed'];
    const currentIdx = statusOrder.indexOf(task.status);
    if (currentIdx > 0) {
      const prevStatus = statusOrder[currentIdx - 1];
      updateTaskStatus(task.id, prevStatus);
      refreshData();
    }
  };

  const handleDelete = (taskId: string) => {
    if (window.confirm('确定删除此调货工单吗？')) {
      deleteTask(taskId);
      refreshData();
    }
  };

  const handleSaveSfNumber = (task: SourcingTask) => {
    saveTask({
      ...task,
      sfTrackingNumber: sfInput.trim(),
    });
    setEditingSfId(null);
    setSfInput('');
    refreshData();
  };

  const handleExportBackup = () => {
    try {
      const backupData = {
        version: '1.0',
        exportTime: new Date().toISOString(),
        contacts: localStorage.getItem('store_finder_contacts_v1'),
        favorites: localStorage.getItem('store_finder_favorites_v1'),
        kanban: localStorage.getItem('store_finder_kanban_v1'),
      };
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `store_finder_backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export backup', err);
    }
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const raw = event.target?.result as string;
        const data = JSON.parse(raw);
        if (data.contacts) {
          localStorage.setItem(
            'store_finder_contacts_v1',
            typeof data.contacts === 'string' ? data.contacts : JSON.stringify(data.contacts)
          );
        }
        if (data.favorites) {
          localStorage.setItem(
            'store_finder_favorites_v1',
            typeof data.favorites === 'string' ? data.favorites : JSON.stringify(data.favorites)
          );
        }
        if (data.kanban) {
          localStorage.setItem(
            'store_finder_kanban_v1',
            typeof data.kanban === 'string' ? data.kanban : JSON.stringify(data.kanban)
          );
        }
        refreshData();
        alert('✅ 调货名片、收藏与看板数据恢复成功！');
      } catch (err) {
        alert('❌ 备份文件解析失败，请确认选择的是正确的 .json 备份文件');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/65 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-zinc-100 rounded-2xl shadow-2xl w-full max-w-7xl h-[92vh] flex flex-col border border-zinc-300 overflow-hidden">
        {/* Modal Top Navigation */}
        <div className="px-5 py-3.5 bg-zinc-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold">得物跨店调货进度看板</h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold">
                  Sourcing Kanban
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                多店调货生命周期闭环追踪与资金收益台账
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Backup / Export Button */}
            <button
              type="button"
              onClick={handleExportBackup}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-zinc-200 text-xs font-medium transition-colors"
              title="导出名片、收藏与工单数据为 JSON 文件备份"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">备份数据</span>
            </button>

            {/* Restore / Import Button */}
            <label
              className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-zinc-200 text-xs font-medium transition-colors cursor-pointer"
              title="从已导出的 JSON 文件恢复名片与工单数据"
            >
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">恢复数据</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportBackup}
                className="hidden"
              />
            </label>

            <button
              type="button"
              onClick={onOpenNewTask}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white text-xs font-bold shadow-xs active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>+ 发起调货工单</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Global Metrics Header Bar */}
        <div className="bg-white border-b border-zinc-200/80 px-5 py-3 grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
          <div className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200/60">
            <span className="text-[11px] text-zinc-500 font-medium">⚡ 活跃调货中</span>
            <div className="text-xl font-black text-zinc-900 mt-0.5">
              {summary.activeCount} <span className="text-xs font-normal text-zinc-500">双</span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-blue-50/60 border border-blue-200/60">
            <span className="text-[11px] text-blue-700 font-medium">💳 在途锁定资金 (已付)</span>
            <div className="text-xl font-black text-blue-900 mt-0.5">
              ¥{summary.inTransitCapital}
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-200/60">
            <span className="text-[11px] text-amber-800 font-medium">⏳ 预计待结算利润</span>
            <div className="text-xl font-black text-amber-900 mt-0.5">
              +¥{summary.pendingProfit}
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-200/60">
            <span className="text-[11px] text-emerald-800 font-medium">🏆 累计已过验完结利润</span>
            <div className="text-xl font-black text-emerald-700 mt-0.5">
              +¥{summary.completedProfit}
            </div>
          </div>
        </div>

        {/* Kanban Board 5 Columns */}
        <div className="flex-1 overflow-x-auto p-3 sm:p-4 bg-zinc-100 flex gap-3.5">
          {STATUS_COLUMNS.map((col) => {
            const colTasks = tasks.filter((t) => t.status === col.id);

            return (
              <div
                key={col.id}
                className="flex-1 min-w-[280px] sm:min-w-[300px] max-w-[340px] bg-zinc-200/60 rounded-2xl flex flex-col border border-zinc-200/80 overflow-hidden"
              >
                {/* Column Header */}
                <div className="px-3.5 py-2.5 bg-white/90 border-b border-zinc-200/80 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-zinc-900">{col.title}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${col.badgeColor}`}>
                      {colTasks.length}
                    </span>
                  </div>
                </div>

                {/* Column Tasks List */}
                <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5">
                  {colTasks.length === 0 ? (
                    <div className="text-center py-10 text-zinc-400 text-xs border border-dashed border-zinc-300 rounded-xl bg-white/40">
                      暂无此阶段工单
                    </div>
                  ) : (
                    colTasks.map((task) => (
                      <div
                        key={task.id}
                        className="bg-white rounded-xl p-3.5 shadow-xs border border-zinc-200/80 space-y-2.5 hover:shadow-md transition-shadow"
                      >
                        {/* Task Card Header */}
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-700 mr-1.5">
                              {task.brandName}
                            </span>
                            <strong className="text-xs font-bold text-zinc-900 font-mono uppercase">
                              {task.sku}
                            </strong>
                            <span className="text-xs font-semibold text-zinc-600 ml-1.5">
                              【{task.size} 码】
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDelete(task.id)}
                            className="text-zinc-400 hover:text-red-500 p-1 transition-colors"
                            title="删除工单"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Store & Contact details */}
                        <div className="text-[11px] text-zinc-600 space-y-0.5">
                          <div className="flex items-center space-x-1 text-zinc-800 font-medium">
                            <Store className="w-3 h-3 text-zinc-400 shrink-0" />
                            <span className="truncate">{task.storeName}</span>
                          </div>
                          {task.contactName && (
                            <div className="text-amber-800 text-[10px] font-semibold pl-4">
                              👤 柜员: {task.contactName}
                            </div>
                          )}
                        </div>

                        {/* Financial metrics */}
                        <div className="grid grid-cols-2 gap-1.5 p-2 rounded-lg bg-zinc-50 text-[11px]">
                          <div>
                            <span className="text-zinc-400 text-[10px]">进价/双:</span>
                            <span className="font-bold text-zinc-800 ml-1">¥{task.purchaseCost || '-'}</span>
                          </div>
                          <div>
                            <span className="text-zinc-400 text-[10px]">预期纯利:</span>
                            <span className="font-bold text-emerald-600 ml-1">
                              {task.expectedProfit ? `+¥${task.expectedProfit}` : '-'}
                            </span>
                          </div>
                        </div>

                        {/* SF Tracking Number in Transit */}
                        {task.status === 'shipped' && (
                          <div className="p-2 rounded-lg bg-purple-50 border border-purple-200 text-[11px]">
                            <div className="flex items-center justify-between text-purple-900 font-semibold mb-1">
                              <span className="flex items-center space-x-1">
                                <Truck className="w-3.5 h-3.5" />
                                <span>顺丰直寄:</span>
                              </span>
                              {task.sfTrackingNumber && (
                                <a
                                  href={`https://www.sf-express.com/cn/sc/dynamic_function/waybill/#search/bill-number/${task.sfTrackingNumber}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[10px] text-purple-700 hover:underline flex items-center"
                                >
                                  <span>查顺丰</span>
                                  <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
                                </a>
                              )}
                            </div>

                            {editingSfId === task.id ? (
                              <div className="flex items-center space-x-1 mt-1">
                                <input
                                  type="text"
                                  value={sfInput}
                                  onChange={(e) => setSfInput(e.target.value)}
                                  placeholder="输入顺丰单号 SF..."
                                  className="w-full px-2 py-1 rounded border border-purple-300 text-xs font-mono bg-white"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleSaveSfNumber(task)}
                                  className="px-2 py-1 rounded bg-purple-600 text-white text-xs font-bold shrink-0"
                                >
                                  保存
                                </button>
                              </div>
                            ) : (
                              <div
                                onClick={() => {
                                  setEditingSfId(task.id);
                                  setSfInput(task.sfTrackingNumber || '');
                                }}
                                className="cursor-pointer font-mono font-bold text-purple-950 text-xs hover:underline"
                              >
                                {task.sfTrackingNumber || '+ 点击填入顺丰单号'}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Notes */}
                        {task.notes && (
                          <p className="text-[10px] text-zinc-500 bg-zinc-50/80 p-1.5 rounded line-clamp-2">
                            📝 {task.notes}
                          </p>
                        )}

                        {/* Lifecycle Step Actions */}
                        <div className="flex items-center justify-between pt-1 border-t border-zinc-100">
                          {col.id !== 'inquiring' ? (
                            <button
                              type="button"
                              onClick={() => handlePrevStatus(task)}
                              className="text-[10px] text-zinc-500 hover:text-zinc-800 flex items-center font-medium"
                            >
                              <ChevronLeft className="w-3 h-3 mr-0.5" />
                              <span>回退</span>
                            </button>
                          ) : <div />}

                          {col.id !== 'completed' ? (
                            <button
                              type="button"
                              onClick={() => handleNextStatus(task)}
                              className="text-xs text-amber-700 hover:text-amber-900 font-bold flex items-center bg-amber-50 hover:bg-amber-100 px-2 py-1 rounded-lg transition-colors"
                            >
                              <span>
                                {col.id === 'inquiring' && '锁定留货 ➔'}
                                {col.id === 'reserved' && '已付款开单 ➔'}
                                {col.id === 'paid' && '顺丰发出 ➔'}
                                {col.id === 'shipped' && '得物已过验 ➔'}
                              </span>
                              <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                            </button>
                          ) : (
                            <span className="text-[10px] text-emerald-600 font-bold flex items-center">
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                              <span>利润已结算</span>
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
