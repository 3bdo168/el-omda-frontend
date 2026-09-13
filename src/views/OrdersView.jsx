import React, { useState, useEffect } from 'react';
import {
  Package,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  AlertCircle,
  Upload,
  Eye,
  Building2,
  CreditCard,
  Banknote,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from 'lucide-react';
import { api, getImageUrl } from '../services/api';
import { useNotifications } from '../context/NotificationContext';
import { Modal } from '../components/Modal';

export const OrdersView = ({ initialSelectedOrderId = null }) => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState(initialSelectedOrderId);
  const [selectedReceiptUrl, setSelectedReceiptUrl] = useState(null);

  // Upload receipt state for a specific order
  const [uploadingForOrderId, setUploadingForOrderId] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadPreview, setUploadPreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const { refreshNotifications } = useNotifications();

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    if (initialSelectedOrderId) {
      setExpandedOrderId(initialSelectedOrderId);
      setTimeout(() => {
        const el = document.getElementById(`order-card-${initialSelectedOrderId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 350);
    }
  }, [initialSelectedOrderId, orders.length]);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const res = await api.getMyOrders();
      if (res.success && res.data) {
        setOrders(res.data);
      }
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (e, orderId) => {
    const file = e.target.files[0];
    if (file) {
      setUploadingForOrderId(orderId);
      setUploadFile(file);
      setUploadPreview(URL.createObjectURL(file));
      setUploadError('');
    }
  };

  const submitReceiptUpload = async (orderId) => {
    if (!uploadFile) return;
    setIsUploading(true);
    setUploadError('');

    try {
      const formData = new FormData();
      formData.append('receipt', uploadFile);

      await api.uploadReceipt(orderId, formData);
      setUploadingForOrderId(null);
      setUploadFile(null);
      setUploadPreview(null);
      await fetchOrders();
      refreshNotifications();
    } catch (err) {
      setUploadError(err.message || 'فشل رفع الإيصال');
    } finally {
      setIsUploading(false);
    }
  };

  const statusConfig = {
    PENDING: { label: 'قيد الانتظار', color: 'bg-amber-100 text-amber-800 border-amber-300', icon: Clock },
    CONFIRMED: { label: 'تم التأكيد', color: 'bg-blue-100 text-blue-800 border-blue-300', icon: CheckCircle },
    PROCESSING: { label: 'جاري التجهيز', color: 'bg-purple-100 text-purple-800 border-purple-300', icon: Package },
    SHIPPED: { label: 'تم الشحن', color: 'bg-indigo-100 text-indigo-800 border-indigo-300', icon: Truck },
    DELIVERED: { label: 'تم التوصيل بنجاح', color: 'bg-emerald-100 text-emerald-800 border-emerald-300', icon: CheckCircle },
    CANCELLED: { label: 'تم الإلغاء', color: 'bg-red-100 text-red-800 border-red-300', icon: XCircle },
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            طلباتي وتتبع الشحنات
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            تابع تفاصيل طلباتك، حالات التوصيل، وإيصالات التحويل البنكي
          </p>
        </div>
        <button
          onClick={fetchOrders}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-smooth"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>تحديث</span>
        </button>
      </div>

      {/* Orders List */}
      {isLoading ? (
        <div className="py-20 text-center text-slate-400">
          <div className="animate-spin w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-xs font-bold">جاري تحميل سجل الطلبات...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="py-16 text-center glass-card rounded-3xl p-8 space-y-3">
          <Package className="w-16 h-16 stroke-[1.2] text-slate-300 mx-auto" />
          <h3 className="font-extrabold text-slate-700 text-base">لم تقم بإجراء أي طلبات حتى الآن</h3>
          <p className="text-xs text-slate-400">تصفح المتجر وأضف منتجاتك المفضلة لبدء طلبك الأول</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const status = statusConfig[order.status] || statusConfig.PENDING;
            const StatusIcon = status.icon;
            const isExpanded = expandedOrderId === order.id;

            return (
              <div
                key={order.id}
                id={`order-card-${order.id}`}
                className={`glass-card rounded-3xl border shadow-sm overflow-hidden transition-smooth ${
                  isExpanded
                    ? 'border-emerald-500 ring-2 ring-emerald-500/25 bg-white'
                    : 'border-slate-200'
                }`}
              >
                {/* Order Top Bar */}
                <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-slate-900 font-mono">
                        #{order.orderNumber}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${status.color}`}
                      >
                        <StatusIcon className="w-3.5 h-3.5" />
                        {status.label}
                      </span>
                      <span className="text-[10px] text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                        {order.orderType === 'WHOLESALE' ? 'طلب جملة (B2B)' : 'طلب قطاعي (Retail)'}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span>
                        📅 {new Date(order.createdAt).toLocaleDateString('ar-EG', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <span>
                        💳{' '}
                        {order.paymentMethod === 'CASH_ON_DELIVERY'
                          ? 'دفع عند الاستلام'
                          : order.paymentMethod === 'BANK_TRANSFER'
                          ? 'تحويل بنكي'
                          : 'دفع إلكتروني'}
                      </span>
                    </div>
                  </div>

                  {/* Financial & Expand Toggle */}
                  <div className="flex items-center justify-between sm:justify-end gap-4">
                    <div className="text-left sm:text-right">
                      <div className="text-xs text-slate-500">الإجمالي النهائي:</div>
                      <div className="font-black text-base text-emerald-700">
                        {order.totalAmount} ج.م
                      </div>
                    </div>

                    <button
                      onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                      className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-xl transition-smooth"
                      title="عرض التفاصيل"
                    >
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Cash on Delivery Status Section */}
                {order.paymentMethod === 'CASH_ON_DELIVERY' && (
                  <div className="px-5 py-3 bg-emerald-50/60 border-t border-b border-emerald-100 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <Banknote className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span className="font-bold text-emerald-950">الدفع عند الاستلام:</span>
                      {order.paymentStatus === 'PAID' ? (
                        <span className="text-emerald-800 bg-emerald-100 font-bold px-2 py-0.5 rounded-full border border-emerald-300 text-[10px]">
                          تم تحصيل المبلغ نقداً بنجاح ✅
                        </span>
                      ) : (
                        <span className="text-amber-800 bg-amber-100 font-bold px-2 py-0.5 rounded-full border border-amber-300 text-[10px]">
                          يتم سداد المبلغ نقداً عند الاستلام ⏳
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      المبلغ المطلوب سداده عند التسليم:{' '}
                      <strong className="text-emerald-800 font-mono">{order.totalAmount} ج.م</strong>
                    </div>
                  </div>
                )}

                {/* Bank Transfer Receipt Management Section */}
                {order.paymentMethod === 'BANK_TRANSFER' && (
                  <div className="px-5 py-3.5 bg-amber-50/50 border-t border-b border-amber-100/70 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                    <div className="flex items-start gap-2.5">
                      <Building2 className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-amber-950 flex items-center gap-2">
                          <span>حالة التحويل البنكي:</span>
                          {order.paymentStatus === 'PAID' ? (
                            <span className="text-emerald-700 bg-emerald-100 font-bold px-2 py-0.2 rounded-full border border-emerald-300 text-[10px]">
                              تم التحقق والدفع بنجاح ✅
                            </span>
                          ) : order.paymentStatus === 'FAILED' ? (
                            <span className="text-red-700 bg-red-100 font-bold px-2 py-0.2 rounded-full border border-red-300 text-[10px]">
                              تم رفض الإيصال ❌
                            </span>
                          ) : order.receiptImageUrl ? (
                            <span className="text-blue-700 bg-blue-100 font-bold px-2 py-0.2 rounded-full border border-blue-300 text-[10px]">
                              الإيصال قيد مراجعة الأدمن ⏳
                            </span>
                          ) : (
                            <span className="text-amber-800 bg-amber-200/80 font-bold px-2 py-0.2 rounded-full border border-amber-300 text-[10px]">
                              بانتظار رفع صورة الإيصال ⚠️
                            </span>
                          )}
                        </div>

                        {order.receiptRejectReason && (
                          <p className="text-[11px] text-red-700 mt-1 font-semibold">
                            سبب الرفض: {order.receiptRejectReason}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Receipt Action Buttons */}
                    <div className="flex items-center gap-2 justify-end">
                      {order.receiptImageUrl && (
                        <button
                          onClick={() => setSelectedReceiptUrl(getImageUrl(order.receiptImageUrl))}
                          className="flex items-center gap-1 text-xs px-3 py-1.5 bg-white border border-slate-300 hover:border-emerald-500 rounded-xl text-slate-700 font-bold transition-smooth"
                        >
                          <Eye className="w-3.5 h-3.5 text-emerald-600" />
                          <span>معاينة الإيصال</span>
                        </button>
                      )}

                      {/* Upload / Re-upload button if not PAID */}
                      {order.paymentStatus !== 'PAID' && (
                        <div>
                          <input
                            type="file"
                            id={`receipt-input-${order.id}`}
                            accept="image/*"
                            onChange={(e) => handleFileSelect(e, order.id)}
                            className="hidden"
                          />
                          <label
                            htmlFor={`receipt-input-${order.id}`}
                            className="cursor-pointer flex items-center gap-1.5 text-xs px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-smooth shadow-sm"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>
                              {order.receiptImageUrl ? 'تحديث الإيصال' : 'رفع إيصال التحويل'}
                            </span>
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Pending Upload Preview Dialog for this order */}
                {uploadingForOrderId === order.id && (
                  <div className="p-4 bg-emerald-50 border-t border-emerald-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-900">
                        معاينة الإيصال قبل الإرسال:
                      </span>
                      <button
                        onClick={() => {
                          setUploadingForOrderId(null);
                          setUploadFile(null);
                          setUploadPreview(null);
                        }}
                        className="text-xs text-slate-500 hover:text-slate-800 font-bold"
                      >
                        إلغاء
                      </button>
                    </div>

                    {uploadError && (
                      <p className="text-xs text-red-600 font-bold">{uploadError}</p>
                    )}

                    <div className="flex items-center gap-4">
                      {uploadPreview && (
                        <img
                          src={uploadPreview}
                          alt="إيصال"
                          className="w-20 h-20 object-cover rounded-xl border border-emerald-300 shadow-sm"
                        />
                      )}
                      <div className="space-y-1 text-xs text-slate-600">
                        <p className="font-semibold">{uploadFile?.name}</p>
                        <p className="text-[11px] text-slate-400">
                          الحجم: {(uploadFile?.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>

                    <button
                      disabled={isUploading}
                      onClick={() => submitReceiptUpload(order.id)}
                      className="py-2 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-smooth flex items-center gap-2"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{isUploading ? 'جاري الرفع...' : 'تأكيد وإرسال الإيصال للأدمن'}</span>
                    </button>
                  </div>
                )}

                {/* Expanded Order Items Breakdown */}
                {isExpanded && (
                  <div className="p-5 border-t border-slate-100 bg-white space-y-4 animate-fade-in">
                    <h4 className="text-xs font-bold text-slate-800">تفاصيل المنتجات في الطلب:</h4>
                    <div className="divide-y divide-slate-100 text-xs">
                      {order.items?.map((item) => (
                        <div key={item.id} className="py-2.5 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-sm">
                              📦
                            </div>
                            <div>
                              <div className="font-bold text-slate-900">
                                {item.product?.name || 'منتج غير محدد'}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                كود SKU: {item.product?.sku}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-6 text-slate-700">
                            <div>
                              <span className="text-slate-400">الكمية: </span>
                              <span className="font-bold">{item.quantity}</span>
                            </div>
                            <div>
                              <span className="text-slate-400">سعر الوحدة: </span>
                              <span className="font-bold">{item.unitPrice} ج.م</span>
                            </div>
                            <div className="font-extrabold text-slate-900 w-24 text-left">
                              {item.totalPrice} ج.م
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Order Cost Breakdown */}
                    <div className="pt-3 border-t border-slate-200 flex flex-col items-end gap-1 text-xs text-slate-600">
                      <div className="flex justify-between w-48">
                        <span>المجموع الفرعي:</span>
                        <span className="font-bold">{order.subtotal} ج.م</span>
                      </div>
                      {parseFloat(order.discountAmount) > 0 && (
                        <div className="flex justify-between w-48 text-emerald-700 font-bold">
                          <span>الخصم الممنوح:</span>
                          <span>- {order.discountAmount} ج.م</span>
                        </div>
                      )}
                      <div className="flex justify-between w-48 text-sm font-extrabold text-slate-900 pt-1 border-t border-slate-200">
                        <span>الإجمالي:</span>
                        <span className="text-emerald-700">{order.totalAmount} ج.م</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Receipt Image Zoom Modal */}
      <Modal
        isOpen={Boolean(selectedReceiptUrl)}
        onClose={() => setSelectedReceiptUrl(null)}
        className="max-w-2xl"
        backdropClassName="bg-slate-950/80 backdrop-blur-md"
      >
        {selectedReceiptUrl && (
          <div className="bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4 text-center">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">معاينة صورة إيصال التحويل البنكي</h3>
              <button
                onClick={() => setSelectedReceiptUrl(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-smooth"
              >
                ✕
              </button>
            </div>
            <div className="max-h-[70vh] overflow-auto rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-center p-2">
              <img
                src={selectedReceiptUrl}
                alt="إيصال التحويل"
                className="max-h-full max-w-full object-contain rounded-lg"
              />
            </div>
            <button
              onClick={() => setSelectedReceiptUrl(null)}
              className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-smooth"
            >
              إغلاق
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
};
