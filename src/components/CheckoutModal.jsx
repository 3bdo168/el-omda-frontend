import React, { useState, useEffect } from 'react';
import {
  X,
  CreditCard,
  Building2,
  CheckCircle2,
  Upload,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Banknote,
  Copy,
  Check,
  Loader2,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { useNotifications } from '../context/NotificationContext';
import { Modal } from './Modal';

export const CheckoutModal = ({ isOpen, onClose, onSuccessOrder }) => {
  const { items, totalAmount, subtotal, discountAmount, appliedCoupon, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const { refreshNotifications } = useNotifications();

  const [paymentMethod, setPaymentMethod] = useState('CASH_ON_DELIVERY');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdOrder, setCreatedOrder] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Payment Destinations State
  const [destinations, setDestinations] = useState([]);
  const [loadingDestinations, setLoadingDestinations] = useState(false);
  const [copiedValue, setCopiedValue] = useState(null);

  // Receipt Upload State
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState(null);
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);
  const [receiptUploadedSuccess, setReceiptUploadedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchDestinations();
      // Reset order state when opening fresh
      if (!createdOrder) {
        setReceiptFile(null);
        setReceiptPreview(null);
        setReceiptUploadedSuccess(false);
      }
    }
  }, [isOpen]);

  const fetchDestinations = async () => {
    setLoadingDestinations(true);
    try {
      const res = await api.paymentDestinations.getPublic();
      if (res.success && Array.isArray(res.data)) {
        setDestinations(res.data);
      }
    } catch (err) {
      console.error('Failed to load payment destinations:', err);
    } finally {
      setLoadingDestinations(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard?.writeText(text);
    setCopiedValue(text);
    setTimeout(() => setCopiedValue(null), 2000);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setReceiptFile(file);
      setReceiptPreview(URL.createObjectURL(file));
    }
  };

  const handleCreateOrder = async () => {
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      // Must be authenticated to place an order
      if (!isAuthenticated) {
        setErrorMsg('يجب تسجيل الدخول أولاً قبل إتمام الطلب');
        return;
      }

      const payload = {
        items: items.map((i) => ({
          productId: i.product.id,
          quantity: i.quantity,
        })),
        couponCode: appliedCoupon?.code || undefined,
        paymentMethod,
      };

      const res = await api.createOrder(payload);

      if (res.success && res.data) {
        setCreatedOrder(res.data);
        clearCart();
        refreshNotifications();
      }
    } catch (err) {
      setErrorMsg(err.message || 'فشل إنشاء الطلب');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUploadReceipt = async () => {
    if (!receiptFile || !createdOrder) return;
    setIsUploadingReceipt(true);
    setErrorMsg('');

    try {
      const formData = new FormData();
      formData.append('receipt', receiptFile);

      await api.uploadReceipt(createdOrder.id, formData);
      setReceiptUploadedSuccess(true);
      refreshNotifications();
    } catch (err) {
      setErrorMsg(err.message || 'فشل رفع صورة الإيصال');
    } finally {
      setIsUploadingReceipt(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-lg">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-right">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">
              {createdOrder ? 'تم تأكيد استلام طلبك 🎉' : 'إتمام الطلب والدفع'}
            </h3>
            <p className="text-xs text-slate-500">
              {createdOrder
                ? `رقم الطلب #${createdOrder.orderNumber}`
                : 'اختر طريقة الدفع المناسبة وأكد الطلب'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-200 transition-smooth"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {errorMsg && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {!createdOrder ? (
            <div className="space-y-5">
              {/* Order Summary */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>عدد العناصر:</span>
                  <span className="font-bold text-slate-800">{items.length} منتج</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>المجموع الفرعي:</span>
                  <span className="font-bold text-slate-800">{subtotal.toFixed(2)} ج.م</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>الخصم المطبق:</span>
                    <span>- {discountAmount.toFixed(2)} ج.م</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-2 border-t border-slate-200">
                  <span>المبلغ الإجمالي المطلوب:</span>
                  <span className="text-emerald-700 font-black">{totalAmount.toFixed(2)} ج.م</span>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-2">
                  اختر طريقة الدفع:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Option 1: Cash on Delivery */}
                  <div
                    onClick={() => setPaymentMethod('CASH_ON_DELIVERY')}
                    className={`p-3 rounded-2xl border-2 cursor-pointer transition-smooth flex flex-col items-center text-center gap-1.5 ${
                      paymentMethod === 'CASH_ON_DELIVERY'
                        ? 'border-emerald-600 bg-emerald-50/60 text-emerald-950 font-bold shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 text-slate-600'
                    }`}
                  >
                    <div className={`p-2 rounded-xl ${paymentMethod === 'CASH_ON_DELIVERY' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      <Banknote className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold">الدفع عند الاستلام</div>
                      <div className="text-[10px] text-slate-500 font-normal mt-0.5">
                        نقداً عند التوصيل (COD)
                      </div>
                    </div>
                  </div>

                  {/* Option 2: Bank Transfer / InstaPay */}
                  <div
                    onClick={() => setPaymentMethod('BANK_TRANSFER')}
                    className={`p-3 rounded-2xl border-2 cursor-pointer transition-smooth flex flex-col items-center text-center gap-1.5 ${
                      paymentMethod === 'BANK_TRANSFER'
                        ? 'border-emerald-600 bg-emerald-50/60 text-emerald-950 font-bold shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 text-slate-600'
                    }`}
                  >
                    <div className={`p-2 rounded-xl ${paymentMethod === 'BANK_TRANSFER' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold">تحويل بنكي / إنستاباي</div>
                      <div className="text-[10px] text-slate-500 font-normal mt-0.5">
                        إرفاق إيصال التحويل
                      </div>
                    </div>
                  </div>

                  {/* Option 3: Online Payment */}
                  <div
                    onClick={() => setPaymentMethod('ONLINE')}
                    className={`p-3 rounded-2xl border-2 cursor-pointer transition-smooth flex flex-col items-center text-center gap-1.5 ${
                      paymentMethod === 'ONLINE'
                        ? 'border-emerald-600 bg-emerald-50/60 text-emerald-950 font-bold shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 text-slate-600'
                    }`}
                  >
                    <div className={`p-2 rounded-xl ${paymentMethod === 'ONLINE' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold">دفع إلكتروني (Online)</div>
                      <div className="text-[10px] text-slate-500 font-normal mt-0.5">
                        فيزا / ماستركارد
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cash on Delivery Notice */}
              {paymentMethod === 'CASH_ON_DELIVERY' && (
                <div className="p-3.5 bg-emerald-50/80 rounded-2xl border border-emerald-200 text-xs text-emerald-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-emerald-800">
                    <Banknote className="w-4 h-4 text-emerald-600" />
                    الدفع نقداً عند استلام الطلب:
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    - يتم سداد كامل المبلغ <strong>({totalAmount.toFixed(2)} ج.م)</strong> نقداً لمندوب الشحن عند وصول الطلب إليك.
                  </p>
                  <p className="text-[10px] text-emerald-700 pt-1 border-t border-emerald-200">
                    * لا حاجة لأي تحويل مسبق أو إرفاق إيصالات بنكية.
                  </p>
                </div>
              )}

              {/* Bank Transfer Instructions with Dynamic Destinations */}
              {paymentMethod === 'BANK_TRANSFER' && (
                <div className="p-3.5 bg-amber-50/80 rounded-2xl border border-amber-200 text-xs text-amber-900 space-y-2.5">
                  <div className="font-bold flex items-center justify-between text-amber-900">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-amber-600" />
                      بيانات التحويل المعتمدة:
                    </span>
                    <span className="text-[10px] text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full font-bold">
                      انسخ رقم الحساب المناسب
                    </span>
                  </div>

                  {loadingDestinations ? (
                    <div className="py-3 flex items-center justify-center gap-2 text-amber-800 text-xs">
                      <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                      <span>جاري تحميل بيانات الحسابات...</span>
                    </div>
                  ) : destinations.length > 0 ? (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-0.5">
                      {destinations.map((dest) => (
                        <div
                          key={dest.id}
                          className="p-2.5 bg-white rounded-xl border border-amber-200/90 shadow-xs flex items-center justify-between gap-2"
                        >
                          <div className="space-y-0.5 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900">
                                {dest.type === 'PHONE' ? 'محفظة كاش' : dest.type === 'INSTAPAY' ? 'InstaPay' : 'حساب بنكي'}
                              </span>
                              <span className="text-xs font-bold text-slate-800 truncate">{dest.label}</span>
                              {dest.bankName && <span className="text-[10px] text-slate-500 font-medium">({dest.bankName})</span>}
                            </div>
                            <div className="text-xs font-mono font-black text-slate-900 select-all tracking-wider">
                              {dest.value}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(dest.value)}
                            className="p-1.5 hover:bg-amber-50 text-slate-500 hover:text-emerald-700 rounded-lg transition-smooth shrink-0 border border-slate-200"
                            title="نسخ الرقم"
                          >
                            {copiedValue === dest.value ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-1 text-[11px] leading-relaxed">
                      <p>- البنك الأهلي المصري (NBE): <strong>EG1200030000112233445566</strong></p>
                      <p>- حساب إنستاباي (InstaPay): <strong>beitelgomla@instapay</strong></p>
                      <p>- فودافون كاش: <strong>01012345678</strong></p>
                    </div>
                  )}

                  <p className="text-[10px] text-amber-700 pt-1 border-t border-amber-200/80">
                    * بعد إتمام الطلب، سيُطلب منك رفع صورة إيصال التحويل ليقوم الأدمن بمراجعته واعتماده فوراً.
                  </p>
                </div>
              )}

              {/* Online Payment Notice */}
              {paymentMethod === 'ONLINE' && (
                <div className="p-3.5 bg-blue-50/80 rounded-2xl border border-blue-200 text-xs text-blue-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-blue-800">
                    <CreditCard className="w-4 h-4 text-blue-600" />
                    الدفع الإلكتروني (Online):
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    الدفع الآمن الفوري عبر بوابات الدفع الإلكتروني المعتمدة بالبطاقات الائتمانية.
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <button
                disabled={isSubmitting}
                onClick={handleCreateOrder}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/25 transition-smooth flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>جاري إنشاء الطلب...</span>
                ) : (
                  <>
                    <span>تأكيد إنشاء الطلب ({totalAmount.toFixed(2)} ج.م)</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          ) : (
            /* Order Success & Receipt Upload Step */
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0" />
                <div>
                  <h4 className="font-bold text-sm text-emerald-950">
                    تم إنشاء الطلب بنجاح وهو قيد المراجعة
                  </h4>
                  <p className="text-xs text-emerald-800 mt-0.5">
                    رقم الطلب: <strong>{createdOrder.orderNumber}</strong> | الإجمالي:{' '}
                    <strong>{createdOrder.totalAmount} ج.م</strong>
                  </p>
                </div>
              </div>

              {/* Cash on Delivery Information Card */}
              {createdOrder.paymentMethod === 'CASH_ON_DELIVERY' && (
                <div className="p-4 border border-emerald-200 rounded-2xl bg-emerald-50/70 space-y-2 text-xs text-emerald-950">
                  <div className="font-bold text-sm text-emerald-900 flex items-center gap-2">
                    <Banknote className="w-4 h-4 text-emerald-600" />
                    <span>الدفع عند الاستلام (COD)</span>
                  </div>
                  <p className="leading-relaxed text-emerald-800">
                    تم تأكيد طلبك وجاري تحضيره للشحن والتسليم. يتم سداد المبلغ الإجمالي <strong>({createdOrder.totalAmount} ج.م)</strong> نقداً لمندوب الشحن عند استلام الطلب. لا تحتاج لرفع أي إيصالات.
                  </p>
                </div>
              )}

              {/* Online Payment Information Card */}
              {createdOrder.paymentMethod === 'ONLINE' && (
                <div className="p-4 border border-blue-200 rounded-2xl bg-blue-50/70 space-y-2 text-xs text-blue-950">
                  <div className="font-bold text-sm text-blue-900 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-blue-600" />
                    <span>الدفع الإلكتروني (Online)</span>
                  </div>
                  <p className="leading-relaxed text-blue-800">
                    تم إنشاء الطلب بنجاح وهو قيد معالجة الدفع الإلكتروني.
                  </p>
                </div>
              )}

              {/* Bank Transfer Receipt Upload Box */}
              {createdOrder.paymentMethod === 'BANK_TRANSFER' && (
                <div className="p-4 border border-slate-200 rounded-2xl bg-slate-50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Upload className="w-4 h-4 text-emerald-600" />
                      رفع صورة إيصال التحويل البنكي
                    </span>
                    {receiptUploadedSuccess && (
                      <span className="text-xs text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded-full">
                        تم الرفع بنجاح
                      </span>
                    )}
                  </div>

                  {!receiptUploadedSuccess ? (
                    <div>
                      <input
                        type="file"
                        id="receipt-file-input"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <label
                        htmlFor="receipt-file-input"
                        className="border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-white rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-smooth group"
                      >
                        {receiptPreview ? (
                          <div className="flex flex-col items-center gap-2">
                            <img
                              src={receiptPreview}
                              alt="معاينة الإيصال"
                              className="w-32 h-32 object-cover rounded-lg shadow-sm border border-slate-200"
                            />
                            <span className="text-[11px] text-emerald-600 font-semibold group-hover:underline">
                              انقر لتغيير الصورة
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center text-center">
                            <Upload className="w-8 h-8 text-slate-400 group-hover:text-emerald-600 mb-1 transition-smooth" />
                            <span className="text-xs font-bold text-slate-700">
                              اختر صورة الإيصال أو اسحبها هنا
                            </span>
                            <span className="text-[10px] text-slate-400 mt-0.5">
                              (JPG, PNG, WEBP بحد أقصى 5MB)
                            </span>
                          </div>
                        )}
                      </label>

                      {receiptFile && (
                        <button
                          disabled={isUploadingReceipt}
                          onClick={handleUploadReceipt}
                          className="w-full mt-3 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-smooth flex items-center justify-center gap-2"
                        >
                          {isUploadingReceipt ? 'جاري رفع الإيصال...' : 'إرسال الإيصال للمراجعة'}
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="text-xs text-slate-600 bg-white p-3 rounded-xl border border-slate-200 leading-relaxed">
                      ✅ تم استلام صورة الإيصال بنجاح. سيقوم أدمن النظام بمراجعتها وتأكيد الدفع، وستتلقى إشعاراً فور اعتماد الطلب.
                    </div>
                  )}
                </div>
              )}

              {/* Finish Actions */}
              <div className="pt-2 flex items-center gap-2">
                <button
                  onClick={() => {
                    onClose();
                    if (onSuccessOrder) onSuccessOrder();
                  }}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-smooth"
                >
                  الانتقال لمتابعة الطلب في صفحة "طلباتي"
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
