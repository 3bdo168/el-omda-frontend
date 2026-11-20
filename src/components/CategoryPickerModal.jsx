import React, { useState, useMemo } from 'react';
import { ArrowRightLeft, Check, FolderTree, Package, RefreshCw, X } from 'lucide-react';
import { Modal } from './Modal';
import { SearchInput } from './SearchInput';
import { matchesArabicFields } from '../utils/arabicSearch';

const CategoryPickerForm = ({
  categories = [],
  selectedCount = 0,
  excludedCategoryId = null,
  isLoading = false,
  onClose,
  onConfirm,
}) => {
  const [targetId, setTargetId] = useState('');
  const [filterText, setFilterText] = useState('');

  const availableCategories = useMemo(
    () => categories.filter((c) => c.id !== excludedCategoryId),
    [categories, excludedCategoryId]
  );

  const filteredCategories = useMemo(() => {
    if (!filterText.trim()) return availableCategories;
    return availableCategories.filter((c) => matchesArabicFields([c.name], filterText));
  }, [availableCategories, filterText]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!targetId || isLoading) return;
    onConfirm?.(targetId);
  };

  return (
    <form
      onSubmit={handleSubmit}
      dir="rtl"
      className="bg-white rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 text-right max-h-[88vh] flex flex-col"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="p-2 rounded-xl bg-purple-100 text-purple-700 shrink-0">
            <ArrowRightLeft className="w-4 h-4" />
          </span>
          <div className="min-w-0">
            <h3 className="font-black text-sm sm:text-base text-slate-900">
              نقل المنتجات إلى قسم آخر
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              اختر القسم المستهدف لنقل <strong className="text-purple-700">{selectedCount}</strong>{' '}
              {selectedCount === 1 ? 'منتج محدد' : 'منتجات محددة'}
            </p>
          </div>
        </div>

        <button
          type="button"
          disabled={isLoading}
          onClick={onClose}
          aria-label="إغلاق نافذة اختيار القسم"
          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-smooth shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Optional quick search if there are several destination categories */}
      {availableCategories.length > 5 && (
        <div className="shrink-0">
          <SearchInput
            value={filterText}
            onChange={setFilterText}
            onClear={() => setFilterText('')}
            placeholder="ابحث عن القسم المستهدف..."
            ariaLabel="البحث عن القسم المستهدف للنقل"
            accent="purple"
            size="sm"
          />
        </div>
      )}

      {/* Categories Selection List */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-0.5 pl-0.5 min-h-[120px] max-h-[48vh]">
        {availableCategories.length === 0 ? (
          <div className="py-10 text-center text-slate-400 space-y-1.5">
            <FolderTree className="w-8 h-8 mx-auto text-slate-300" />
            <p className="text-xs font-bold text-slate-600">
              لا توجد أقسام أخرى متاحة للنقل إليها
            </p>
            <p className="text-[11px] text-slate-400">
              أضف قسماً جديداً أولاً لتتمكن من نقل المنتجات إليه.
            </p>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="py-8 text-center text-xs font-bold text-slate-500">
            لا توجد أقسام مطابقة للبحث &ldquo;{filterText.trim()}&rdquo;
          </div>
        ) : (
          filteredCategories.map((cat) => {
            const isSelected = targetId === cat.id;
            const count = cat._count?.products || 0;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setTargetId(cat.id)}
                aria-label={`اختيار قسم ${cat.name}`}
                aria-pressed={isSelected}
                className={`w-full p-3 rounded-2xl border text-right transition-smooth flex items-center justify-between gap-3 ${
                  isSelected
                    ? 'border-purple-600 bg-purple-50/90 ring-2 ring-purple-500/20 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-purple-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-smooth ${
                      isSelected
                        ? 'bg-purple-700 border-purple-700 text-white'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3" />}
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-extrabold text-xs sm:text-sm text-slate-900 truncate">
                        {cat.name}
                      </span>
                      {!cat.isActive && (
                        <span className="text-[10px] bg-slate-200 text-slate-600 font-bold px-2 py-0.5 rounded-full">
                          غير نشط
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 flex items-center gap-1 shrink-0">
                  <Package className="w-3 h-3 text-purple-600" />
                  <span>{count} منتج</span>
                </span>
              </button>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2 pt-3 border-t border-slate-100 shrink-0">
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
          disabled={!targetId || isLoading}
          className="flex-1 py-2.5 px-4 bg-purple-700 hover:bg-purple-800 disabled:opacity-45 disabled:cursor-not-allowed text-white rounded-xl text-xs font-extrabold transition-smooth flex items-center justify-center gap-1.5 shadow-sm"
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>جاري نقل المنتجات...</span>
            </>
          ) : (
            <>
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>تأكيد النقل ({selectedCount})</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};

/**
 * Modal picker for moving selected products into a target category.
 */
export const CategoryPickerModal = ({
  isOpen,
  sessionKey = 0,
  categories = [],
  selectedCount = 0,
  excludedCategoryId = null,
  isLoading = false,
  onClose,
  onConfirm,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={isLoading ? undefined : onClose}
      closeOnBackdropClick={!isLoading}
      closeOnEscape={!isLoading}
      className="max-w-md"
    >
      <CategoryPickerForm
        key={sessionKey}
        categories={categories}
        selectedCount={selectedCount}
        excludedCategoryId={excludedCategoryId}
        isLoading={isLoading}
        onClose={onClose}
        onConfirm={onConfirm}
      />
    </Modal>
  );
};
