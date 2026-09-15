import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { Modal } from './Modal';
import {
  Plus,
  X,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Loader2,
  Trash2,
  Flag,
  CalendarDays,
  ListTodo,
} from 'lucide-react';

const PRIORITY_CONFIG = {
  LOW: { label: 'منخفض', color: 'bg-slate-100 text-slate-700 border-slate-200' },
  MEDIUM: { label: 'متوسط', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  HIGH: { label: 'مرتفع', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  URGENT: { label: 'عاجل', color: 'bg-red-100 text-red-700 border-red-200' },
};

const STATUS_CONFIG = {
  PENDING: { label: 'قيد الانتظار', color: 'bg-slate-100 text-slate-700', icon: Clock },
  IN_PROGRESS: { label: 'جاري العمل', color: 'bg-blue-100 text-blue-700', icon: Loader2 },
  COMPLETED: { label: 'مكتملة', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  OVERDUE: { label: 'متأخرة', color: 'bg-red-100 text-red-700', icon: AlertTriangle },
};

export const TasksModal = ({ isOpen, onClose, employeeId, employeeName }) => {
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', priority: 'MEDIUM', dueDate: '' });
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const { data: tasksData, isLoading } = useQuery({
    queryKey: ['owner', 'employee-tasks', employeeId],
    queryFn: async () => {
      const res = await api.owner.getEmployeeTasks(employeeId);
      return res.data;
    },
    enabled: isOpen && !!employeeId,
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.owner.createTask(employeeId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner', 'employee-tasks', employeeId] });
      setForm({ title: '', description: '', priority: 'MEDIUM', dueDate: '' });
      setShowAddForm(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ taskId, data }) => api.owner.updateTask(employeeId, taskId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner', 'employee-tasks', employeeId] });
      setEditingTaskId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (taskId) => api.owner.deleteTask(employeeId, taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner', 'employee-tasks', employeeId] });
    },
  });

  const handleCreate = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    createMutation.mutate({
      title: form.title,
      description: form.description || undefined,
      priority: form.priority,
      dueDate: form.dueDate || undefined,
    });
  };

  const handleStatusChange = (taskId, newStatus) => {
    updateMutation.mutate({ taskId, data: { status: newStatus } });
  };

  const startEditing = (task) => {
    setEditingTaskId(task.id);
    setEditForm({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      status: task.status,
      dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
    });
  };

  const handleEditSave = () => {
    updateMutation.mutate({
      taskId: editingTaskId,
      data: {
        title: editForm.title,
        description: editForm.description || null,
        priority: editForm.priority,
        status: editForm.status,
        dueDate: editForm.dueDate || null,
      },
    });
  };

  const tasks = tasksData || [];
  const pendingTasks = tasks.filter((t) => t.status === 'PENDING' || t.status === 'IN_PROGRESS' || t.status === 'OVERDUE');
  const completedTasks = tasks.filter((t) => t.status === 'COMPLETED');

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-lg">
      <div className="p-5 space-y-5" style={{ direction: 'rtl' }}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <ListTodo className="w-5 h-5 text-indigo-600" />
            <h2 className="font-black text-lg text-slate-900">مهام {employeeName}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg transition-smooth">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {/* Add Task Button / Form */}
        {!showAddForm ? (
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-sm font-bold transition-smooth border border-indigo-200"
          >
            <Plus className="w-4 h-4" />
            إضافة مهمة جديدة
          </button>
        ) : (
          <form onSubmit={handleCreate} className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 space-y-3">
            <input
              type="text"
              placeholder="عنوان المهمة *"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              autoFocus
            />
            <textarea
              placeholder="وصف المهمة (اختياري)"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none"
            />
            <div className="grid grid-cols-2 gap-3">
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              >
                <option value="LOW">منخفض</option>
                <option value="MEDIUM">متوسط</option>
                <option value="HIGH">مرتفع</option>
                <option value="URGENT">عاجل</option>
              </select>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={createMutation.isPending || !form.title.trim()}
                className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-smooth disabled:opacity-50"
              >
                {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'إضافة'}
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition-smooth"
              >
                إلغاء
              </button>
            </div>
          </form>
        )}

        {/* Tasks List */}
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">
            <ListTodo className="w-10 h-10 mx-auto mb-2 opacity-30" />
            مفيش مهام لسه — أضف مهمة جديدة
          </div>
        ) : (
          <div className="space-y-4">
            {/* Pending Tasks */}
            {pendingTasks.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-500 uppercase">مهام نشطة ({pendingTasks.length})</h4>
                {pendingTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    isEditing={editingTaskId === task.id}
                    editForm={editForm}
                    setEditForm={setEditForm}
                    onStartEdit={() => startEditing(task)}
                    onSaveEdit={handleEditSave}
                    onCancelEdit={() => setEditingTaskId(null)}
                    onStatusChange={handleStatusChange}
                    onDelete={() => deleteMutation.mutate(task.id)}
                    isUpdating={updateMutation.isPending}
                    isDeleting={deleteMutation.isPending}
                  />
                ))}
              </div>
            )}

            {/* Completed Tasks */}
            {completedTasks.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-emerald-600 uppercase">مهام مكتملة ({completedTasks.length})</h4>
                {completedTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    isEditing={editingTaskId === task.id}
                    editForm={editForm}
                    setEditForm={setEditForm}
                    onStartEdit={() => startEditing(task)}
                    onSaveEdit={handleEditSave}
                    onCancelEdit={() => setEditingTaskId(null)}
                    onStatusChange={handleStatusChange}
                    onDelete={() => deleteMutation.mutate(task.id)}
                    isUpdating={updateMutation.isPending}
                    isDeleting={deleteMutation.isPending}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};

const TaskCard = ({ task, isEditing, editForm, setEditForm, onStartEdit, onSaveEdit, onCancelEdit, onStatusChange, onDelete, isUpdating, isDeleting }) => {
  const statusCfg = STATUS_CONFIG[task.status];
  const priorityCfg = PRIORITY_CONFIG[task.priority];
  const StatusIcon = statusCfg.icon;

  if (isEditing) {
    return (
      <div className="p-3 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-2">
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
        />
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          rows={2}
          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
          placeholder="وصف المهمة"
        />
        <div className="grid grid-cols-3 gap-2">
          <select
            value={editForm.priority}
            onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}
            className="px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none"
          >
            <option value="LOW">منخفض</option>
            <option value="MEDIUM">متوسط</option>
            <option value="HIGH">مرتفع</option>
            <option value="URGENT">عاجل</option>
          </select>
          <select
            value={editForm.status}
            onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
            className="px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none"
          >
            <option value="PENDING">قيد الانتظار</option>
            <option value="IN_PROGRESS">جاري العمل</option>
            <option value="COMPLETED">مكتملة</option>
            <option value="OVERDUE">متأخرة</option>
          </select>
          <input
            type="date"
            value={editForm.dueDate}
            onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })}
            className="px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none"
          />
        </div>
        <div className="flex gap-2 pt-1">
          <button onClick={onSaveEdit} disabled={isUpdating} className="flex-1 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold disabled:opacity-50">
            {isUpdating ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : 'حفظ'}
          </button>
          <button onClick={onCancelEdit} className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold">
            إلغاء
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-3 bg-white rounded-2xl border border-slate-100 shadow-xs hover:shadow-sm transition-smooth ${task.status === 'COMPLETED' ? 'opacity-70' : ''}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${statusCfg.color}`}>
              <StatusIcon className="w-3 h-3" />
              {statusCfg.label}
            </span>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${priorityCfg.color}`}>
              <Flag className="w-2.5 h-2.5" />
              {priorityCfg.label}
            </span>
          </div>
          <h5 className={`font-bold text-sm text-slate-800 ${task.status === 'COMPLETED' ? 'line-through' : ''}`}>
            {task.title}
          </h5>
          {task.description && (
            <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{task.description}</p>
          )}
          {task.dueDate && (
            <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-400">
              <CalendarDays className="w-3 h-3" />
              {new Date(task.dueDate).toLocaleDateString('ar-EG')}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {task.status !== 'COMPLETED' && (
            <button
              onClick={() => onStatusChange(task.id, 'COMPLETED')}
              className="p-1.5 hover:bg-emerald-50 rounded-lg transition-smooth"
              title="إكمال المهمة"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </button>
          )}
          <button
            onClick={onStartEdit}
            className="p-1.5 hover:bg-slate-100 rounded-lg transition-smooth"
            title="تعديل"
          >
            <Flag className="w-3.5 h-3.5 text-slate-400" />
          </button>
          <button
            onClick={onDelete}
            disabled={isDeleting}
            className="p-1.5 hover:bg-red-50 rounded-lg transition-smooth"
            title="حذف"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-400" />
          </button>
        </div>
      </div>
    </div>
  );
};
