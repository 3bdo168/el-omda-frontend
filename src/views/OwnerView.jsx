import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Crown,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Users,
  Award,
  AlertCircle,
  Calendar,
  CreditCard,
  Building2,
  ArrowUpRight,
  Package,
  CheckCircle2,
  RefreshCw,
  BarChart3,
  Plus,
  History,
  Gift,
  MinusCircle,
  Percent,
  Eye,
  UserPlus,
  X,
  Loader2,
  Trash2,
  Edit2,
  Smartphone,
  Wallet,
  Banknote,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { api } from '../services/api';
import { Modal } from '../components/Modal';
import { TasksModal } from '../components/TasksModal';
import { MetricCardSkeleton, TableRowSkeleton } from '../components/Skeleton';

// ─── Revenue Trend Chart ──────────────────────────────────────────────────────

const PERIOD_LABELS = {
  TODAY: 'الإيرادات حسب الساعة — اليوم',
  WEEK: 'الإيرادات اليومية — آخر 7 أيام',
  MONTH: 'الإيرادات اليومية — آخر 30 يوم',
  ALL: 'الإيرادات الشهرية — كل الفترات',
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div
      style={{ direction: 'rtl' }}
      className="bg-white border border-slate-200 rounded-xl shadow-md px-3 py-2 text-xs"
    >
      <p className="font-bold text-slate-700 mb-1">{label}</p>
      <p className="text-emerald-700 font-extrabold">
        الإيرادات: {payload[0].value.toLocaleString('ar-EG')} ج.م
      </p>
      {payload[0].payload.orderCount !== undefined && (
        <p className="text-slate-500">عدد الطلبات: {payload[0].payload.orderCount}</p>
      )}
    </div>
  );
};

const RevenueChart = ({ timeSeries, period }) => {
  if (!timeSeries || timeSeries.length === 0) return null;

  const gradientId = 'revenueGradient';

  // Decide how many X-axis ticks to show to avoid clutter
  const tickInterval = timeSeries.length > 20 ? Math.floor(timeSeries.length / 10) : 0;

  return (
    <div className="glass-card p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-amber-600" />
          {PERIOD_LABELS[period] || 'مخطط الإيرادات'}
        </h3>
        <span className="text-[11px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
          Revenue Trend
        </span>
      </div>

      {/* ltr wrapper keeps X-axis chronological even on an RTL page */}
      <div style={{ direction: 'ltr' }}>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={timeSeries} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#d97706" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#d97706" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: '#94a3b8', fontFamily: 'Cairo, sans-serif' }}
              axisLine={false}
              tickLine={false}
              interval={tickInterval}
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#94a3b8', fontFamily: 'Cairo, sans-serif' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)}
              width={38}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#d97706"
              strokeWidth={2.5}
              fill={`url(#${gradientId})`}
              dot={false}
              activeDot={{ r: 5, fill: '#d97706', strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────

export const OwnerView = () => {
  const [activeTab, setActiveTab] = useState('financial'); // 'financial' | 'employees' | 'products'
  const [datePeriod, setDatePeriod] = useState('ALL'); // 'TODAY' | 'WEEK' | 'MONTH' | 'ALL'
  const queryClient = useQueryClient();

  // ── Employee Management State ───────────────────────────────────────────────
  const [showCreateEmployeeModal, setShowCreateEmployeeModal] = useState(false);
  const [createEmpForm, setCreateEmpForm] = useState({ name: '', email: '', phone: '', password: '', targetAmount: '', targetOrders: '' });
  const [createEmpLoading, setCreateEmpLoading] = useState(false);
  const [createEmpError, setCreateEmpError] = useState('');

  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [adjustmentTarget, setAdjustmentTarget] = useState(null); // { employeeId, name, totalSalesAchieved }
  const [adjForm, setAdjForm] = useState({ type: 'BONUS', basis: 'FIXED_AMOUNT', amount: '', reason: '' });
  const [adjLoading, setAdjLoading] = useState(false);
  const [adjError, setAdjError] = useState('');
  const [adjPreview, setAdjPreview] = useState(null); // { calculatedAmount, totalSales }

  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyTarget, setHistoryTarget] = useState(null); // { employeeId, name }
  const [historyData, setHistoryData] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [showTasksModal, setShowTasksModal] = useState(false);
  const [tasksTarget, setTasksTarget] = useState(null); // { employeeId, name }
  
  // ── Payment Destinations State ──────────────────────────────────────────────
  const [showDestModal, setShowDestModal] = useState(false);
  const [destModalMode, setDestModalMode] = useState('create'); // 'create' | 'edit'
  const [destForm, setDestForm] = useState({
    id: '',
    label: '',
    type: 'PHONE',
    value: '',
    bankName: '',
    isActive: true,
    displayOrder: 0,
  });
  const [destSubmitting, setDestSubmitting] = useState(false);
  const [destError, setDestError] = useState('');

  const getDateRangeParams = () => {
    const now = new Date();
    let startDate = '';
    const endDate = now.toISOString().split('T')[0];

    if (datePeriod === 'TODAY') {
      startDate = endDate;
    } else if (datePeriod === 'WEEK') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      startDate = d.toISOString().split('T')[0];
    } else if (datePeriod === 'MONTH') {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      startDate = d.toISOString().split('T')[0];
    }

    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate && startDate) params.append('endDate', endDate);
    params.append('period', datePeriod);
    return params.toString();
  };

  // Queries
  const {
    data: financialData = null,
    isLoading: isLoadingFinancial,
    isFetching: isFetchingFinancial,
  } = useQuery({
    queryKey: ['owner', 'financial', datePeriod],
    queryFn: async () => {
      const res = await api.owner.getFinancialReport(getDateRangeParams());
      return res.success ? res.data : null;
    },
    enabled: activeTab === 'financial',
  });

  const {
    data: employeesData = [],
    isLoading: isLoadingEmployees,
    isFetching: isFetchingEmployees,
  } = useQuery({
    queryKey: ['owner', 'employees', datePeriod],
    queryFn: async () => {
      const res = await api.owner.getEmployeePerformance(getDateRangeParams());
      return res.success ? res.data || [] : [];
    },
    enabled: activeTab === 'employees',
  });

  const {
    data: productsData = null,
    isLoading: isLoadingProducts,
    isFetching: isFetchingProducts,
  } = useQuery({
    queryKey: ['owner', 'products', datePeriod],
    queryFn: async () => {
      const res = await api.owner.getProductPerformance(getDateRangeParams());
      return res.success ? res.data : null;
    },
    enabled: activeTab === 'products',
  });

  const {
    data: destinationsList = [],
    isLoading: isLoadingDestinations,
    isFetching: isFetchingDestinations,
  } = useQuery({
    queryKey: ['payment-destinations', 'all'],
    queryFn: async () => {
      const res = await api.paymentDestinations.getAll();
      return res.success && Array.isArray(res.data) ? res.data : [];
    },
    enabled: activeTab === 'payments',
  });

  const isTabLoading =
    (activeTab === 'financial' && isLoadingFinancial) ||
    (activeTab === 'employees' && isLoadingEmployees) ||
    (activeTab === 'products' && isLoadingProducts) ||
    (activeTab === 'payments' && isLoadingDestinations);

  const isTabFetching =
    (activeTab === 'financial' && isFetchingFinancial) ||
    (activeTab === 'employees' && isFetchingEmployees) ||
    (activeTab === 'products' && isFetchingProducts) ||
    (activeTab === 'payments' && isFetchingDestinations);

  const handleRefreshOwnerData = () => {
    if (activeTab === 'payments') {
      queryClient.invalidateQueries({ queryKey: ['payment-destinations'] });
    } else {
      queryClient.invalidateQueries({ queryKey: ['owner'] });
    }
  };

  // ── Payment Destination Handlers ────────────────────────────────────────────
  const handleOpenCreateDest = () => {
    setDestModalMode('create');
    setDestForm({
      id: '',
      label: '',
      type: 'PHONE',
      value: '',
      bankName: '',
      isActive: true,
      displayOrder: destinationsList.length + 1,
    });
    setDestError('');
    setShowDestModal(true);
  };

  const handleOpenEditDest = (dest) => {
    setDestModalMode('edit');
    setDestForm({
      id: dest.id,
      label: dest.label,
      type: dest.type,
      value: dest.value,
      bankName: dest.bankName || '',
      isActive: dest.isActive,
      displayOrder: dest.displayOrder,
    });
    setDestError('');
    setShowDestModal(true);
  };

  const handleSaveDest = async (e) => {
    e.preventDefault();
    setDestSubmitting(true);
    setDestError('');

    try {
      if (!destForm.label || !destForm.value) {
        throw new Error('يرجى ملء الاسم وبيانات الحساب/الرقم');
      }

      if (destModalMode === 'create') {
        await api.paymentDestinations.create({
          label: destForm.label,
          type: destForm.type,
          value: destForm.value,
          bankName: destForm.type === 'BANK_ACCOUNT' ? destForm.bankName : undefined,
          isActive: destForm.isActive,
          displayOrder: parseInt(destForm.displayOrder, 10) || 0,
        });
      } else {
        await api.paymentDestinations.update(destForm.id, {
          label: destForm.label,
          type: destForm.type,
          value: destForm.value,
          bankName: destForm.type === 'BANK_ACCOUNT' ? destForm.bankName : null,
          isActive: destForm.isActive,
          displayOrder: parseInt(destForm.displayOrder, 10) || 0,
        });
      }

      setShowDestModal(false);
      queryClient.invalidateQueries({ queryKey: ['payment-destinations'] });
    } catch (err) {
      setDestError(err.message || 'فشلت العملية');
    } finally {
      setDestSubmitting(false);
    }
  };

  const handleToggleDestActive = async (dest) => {
    try {
      await api.paymentDestinations.update(dest.id, { isActive: !dest.isActive });
      queryClient.invalidateQueries({ queryKey: ['payment-destinations'] });
    } catch (err) {
      alert(err.message || 'فشل تحديث الحالة');
    }
  };

  const handleDeleteDest = async (dest) => {
    if (!window.confirm(`هل أنت متأكد من حذف "${dest.label}"؟`)) return;
    try {
      await api.paymentDestinations.delete(dest.id);
      queryClient.invalidateQueries({ queryKey: ['payment-destinations'] });
    } catch (err) {
      alert(err.message || 'فشل حذف وسيلة الدفع');
    }
  };

  // ── Create Employee Handler ─────────────────────────────────────────────────
  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    setCreateEmpLoading(true);
    setCreateEmpError('');
    try {
      const res = await api.owner.createEmployee({
        name: createEmpForm.name,
        email: createEmpForm.email,
        phone: createEmpForm.phone || undefined,
        password: createEmpForm.password,
        targetAmount: createEmpForm.targetAmount || undefined,
        targetOrders: createEmpForm.targetOrders || undefined,
      });
      if (res.success) {
        setShowCreateEmployeeModal(false);
        setCreateEmpForm({ name: '', email: '', phone: '', password: '', targetAmount: '', targetOrders: '' });
        queryClient.invalidateQueries({ queryKey: ['owner', 'employees'] });
      }
    } catch (err) {
      setCreateEmpError(err.message || 'حدث خطأ أثناء إنشاء الموظف');
    } finally {
      setCreateEmpLoading(false);
    }
  };

  // ── Open Adjustment Modal ───────────────────────────────────────────────────
  const openAdjustmentModal = (emp) => {
    setAdjustmentTarget({
      employeeId: emp.employeeId,
      name: emp.name,
      totalSalesAchieved: emp.performance.totalSalesAchieved,
    });
    setAdjForm({ type: 'BONUS', basis: 'FIXED_AMOUNT', amount: '', reason: '' });
    setAdjPreview(null);
    setAdjError('');
    setShowAdjustmentModal(true);
  };

  // ── Create Adjustment Handler ──────────────────────────────────────────────
  const handleCreateAdjustment = async () => {
    if (!adjustmentTarget) return;
    setAdjLoading(true);
    setAdjError('');
    try {
      const res = await api.owner.createAdjustment(adjustmentTarget.employeeId, {
        type: adjForm.type,
        basis: adjForm.basis,
        amount: parseFloat(adjForm.amount),
        reason: adjForm.reason || undefined,
      });
      if (res.success) {
        // Show preview with the calculated amount before closing
        if (!adjPreview) {
          setAdjPreview({
            calculatedAmount: parseFloat(res.data.calculatedAmount),
            totalSales: res.data.totalSales ? parseFloat(res.data.totalSales) : null,
            type: adjForm.type,
            basis: adjForm.basis,
            amount: parseFloat(adjForm.amount),
          });
        }
        // Close and refresh
        setShowAdjustmentModal(false);
        setAdjPreview(null);
        queryClient.invalidateQueries({ queryKey: ['owner', 'employees'] });
      }
    } catch (err) {
      setAdjError(err.message || 'حدث خطأ أثناء إنشاء المكافأة/الخصم');
    } finally {
      setAdjLoading(false);
    }
  };

  // ── Calculate preview locally ───────────────────────────────────────────────
  const getAdjustmentPreviewText = () => {
    if (!adjForm.amount || !adjustmentTarget) return null;
    const parsedAmt = parseFloat(adjForm.amount);
    if (isNaN(parsedAmt) || parsedAmt <= 0) return null;

    const typeLabel = adjForm.type === 'BONUS' ? 'مكافأة' : 'خصم';
    const actionLabel = adjForm.type === 'BONUS' ? 'صرف' : 'خصم';

    if (adjForm.basis === 'FIXED_AMOUNT') {
      return `سيتم ${actionLabel} ${typeLabel} قدرها ${parsedAmt.toLocaleString('ar-EG')} ج.م`;
    } else {
      const sales = parseFloat(adjustmentTarget.totalSalesAchieved) || 0;
      const calc = (parsedAmt / 100) * sales;
      return `سيتم ${actionLabel} ${typeLabel} قدرها ${calc.toLocaleString('ar-EG', { maximumFractionDigits: 2 })} ج.م (${parsedAmt}% من ${sales.toLocaleString('ar-EG')} ج.م مبيعات)`;
    }
  };

  // ── Load History ────────────────────────────────────────────────────────────
  const openHistoryModal = async (emp) => {
    setHistoryTarget({ employeeId: emp.employeeId, name: emp.name });
    setHistoryLoading(true);
    setShowHistoryModal(true);
    setHistoryData([]);
    try {
      const res = await api.owner.getEmployeeAdjustments(emp.employeeId);
      if (res.success) {
        setHistoryData(res.data || []);
      }
    } catch (err) {
      console.error('Failed to load adjustments:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  // ── Load Tasks ──────────────────────────────────────────────────────────────
  const openTasksModal = (emp) => {
    setTasksTarget({ employeeId: emp.employeeId, name: emp.name });
    setShowTasksModal(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in">
      {/* Title & Period Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            لوحة الإدارة التنفيذية والتقارير المالية (Owner Dashboard)
            <span className="text-xs bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full border border-amber-300 font-bold flex items-center gap-1">
              <Crown className="w-3.5 h-3.5 text-amber-600" />
              خاص بالمالك
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            التقارير المالية المجمعة، قياس تارجت الموظفين، ورصد المنتجات الأعلى والأقل مبيعاً
          </p>
        </div>

        {/* Date Filter Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 self-start sm:self-auto">
          {[
            { id: 'ALL', label: 'كل الفترات' },
            { id: 'MONTH', label: 'آخر 30 يوم' },
            { id: 'WEEK', label: 'آخر 7 أيام' },
            { id: 'TODAY', label: 'اليوم' },
          ].map((p) => (
            <button
              key={p.id}
              onClick={() => setDatePeriod(p.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-smooth ${
                datePeriod === p.id
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {p.label}
            </button>
          ))}
          <button
            onClick={handleRefreshOwnerData}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200"
            title="تحديث"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isTabFetching ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="glass-card p-1.5 rounded-2xl flex items-center gap-1.5">
        <button
          onClick={() => setActiveTab('financial')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold transition-smooth flex items-center justify-center gap-2 ${
            activeTab === 'financial'
              ? 'bg-amber-600 text-white shadow-sm shadow-amber-600/30'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>التقارير المالية ومصادر الدخل</span>
        </button>

        <button
          onClick={() => setActiveTab('employees')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold transition-smooth flex items-center justify-center gap-2 ${
            activeTab === 'employees'
              ? 'bg-amber-600 text-white shadow-sm shadow-amber-600/30'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>أداء الموظفين مقابل التارجت</span>
        </button>

        <button
          onClick={() => setActiveTab('products')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold transition-smooth flex items-center justify-center gap-2 ${
            activeTab === 'products'
              ? 'bg-amber-600 text-white shadow-sm shadow-amber-600/30'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>المنتجات الأكثر والأقل مبيعاً</span>
        </button>

        <button
          onClick={() => setActiveTab('payments')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold transition-smooth flex items-center justify-center gap-2 ${
            activeTab === 'payments'
              ? 'bg-amber-600 text-white shadow-sm shadow-amber-600/30'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>طرق الدفع والتحويل</span>
        </button>
      </div>

      {/* ── TAB 1: FINANCIAL REPORTS ────────────────────────────────────────── */}
      {activeTab === 'financial' && isLoadingFinancial && !financialData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <MetricCardSkeleton key={i} />
            ))}
          </div>
        </div>
      )}
      {activeTab === 'financial' && financialData && (
        <div className="space-y-6">
          {/* Revenue Trend Chart */}
          <RevenueChart timeSeries={financialData.timeSeries} period={datePeriod} />

          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Revenue */}
            <div className="glass-card p-5 rounded-3xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
                <span>إجمالي الإيرادات (Revenue)</span>
                <span className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">💰</span>
              </div>
              <div className="text-2xl font-black text-slate-900">
                {financialData.summary?.totalRevenue} ج.م
              </div>
              <div className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>صافي الطلبات النشطة وغير الملغاة</span>
              </div>
            </div>

            {/* Total Orders */}
            <div className="glass-card p-5 rounded-3xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
                <span>عدد الطلبات المكتملة</span>
                <span className="p-2 bg-blue-100 text-blue-800 rounded-xl">📦</span>
              </div>
              <div className="text-2xl font-black text-slate-900">
                {financialData.summary?.activeOrders} طلب
              </div>
              <div className="text-[11px] text-slate-400">
                من إجمالي {financialData.summary?.totalOrders} طلب مسجل
              </div>
            </div>

            {/* Total Discounts */}
            <div className="glass-card p-5 rounded-3xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
                <span>إجمالي الخصومات الممنوحة</span>
                <span className="p-2 bg-purple-100 text-purple-800 rounded-xl">🏷️</span>
              </div>
              <div className="text-2xl font-black text-purple-900">
                {financialData.summary?.totalDiscounts} ج.م
              </div>
              <div className="text-[11px] text-purple-700">عبر كوبونات الخصم والعروض</div>
            </div>

            {/* Average Order Value */}
            <div className="glass-card p-5 rounded-3xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
                <span>متوسط قيمة الطلب (AOV)</span>
                <span className="p-2 bg-amber-100 text-amber-800 rounded-xl">⚖️</span>
              </div>
              <div className="text-2xl font-black text-amber-900">
                {financialData.summary?.averageOrderValue} ج.م
              </div>
              <div className="text-[11px] text-amber-700">معدل سلة الشراء لكل طلب</div>
            </div>
          </div>

          {/* Breakdown Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Payment Method Distribution */}
            <div className="glass-card p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                توزيع المبيعات حسب وسيلة الدفع:
              </h3>

              <div className="space-y-3">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Banknote className="w-5 h-5 text-emerald-600" />
                    <div>
                      <div className="font-bold text-xs text-slate-900">الدفع عند الاستلام (COD)</div>
                      <div className="text-[11px] text-slate-400">
                        {financialData.paymentMethodBreakdown?.CASH_ON_DELIVERY?.count || 0} طلب
                      </div>
                    </div>
                  </div>
                  <div className="text-sm font-black text-emerald-700">
                    {financialData.paymentMethodBreakdown?.CASH_ON_DELIVERY?.revenue || 0} ج.م
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Building2 className="w-5 h-5 text-amber-600" />
                    <div>
                      <div className="font-bold text-xs text-slate-900">التحويل البنكي / إنستاباي</div>
                      <div className="text-[11px] text-slate-400">
                        {financialData.paymentMethodBreakdown?.BANK_TRANSFER?.count || 0} طلب
                      </div>
                    </div>
                  </div>
                  <div className="text-sm font-black text-emerald-700">
                    {financialData.paymentMethodBreakdown?.BANK_TRANSFER?.revenue || 0} ج.م
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-5 h-5 text-blue-600" />
                    <div>
                      <div className="font-bold text-xs text-slate-900">الدفع الإلكتروني (Online)</div>
                      <div className="text-[11px] text-slate-400">
                        {financialData.paymentMethodBreakdown?.ONLINE?.count || 0} طلب
                      </div>
                    </div>
                  </div>
                  <div className="text-sm font-black text-emerald-700">
                    {financialData.paymentMethodBreakdown?.ONLINE?.revenue || 0} ج.م
                  </div>
                </div>
              </div>
            </div>

            {/* Wholesale vs Retail Breakdown */}
            <div className="glass-card p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-emerald-600" />
                توزيع المبيعات (جملة Wholesale مقابل قطاعي Retail):
              </h3>

              <div className="space-y-3">
                <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-xs text-emerald-950">مبيعات الجملة والتجار (B2B)</div>
                    <div className="text-[11px] text-emerald-700">
                      {financialData.orderTypeBreakdown?.WHOLESALE?.count || 0} طلب جملة
                    </div>
                  </div>
                  <div className="text-sm font-black text-emerald-800">
                    {financialData.orderTypeBreakdown?.WHOLESALE?.revenue || 0} ج.م
                  </div>
                </div>

                <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-xs text-blue-950">مبيعات التجزئة للمستهلكين (B2C)</div>
                    <div className="text-[11px] text-blue-700">
                      {financialData.orderTypeBreakdown?.RETAIL?.count || 0} طلب قطاعي
                    </div>
                  </div>
                  <div className="text-sm font-black text-blue-800">
                    {financialData.orderTypeBreakdown?.RETAIL?.revenue || 0} ج.م
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: EMPLOYEE PERFORMANCE VS TARGETS ─────────────────────────── */}
      {activeTab === 'employees' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-700 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-600 shrink-0" />
              <span>
                نظام متابعة أداء الموظفين: يتم توزيع الطلبات بالتساوي بنظام Round-Robin، ويقيس هذا التقرير
                مدى تحقيق كل موظف لمستهدفاته الشهرية (التارجت المالي وتارجت الطلبات).
              </span>
            </div>
            <button
              onClick={() => { setCreateEmpError(''); setShowCreateEmployeeModal(true); }}
              className="shrink-0 flex items-center gap-2 px-4 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl text-xs font-bold transition-smooth shadow-sm shadow-amber-600/30"
            >
              <UserPlus className="w-4 h-4" />
              <span className="hidden sm:inline">+ إضافة موظف جديد</span>
              <span className="sm:hidden">+</span>
            </button>
          </div>

          {isLoadingEmployees ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <MetricCardSkeleton key={i} />
              ))}
            </div>
          ) : employeesData.length === 0 ? (
            <div className="py-16 text-center glass-card rounded-3xl p-6 text-slate-400">
              <Users className="w-12 h-12 mx-auto mb-2 text-slate-300" />
              <h4 className="font-bold text-slate-700">لا يوجد موظفون مسجلون حالياً بالنظام</h4>
              <p className="text-xs text-slate-400 mt-1">اضغط "+ إضافة موظف جديد" لإضافة أول موظف</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {employeesData.map((emp) => {
                const amtPct = parseFloat(emp.performance.amountProgressPercent) || 0;
                const ordPct = parseFloat(emp.performance.ordersProgressPercent) || 0;
                const bothAchieved = emp.performance.amountTargetAchieved && emp.performance.ordersTargetAchieved;
                const eitherAchieved = emp.performance.amountTargetAchieved || emp.performance.ordersTargetAchieved;
                const noTarget = emp.targets.targetAmount === null && emp.targets.targetOrders === null;
                const nearTarget = !bothAchieved && (amtPct >= 75 || ordPct >= 75);

                // Determine status badge
                let statusBadge;
                if (noTarget) {
                  statusBadge = { emoji: '⚪', label: 'لم يحدد تارجت', bg: 'bg-slate-100 text-slate-600 border-slate-200' };
                } else if (bothAchieved) {
                  statusBadge = { emoji: '🟢', label: 'حقق التارجت! 🏆', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
                } else if (nearTarget) {
                  statusBadge = { emoji: '🟡', label: 'قريب من التحقيق', bg: 'bg-yellow-100 text-yellow-800 border-yellow-200' };
                } else {
                  statusBadge = { emoji: '🔵', label: 'قيد العمل', bg: 'bg-blue-100 text-blue-700 border-blue-200' };
                }

                const cardBorder = bothAchieved
                  ? 'border-emerald-300 shadow-emerald-100 shadow-md'
                  : 'border-slate-200 shadow-sm';

                return (
                  <div
                    key={emp.employeeId}
                    className={`glass-card rounded-3xl border p-5 space-y-4 ${cardBorder}`}
                  >
                    {/* Header */}
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-900">{emp.name}</h4>
                        <p className="text-xs text-slate-500">{emp.email}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusBadge.bg}`}>
                          {statusBadge.emoji} {statusBadge.label}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${emp.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                          {emp.isActive ? 'نشط' : 'معطل'}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bars */}
                    <div className="space-y-3 pt-2 border-t border-slate-100 text-xs">
                      {/* Financial Target */}
                      <div>
                        <div className="flex justify-between font-bold mb-1">
                          <span className="text-slate-600">التارجت المالي:</span>
                          <span className={emp.performance.amountTargetAchieved ? 'text-emerald-600' : 'text-slate-700'}>
                            {emp.performance.totalSalesAchieved} / {emp.targets.targetAmount || '—'} ج.م
                            {emp.performance.amountProgressPercent !== 'غير محدد' && (
                              <span className="text-[10px] mr-1">({emp.performance.amountProgressPercent})</span>
                            )}
                          </span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              emp.performance.amountTargetAchieved ? 'bg-emerald-500' : 'bg-emerald-400'
                            }`}
                            style={{ width: `${Math.min(100, amtPct)}%` }}
                          />
                        </div>
                        {emp.performance.remainingAmount && parseFloat(emp.performance.remainingAmount) > 0 && (
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            باقي {parseFloat(emp.performance.remainingAmount).toLocaleString('ar-EG')} ج.م للتارجت
                          </p>
                        )}
                        {emp.performance.amountTargetAchieved && (
                          <p className="text-[10px] text-emerald-600 font-bold mt-0.5">
                            ✅ تجاوز التارجت بنسبة {(amtPct - 100).toFixed(1)}%
                          </p>
                        )}
                      </div>

                      {/* Orders Target */}
                      <div>
                        <div className="flex justify-between font-bold mb-1">
                          <span className="text-slate-600">تارجت الطلبات:</span>
                          <span className={emp.performance.ordersTargetAchieved ? 'text-purple-600' : 'text-slate-700'}>
                            {emp.performance.deliveredOrdersCount} / {emp.targets.targetOrders || '—'} طلب
                            {emp.performance.ordersProgressPercent !== 'غير محدد' && (
                              <span className="text-[10px] mr-1">({emp.performance.ordersProgressPercent})</span>
                            )}
                          </span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              emp.performance.ordersTargetAchieved ? 'bg-purple-500' : 'bg-purple-400'
                            }`}
                            style={{ width: `${Math.min(100, ordPct)}%` }}
                          />
                        </div>
                        {emp.performance.remainingOrders > 0 && (
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            باقي {emp.performance.remainingOrders} طلب للتارجت
                          </p>
                        )}
                        {emp.performance.ordersTargetAchieved && (
                          <p className="text-[10px] text-purple-600 font-bold mt-0.5">
                            ✅ تجاوز تارجت الطلبات بنسبة {(ordPct - 100).toFixed(1)}%
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Summary Stats */}
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center text-xs">
                      <div className="p-2 bg-slate-50 rounded-xl">
                        <div className="text-[10px] text-slate-400">إجمالي المسند</div>
                        <div className="font-black text-slate-800">{emp.performance.totalAssignedOrders}</div>
                      </div>
                      <div className="p-2 bg-emerald-50 rounded-xl">
                        <div className="text-[10px] text-emerald-700">تم التوصيل</div>
                        <div className="font-black text-emerald-800">{emp.performance.deliveredOrdersCount}</div>
                      </div>
                      <div className="p-2 bg-red-50 rounded-xl">
                        <div className="text-[10px] text-red-700">ملغي</div>
                        <div className="font-black text-red-800">{emp.performance.cancelledOrdersCount}</div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                      <button
                        onClick={() => openTasksModal(emp)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 rounded-xl text-[11px] font-bold transition-smooth border border-indigo-200"
                        title="مهام الموظف"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        المهام
                      </button>
                      <button
                        onClick={() => openAdjustmentModal(emp)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-xl text-[11px] font-bold transition-smooth border border-amber-200"
                      >
                        <Gift className="w-3.5 h-3.5" />
                        + مكافأة/خصم
                      </button>
                      <button
                        onClick={() => openHistoryModal(emp)}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl text-[11px] font-bold transition-smooth border border-slate-200"
                        title="سجل المكافآت والخصومات"
                      >
                        <History className="w-3.5 h-3.5" />
                        السجل
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 3: PRODUCT ANALYTICS (TOP & LOWEST SELLING) ────────────────── */}
      {activeTab === 'products' && isLoadingProducts && !productsData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="glass-card p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
              {Array.from({ length: 5 }).map((_, j) => (
                <TableRowSkeleton key={j} cols={3} />
              ))}
            </div>
          ))}
        </div>
      )}
      {activeTab === 'products' && productsData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Selling Products */}
          <div className="glass-card p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                المنتجات الأكثر مبيعاً (Top-Selling Products)
              </h3>
              <span className="text-[11px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                الأعلى طلباً
              </span>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {productsData.topSelling?.map((p, idx) => (
                <div key={p.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div>
                      <h4 className="font-bold text-slate-900">{p.name}</h4>
                      <p className="text-[11px] text-slate-400">
                        كود: {p.sku} | القسم: {p.category}
                      </p>
                    </div>
                  </div>

                  <div className="text-left">
                    <div className="font-extrabold text-emerald-700 text-sm">
                      {p.totalQuantitySold} وحدة مباعة
                    </div>
                    <div className="text-[11px] text-slate-500 font-semibold">
                      عائد: {p.totalRevenue} ج.م
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Lowest Selling Products (Dead Stock) */}
          <div className="glass-card p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                المنتجات الأقل مبيعاً / الراكدة (Dead Stock)
              </h3>
              <span className="text-[11px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                تحتاج عروض لتصريفها
              </span>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {productsData.lowestSelling?.map((p, idx) => (
                <div key={p.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 font-black text-xs flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div>
                      <h4 className="font-bold text-slate-900">{p.name}</h4>
                      <p className="text-[11px] text-slate-400">
                        كود: {p.sku} | المخزون بالمستودع: {p.stockQuantity} وحدة
                      </p>
                    </div>
                  </div>

                  <div className="text-left">
                    <div className="font-extrabold text-amber-800 text-sm">
                      {p.totalQuantitySold} وحدة فقط
                    </div>
                    <div className="text-[11px] text-slate-400">
                      سعر الوحدة: {p.retailPrice} ج.م
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: PAYMENT DESTINATIONS MANAGEMENT ─────────────────────────── */}
      {activeTab === 'payments' && (
        <div className="space-y-6">
          {/* Header Action Banner */}
          <div className="glass-card p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
                  <CreditCard className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-base text-slate-900">
                  إدارة طرق الدفع وحسابات التحويل المعتمدة
                </h3>
              </div>
              <p className="text-xs text-slate-500 max-w-xl">
                تحكم في الحسابات البنكية، أرقام فودافون كاش / المحافظ الإلكترونية، ومعرفات إنستاباي (InstaPay) التي تظهر للعملاء عند اختيار الدفع بالتحويل البنكي.
              </p>
            </div>

            <button
              onClick={handleOpenCreateDest}
              className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md shadow-amber-600/25 transition-smooth flex items-center gap-2 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة وسيلة دفع جديدة</span>
            </button>
          </div>

          {/* List of Destinations */}
          {isLoadingDestinations ? (
            <div className="py-20 text-center glass-card rounded-3xl p-6">
              <Loader2 className="w-8 h-8 mx-auto animate-spin text-amber-600 mb-2" />
              <p className="text-xs font-bold text-slate-500">جاري تحميل وسائل الدفع...</p>
            </div>
          ) : destinationsList.length === 0 ? (
            <div className="py-16 text-center glass-card rounded-3xl p-6 space-y-3 border border-slate-200">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                <Wallet className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-slate-800 text-sm">لا توجد وسائل دفع مضافة حالياً</h4>
                <p className="text-xs text-slate-400">
                  قم بإضافة أرقام محافظ الكاش أو حسابات إنستاباي أو الحسابات البنكية للمحل
                </p>
              </div>
              <button
                onClick={handleOpenCreateDest}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-smooth"
              >
                إضافة أول وسيلة دفع
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {destinationsList.map((dest) => (
                <div
                  key={dest.id}
                  className={`p-5 rounded-3xl border transition-smooth bg-white shadow-xs flex flex-col justify-between space-y-4 ${
                    dest.isActive ? 'border-slate-200' : 'border-slate-200 bg-slate-50/70 opacity-70'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${
                          dest.type === 'PHONE'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : dest.type === 'INSTAPAY'
                            ? 'bg-purple-50 text-purple-800 border-purple-200'
                            : 'bg-blue-50 text-blue-800 border-blue-200'
                        }`}
                      >
                        {dest.type === 'PHONE' ? '📱 محفظة كاش' : dest.type === 'INSTAPAY' ? '⚡ إنستاباي' : '🏦 حساب بنكي'}
                      </span>

                      <button
                        onClick={() => handleToggleDestActive(dest)}
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full transition-smooth border ${
                          dest.isActive
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200'
                            : 'bg-slate-200 text-slate-600 border-slate-300 hover:bg-slate-300'
                        }`}
                        title="انقر لتغيير حالة التفعيل"
                      >
                        {dest.isActive ? '● متاح للعملاء' : '○ غير متاح'}
                      </button>
                    </div>

                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900">{dest.label}</h4>
                      {dest.bankName && (
                        <p className="text-xs text-slate-500 mt-0.5 font-semibold">
                          البنك: {dest.bankName}
                        </p>
                      )}
                    </div>

                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
                      <div className="text-[10px] text-slate-400 font-semibold mb-0.5">
                        {dest.type === 'PHONE' ? 'رقم المحفظة:' : dest.type === 'INSTAPAY' ? 'معرّف إنستاباي:' : 'رقم الحساب / IBAN:'}
                      </div>
                      <div className="font-mono font-black text-xs text-slate-900 select-all tracking-wider break-all">
                        {dest.value}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                    <span className="text-[11px] font-semibold text-slate-500">
                      ترتيب الظهور: #{dest.displayOrder}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEditDest(dest)}
                        className="p-1.5 hover:bg-amber-50 text-amber-800 rounded-lg transition-smooth border border-slate-200 hover:border-amber-300"
                        title="تعديل"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteDest(dest)}
                        className="p-1.5 hover:bg-red-50 text-red-700 rounded-lg transition-smooth border border-slate-200 hover:border-red-300"
                        title="حذف"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ── MODALS ────────────────────────────────────────────────────────── */}
      {/* ══════════════════════════════════════════════════════════════════════ */}

      {/* ── Modal 1: Create Employee ──────────────────────────────────────── */}
      <Modal
        isOpen={showCreateEmployeeModal}
        onClose={() => setShowCreateEmployeeModal(false)}
        className="max-w-md"
      >
        <div className="bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-amber-600" />
              إضافة موظف جديد
            </h3>
            <button
              onClick={() => setShowCreateEmployeeModal(false)}
              className="p-1 hover:bg-slate-100 rounded-lg transition-smooth"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          {createEmpError && (
            <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs font-bold border border-red-200">
              {createEmpError}
            </div>
          )}

          <form onSubmit={handleCreateEmployee} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">الاسم *</label>
              <input
                type="text"
                required
                value={createEmpForm.name}
                onChange={(e) => setCreateEmpForm({ ...createEmpForm, name: e.target.value })}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="اسم الموظف"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">البريد الإلكتروني *</label>
              <input
                type="email"
                required
                value={createEmpForm.email}
                onChange={(e) => setCreateEmpForm({ ...createEmpForm, email: e.target.value })}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="employee@example.com"
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">رقم التليفون</label>
              <input
                type="tel"
                value={createEmpForm.phone}
                onChange={(e) => setCreateEmpForm({ ...createEmpForm, phone: e.target.value })}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="01XXXXXXXXX"
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">كلمة السر *</label>
              <input
                type="password"
                required
                value={createEmpForm.password}
                onChange={(e) => setCreateEmpForm({ ...createEmpForm, password: e.target.value })}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="كلمة سر قوية"
                dir="ltr"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">التارجت الشهري (ج.م)</label>
                <input
                  type="number"
                  value={createEmpForm.targetAmount}
                  onChange={(e) => setCreateEmpForm({ ...createEmpForm, targetAmount: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="مثلاً 50000"
                  min="0"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">تارجت الطلبات</label>
                <input
                  type="number"
                  value={createEmpForm.targetOrders}
                  onChange={(e) => setCreateEmpForm({ ...createEmpForm, targetOrders: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="مثلاً 100"
                  min="0"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
              <button
                type="submit"
                disabled={createEmpLoading}
                className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-smooth disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {createEmpLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    جاري الإنشاء...
                  </>
                ) : (
                  'إنشاء الموظف'
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowCreateEmployeeModal(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-smooth"
              >
                إلغاء
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* ── Modal 2: Create Adjustment (Bonus / Deduction) ────────────────── */}
      <Modal
        isOpen={showAdjustmentModal}
        onClose={() => setShowAdjustmentModal(false)}
        className="max-w-md"
      >
        <div className="bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
              <Gift className="w-5 h-5 text-amber-600" />
              مكافأة / خصم — {adjustmentTarget?.name}
            </h3>
            <button
              onClick={() => setShowAdjustmentModal(false)}
              className="p-1 hover:bg-slate-100 rounded-lg transition-smooth"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          {adjError && (
            <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs font-bold border border-red-200">
              {adjError}
            </div>
          )}

          <div className="space-y-4">
            {/* Type Toggle */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">النوع</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setAdjForm({ ...adjForm, type: 'BONUS' })}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-smooth flex items-center justify-center gap-1.5 ${
                    adjForm.type === 'BONUS'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Gift className="w-3.5 h-3.5" />
                  مكافأة (Bonus)
                </button>
                <button
                  type="button"
                  onClick={() => setAdjForm({ ...adjForm, type: 'DEDUCTION' })}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-smooth flex items-center justify-center gap-1.5 ${
                    adjForm.type === 'DEDUCTION'
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <MinusCircle className="w-3.5 h-3.5" />
                  خصم (Deduction)
                </button>
              </div>
            </div>

            {/* Basis Toggle */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">الأساس</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setAdjForm({ ...adjForm, basis: 'FIXED_AMOUNT' })}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-smooth flex items-center justify-center gap-1.5 ${
                    adjForm.basis === 'FIXED_AMOUNT'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  مبلغ ثابت
                </button>
                <button
                  type="button"
                  onClick={() => setAdjForm({ ...adjForm, basis: 'PERCENTAGE_OF_SALES' })}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-smooth flex items-center justify-center gap-1.5 ${
                    adjForm.basis === 'PERCENTAGE_OF_SALES'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Percent className="w-3.5 h-3.5" />
                  نسبة من المبيعات
                </button>
              </div>
            </div>

            {/* Amount Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {adjForm.basis === 'FIXED_AMOUNT' ? 'المبلغ (ج.م)' : 'النسبة (%)'}
              </label>
              <input
                type="number"
                value={adjForm.amount}
                onChange={(e) => setAdjForm({ ...adjForm, amount: e.target.value })}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder={adjForm.basis === 'FIXED_AMOUNT' ? 'مثلاً 500' : 'مثلاً 5'}
                min="0"
                step="any"
                dir="ltr"
              />
            </div>

            {/* Reason */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">السبب (اختياري)</label>
              <input
                type="text"
                value={adjForm.reason}
                onChange={(e) => setAdjForm({ ...adjForm, reason: e.target.value })}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="سبب المكافأة أو الخصم"
              />
            </div>

            {/* Preview */}
            {getAdjustmentPreviewText() && (
              <div className={`p-3 rounded-xl text-xs font-bold border ${
                adjForm.type === 'BONUS'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-red-50 text-red-800 border-red-200'
              }`}>
                {getAdjustmentPreviewText()}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                disabled={adjLoading || !adjForm.amount}
                onClick={handleCreateAdjustment}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-smooth text-white disabled:opacity-50 flex items-center justify-center gap-2 ${
                  adjForm.type === 'BONUS'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {adjLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    جاري التنفيذ...
                  </>
                ) : (
                  adjForm.type === 'BONUS' ? 'تأكيد المكافأة' : 'تأكيد الخصم'
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowAdjustmentModal(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-smooth"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* ── Modal 3: Adjustment History ───────────────────────────────────── */}
      <Modal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        className="max-w-lg"
      >
        <div className="bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-between sticky top-0 bg-white pb-3 border-b border-slate-100">
            <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
              <History className="w-5 h-5 text-amber-600" />
              سجل المكافآت والخصومات — {historyTarget?.name}
            </h3>
            <button
              onClick={() => setShowHistoryModal(false)}
              className="p-1 hover:bg-slate-100 rounded-lg transition-smooth"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          {historyLoading ? (
            <div className="py-12 text-center">
              <Loader2 className="w-8 h-8 mx-auto animate-spin text-amber-600" />
              <p className="text-xs text-slate-400 mt-2">جاري التحميل...</p>
            </div>
          ) : historyData.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <History className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p className="text-xs font-bold">لا توجد مكافآت أو خصومات مسجلة لهذا الموظف</p>
            </div>
          ) : (
            <div className="space-y-2">
              {historyData.map((adj) => (
                <div
                  key={adj.id}
                  className={`p-3 rounded-2xl border text-xs space-y-1 ${
                    adj.type === 'BONUS'
                      ? 'bg-emerald-50/60 border-emerald-200'
                      : 'bg-red-50/60 border-red-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`font-black text-sm ${
                      adj.type === 'BONUS' ? 'text-emerald-800' : 'text-red-800'
                    }`}>
                      {adj.type === 'BONUS' ? '+' : '-'}{parseFloat(adj.calculatedAmount).toLocaleString('ar-EG')} ج.م
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      adj.type === 'BONUS'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {adj.type === 'BONUS' ? 'مكافأة' : 'خصم'}
                    </span>
                  </div>
                  <div className="text-slate-500 flex items-center justify-between">
                    <span>
                      {adj.basis === 'FIXED_AMOUNT'
                        ? `مبلغ ثابت: ${parseFloat(adj.amount).toLocaleString('ar-EG')} ج.م`
                        : `${parseFloat(adj.amount)}% من المبيعات`
                      }
                    </span>
                    <span className="text-slate-400">
                      {new Date(adj.createdAt).toLocaleDateString('ar-EG', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  {adj.reason && (
                    <p className="text-slate-600 pt-1 border-t border-slate-200/60">
                      السبب: {adj.reason}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* ── Modal 4: Add / Edit Payment Destination ──────────────────────── */}
      <Modal
        isOpen={showDestModal}
        onClose={() => setShowDestModal(false)}
        className="max-w-md"
      >
        <div className="bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-amber-600" />
              {destModalMode === 'create' ? 'إضافة وسيلة دفع جديدة' : 'تعديل وسيلة الدفع'}
            </h3>
            <button
              onClick={() => setShowDestModal(false)}
              className="p-1 hover:bg-slate-100 rounded-lg transition-smooth"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          {destError && (
            <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs font-bold border border-red-200">
              {destError}
            </div>
          )}

          <form onSubmit={handleSaveDest} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">نوع وسيلة الدفع *</label>
              <select
                value={destForm.type}
                onChange={(e) => setDestForm({ ...destForm, type: e.target.value })}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
              >
                <option value="PHONE">محفظة هاتف / كاش (فودافون كاش، أورنج، اتصالات، وي)</option>
                <option value="INSTAPAY">حساب إنستاباي (InstaPay Handle / IPA)</option>
                <option value="BANK_ACCOUNT">حساب بنكي / آيبان (Bank Account / IBAN)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">الاسم التعريفي (Label) *</label>
              <input
                type="text"
                required
                value={destForm.label}
                onChange={(e) => setDestForm({ ...destForm, label: e.target.value })}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder={
                  destForm.type === 'PHONE'
                    ? 'مثلاً: فودافون كاش - المحل الرئيسي'
                    : destForm.type === 'INSTAPAY'
                    ? 'مثلاً: حساب إنستاباي الرسمي'
                    : 'مثلاً: حساب البنك الأهلي المصري'
                }
              />
            </div>

            {destForm.type === 'BANK_ACCOUNT' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم البنك (اختياري)</label>
                <input
                  type="text"
                  value={destForm.bankName}
                  onChange={(e) => setDestForm({ ...destForm, bankName: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="مثلاً: البنك الأهلي المصري (NBE) أو CIB"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {destForm.type === 'PHONE'
                  ? 'رقم الهاتف المحمول *'
                  : destForm.type === 'INSTAPAY'
                  ? 'معرّف إنستاباي (InstaPay Handle) *'
                  : 'رقم الحساب أو الآيبان (IBAN) *'}
              </label>
              <input
                type="text"
                required
                value={destForm.value}
                onChange={(e) => setDestForm({ ...destForm, value: e.target.value })}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder={
                  destForm.type === 'PHONE'
                    ? '01012345678'
                    : destForm.type === 'INSTAPAY'
                    ? 'name@instapay'
                    : 'EG1200030000112233445566'
                }
                dir="ltr"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ترتيب العرض</label>
                <input
                  type="number"
                  min="0"
                  value={destForm.displayOrder}
                  onChange={(e) => setDestForm({ ...destForm, displayOrder: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                  dir="ltr"
                />
              </div>

              <div className="flex flex-col justify-end">
                <label className="flex items-center gap-2 cursor-pointer p-2.5 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-smooth">
                  <input
                    type="checkbox"
                    checked={destForm.isActive}
                    onChange={(e) => setDestForm({ ...destForm, isActive: e.target.checked })}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span className="text-xs font-bold text-slate-800">مفعل ومتاح للعملاء</span>
                </label>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
              <button
                type="submit"
                disabled={destSubmitting}
                className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-smooth disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {destSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>جاري الحفظ...</span>
                  </>
                ) : (
                  <span>{destModalMode === 'create' ? 'إضافة وسيلة الدفع' : 'حفظ التعديلات'}</span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowDestModal(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-smooth"
              >
                إلغاء
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* ── Modal: Tasks ──────────────────────────────────────────────────── */}
      <TasksModal
        isOpen={showTasksModal}
        onClose={() => setShowTasksModal(false)}
        employeeId={tasksTarget?.employeeId}
        employeeName={tasksTarget?.name}
      />
    </div>
  );
};
