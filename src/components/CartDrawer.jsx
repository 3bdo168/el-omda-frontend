import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Trash2, Plus, Minus, Tag, ChevronLeft, AlertCircle, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export const CartDrawer = ({ isOpen, onClose, onProceedToCheckout }) => {
  const {
    items,
    totalCount,
    subtotal,
    discountAmount,
    totalAmount,
    couponCode,
    setCouponCode,
    appliedCoupon,
    setAppliedCoupon,
    updateQuantity,
    removeFromCart,
    clearCart,
  } = useCart();

  const { isTrader, user } = useAuth();
  const [couponError, setCouponError] = useState('');

  // Body scroll lock & Escape key handling
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleApplyCoupon = () => {
    setCouponError('');
    if (!couponCode.trim()) return;

    // Simulate coupon check or accept demo coupons
    if (couponCode.toUpperCase() === 'WELCOME10') {
      setAppliedCoupon({
        code: 'WELCOME10',
        discountType: 'PERCENTAGE',
        discountValue: 10,
      });
    } else if (couponCode.toUpperCase() === 'GOMLA50' || couponCode.toUpperCase() === 'OMDA50') {
      setAppliedCoupon({
        code: couponCode.toUpperCase(),
        discountType: 'FIXED_AMOUNT',
        discountValue: 50,
      });
    } else {
      // Set generic percentage discount for custom codes
      setAppliedCoupon({
        code: couponCode.toUpperCase(),
        discountType: 'PERCENTAGE',
        discountValue: 5,
      });
    }
  };

  const hasMoqViolations = items.some((item) => !item.isValidMinQty);

  const drawerContent = (
    <div className="fixed inset-0 z-50 overflow-hidden select-none">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-fade-in"
        aria-hidden="true"
      />

      {/* Cart Drawer pinned to Left */}
      <aside
        className="fixed inset-y-0 left-0 w-full sm:w-[440px] max-w-full bg-white shadow-2xl z-50 flex flex-col border-r border-slate-200/90 animate-slide-in-left overflow-hidden"
        aria-label="سلة المشتريات"
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <h2 className="font-extrabold text-base text-slate-800">
              سلة المشتريات ({totalCount})
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {items.length > 0 && (
              <button
                onClick={clearCart}
                className="text-xs text-rose-600 hover:text-rose-800 font-bold px-2.5 py-1 rounded-lg hover:bg-rose-50 transition-smooth"
              >
                إفراغ السلة
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-200 transition-smooth"
              aria-label="إغلاق السلة"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 divide-y divide-slate-100">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 py-16">
              <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                <ShoppingBag className="w-10 h-10 text-slate-300 stroke-[1.5]" />
              </div>
              <p className="font-bold text-slate-700 text-base">سلتك فارغة حالياً</p>
              <p className="text-xs text-slate-400 mt-1">تصفح المنتجات في المتجر وأضف ما يناسبك</p>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.product.id} className="pt-3 first:pt-0">
                <div className="flex items-start gap-3 bg-white p-3 rounded-2xl border border-slate-100 shadow-2xs hover:border-slate-200 transition-smooth">
                  {/* Thumbnail */}
                  <div className="w-16 h-16 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                    {item.product.imageUrl ? (
                      <img
                        src={item.product.imageUrl}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl">📦</span>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-xs sm:text-sm text-slate-900 line-clamp-2 leading-snug">
                        {item.product.name}
                      </h4>
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-smooth shrink-0"
                        title="حذف من السلة"
                        aria-label="حذف من السلة"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
                      كود: {item.product.sku}
                    </p>

                    {/* Pricing Info */}
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <span className="font-black text-sm text-emerald-700">
                        {item.unitPrice.toFixed(2)} ج.م
                      </span>
                      {isTrader && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                          سعر شريحة الجملة
                        </span>
                      )}
                    </div>

                    {/* MOQ Warning if quantity < minQty */}
                    {!item.isValidMinQty && (
                      <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>الحد الأدنى للطلب: {item.minQty} وحدة</span>
                      </div>
                    )}

                    {/* Quantity Controls & Line Total */}
                    <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-1 border border-slate-200 rounded-xl p-0.5 bg-slate-50">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-white hover:text-slate-900 rounded-lg transition-smooth"
                          aria-label="تقليل الكمية"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-black w-8 text-center text-slate-800">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-white hover:text-slate-900 rounded-lg transition-smooth"
                          aria-label="زيادة الكمية"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="text-left font-bold text-xs text-slate-800 whitespace-nowrap">
                        <span className="text-slate-400 text-[11px] font-normal ml-1">الإجمالي:</span>
                        <span className="font-extrabold text-slate-900">{item.totalPrice.toFixed(2)} ج.م</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer with Coupon & Checkout */}
        {items.length > 0 && (
          <div className="p-4 border-t border-slate-200 bg-slate-50 space-y-3 shrink-0">
            {/* Coupon Box */}
            <div className="flex gap-2 items-center">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="كود الخصم (مثال: WELCOME10)"
                  className="w-full text-xs bg-white border border-slate-300 rounded-xl py-2.5 pr-8 pl-3 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-medium uppercase text-right"
                />
                <Tag className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
              </div>
              <button
                onClick={handleApplyCoupon}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-smooth shrink-0 shadow-xs active:scale-95"
              >
                تطبيق
              </button>
            </div>

            {appliedCoupon && (
              <div className="flex items-center justify-between text-xs bg-emerald-50 text-emerald-800 px-3 py-2 rounded-xl border border-emerald-200">
                <span className="font-medium">
                  تم تطبيق كوبون <strong className="font-extrabold">{appliedCoupon.code}</strong> (خصم{' '}
                  {appliedCoupon.discountType === 'PERCENTAGE'
                    ? `${appliedCoupon.discountValue}%`
                    : `${appliedCoupon.discountValue} ج.م`}
                  )
                </span>
                <button
                  onClick={() => setAppliedCoupon(null)}
                  className="text-rose-600 hover:text-rose-800 text-xs font-bold hover:underline shrink-0 mr-2"
                >
                  إلغاء
                </button>
              </div>
            )}

            {/* Price Breakdown */}
            <div className="space-y-1.5 text-xs text-slate-600 pt-1">
              <div className="flex justify-between items-center">
                <span>المجموع الفرعي:</span>
                <span className="font-bold text-slate-800">{subtotal.toFixed(2)} ج.م</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between items-center text-emerald-700 font-bold">
                  <span>قيمة الخصم:</span>
                  <span>- {discountAmount.toFixed(2)} ج.م</span>
                </div>
              )}
              <div className="flex justify-between items-center text-base font-black text-slate-900 pt-2 border-t border-slate-200">
                <span>الإجمالي النهائي:</span>
                <span className="text-emerald-700">{totalAmount.toFixed(2)} ج.م</span>
              </div>
            </div>

            {/* Checkout Button */}
            <button
              disabled={hasMoqViolations}
              onClick={onProceedToCheckout}
              className={`w-full py-3 px-4 rounded-xl font-black text-sm text-white flex items-center justify-center gap-2 shadow-lg transition-smooth ${
                hasMoqViolations
                  ? 'bg-slate-400 cursor-not-allowed shadow-none'
                  : 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 shadow-emerald-600/30 active:scale-[0.99]'
              }`}
            >
              <span>إتمام الطلب والدفع</span>
              <ChevronLeft className="w-4 h-4 shrink-0" />
            </button>

            {hasMoqViolations && (
              <p className="text-[11px] text-amber-700 text-center font-bold">
                ⚠️ يرجى تصحيح الكميات لتتوافق مع الحد الأدنى للطلب لكل منتج
              </p>
            )}

            {isTrader && user?.approvalStatus !== 'APPROVED' && (
              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-[11px] font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>حسابك كتاجر قيد المراجعة — إتمام الطلبات متاح بعد اعتماد الإدارة.</span>
              </div>
            )}
          </div>
        )}
      </aside>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(drawerContent, document.body) : drawerContent;
};
