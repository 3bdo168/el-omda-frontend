import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Briefcase,
  TrendingUp,
  Package,
  XCircle,
  CheckCircle2,
  Target,
  Clock,
  AlertTriangle,
  Loader2,
  Flag,
  CalendarDays,
  ListTodo,
  PlayCircle,
} from 'lucide-react';
import { Skeleton } from '../components/Skeleton';

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

const MetricCardSkeleton = () => (
  <div className="glass-card p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4 animate-pulse">
    <div className="flex justify-between items-start">
      <div className="space-y-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-3 w-48" />
      </div>
      <Skeleton className="h-6 w-20 rounded-full" />
    </div>
    <div className="space-y-4 pt-2 border-t border-slate-100">
      <div className="space-y-2">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-2.5 w-full rounded-full" />
      </div>
    </div>
  </div>
);

export const EmployeeView = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: dashboardData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['employee', 'dashboard'],
    queryFn: async () => {
      const res = await api.employee.getMyDashboard();
      return res.data;
    },
  });

  const {
    data: tasksData,
    isLoading: tasksLoading,
  } = useQuery({
    queryKey: ['employee', 'tasks'],
    queryFn: async () => {
      const res = await api.employee.getMyTasks();
      return res.data;
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ taskId, status }) => api.employee.updateTaskStatus(taskId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee', 'tasks'] });
      queryClient.invalidateQueries({ queryKey: ['employee', 'dashboard'] });
    },
  });

  const tasks = tasksData || [];
  const pendingTasks = tasks.filter((t) => t.status === 'PENDING' || t.status === 'IN_PROGRESS' || t.status === 'OVERDUE');
  const completedTasks = tasks.filter((t) => t.status === 'COMPLETED');

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-in">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-indigo-100 text-indigo-700 rounded-2xl">
          <Briefcase className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">لوحة الموظف</h2>
          <p className="text-sm text-slate-500 font-medium">متابعة التارجت والأداء الشهري</p>
        </div>
      </div>

      {isLoading ? (
        <MetricCardSkeleton />
      ) : isError ? (
        <div className="p-6 bg-red-50 text-red-600 rounded-2xl text-center font-bold">
          حدث خطأ في تحميل البيانات
        </div>
      ) : dashboardData ? (
        <div className="space-y-6">
          {/* Main Dashboard Card */}
          <div className="glass-card rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-xl font-black shadow-md">
                  {dashboardData.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-slate-900">{dashboardData.name}</h3>
                  <p className="text-sm text-slate-500">{user?.email}</p>
                </div>
              </div>
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full ${
                  dashboardData.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                }`}
              >
                {dashboardData.isActive ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                {dashboardData.isActive ? 'حساب نشط' : 'حساب معطل'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-100">
              {/* Financial Target Progress */}
              {(() => {
                const achieved = parseFloat(dashboardData.performance.totalSalesAchieved) || 0;
                const target = parseFloat(dashboardData.targets.targetAmount) || 0;
                const pct = parseFloat(dashboardData.performance.amountProgressPercent) || 0;
                const remaining = target > 0 ? Math.max(0, target - achieved) : 0;
                const exceeded = target > 0 && achieved >= target;
                return (
                  <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-700 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-emerald-600" />
                        التارجت المالي
                      </span>
                      <span className="text-sm font-black text-emerald-700">
                        {achieved.toLocaleString('ar-EG')} / {target > 0 ? target.toLocaleString('ar-EG') : '—'} ج.م
                      </span>
                    </div>
                    <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ease-out ${exceeded ? 'bg-emerald-500' : 'bg-emerald-400'}`}
                        style={{ width: `${Math.min(100, pct)}%` }}
                      />
                    </div>
                    {exceeded ? (
                      <p className="text-xs font-black text-emerald-600">
                        🏆 تم تحقيق التارجت وتجاوزه بنسبة {(pct - 100).toFixed(1)}%!
                      </p>
                    ) : remaining > 0 ? (
                      <p className="text-xs text-slate-500 font-bold">
                        باقي {remaining.toLocaleString('ar-EG')} ج.م لتحقيق التارجت — {pct.toFixed(1)}%
                      </p>
                    ) : (
                      <p className="text-xs text-slate-400 font-bold">لم يتم تحديد تارجت مالي</p>
                    )}
                  </div>
                );
              })()}

              {/* Order Target Progress */}
              {(() => {
                const delivered = dashboardData.performance.deliveredOrdersCount || 0;
                const target = dashboardData.targets.targetOrders || 0;
                const pct = parseFloat(dashboardData.performance.ordersProgressPercent) || 0;
                const remaining = target > 0 ? Math.max(0, target - delivered) : 0;
                const exceeded = target > 0 && delivered >= target;
                return (
                  <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-700 flex items-center gap-2">
                        <Target className="w-4 h-4 text-purple-600" />
                        تارجت الطلبات
                      </span>
                      <span className="text-sm font-black text-purple-700">
                        {delivered} / {target > 0 ? target : '—'} طلب
                      </span>
                    </div>
                    <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ease-out ${exceeded ? 'bg-purple-500' : 'bg-purple-400'}`}
                        style={{ width: `${Math.min(100, pct)}%` }}
                      />
                    </div>
                    {exceeded ? (
                      <p className="text-xs font-black text-purple-600">
                        🏆 تم تحقيق تارجت الطلبات وتجاوزه بنسبة {(pct - 100).toFixed(1)}%!
                      </p>
                    ) : remaining > 0 ? (
                      <p className="text-xs text-slate-500 font-bold">
                        باقي {remaining} طلب لتحقيق التارجت — {pct.toFixed(1)}%
                      </p>
                    ) : (
                      <p className="text-xs text-slate-400 font-bold">لم يتم تحديد تارجت للطلبات</p>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-100">
              <div className="bg-white p-4 rounded-2xl border border-slate-100 text-center shadow-xs">
                <div className="flex justify-center mb-2"><Package className="w-6 h-6 text-slate-400" /></div>
                <div className="text-xs text-slate-500 mb-1">الطلبات المسندة</div>
                <div className="font-black text-lg text-slate-800">{dashboardData.performance.totalAssignedOrders}</div>
              </div>
              <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 text-center shadow-xs">
                <div className="flex justify-center mb-2"><CheckCircle2 className="w-6 h-6 text-emerald-500" /></div>
                <div className="text-xs text-emerald-700 mb-1">تم التوصيل</div>
                <div className="font-black text-lg text-emerald-800">{dashboardData.performance.deliveredOrdersCount}</div>
              </div>
              <div className="bg-red-50 p-4 rounded-2xl border border-red-100 text-center shadow-xs">
                <div className="flex justify-center mb-2"><XCircle className="w-6 h-6 text-red-500" /></div>
                <div className="text-xs text-red-700 mb-1">طلبات ملغية</div>
                <div className="font-black text-lg text-red-800">{dashboardData.performance.cancelledOrdersCount}</div>
              </div>
            </div>
          </div>

          {/* Tasks Section */}
          <div className="glass-card rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <ListTodo className="w-5 h-5 text-indigo-600" />
              <h3 className="font-black text-lg text-slate-900">المهام المطلوبة منك</h3>
              {tasks.length > 0 && (
                <span className="text-xs font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                  {pendingTasks.length} نشطة
                </span>
              )}
            </div>

            {tasksLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
              </div>
            ) : tasks.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm">
                <ListTodo className="w-10 h-10 mx-auto mb-2 opacity-30" />
                مفيش مهام مطلوبة منك حالياً
              </div>
            ) : (
              <div className="space-y-4">
                {/* Pending Tasks */}
                {pendingTasks.length > 0 && (
                  <div className="space-y-2">
                    {pendingTasks.map((task) => {
                      const statusCfg = STATUS_CONFIG[task.status];
                      const priorityCfg = PRIORITY_CONFIG[task.priority];
                      const StatusIcon = statusCfg.icon;
                      return (
                        <div key={task.id} className="p-4 bg-white rounded-2xl border border-slate-100 shadow-xs hover:shadow-sm transition-smooth">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${statusCfg.color}`}>
                                  <StatusIcon className="w-3 h-3" />
                                  {statusCfg.label}
                                </span>
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${priorityCfg.color}`}>
                                  <Flag className="w-2.5 h-2.5" />
                                  {priorityCfg.label}
                                </span>
                              </div>
                              <h5 className="font-bold text-sm text-slate-800">{task.title}</h5>
                              {task.description && (
                                <p className="text-xs text-slate-500 mt-1">{task.description}</p>
                              )}
                              {task.dueDate && (
                                <div className="flex items-center gap-1 mt-1.5 text-[10px] text-slate-400">
                                  <CalendarDays className="w-3 h-3" />
                                  الموعد: {new Date(task.dueDate).toLocaleDateString('ar-EG')}
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col gap-1.5 shrink-0">
                              {task.status === 'PENDING' && (
                                <button
                                  onClick={() => statusMutation.mutate({ taskId: task.id, status: 'IN_PROGRESS' })}
                                  disabled={statusMutation.isPending}
                                  className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-[10px] font-bold transition-smooth border border-blue-200"
                                  title="بدأت الشغل"
                                >
                                  <PlayCircle className="w-3.5 h-3.5" />
                                  ابدأ
                                </button>
                              )}
                              <button
                                onClick={() => statusMutation.mutate({ taskId: task.id, status: 'COMPLETED' })}
                                disabled={statusMutation.isPending}
                                className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-[10px] font-bold transition-smooth border border-emerald-200"
                                title="خلصت المهمة"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                خلصت
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Completed Tasks */}
                {completedTasks.length > 0 && (
                  <div className="space-y-2 pt-3 border-t border-slate-100">
                    <h4 className="text-xs font-bold text-emerald-600">مهام مكتملة ({completedTasks.length})</h4>
                    {completedTasks.map((task) => (
                      <div key={task.id} className="p-3 bg-emerald-50/40 rounded-2xl border border-emerald-100 opacity-70">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                          <span className="font-bold text-sm text-slate-600 line-through">{task.title}</span>
                        </div>
                        {task.completedAt && (
                          <p className="text-[10px] text-slate-400 mt-1 mr-6">
                            اكتمل: {new Date(task.completedAt).toLocaleDateString('ar-EG')}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};
