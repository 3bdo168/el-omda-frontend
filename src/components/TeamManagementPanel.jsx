import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  UserPlus,
  Shield,
  Briefcase,
  CheckCircle2,
  XCircle,
  KeyRound,
  Edit2,
  UserCheck,
  UserX,
  Search,
  Filter,
  AlertCircle,
  Loader2,
  Target,
  RefreshCw,
  Mail,
  Phone,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { api } from '../services/api';
import { Modal, ConfirmModal } from './Modal';
import { ScrollableNavContainer } from './ScrollableNavContainer';

export const TeamManagementPanel = () => {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('all'); // 'all' | 'admins' | 'employees' | 'inactive'
  const [searchQuery, setSearchQuery] = useState('');

  // ── Modals State ─────────────────────────────────────────────────────────────
  // 1. Add Member Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'EMPLOYEE',
    targetAmount: '',
    targetOrders: '',
  });
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');

  // 2. Edit Details Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    targetAmount: '',
    targetOrders: '',
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  // 3. Change Role Modal
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [roleTarget, setRoleTarget] = useState(null);
  const [selectedNewRole, setSelectedNewRole] = useState('ADMIN');
  const [roleLoading, setRoleLoading] = useState(false);
  const [roleError, setRoleError] = useState('');

  // 4. Reset Password Modal
  const [showResetPassModal, setShowResetPassModal] = useState(false);
  const [resetPassTarget, setResetPassTarget] = useState(null);
  const [tempPassword, setTempPassword] = useState('');
  const [resetPassLoading, setResetPassLoading] = useState(false);
  const [resetPassError, setResetPassError] = useState('');
  const [resetPassSuccess, setResetPassSuccess] = useState('');

  // 5. Deactivate / Reactivate Confirm Modal
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusTarget, setStatusTarget] = useState(null); // { id, name, role, isActive }
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState('');

  // ── Query Team Members ───────────────────────────────────────────────────────
  const {
    data: members = [],
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['owner', 'team'],
    queryFn: async () => {
      const res = await api.owner.getTeamMembers();
      return res.success ? res.data || [] : [];
    },
  });

  // ── Filtered & Searched Members ──────────────────────────────────────────────
  const filteredMembers = members.filter((m) => {
    // Filter tab
    if (filter === 'admins' && m.role !== 'ADMIN') return false;
    if (filter === 'employees' && m.role !== 'EMPLOYEE') return false;
    if (filter === 'inactive' && m.isActive) return false;

    // Search query
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      const matchName = m.name?.toLowerCase().includes(query);
      const matchEmail = m.email?.toLowerCase().includes(query);
      const matchPhone = m.phone?.toLowerCase().includes(query);
      return matchName || matchEmail || matchPhone;
    }
    return true;
  });

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleOpenAddModal = () => {
    setAddForm({
      name: '',
      email: '',
      phone: '',
      password: '',
      role: 'EMPLOYEE',
      targetAmount: '',
      targetOrders: '',
    });
    setAddError('');
    setShowAddModal(true);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setAddError('');
    setAddLoading(true);

    try {
      const payload = {
        name: addForm.name.trim(),
        email: addForm.email.trim(),
        phone: addForm.phone.trim() || undefined,
        password: addForm.password,
        role: addForm.role,
        targetAmount: addForm.role === 'EMPLOYEE' && addForm.targetAmount ? addForm.targetAmount : undefined,
        targetOrders: addForm.role === 'EMPLOYEE' && addForm.targetOrders ? addForm.targetOrders : undefined,
      };

      const res = await api.owner.createTeamMember(payload);
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: ['owner', 'team'] });
        queryClient.invalidateQueries({ queryKey: ['owner', 'employees'] });
        setShowAddModal(false);
      } else {
        setAddError(res.message || 'فشل إضافة العضو');
      }
    } catch (err) {
      setAddError(err.message || 'حدث خطأ أثناء إضافة العضو');
    } finally {
      setAddLoading(false);
    }
  };

  const handleOpenEditModal = (member) => {
    setEditTarget(member);
    setEditForm({
      name: member.name || '',
      email: member.email || '',
      phone: member.phone || '',
      targetAmount: member.targetAmount !== null && member.targetAmount !== undefined ? String(member.targetAmount) : '',
      targetOrders: member.targetOrders !== null && member.targetOrders !== undefined ? String(member.targetOrders) : '',
    });
    setEditError('');
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editTarget) return;
    setEditError('');
    setEditLoading(true);

    try {
      const payload = {
        name: editForm.name.trim(),
        email: editForm.email.trim(),
        phone: editForm.phone.trim() || null,
      };
      if (editTarget.role === 'EMPLOYEE') {
        payload.targetAmount = editForm.targetAmount ? parseFloat(editForm.targetAmount) : null;
        payload.targetOrders = editForm.targetOrders ? parseInt(editForm.targetOrders, 10) : null;
      }

      const res = await api.owner.updateTeamMember(editTarget.id, payload);
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: ['owner', 'team'] });
        queryClient.invalidateQueries({ queryKey: ['owner', 'employees'] });
        setShowEditModal(false);
      } else {
        setEditError(res.message || 'فشل تحديث البيانات');
      }
    } catch (err) {
      setEditError(err.message || 'حدث خطأ أثناء تحديث البيانات');
    } finally {
      setEditLoading(false);
    }
  };

  const handleOpenRoleModal = (member) => {
    setRoleTarget(member);
    setSelectedNewRole(member.role === 'ADMIN' ? 'EMPLOYEE' : 'ADMIN');
    setRoleError('');
    setShowRoleModal(true);
  };

  const handleRoleSubmit = async () => {
    if (!roleTarget) return;
    setRoleError('');
    setRoleLoading(true);

    try {
      const res = await api.owner.updateTeamMember(roleTarget.id, {
        role: selectedNewRole,
      });

      if (res.success) {
        queryClient.invalidateQueries({ queryKey: ['owner', 'team'] });
        queryClient.invalidateQueries({ queryKey: ['owner', 'employees'] });
        setShowRoleModal(false);
      } else {
        setRoleError(res.message || 'فشل تغيير الدور');
      }
    } catch (err) {
      setRoleError(err.message || 'حدث خطأ أثناء تغيير الدور');
    } finally {
      setRoleLoading(false);
    }
  };

  const handleOpenResetPass = (member) => {
    setResetPassTarget(member);
    setTempPassword('');
    setResetPassError('');
    setResetPassSuccess('');
    setShowResetPassModal(true);
  };

  const handleResetPassSubmit = async (e) => {
    e.preventDefault();
    if (!resetPassTarget) return;
    setResetPassError('');
    setResetPassSuccess('');

    if (!tempPassword || tempPassword.length < 6) {
      setResetPassError('كلمة المرور المؤقتة يجب ألا تقل عن 6 أحرف');
      return;
    }

    setResetPassLoading(true);
    try {
      const res = await api.owner.resetMemberPassword(resetPassTarget.id, tempPassword);
      if (res.success) {
        setResetPassSuccess('تم تعيين كلمة المرور المؤقتة بنجاح، وسيلتزم المستخدم بتغييرها فور تسجيل دخوله.');
        queryClient.invalidateQueries({ queryKey: ['owner', 'team'] });
        setTimeout(() => {
          setShowResetPassModal(false);
        }, 1600);
      } else {
        setResetPassError(res.message || 'فشل إعادة تعيين كلمة المرور');
      }
    } catch (err) {
      setResetPassError(err.message || 'حدث خطأ أثناء إعادة تعيين كلمة المرور');
    } finally {
      setResetPassLoading(false);
    }
  };

  const handleOpenStatusModal = (member) => {
    setStatusTarget(member);
    setStatusError('');
    setShowStatusModal(true);
  };

  const handleStatusConfirm = async () => {
    if (!statusTarget) return;
    setStatusError('');
    setStatusLoading(true);

    try {
      const nextActive = !statusTarget.isActive;
      const res = await api.owner.toggleMemberStatus(statusTarget.id, nextActive);

      if (res.success) {
        queryClient.invalidateQueries({ queryKey: ['owner', 'team'] });
        queryClient.invalidateQueries({ queryKey: ['owner', 'employees'] });
        setShowStatusModal(false);
      } else {
        setStatusError(res.message || 'فشل تعديل حالة الحساب');
      }
    } catch (err) {
      setStatusError(err.message || 'حدث خطأ أثناء تعديل حالة الحساب');
    } finally {
      setStatusLoading(false);
    }
  };

  return (
    <div className="space-y-6" style={{ direction: 'rtl' }}>
      {/* ── Top Header Bar ──────────────────────────────────────────────────────── */}
      <div className="glass-card p-4 sm:p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 bg-amber-100 text-amber-800 rounded-xl">
              <Users className="w-5 h-5" />
            </span>
            <h2 className="text-lg sm:text-xl font-black text-slate-900">إدارة فريق العمل والصلاحيات</h2>
          </div>
          <p className="text-xs text-slate-500">
            إضافة وإدارة المشرفين (Admins) وموظفي المبيعات (Employees)، تعيين التارجت، وإلزام كلمات المرور.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-smooth"
            title="تحديث القائمة"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin text-amber-600' : ''}`} />
          </button>
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 active:scale-[0.99] text-white rounded-xl text-xs font-bold transition-smooth shadow-md shadow-amber-600/20 flex items-center gap-2 whitespace-nowrap"
          >
            <UserPlus className="w-4 h-4" />
            <span>إضافة عضو جديد</span>
          </button>
        </div>
      </div>

      {/* ── Filter Tabs & Search Bar ──────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Filters with scrollable buttons */}
        <ScrollableNavContainer variant="amber" className="glass-card p-1 rounded-2xl gap-1 text-xs font-bold">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-xl transition-smooth whitespace-nowrap shrink-0 ${
              filter === 'all'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            الكل ({members.length})
          </button>
          <button
            onClick={() => setFilter('admins')}
            className={`px-3 py-1.5 rounded-xl transition-smooth whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              filter === 'admins'
                ? 'bg-purple-700 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            المشرفين ({members.filter((m) => m.role === 'ADMIN').length})
          </button>
          <button
            onClick={() => setFilter('employees')}
            className={`px-3 py-1.5 rounded-xl transition-smooth whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              filter === 'employees'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            الموظفين ({members.filter((m) => m.role === 'EMPLOYEE').length})
          </button>
          <button
            onClick={() => setFilter('inactive')}
            className={`px-3 py-1.5 rounded-xl transition-smooth whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              filter === 'inactive'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <UserX className="w-3.5 h-3.5" />
            المعطلين ({members.filter((m) => !m.isActive).length})
          </button>
        </ScrollableNavContainer>

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث بالاسم أو الإيميل أو التليفون..."
            className="w-full pr-10 pl-4 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-smooth"
          />
        </div>
      </div>

      {/* ── Content: Loading / Empty / Data ────────────────────────────────────── */}
      {isLoading ? (
        <div className="glass-card p-12 rounded-3xl border border-slate-200 text-center space-y-3">
          <Loader2 className="w-8 h-8 text-amber-600 animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-600">جاري تحميل أعضاء الفريق...</p>
        </div>
      ) : filteredMembers.length === 0 ? (
        <div className="glass-card p-12 rounded-3xl border border-slate-200 text-center space-y-3">
          <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-sm text-slate-800">لا يوجد أعضاء مطابقين للبحث</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            لم نجد أي عضو مطابق للشروط المحددة. يمكنك إضافة عضو جديد أو تغيير الفلتر.
          </p>
        </div>
      ) : (
        <>
          {/* ── Desktop View (Table on md and above) ────────────────────────────── */}
          <div className="hidden md:block glass-card rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-extrabold text-[11px] uppercase tracking-wider">
                    <th className="py-3.5 px-4">العضو</th>
                    <th className="py-3.5 px-4">الدور</th>
                    <th className="py-3.5 px-4">الحالة</th>
                    <th className="py-3.5 px-4">التارجت الحالي</th>
                    <th className="py-3.5 px-4">تاريخ الانضمام</th>
                    <th className="py-3.5 px-4 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredMembers.map((member) => (
                    <tr
                      key={member.id}
                      className={`hover:bg-slate-50/70 transition-smooth ${
                        !member.isActive ? 'bg-slate-50/40 opacity-75' : ''
                      }`}
                    >
                      {/* Name & Contact */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                              member.role === 'ADMIN'
                                ? 'bg-purple-100 text-purple-700'
                                : 'bg-indigo-100 text-indigo-700'
                            }`}
                          >
                            {member.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                              <span>{member.name}</span>
                              {member.mustChangePassword && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                                  كلمة مرور مؤقتة
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-3 mt-0.5">
                              <span className="flex items-center gap-1">
                                <Mail className="w-3 h-3 text-slate-400" />
                                {member.email}
                              </span>
                              {member.phone && (
                                <span className="flex items-center gap-1 font-mono">
                                  <Phone className="w-3 h-3 text-slate-400" />
                                  {member.phone}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="py-3.5 px-4">
                        {member.role === 'ADMIN' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
                            <Shield className="w-3.5 h-3.5 text-purple-600" />
                            مشرف (Admin)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                            <Briefcase className="w-3.5 h-3.5 text-indigo-600" />
                            موظف مبيعات
                          </span>
                        )}
                      </td>

                      {/* Active Status Badge */}
                      <td className="py-3.5 px-4">
                        {member.isActive ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            نشط
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-200 text-slate-700">
                            <XCircle className="w-3 h-3 text-slate-500" />
                            معطل
                          </span>
                        )}
                      </td>

                      {/* Targets */}
                      <td className="py-3.5 px-4">
                        {member.role === 'EMPLOYEE' ? (
                          <div className="text-[11px] space-y-0.5">
                            <div className="text-slate-700 font-semibold">
                              مبيعات:{' '}
                              <span className="font-extrabold text-emerald-700">
                                {member.targetAmount
                                  ? `${member.targetAmount.toLocaleString('ar-EG')} ج.م`
                                  : 'غير محدد'}
                              </span>
                            </div>
                            <div className="text-slate-500">
                              طلبات:{' '}
                              <span className="font-bold text-slate-700">
                                {member.targetOrders ? `${member.targetOrders} طلب` : 'غير محدد'}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">— لا ينطبق —</span>
                        )}
                      </td>

                      {/* Created At */}
                      <td className="py-3.5 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                        {new Date(member.createdAt).toLocaleDateString('ar-EG', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(member)}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 transition-smooth"
                            title="تعديل البيانات"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenRoleModal(member)}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-purple-700 transition-smooth"
                            title="تغيير الرتبة (الدور)"
                          >
                            <Shield className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenResetPass(member)}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-amber-600 transition-smooth"
                            title="تعيين كلمة مرور مؤقتة"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenStatusModal(member)}
                            className={`p-1.5 rounded-lg border transition-smooth ${
                              member.isActive
                                ? 'border-red-200 hover:bg-red-50 text-red-600'
                                : 'border-emerald-200 hover:bg-emerald-50 text-emerald-600'
                            }`}
                            title={member.isActive ? 'تعطيل الحساب' : 'تفعيل الحساب'}
                          >
                            {member.isActive ? (
                              <UserX className="w-3.5 h-3.5" />
                            ) : (
                              <UserCheck className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Mobile View (Cards below md) ──────────────────────────────────── */}
          <div className="md:hidden space-y-3">
            {filteredMembers.map((member) => (
              <div
                key={member.id}
                className={`glass-card p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3 ${
                  !member.isActive ? 'bg-slate-50/50 opacity-80' : ''
                }`}
              >
                {/* Card Top: Name & Badges */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                        member.role === 'ADMIN'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-indigo-100 text-indigo-700'
                      }`}
                    >
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900">{member.name}</h4>
                      <p className="text-[11px] text-slate-500">{member.email}</p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    {member.role === 'ADMIN' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
                        <Shield className="w-3 h-3" />
                        مشرف
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">
                        <Briefcase className="w-3 h-3" />
                        موظف
                      </span>
                    )}

                    {member.isActive ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        نشط
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">
                        <XCircle className="w-2.5 h-2.5" />
                        معطل
                      </span>
                    )}
                  </div>
                </div>

                {/* Contact & Password Info */}
                <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50/60 p-2.5 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-slate-400 block text-[10px]">رقم الهاتف</span>
                    <span className="font-mono font-bold text-slate-700">
                      {member.phone || 'غير مسجل'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">حالة كلمة المرور</span>
                    <span className="font-bold text-slate-700">
                      {member.mustChangePassword ? (
                        <span className="text-amber-700">مؤقتة (تتطلب تغيير)</span>
                      ) : (
                        <span className="text-emerald-700">مستقرة ودائمة</span>
                      )}
                    </span>
                  </div>
                </div>

                {/* Targets (if Employee) */}
                {member.role === 'EMPLOYEE' && (
                  <div className="flex items-center justify-between text-xs p-2 bg-indigo-50/50 rounded-xl border border-indigo-100 text-indigo-900">
                    <span className="flex items-center gap-1 text-[11px] font-bold">
                      <Target className="w-3.5 h-3.5 text-indigo-600" />
                      تارجت المبيعات:
                    </span>
                    <span className="font-extrabold">
                      {member.targetAmount
                        ? `${member.targetAmount.toLocaleString('ar-EG')} ج.م`
                        : 'غير محدد'}
                      {member.targetOrders ? ` (${member.targetOrders} طلب)` : ''}
                    </span>
                  </div>
                )}

                {/* Card Action Buttons */}
                <div className="grid grid-cols-4 gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(member)}
                    className="py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-smooth"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>تعديل</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenRoleModal(member)}
                    className="py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-smooth"
                  >
                    <Shield className="w-3 h-3" />
                    <span>الرتبة</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenResetPass(member)}
                    className="py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-smooth"
                  >
                    <KeyRound className="w-3 h-3" />
                    <span>الرمز</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenStatusModal(member)}
                    className={`py-1.5 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-smooth ${
                      member.isActive
                        ? 'bg-red-50 hover:bg-red-100 text-red-600'
                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {member.isActive ? (
                      <>
                        <UserX className="w-3 h-3" />
                        <span>تعطيل</span>
                      </>
                    ) : (
                      <>
                        <UserCheck className="w-3 h-3" />
                        <span>تفعيل</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── 1. MODAL: ADD MEMBER ──────────────────────────────────────────────── */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} className="max-w-md">
        <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 text-right">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-amber-100 text-amber-800 rounded-xl">
                <UserPlus className="w-4 h-4" />
              </span>
              <h3 className="font-black text-sm text-slate-900">إضافة عضو جديد للفريق</h3>
            </div>
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          </div>

          {addError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-red-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{addError}</span>
            </div>
          )}

          <form onSubmit={handleAddSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                الاسم الثلاثي أو المستعار <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={addForm.name}
                onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                placeholder="مثال: أحمد محمود"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  البريد الإلكتروني <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={addForm.email}
                  onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                  placeholder="name@example.com"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  رقم الهاتف (اختياري)
                </label>
                <input
                  type="tel"
                  value={addForm.phone}
                  onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                  placeholder="01012345678"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  dir="ltr"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                كلمة المرور المؤقتة <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                minLength={6}
                value={addForm.password}
                onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                placeholder="6 أحرف أو أرقام على الأقل"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                dir="ltr"
              />
              <span className="text-[10px] text-amber-700 font-medium block mt-1">
                💡 سيلتزم العضو بتغيير هذه الكلمة فور تسجيل الدخول لأول مرة.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                الدور والصلاحية <span className="text-red-500">*</span>
              </label>
              <select
                value={addForm.role}
                onChange={(e) => setAddForm({ ...addForm, role: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white"
              >
                <option value="EMPLOYEE">موظف مبيعات (EMPLOYEE) — يتلقى الطلبات الدورية</option>
                <option value="ADMIN">مشرف نظام (ADMIN) — صلاحيات لوحة الأدمن كاملة</option>
              </select>
            </div>

            {/* Target Fields for EMPLOYEE */}
            {addForm.role === 'EMPLOYEE' && (
              <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-2xl space-y-3">
                <span className="text-[11px] font-extrabold text-indigo-900 block">
                  🎯 أهداف وتارجت الموظف (اختياري):
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">
                      تارجت المبيعات (ج.م)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={addForm.targetAmount}
                      onChange={(e) => setAddForm({ ...addForm, targetAmount: e.target.value })}
                      placeholder="مثلاً: 50000"
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">
                      تارجت عدد الطلبات
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={addForm.targetOrders}
                      onChange={(e) => setAddForm({ ...addForm, targetOrders: e.target.value })}
                      placeholder="مثلاً: 30"
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none"
                      dir="ltr"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <button
                type="submit"
                disabled={addLoading}
                className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 active:scale-[0.99] text-white rounded-xl text-xs font-bold transition-smooth shadow-md shadow-amber-600/20 disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {addLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>جاري الإنشاء...</span>
                  </>
                ) : (
                  <span>إنشاء الحساب</span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-smooth"
              >
                إلغاء
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* ── 2. MODAL: EDIT DETAILS ────────────────────────────────────────────── */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} className="max-w-md">
        <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 text-right">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-slate-100 text-slate-700 rounded-xl">
                <Edit2 className="w-4 h-4" />
              </span>
              <h3 className="font-black text-sm text-slate-900">تعديل بيانات العضو</h3>
            </div>
            <button
              type="button"
              onClick={() => setShowEditModal(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          </div>

          {editError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-red-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{editError}</span>
            </div>
          )}

          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">الاسم</label>
              <input
                type="text"
                required
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">البريد الإلكتروني</label>
                <input
                  type="email"
                  required
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">رقم الهاتف</label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  placeholder="01012345678"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  dir="ltr"
                />
              </div>
            </div>

            {/* Target Fields if Employee */}
            {editTarget?.role === 'EMPLOYEE' && (
              <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-2xl space-y-3">
                <span className="text-[11px] font-extrabold text-indigo-900 block">
                  🎯 تعديل التارجت المستهدف:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">
                      المبيعات (ج.م)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={editForm.targetAmount}
                      onChange={(e) => setEditForm({ ...editForm, targetAmount: e.target.value })}
                      placeholder="50000"
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">
                      عدد الطلبات
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={editForm.targetOrders}
                      onChange={(e) => setEditForm({ ...editForm, targetOrders: e.target.value })}
                      placeholder="30"
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none"
                      dir="ltr"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <button
                type="submit"
                disabled={editLoading}
                className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-smooth shadow-md shadow-amber-600/20 disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {editLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>جاري الحفظ...</span>
                  </>
                ) : (
                  <span>حفظ التعديلات</span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-smooth"
              >
                إلغاء
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* ── 3. MODAL: CHANGE ROLE CONFIRMATION ─────────────────────────────────── */}
      <Modal isOpen={showRoleModal} onClose={() => setShowRoleModal(false)} className="max-w-md">
        <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-4 text-right">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-purple-100 text-purple-700">
              <Shield className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-bold text-sm text-slate-900">تغيير دور / رتبة العضو</h3>
              <p className="text-xs text-slate-500">{roleTarget?.name}</p>
            </div>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
            <p className="font-bold">⚠️ تنبيه هام حول تغيير الرتبة:</p>
            <p className="text-[11px] leading-relaxed">
              {roleTarget?.role === 'EMPLOYEE'
                ? 'عند تحويل الموظف إلى مشرف (Admin)، سيتم استبعاده فوراً من التوزيع الدوري للطلبات وإعادة إسناد أي طلبات مفتوحة لديه إلى باقي الموظفين النشطين.'
                : 'عند تحويل المشرف (Admin) إلى موظف (Employee)، سيبدأ فوراً في استقبال طلبات العملاء بنظام التوزيع الدوري (Round-Robin).'}
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">اختر الرتبة الجديدة:</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSelectedNewRole('ADMIN')}
                className={`p-3 rounded-xl border text-xs font-bold transition-smooth flex flex-col items-center gap-1 ${
                  selectedNewRole === 'ADMIN'
                    ? 'border-purple-600 bg-purple-50 text-purple-900'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Shield className="w-4 h-4 text-purple-600" />
                <span>مشرف (Admin)</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedNewRole('EMPLOYEE')}
                className={`p-3 rounded-xl border text-xs font-bold transition-smooth flex flex-col items-center gap-1 ${
                  selectedNewRole === 'EMPLOYEE'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-900'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Briefcase className="w-4 h-4 text-indigo-600" />
                <span>موظف مبيعات</span>
              </button>
            </div>
          </div>

          {roleError && (
            <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs">
              {roleError}
            </div>
          )}

          <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              disabled={roleLoading || selectedNewRole === roleTarget?.role}
              onClick={handleRoleSubmit}
              className="flex-1 py-2.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold transition-smooth disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {roleLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>جاري تغيير الدور...</span>
                </>
              ) : (
                <span>تأكيد تغيير الدور</span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setShowRoleModal(false)}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-smooth"
            >
              إلغاء
            </button>
          </div>
        </div>
      </Modal>

      {/* ── 4. MODAL: RESET PASSWORD ──────────────────────────────────────────── */}
      <Modal isOpen={showResetPassModal} onClose={() => setShowResetPassModal(false)} className="max-w-md">
        <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-4 text-right">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-amber-100 text-amber-700">
              <KeyRound className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-bold text-sm text-slate-900">تعيين كلمة مرور مؤقتة جديدة</h3>
              <p className="text-xs text-slate-500">{resetPassTarget?.name}</p>
            </div>
          </div>

          {resetPassError && (
            <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs">
              {resetPassError}
            </div>
          )}

          {resetPassSuccess && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold">
              {resetPassSuccess}
            </div>
          )}

          <form onSubmit={handleResetPassSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                كلمة المرور المؤقتة الجديدة <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                minLength={6}
                value={tempPassword}
                onChange={(e) => setTempPassword(e.target.value)}
                placeholder="أدخل كلمة مرور مؤقتة (6 أحرف على الأقل)"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                dir="ltr"
              />
              <span className="text-[10px] text-slate-500 block mt-1">
                سيُطلب من العضو تغيير هذه الكلمة فور تسجيل دخوله القادم.
              </span>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <button
                type="submit"
                disabled={resetPassLoading}
                className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-smooth shadow-md shadow-amber-600/20 disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {resetPassLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>جاري التعيين...</span>
                  </>
                ) : (
                  <span>تعيين كلمة المرور</span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowResetPassModal(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-smooth"
              >
                إلغاء
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* ── 5. CONFIRM MODAL: DEACTIVATE / REACTIVATE ─────────────────────────── */}
      <ConfirmModal
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        onConfirm={handleStatusConfirm}
        title={statusTarget?.isActive ? 'تأكيد تعطيل الحساب' : 'تأكيد إعادة تفعيل الحساب'}
        message={
          statusError ||
          (statusTarget?.isActive
            ? `هل أنت متأكد من تعطيل حساب "${statusTarget?.name}"؟ سيتم فوراً منع تسجيل دخوله، وإذا كان موظفاً سيتم استبعاده من توزيع الطلبات وإعادة تعيين طلباته المفتوحة لباقي الموظفين.`
            : `هل أنت متأكد من إعادة تفعيل حساب "${statusTarget?.name}"؟ سيتمكن من تسجيل الدخول واستئناف مهامه بشكل طبيعي.`)
        }
        confirmText={statusTarget?.isActive ? 'نعم، تعطيل الحساب' : 'نعم، تفعيل الحساب'}
        cancelText="إلغاء"
        isDanger={statusTarget?.isActive}
        isLoading={statusLoading}
      />
    </div>
  );
};
