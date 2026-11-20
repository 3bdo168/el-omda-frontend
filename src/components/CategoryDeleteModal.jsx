import React, { useState } from 'react';
import { AlertTriangle, Check, FolderTree, RefreshCw, Trash2, X } from 'lucide-react';
import { Modal } from './Modal';

const CategoryDeleteForm = ({
  category,
  productCount = 0,
  isLoading = false,
  onClose,
  onConfirm,
}) => {
  const [confirmName, setConfirmName] = useState('');

  const hasProducts = productCount > 0;
  const expectedName = (category.name || '').trim();
  const isNameMatched = !hasProducts || confirmName.trim() === expectedName;
  const canSubmit = !isLoading && isNameMatched;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    onConfirm?.(hasProducts ? confirmName.trim() : '');
  };

  return (
    <form
      onSubmit={handleSubmit}
      dir="rtl"
      className="bg-white rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 text-right"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-3 min-w-0">
          <span className="p-2.5 rounded-2xl bg-red-100 text-red-600 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </span>
          <div className="min-w-0">
            <h3 className="font-black text-sm sm:text-base text-slate-900">
              {hasProducts ? 'حذف القسم وجميع منتجاته' : 'تأكيد حذف القسم'}
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5 truncate">
              إجراء لا يمكن التراجع عنه
            </p>
          </div>
        </div>
        <button
          type="button"
          disabled={isLoading}
          onClick={onClose}
          aria-label="إغلاق نافذة حذف القسم"
          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-smooth shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Target Summary Card */}
      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <FolderTree className="w-4 h-4 text-purple-700 shrink-0" />
          <div className="min-w-0">
            <span className="text-[10px] text-slate-400 font-bold block">اسم القسم المستهدف</span>
            <span className="text-xs sm:text-sm font-black text-slate-900 break-words">
              {category.name}
            </span>
          </div>
        </div>
        <span
          className={`text-xs font-extrabold px-2.5 py-1 rounded-full shrink-0 ${
            hasProducts
              ? 'bg-red-100 text-red-800 border border-red-200'
              : 'bg-slate-200 text-slate-700'
          }`}
        >
          {productCount} منتج
        </span>
      </div>

      {hasProducts ? (
        <div className="space-y-3.5">
          <div className="p-3.5 rounded-2xl bg-red-50/90 border border-red-200 text-xs text-red-900 space-y-2 leading-relaxed">
            <p className="font-extrabold">
              تحذير: سيؤدي هذا الإجراء إلى حذف القسم &ldquo;{category.name}&rdquo; بالكامل مع جميع منتجاته البالغ عددها{' '}
              <span className="underline decoration-red-400 font-black">{productCount} منتج</span> في عملية واحدة:
            </p>
            <ul className="list-disc pr-4 space-y-1 text-[11px] text-red-800">
              <li>سيتم حذف المنتجات التي لم تدخل في طلبات سابقة نهائياً مع شرائح أسعارها.</li>
              <li>
                المنتجات المرتبطة بطلبات عملاء أو تجار سابقة سيتم أرشفتها وإخفاؤها تلقائياً للحفاظ على سلامة الفواتير وسجل الطلبات.
              </li>
            </ul>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="confirm-delete-category-name" className="block text-xs font-bold text-slate-800">
              للتأكيد، اكتب اسم القسم تماماً:
              <span className="inline-block mr-1.5 px-2 py-0.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-900 font-extrabold select-all">
                {category.name}
              </span>
            </label>
            <input
              id="confirm-delete-category-name"
              type="text"
              dir="rtl"
              autoFocus
              disabled={isLoading}
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              placeholder={`اكتب "${category.name}" هنا للتأكيد...`}
              className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-bold bg-white focus:outline-none focus:ring-2 transition-smooth ${
                confirmName && isNameMatched
                  ? 'border-emerald-500 focus:ring-emerald-500/20 text-emerald-900'
                  : 'border-slate-300 focus:border-red-500 focus:ring-red-500/20 text-slate-900'
              }`}
            />
            {confirmName && (
              <p
                className={`text-[11px] font-bold flex items-center gap-1 ${
                  isNameMatched ? 'text-emerald-700' : 'text-red-600'
                }`}
              >
                {isNameMatched ? (
                  <>
                    <Check className="w-3.5 h-3.5 shrink-0" />
                    <span>اسم القسم مطابق — يمكنك المتابعة للحذف</span>
                  </>
                ) : (
                  <span>الاسم غير مطابق بعد ({expectedName})</span>
                )}
              </p>
            )}
          </div>
        </div>
      ) : (
        <p className="text-xs text-slate-600 leading-relaxed">
          هل أنت متأكد من رغبتك في حذف القسم <strong>&ldquo;{category.name}&rdquo;</strong> نهائياً؟ هذا القسم لا يحتوي على منتجات حالياً.
        </p>
      )}

      {/* Actions */}
      <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2 pt-2 border-t border-slate-100">
        <button
          type="button"
          disabled={isLoading}
          onClick={onClose}
          className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-smooth"
        >
          إلغاء
        </button>
        <button
          type="submit"
          disabled={!canSubmit}
          aria-label={`تأكيد حذف القسم ${category.name}`}
          className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 disabled:opacity-45 disabled:cursor-not-allowed text-white rounded-xl text-xs font-extrabold transition-smooth flex items-center justify-center gap-1.5 shadow-sm shadow-red-600/20"
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>جاري حذف القسم...</span>
            </>
          ) : (
            <>
              <Trash2 className="w-3.5 h-3.5" />
              <span>
                {hasProducts
                  ? `حذف القسم و (${productCount}) منتج`
                  : 'نعم، احذف القسم'}
              </span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};

/**
 * Confirmation modal for deleting a category (empty or containing products).
 * Requires typing the exact category name when `productCount > 0`.
 */
export const CategoryDeleteModal = ({
  category,
  productCount = 0,
  isLoading = false,
  onClose,
  onConfirm,
}) => {
  return (
    <Modal
      isOpen={Boolean(category)}
      onClose={isLoading ? undefined : onClose}
      closeOnBackdropClick={!isLoading}
      closeOnEscape={!isLoading}
      className="max-w-md"
    >
      {category && (
        <CategoryDeleteForm
          key={category.id}
          category={category}
          productCount={productCount}
          isLoading={isLoading}
          onClose={onClose}
          onConfirm={onConfirm}
        />
      )}
    </Modal>
  );
};
