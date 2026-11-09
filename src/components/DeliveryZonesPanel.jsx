import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MapPin, Plus, Edit2, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { Modal, ConfirmModal } from './Modal';

export const DeliveryZonesPanel = () => {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [form, setForm] = useState({ nameAr: '', fee: '', sortOrder: 0, isActive: true });
  const [error, setError] = useState('');
  const { data: zones = [], isLoading, isError } = useQuery({
    queryKey: ['admin', 'delivery-zones'],
    queryFn: async () => { const res = await api.admin.getDeliveryZones(); return res.data || []; },
  });
  const saveMutation = useMutation({
    mutationFn: () => editing?.id ? api.admin.updateDeliveryZone(editing.id, form) : api.admin.createDeliveryZone(form),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', 'delivery-zones'] }); queryClient.invalidateQueries({ queryKey: ['delivery-zones'] }); setEditing(null); setError(''); },
    onError: (e) => setError(e.message || 'تعذر حفظ المنطقة'),
  });
  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }) => api.admin.updateDeliveryZone(id, { isActive }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', 'delivery-zones'] }); queryClient.invalidateQueries({ queryKey: ['delivery-zones'] }); },
  });
  const deleteMutation = useMutation({
    mutationFn: (id) => api.admin.deleteDeliveryZone(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', 'delivery-zones'] }); queryClient.invalidateQueries({ queryKey: ['delivery-zones'] }); setDeleting(null); },
    onError: (e) => setError(e.message || 'تعذر حذف المنطقة'),
  });
  const openCreate = () => { setForm({ nameAr: '', fee: '', sortOrder: zones.length, isActive: true }); setError(''); setEditing({}); };
  const openEdit = (zone) => { setForm({ nameAr: zone.nameAr, fee: String(zone.fee), sortOrder: zone.sortOrder, isActive: zone.isActive }); setError(''); setEditing(zone); };
  const submit = (event) => { event.preventDefault(); setError(''); saveMutation.mutate(); };

  return <section className="space-y-4" dir="rtl">
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-emerald-100 bg-white p-4 shadow-sm sm:p-6">
      <div><h2 className="flex items-center gap-2 text-lg font-black text-slate-900"><MapPin className="h-5 w-5 text-emerald-700" />مناطق التوصيل</h2><p className="mt-1 text-xs text-slate-500">حدد رسوم كل منطقة وترتيب ظهورها للعملاء.</p></div>
      <button type="button" onClick={openCreate} className="flex min-h-11 items-center gap-2 rounded-xl bg-emerald-700 px-4 text-sm font-bold text-white hover:bg-emerald-800"><Plus className="h-4 w-4" />إضافة منطقة</button>
    </div>
    {isError && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">تعذر تحميل المناطق. حاول تحديث الصفحة.</div>}
    {isLoading ? <div className="rounded-2xl bg-white p-8 text-center text-sm text-slate-500"><Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />جاري تحميل المناطق...</div> : zones.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">لا توجد مناطق توصيل. أضف أول منطقة للبدء.</div> :
      <>
        {/* Desktop / Tablet Table View (md+) */}
        <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[620px] text-right text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500">
              <tr>
                <th className="p-4">المنطقة</th>
                <th className="p-4">الرسوم</th>
                <th className="p-4">الترتيب</th>
                <th className="p-4">الحالة</th>
                <th className="p-4">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {zones.map((zone) => (
                <tr key={zone.id} className="text-slate-700">
                  <td className="p-4 font-extrabold text-slate-900">{zone.nameAr}</td>
                  <td className="p-4 font-bold">{Number(zone.fee).toFixed(2)} ج.م</td>
                  <td className="p-4">{zone.sortOrder}</td>
                  <td className="p-4">
                    <button
                      type="button"
                      onClick={() => toggleMutation.mutate({ id: zone.id, isActive: !zone.isActive })}
                      aria-label={zone.isActive ? 'إيقاف المنطقة' : 'تفعيل المنطقة'}
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        zone.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {zone.isActive ? 'نشطة' : 'متوقفة'}
                    </button>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(zone)}
                        className="rounded-lg bg-slate-100 p-2 text-slate-700 hover:bg-emerald-100"
                        aria-label="تعديل"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleting(zone)}
                        className="rounded-lg bg-slate-100 p-2 text-red-600 hover:bg-red-50"
                        aria-label="حذف"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards View (<md) */}
        <div className="md:hidden space-y-3">
          {zones.map((zone) => (
            <div
              key={zone.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3 text-right"
            >
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                <span className="font-extrabold text-sm text-slate-900">{zone.nameAr}</span>
                <button
                  type="button"
                  onClick={() => toggleMutation.mutate({ id: zone.id, isActive: !zone.isActive })}
                  aria-label={zone.isActive ? 'إيقاف المنطقة' : 'تفعيل المنطقة'}
                  className={`min-h-[36px] rounded-full px-3 py-1 text-xs font-bold transition-smooth ${
                    zone.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {zone.isActive ? 'نشطة' : 'متوقفة'}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div>
                  <span className="text-slate-400 block text-[10px]">رسوم التوصيل</span>
                  <span className="font-black text-slate-900 text-sm">
                    {Number(zone.fee).toFixed(2)} ج.م
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">ترتيب الظهور</span>
                  <span className="font-bold text-slate-700">{zone.sortOrder}</span>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => openEdit(zone)}
                  className="flex-1 min-h-[44px] flex items-center justify-center gap-1.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-emerald-100 hover:text-emerald-800 font-bold text-xs transition-smooth"
                  aria-label="تعديل"
                >
                  <Edit2 className="h-4 w-4" />
                  <span>تعديل</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDeleting(zone)}
                  className="min-h-[44px] px-3.5 flex items-center justify-center rounded-xl bg-slate-100 text-red-600 hover:bg-red-50 font-bold text-xs transition-smooth"
                  aria-label="حذف"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </>
    }

    <Modal isOpen={Boolean(editing)} onClose={() => setEditing(null)} className="max-w-md">
      <form onSubmit={submit} className="space-y-4 rounded-3xl bg-white p-5 text-right shadow-2xl sm:p-6">
        <h3 className="text-base font-black text-slate-900">{editing?.id ? 'تعديل منطقة التوصيل' : 'إضافة منطقة توصيل'}</h3>
        {error && <p className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs text-red-700"><AlertCircle className="h-4 w-4" />{error}</p>}
        <label className="block text-xs font-bold text-slate-700">اسم المنطقة<input required value={form.nameAr} onChange={(e) => setForm({ ...form, nameAr: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5" /></label>
        <label className="block text-xs font-bold text-slate-700">رسوم التوصيل (ج.م)<input required type="number" min="0" step="0.01" value={form.fee} onChange={(e) => setForm({ ...form, fee: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5" /></label>
        <label className="block text-xs font-bold text-slate-700">ترتيب الظهور<input type="number" step="1" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5" /></label>
        <label className="flex items-center gap-2 text-xs font-bold text-slate-700"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />منطقة نشطة</label>
        <div className="flex gap-2"><button disabled={saveMutation.isPending} className="flex min-h-11 flex-1 items-center justify-center rounded-xl bg-emerald-700 px-4 text-sm font-bold text-white disabled:opacity-60">{saveMutation.isPending ? 'جاري الحفظ...' : 'حفظ'}</button><button type="button" onClick={() => setEditing(null)} className="rounded-xl bg-slate-100 px-4 text-sm font-bold text-slate-700">إلغاء</button></div>
      </form>
    </Modal>
    <ConfirmModal isOpen={Boolean(deleting)} onClose={() => setDeleting(null)} onConfirm={() => deleteMutation.mutate(deleting.id)} isLoading={deleteMutation.isPending} isDanger title="حذف منطقة التوصيل" message="إذا كانت المنطقة مستخدمة في طلبات سابقة فسيتم إيقافها للحفاظ على بيانات الطلبات." confirmText="حذف المنطقة" />
  </section>;
};
