import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Package,
  Layers,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Archive,
  Calendar,
  Search,
  Plus,
  Edit2,
  Trash2,
  Eye,
  Check,
  X,
  Building2,
  UserCheck,
  UserX,
  FileText,
  Boxes,
  ShieldCheck,
  RefreshCw,
  Upload,
  Image as ImageIcon,
  ExternalLink,
  DollarSign,
  Banknote,
  CreditCard,
  AlertCircle,
  Tag,
  FolderTree,
  GripVertical,
  ChevronDown,
  ChevronUp,
  ArrowRightLeft,
  Flame,
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { api, getImageUrl } from '../services/api';
import { useNotifications } from '../context/NotificationContext';
import { Modal, ConfirmModal } from '../components/Modal';
import { ScrollableRow } from '../components/ScrollableRow';
import { TableRowSkeleton } from '../components/Skeleton';
import { SearchInput } from '../components/SearchInput';
import { HighlightText } from '../components/HighlightText';
import { useDebouncedSearch } from '../hooks/useDebouncedSearch';
import { matchesArabicFields } from '../utils/arabicSearch';
import { useToast, ToastContainer } from '../components/Toast';
import { CategoryDeleteModal } from '../components/CategoryDeleteModal';
import { CategoryPickerModal } from '../components/CategoryPickerModal';
import { OffersManagementPanel } from '../components/OffersManagementPanel';

const SortableCategoryItem = ({
  category,
  index,
  totalProductsInCategory,
  displayedProducts,
  matchedProductCount,
  isExpanded,
  isSearching,
  searchQuery,
  categoryMatched,
  showingAllInCategory,
  isProductsLoading,
  isDragDisabled,
  isToggling,
  isMovingProducts,
  otherCategories,
  selectedProductIdSet,
  onToggleExpand,
  onToggleShowAllInCategory,
  onEdit,
  onDelete,
  onToggleActive,
  onAddProductInCategory,
  onEditProduct,
  onDeleteProduct,
  onMoveSingleProduct,
  onToggleSelectProduct,
  onToggleSelectCategoryAll,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id, disabled: isDragDisabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.65 : 1,
  };

  const productCount = totalProductsInCategory;
  const hasProducts = productCount > 0;

  const visibleProductIds = displayedProducts.map((p) => p.id);
  const selectedInVisibleCount = visibleProductIds.filter((id) =>
    selectedProductIdSet.has(id)
  ).length;
  const allVisibleSelected =
    visibleProductIds.length > 0 && selectedInVisibleCount === visibleProductIds.length;
  const someVisibleSelected = selectedInVisibleCount > 0 && !allVisibleSelected;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`glass-card rounded-2xl border transition-all overflow-hidden ${
        isDragging
          ? 'border-purple-500 shadow-xl bg-purple-50/90 scale-[1.01]'
          : isExpanded
          ? 'border-purple-300 shadow-sm bg-white'
          : category.isActive
          ? 'border-slate-200 hover:border-slate-300 bg-white'
          : 'border-slate-200 bg-slate-50/70 opacity-90'
      }`}
    >
      {/* Category Header Row */}
      <div className="p-3.5 sm:p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <button
            type="button"
            {...(isDragDisabled ? {} : attributes)}
            {...(isDragDisabled ? {} : listeners)}
            disabled={isDragDisabled}
            aria-label={`إعادة ترتيب القسم ${category.name}`}
            title={
              isDragDisabled
                ? 'السحب والإفلات معطل مؤقتاً أثناء البحث'
                : 'اسحب لإعادة الترتيب'
            }
            className={`p-1.5 rounded-lg transition-smooth shrink-0 ${
              isDragDisabled
                ? 'text-slate-200 cursor-not-allowed'
                : 'cursor-grab active:cursor-grabbing text-slate-400 hover:text-purple-600 hover:bg-purple-50 touch-none'
            }`}
          >
            <GripVertical className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={() => onToggleExpand(category.id)}
            aria-expanded={isExpanded}
            aria-label={
              isExpanded
                ? `إخفاء تفاصيل ومنتجات قسم ${category.name}`
                : `عرض تفاصيل ومنتجات قسم ${category.name}`
            }
            className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1 text-right rounded-xl p-1 -m-1 hover:bg-purple-50/50 transition-smooth focus:outline-none focus:ring-2 focus:ring-purple-500/20"
          >
            <span className="w-7 h-7 rounded-xl bg-purple-50 text-purple-700 text-xs font-bold flex items-center justify-center shrink-0 border border-purple-100">
              {index + 1}
            </span>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 min-w-0">
                <h4 className="font-extrabold text-sm text-slate-900 break-words">
                  <HighlightText
                    text={category.name}
                    query={searchQuery}
                    variant="purple"
                  />
                </h4>
                {!category.isActive && (
                  <span className="text-[10px] bg-slate-200 text-slate-600 font-bold px-2 py-0.5 rounded-full shrink-0">
                    غير نشط
                  </span>
                )}
                {isSearching && categoryMatched && matchedProductCount === 0 && (
                  <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded-full shrink-0">
                    تطابق في اسم القسم
                  </span>
                )}
                {isSearching && matchedProductCount > 0 && (
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full shrink-0">
                    {matchedProductCount} منتج مطابق
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5 flex flex-wrap items-center gap-2">
                <span>الترتيب المعروض: #{category.displayOrder}</span>
                <span className="text-purple-700 font-bold">
                  • {isExpanded ? 'إخفاء المنتجات' : 'انقر لعرض وإدارة المنتجات'}
                </span>
              </p>
            </div>

            <span
              className={`p-1.5 rounded-xl border transition-smooth shrink-0 ${
                isExpanded
                  ? 'bg-purple-700 text-white border-purple-700'
                  : 'bg-slate-50 text-slate-500 border-slate-200'
              }`}
            >
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </span>
          </button>
        </div>

        {/* Category Actions Toolbar */}
        <div className="flex flex-wrap items-center justify-end gap-1.5 sm:gap-2.5 shrink-0">
          {/* Product Count Badge */}
          <button
            type="button"
            onClick={() => onToggleExpand(category.id)}
            aria-label={`عرض منتجات قسم ${category.name} (${productCount} منتج)`}
            className={`text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 transition-smooth ${
              hasProducts
                ? 'bg-purple-100 text-purple-800 hover:bg-purple-200'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>{productCount} منتج</span>
          </button>

          {/* Active/Inactive Toggle Button */}
          <button
            type="button"
            onClick={() => onToggleActive(category)}
            disabled={isToggling}
            aria-label={
              category.isActive
                ? `تعطيل القسم ${category.name} في المتجر`
                : `تفعيل القسم ${category.name} في المتجر`
            }
            title={category.isActive ? 'تعطيل القسم في المتجر' : 'تفعيل القسم في المتجر'}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-smooth ${
              category.isActive
                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
            }`}
          >
            {category.isActive ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>نشط</span>
              </>
            ) : (
              <>
                <X className="w-3.5 h-3.5 text-slate-500" />
                <span>معطل</span>
              </>
            )}
          </button>

          {/* Edit Button */}
          <button
            type="button"
            onClick={() => onEdit(category)}
            aria-label={`تعديل اسم القسم ${category.name}`}
            title="تعديل اسم القسم"
            className="p-2 text-slate-600 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-smooth"
          >
            <Edit2 className="w-4 h-4" />
          </button>

          {/* Delete Button (Works on both empty & populated categories) */}
          <button
            type="button"
            onClick={() => onDelete(category)}
            aria-label={`حذف القسم ${category.name}`}
            title={
              hasProducts
                ? `حذف القسم وجميع منتجاته (${productCount} منتج)`
                : 'حذف القسم'
            }
            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-smooth"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Accordion Detail Body: Category Products Workspace */}
      {isExpanded && (
        <div className="border-t border-slate-100 bg-slate-50/75 p-3.5 sm:p-4 space-y-3 animate-fade-in">
          {/* Detail Workspace Sub-Header */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2.5 border-b border-slate-200/80">
            <div className="flex flex-wrap items-center gap-2.5 min-w-0">
              {displayedProducts.length > 0 && (
                <label className="inline-flex items-center gap-2 cursor-pointer select-none px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-purple-300 text-xs font-bold text-slate-700 transition-smooth">
                  <input
                    type="checkbox"
                    ref={(el) => {
                      if (el) el.indeterminate = someVisibleSelected;
                    }}
                    checked={allVisibleSelected}
                    onChange={() =>
                      onToggleSelectCategoryAll(visibleProductIds, allVisibleSelected)
                    }
                    aria-label={`تحديد جميع المنتجات المعروضة في قسم ${category.name}`}
                    className="w-4 h-4 rounded accent-purple-700 cursor-pointer"
                  />
                  <span>تحديد الكل ({displayedProducts.length})</span>
                </label>
              )}

              {isSearching &&
                matchedProductCount > 0 &&
                matchedProductCount < totalProductsInCategory && (
                  <button
                    type="button"
                    onClick={() => onToggleShowAllInCategory(category.id)}
                    aria-label={
                      showingAllInCategory
                        ? `عرض المنتجات المطابقة فقط في قسم ${category.name}`
                        : `عرض كل منتجات قسم ${category.name}`
                    }
                    className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 transition-smooth"
                  >
                    {showingAllInCategory
                      ? `عرض المطابقة فقط (${matchedProductCount})`
                      : `عرض كل منتجات القسم (${totalProductsInCategory})`}
                  </button>
                )}
            </div>

            <button
              type="button"
              onClick={() => onAddProductInCategory(category.id)}
              aria-label={`إضافة منتج جديد في قسم ${category.name}`}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl transition-smooth shadow-xs shrink-0 w-full sm:w-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة منتج للقسم</span>
            </button>
          </div>

          {/* Loading Skeleton */}
          {isProductsLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, idx) => (
                <div
                  key={idx}
                  className="h-16 rounded-2xl bg-white border border-slate-200 animate-pulse"
                />
              ))}
            </div>
          ) : displayedProducts.length === 0 ? (
            <div className="py-8 px-4 bg-white rounded-2xl border border-dashed border-slate-300 text-center space-y-2.5">
              <Package className="w-9 h-9 text-slate-300 mx-auto" />
              <div>
                <p className="text-xs font-extrabold text-slate-700">
                  لا توجد منتجات في قسم &ldquo;{category.name}&rdquo; حالياً
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  أضف منتجاً جديداً لهذا القسم مباشرة أو انقل منتجات من أقسام أخرى.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onAddProductInCategory(category.id)}
                aria-label={`إضافة أول منتج في قسم ${category.name}`}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold transition-smooth"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة منتج الآن</span>
              </button>
            </div>
          ) : (
            <>
              {/* Phone & iPad Portrait Cards (lg:hidden) */}
              <div className="lg:hidden grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {displayedProducts.map((p) => {
                  const isSelected = selectedProductIdSet.has(p.id);
                  return (
                    <div
                      key={p.id}
                      className={`p-3 bg-white rounded-2xl border transition-smooth space-y-2.5 min-w-0 ${
                        isSelected
                          ? 'border-purple-500 ring-2 ring-purple-500/20 bg-purple-50/20'
                          : 'border-slate-200'
                      }`}
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => onToggleSelectProduct(p.id)}
                          aria-label={`تحديد المنتج ${p.name}`}
                          className="w-4 h-4 mt-1 rounded accent-purple-700 cursor-pointer shrink-0"
                        />

                        {p.imageUrl ? (
                          <img
                            src={getImageUrl(p.imageUrl)}
                            alt={p.name}
                            className="w-11 h-11 object-cover rounded-xl border border-slate-200 shrink-0"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center text-base border border-slate-200 shrink-0">
                            📦
                          </div>
                        )}

                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-start justify-between gap-1.5">
                            <h5 className="font-extrabold text-xs text-slate-900 leading-snug break-words min-w-0">
                              <HighlightText
                                text={p.name}
                                query={searchQuery}
                                variant="purple"
                              />
                            </h5>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                                p.isActive
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-slate-200 text-slate-600'
                              }`}
                            >
                              {p.isActive ? 'نشط' : 'معطل'}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                            <span className="font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded break-all">
                              <HighlightText
                                text={p.sku}
                                query={searchQuery}
                                variant="purple"
                              />
                            </span>
                            <span className="bg-purple-50 text-purple-800 font-bold px-2 py-0.5 rounded-full border border-purple-100">
                              <HighlightText
                                text={category.name}
                                query={searchQuery}
                                variant="purple"
                              />
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2 rounded-xl text-[11px]">
                        <div>
                          <span className="text-[10px] text-slate-400 block">سعر القطاعي</span>
                          <span className="font-black text-slate-900">{p.retailPrice} ج.م</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">المخزون</span>
                          <span
                            className={`inline-block font-bold px-2 py-0.5 rounded-full text-[10px] mt-0.5 ${
                              p.stockQuantity <= p.lowStockAlertAt
                                ? 'bg-red-100 text-red-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {p.stockQuantity} وحدة
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2 border-t border-slate-100">
                        <select
                          value=""
                          disabled={isMovingProducts || otherCategories.length === 0}
                          onChange={(e) => {
                            if (e.target.value) {
                              onMoveSingleProduct(p.id, e.target.value);
                            }
                          }}
                          aria-label={`نقل المنتج ${p.name} إلى قسم آخر`}
                          className="flex-1 min-w-0 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-[11px] font-bold text-slate-700 focus:outline-none focus:border-purple-600 disabled:opacity-50"
                        >
                          <option value="" disabled>
                            {otherCategories.length === 0
                              ? 'لا توجد أقسام أخرى'
                              : 'نقل إلى قسم...'}
                          </option>
                          {otherCategories.map((targetCat) => (
                            <option key={targetCat.id} value={targetCat.id}>
                              {targetCat.name} {!targetCat.isActive ? '(معطل)' : ''}
                            </option>
                          ))}
                        </select>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onEditProduct(p)}
                            aria-label={`تعديل المنتج ${p.name}`}
                            className="flex-1 sm:flex-initial px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-800 rounded-xl text-[11px] font-bold transition-smooth flex items-center justify-center gap-1"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>تعديل</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteProduct(p.id)}
                            aria-label={`حذف المنتج ${p.name}`}
                            className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-[11px] font-bold transition-smooth flex items-center justify-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>حذف</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Small Laptop & Desktop Table (hidden lg:block) */}
              <div className="hidden lg:block rounded-2xl border border-slate-200 bg-white overflow-hidden">
                <ScrollableRow
                  mode="table"
                  variant="purple"
                  hasStickyStart
                  ariaLabel={`جدول منتجات قسم ${category.name}`}
                >
                  <table className="w-full min-w-[860px] text-right text-xs">
                    <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-bold">
                      <tr>
                        <th className="p-2.5 w-12 text-center whitespace-nowrap">تحديد</th>
                        <th className="sticky right-0 z-20 bg-slate-50 p-2.5 min-w-[200px] max-w-[260px] border-l border-slate-200/80 shadow-[-4px_0_10px_-6px_rgba(15,23,42,0.12)]">
                          المنتج والقسم
                        </th>
                        <th className="p-2.5 whitespace-nowrap">الـ SKU</th>
                        <th className="p-2.5 whitespace-nowrap">السعر</th>
                        <th className="p-2.5 whitespace-nowrap">المخزون</th>
                        <th className="p-2.5 whitespace-nowrap">الحالة</th>
                        <th className="p-2.5 whitespace-nowrap">نقل لقسم</th>
                        <th className="p-2.5 text-center whitespace-nowrap">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {displayedProducts.map((p) => {
                        const isSelected = selectedProductIdSet.has(p.id);
                        return (
                          <tr
                            key={p.id}
                            className={`group transition-smooth ${
                              isSelected ? 'bg-purple-50/60' : 'hover:bg-slate-50'
                            }`}
                          >
                            <td className="p-2.5 text-center">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => onToggleSelectProduct(p.id)}
                                aria-label={`تحديد المنتج ${p.name}`}
                                className="w-4 h-4 rounded accent-purple-700 cursor-pointer"
                              />
                            </td>
                            <td
                              className={`sticky right-0 z-20 p-2.5 min-w-[200px] max-w-[260px] border-l border-slate-100 shadow-[-4px_0_10px_-6px_rgba(15,23,42,0.12)] transition-smooth ${
                                isSelected
                                  ? 'bg-purple-50'
                                  : 'bg-white group-hover:bg-slate-50'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                {p.imageUrl ? (
                                  <img
                                    src={getImageUrl(p.imageUrl)}
                                    alt={p.name}
                                    className="w-9 h-9 object-cover rounded-xl border border-slate-200 shrink-0"
                                  />
                                ) : (
                                  <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-sm border border-slate-200 shrink-0">
                                    📦
                                  </div>
                                )}
                                <div className="min-w-0 space-y-0.5">
                                  <div className="font-bold text-slate-900 break-words">
                                    <HighlightText
                                      text={p.name}
                                      query={searchQuery}
                                      variant="purple"
                                    />
                                  </div>
                                  <span className="inline-block text-[10px] bg-purple-50 text-purple-800 font-bold px-2 py-0.5 rounded-full border border-purple-100">
                                    <HighlightText
                                      text={category.name}
                                      query={searchQuery}
                                      variant="purple"
                                    />
                                  </span>
                                </div>
                              </div>
                            </td>
                          <td className="p-2.5 font-mono text-slate-500 whitespace-nowrap">
                            <HighlightText
                              text={p.sku}
                              query={searchQuery}
                              variant="purple"
                            />
                          </td>
                          <td className="p-2.5 whitespace-nowrap">
                            <div className="font-bold text-slate-900">{p.retailPrice} ج.م</div>
                            <div className="text-[10px] text-slate-400">
                              {p.pricingTiers?.length || 0} شريحة جملة
                            </div>
                          </td>
                          <td className="p-2.5 whitespace-nowrap">
                            <span
                              className={`font-bold px-2 py-0.5 rounded-full ${
                                p.stockQuantity <= p.lowStockAlertAt
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {p.stockQuantity} وحدة
                            </span>
                          </td>
                          <td className="p-2.5 whitespace-nowrap">
                            <span
                              className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                                p.isActive
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-slate-200 text-slate-600'
                              }`}
                            >
                              {p.isActive ? 'نشط' : 'معطل'}
                            </span>
                          </td>
                          <td className="p-2.5 whitespace-nowrap">
                            <select
                              value=""
                              disabled={isMovingProducts || otherCategories.length === 0}
                              onChange={(e) => {
                                if (e.target.value) {
                                  onMoveSingleProduct(p.id, e.target.value);
                                }
                              }}
                              aria-label={`نقل المنتج ${p.name} إلى قسم آخر`}
                              className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-[11px] font-bold text-slate-700 focus:outline-none focus:border-purple-600 disabled:opacity-50 max-w-[155px]"
                            >
                              <option value="" disabled>
                                {otherCategories.length === 0
                                  ? 'لا أقسام أخرى'
                                  : 'نقل إلى قسم...'}
                              </option>
                              {otherCategories.map((targetCat) => (
                                <option key={targetCat.id} value={targetCat.id}>
                                  {targetCat.name} {!targetCat.isActive ? '(معطل)' : ''}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="p-2.5 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => onEditProduct(p)}
                                aria-label={`تعديل المنتج ${p.name}`}
                                title="تعديل المنتج"
                                className="p-1.5 text-purple-700 hover:bg-purple-50 rounded-lg transition-smooth"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => onDeleteProduct(p.id)}
                                aria-label={`حذف المنتج ${p.name}`}
                                title="حذف أو أرشفة المنتج"
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-smooth"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </ScrollableRow>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export const AdminView = ({ initialSubTab = 'orders' }) => {
  const [activeSubTab, setActiveSubTab] = useState(initialSubTab); // 'orders' | 'receipts' | 'products' | 'categories' | 'inventory' | 'traders'
  const queryClient = useQueryClient();
  const { refreshNotifications } = useNotifications();
  const { toasts, dismissToast, toast } = useToast();

  const showToast = (message, type = 'info') => {
    if (type === 'success') toast.success(message);
    else if (type === 'error') toast.error(message);
    else if (type === 'warning') toast.warning(message);
    else toast.info(message);
  };

  useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  // ── Queries with React Query ─────────────────────────────────────────────
  const {
    data: orders = [],
    isLoading: isLoadingOrders,
    isFetching: isFetchingOrders,
  } = useQuery({
    queryKey: ['admin', 'orders'],
    queryFn: async () => {
      const res = await api.admin.getOrders();
      return res.success ? res.data || [] : [];
    },
  });

  const {
    data: pendingReceipts = [],
    isLoading: isLoadingReceipts,
    isFetching: isFetchingReceipts,
  } = useQuery({
    queryKey: ['admin', 'receipts'],
    queryFn: async () => {
      const res = await api.admin.getPendingReceipts();
      return res.success ? res.data || [] : [];
    },
  });

  const {
    data: categories = [],
    isLoading: isLoadingCategories,
    isFetching: isFetchingCategories,
  } = useQuery({
    queryKey: ['admin', 'categories'],
    queryFn: async () => {
      const res = await api.admin.getCategories();
      return res.success ? res.data || [] : [];
    },
  });

  const {
    data: products = [],
    isLoading: isLoadingProducts,
    isFetching: isFetchingProducts,
  } = useQuery({
    queryKey: ['admin', 'products'],
    queryFn: async () => {
      const res = await api.admin.getProducts();
      return res.success ? res.data || [] : [];
    },
    staleTime: 10 * 1000, // 10s for stock/price accuracy
  });

  const {
    data: lowStockProducts = [],
    isLoading: isLoadingLowStock,
    isFetching: isFetchingLowStock,
  } = useQuery({
    queryKey: ['admin', 'inventory', 'low-stock'],
    queryFn: async () => {
      const res = await api.admin.getLowStock();
      return res.success ? res.data || [] : [];
    },
    staleTime: 10 * 1000, // 10s for low stock alert accuracy
  });

  const {
    data: pendingTraders = [],
    isLoading: isLoadingTraders,
    isFetching: isFetchingTraders,
  } = useQuery({
    queryKey: ['admin', 'traders'],
    queryFn: async () => {
      const res = await api.admin.getPendingTraders();
      return res.success ? res.data || [] : [];
    },
  });

  const isTabLoading =
    (activeSubTab === 'orders' && isLoadingOrders) ||
    (activeSubTab === 'receipts' && isLoadingReceipts) ||
    (activeSubTab === 'products' && isLoadingProducts) ||
    (activeSubTab === 'categories' && isLoadingCategories) ||
    (activeSubTab === 'inventory' && isLoadingLowStock) ||
    (activeSubTab === 'traders' && isLoadingTraders);

  const isTabFetching =
    (activeSubTab === 'orders' && isFetchingOrders) ||
    (activeSubTab === 'receipts' && isFetchingReceipts) ||
    (activeSubTab === 'products' && isFetchingProducts) ||
    (activeSubTab === 'categories' && isFetchingCategories) ||
    (activeSubTab === 'inventory' && isFetchingLowStock) ||
    (activeSubTab === 'traders' && isFetchingTraders);

  const handleRefreshCurrentTab = () => {
    if (activeSubTab === 'orders') queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
    else if (activeSubTab === 'receipts') queryClient.invalidateQueries({ queryKey: ['admin', 'receipts'] });
    else if (activeSubTab === 'products') {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] });
    } else if (activeSubTab === 'categories') {
      queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
    }
    else if (activeSubTab === 'inventory') queryClient.invalidateQueries({ queryKey: ['admin', 'inventory', 'low-stock'] });
    else if (activeSubTab === 'traders') queryClient.invalidateQueries({ queryKey: ['admin', 'traders'] });
    else if (activeSubTab === 'offers') queryClient.invalidateQueries({ queryKey: ['admin', 'offers'] });
  };

  // Modals & Action States
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [viewingReceipt, setViewingReceipt] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  // Order status modal
  const [statusModalOrder, setStatusModalOrder] = useState(null);
  const [newOrderStatus, setNewOrderStatus] = useState('');
  const [newPaymentStatus, setNewPaymentStatus] = useState('');
  const [isUpdatingOrder, setIsUpdatingOrder] = useState(false);
  const [showDeliveredWarning, setShowDeliveredWarning] = useState(false);

  // Orders Archive Filter States
  const [archivePeriod, setArchivePeriod] = useState('ALL'); // 'ALL' | 'TODAY' | 'YESTERDAY' | 'WEEK' | 'MONTH' | 'CUSTOM'
  const [archiveCustomStart, setArchiveCustomStart] = useState('');
  const [archiveCustomEnd, setArchiveCustomEnd] = useState('');
  const [archiveSearch, setArchiveSearch] = useState('');

  // Tab Search States (Products, Inventory, Categories)
  const {
    value: productSearch,
    debouncedValue: debouncedProductSearch,
    setValue: setProductSearch,
    clear: clearProductSearch,
  } = useDebouncedSearch('', 300);

  const {
    value: inventorySearch,
    debouncedValue: debouncedInventorySearch,
    setValue: setInventorySearch,
    clear: clearInventorySearch,
  } = useDebouncedSearch('', 300);

  const {
    value: categorySearch,
    debouncedValue: debouncedCategorySearch,
    setValue: setCategorySearch,
    clear: clearCategorySearch,
  } = useDebouncedSearch('', 300);

  // Category Workspace states (accordion, cross-category search overrides, selection & modals)
  const [expandedCategoryIds, setExpandedCategoryIds] = useState([]);
  const [searchExpandedOverridesState, setSearchExpandedOverridesState] = useState({
    query: '',
    map: {},
  });
  const [showAllInCategoryState, setShowAllInCategoryState] = useState({
    query: '',
    ids: [],
  });
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [isDeletingCategory, setIsDeletingCategory] = useState(false);
  const [bulkMovePickerState, setBulkMovePickerState] = useState({
    isOpen: false,
    session: 0,
  });
  const [isMovingProducts, setIsMovingProducts] = useState(false);

  const searchExpandedOverrides =
    searchExpandedOverridesState.query === debouncedCategorySearch
      ? searchExpandedOverridesState.map
      : {};
  const showAllInCategoryIds = useMemo(
    () =>
      showAllInCategoryState.query === debouncedCategorySearch
        ? showAllInCategoryState.ids
        : [],
    [showAllInCategoryState, debouncedCategorySearch]
  );

  // Reset tab-scoped search terms when switching tabs
  useEffect(() => {
    if (activeSubTab !== 'products') clearProductSearch();
    if (activeSubTab !== 'inventory') clearInventorySearch();
    if (activeSubTab !== 'categories') clearCategorySearch();
  }, [activeSubTab, clearProductSearch, clearInventorySearch, clearCategorySearch]);

  const filteredProducts = useMemo(() => {
    if (!debouncedProductSearch.trim()) return products;
    return products.filter((p) =>
      matchesArabicFields(
        [p.name, p.sku, p.category?.name || 'عام'],
        debouncedProductSearch
      )
    );
  }, [products, debouncedProductSearch]);

  const filteredLowStockProducts = useMemo(() => {
    if (!debouncedInventorySearch.trim()) return lowStockProducts;
    return lowStockProducts.filter((p) =>
      matchesArabicFields(
        [p.name, p.sku, p.category?.name || 'عام'],
        debouncedInventorySearch
      )
    );
  }, [lowStockProducts, debouncedInventorySearch]);

  const productsByCategoryMap = useMemo(() => {
    const map = new Map();
    for (const p of products) {
      if (!p.categoryId) continue;
      if (!map.has(p.categoryId)) map.set(p.categoryId, []);
      map.get(p.categoryId).push(p);
    }
    return map;
  }, [products]);

  const isCategorySearching = Boolean(debouncedCategorySearch.trim());

  const categoryWorkspaceEntries = useMemo(() => {
    return categories
      .map((cat) => {
        const catProducts = productsByCategoryMap.get(cat.id) || [];
        if (!isCategorySearching) {
          return {
            category: cat,
            allProducts: catProducts,
            displayedProducts: catProducts,
            matchedProductCount: 0,
            categoryMatched: false,
            showingAll: false,
          };
        }

        const categoryMatched = matchesArabicFields([cat.name], debouncedCategorySearch);
        const matchingProducts = catProducts.filter(
          (p) =>
            matchesArabicFields([p.name, p.sku], debouncedCategorySearch) ||
            (!categoryMatched &&
              matchesArabicFields([p.name, p.sku, cat.name], debouncedCategorySearch))
        );

        if (!categoryMatched && matchingProducts.length === 0) {
          return null;
        }

        const showingAll = showAllInCategoryIds.includes(cat.id);
        const displayedProducts =
          showingAll || matchingProducts.length === 0 ? catProducts : matchingProducts;

        return {
          category: cat,
          allProducts: catProducts,
          displayedProducts,
          matchedProductCount: matchingProducts.length,
          categoryMatched,
          showingAll,
        };
      })
      .filter(Boolean);
  }, [
    categories,
    productsByCategoryMap,
    isCategorySearching,
    debouncedCategorySearch,
    showAllInCategoryIds,
  ]);

  const totalMatchedProductsInCategories = useMemo(
    () =>
      categoryWorkspaceEntries.reduce(
        (sum, entry) => sum + entry.matchedProductCount,
        0
      ),
    [categoryWorkspaceEntries]
  );

  const validProductIdSet = useMemo(
    () => new Set(products.map((p) => p.id)),
    [products]
  );

  const activeSelectedProductIds = useMemo(
    () => selectedProductIds.filter((id) => validProductIdSet.has(id)),
    [selectedProductIds, validProductIdSet]
  );

  const selectedProductIdSet = useMemo(
    () => new Set(activeSelectedProductIds),
    [activeSelectedProductIds]
  );

  const selectedSourceCategoryIds = useMemo(() => {
    const sourceSet = new Set();
    for (const p of products) {
      if (selectedProductIdSet.has(p.id) && p.categoryId) {
        sourceSet.add(p.categoryId);
      }
    }
    return sourceSet;
  }, [products, selectedProductIdSet]);

  const pickerExcludedCategoryId =
    selectedSourceCategoryIds.size === 1
      ? Array.from(selectedSourceCategoryIds)[0]
      : null;

  const deleteModalProductCount = useMemo(() => {
    if (!categoryToDelete) return 0;
    if (isLoadingProducts) return categoryToDelete._count?.products || 0;
    return (productsByCategoryMap.get(categoryToDelete.id) || []).length;
  }, [categoryToDelete, isLoadingProducts, productsByCategoryMap]);

  // Product Add / Edit Modal
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productImageFile, setProductImageFile] = useState(null);
  const [productImagePreview, setProductImagePreview] = useState(null);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [productForm, setProductForm] = useState({
    name: '',
    sku: '',
    description: '',
    categoryId: '',
    retailPrice: '',
    minOrderQtyRetail: 1,
    minOrderQtyWholesale: 5,
    stockQuantity: 20,
    lowStockAlertAt: 10,
    isActive: true,
    pricingTiers: [{ minQuantity: 5, maxQuantity: 10, price: '' }],
  });

  // Category Management States
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categoryToEdit, setCategoryToEdit] = useState(null);
  const [editCategoryName, setEditCategoryName] = useState('');
  const [categoryModalError, setCategoryModalError] = useState('');
  const [isCategoryActionLoading, setIsCategoryActionLoading] = useState(false);
  const [isTogglingCategory, setIsTogglingCategory] = useState(false);

  // Confirmation Modal State
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'تأكيد',
    onConfirm: null,
    isDanger: true,
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // ── Category Workspace Handlers & Optimistic Updates ─────────────────────
  const handleToggleCategoryExpand = (categoryId) => {
    if (isCategorySearching) {
      const entry = categoryWorkspaceEntries.find((e) => e.category.id === categoryId);
      const currentExpanded =
        searchExpandedOverrides[categoryId] ?? Boolean(entry?.matchedProductCount > 0);
      setSearchExpandedOverridesState((prev) => {
        const baseMap = prev.query === debouncedCategorySearch ? prev.map : {};
        return {
          query: debouncedCategorySearch,
          map: {
            ...baseMap,
            [categoryId]: !currentExpanded,
          },
        };
      });
      return;
    }

    setExpandedCategoryIds((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleToggleShowAllInCategory = (categoryId) => {
    setShowAllInCategoryState((prev) => {
      const baseIds = prev.query === debouncedCategorySearch ? prev.ids : [];
      const nextIds = baseIds.includes(categoryId)
        ? baseIds.filter((id) => id !== categoryId)
        : [...baseIds, categoryId];
      return {
        query: debouncedCategorySearch,
        ids: nextIds,
      };
    });
  };

  const handleToggleSelectProduct = (productId) => {
    setSelectedProductIds((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const handleToggleSelectCategoryAll = (visibleProductIds, currentlyAllSelected) => {
    if (!visibleProductIds.length) return;
    setSelectedProductIds((prev) => {
      if (currentlyAllSelected) {
        const removeSet = new Set(visibleProductIds);
        return prev.filter((id) => !removeSet.has(id));
      }
      const nextSet = new Set(prev);
      for (const id of visibleProductIds) {
        nextSet.add(id);
      }
      return Array.from(nextSet);
    });
  };

  const handleMoveProducts = async (productIdsToMove, targetCategoryId) => {
    if (!Array.isArray(productIdsToMove) || productIdsToMove.length === 0 || !targetCategoryId) {
      return;
    }

    const targetCategory = categories.find((c) => c.id === targetCategoryId);
    if (!targetCategory) {
      toast.error('القسم المستهدف غير موجود');
      return;
    }

    const moveSet = new Set(productIdsToMove);
    const previousCategories = queryClient.getQueryData(['admin', 'categories']);
    const previousProducts = queryClient.getQueryData(['admin', 'products']);
    const previousSelectedIds = selectedProductIds;

    // Count how many products are actually moving out of each source category
    const currentProducts = Array.isArray(previousProducts) ? previousProducts : products;
    const sourceDeltaMap = new Map();
    let totalActuallyMoving = 0;

    for (const p of currentProducts) {
      if (!moveSet.has(p.id)) continue;
      if (p.categoryId !== targetCategoryId) {
        totalActuallyMoving += 1;
        if (p.categoryId) {
          sourceDeltaMap.set(p.categoryId, (sourceDeltaMap.get(p.categoryId) || 0) + 1);
        }
      }
    }

    if (totalActuallyMoving === 0) {
      toast.info(`المنتجات المحددة موجودة بالفعل في قسم "${targetCategory.name}"`);
      setBulkMovePickerState((prev) => ({ ...prev, isOpen: false }));
      return;
    }

    // Optimistically update product list & category product counts
    if (Array.isArray(previousProducts)) {
      queryClient.setQueryData(
        ['admin', 'products'],
        previousProducts.map((p) =>
          moveSet.has(p.id)
            ? {
                ...p,
                categoryId: targetCategoryId,
                category: {
                  id: targetCategory.id,
                  name: targetCategory.name,
                  isActive: targetCategory.isActive,
                  displayOrder: targetCategory.displayOrder,
                },
              }
            : p
        )
      );
    }

    if (Array.isArray(previousCategories)) {
      queryClient.setQueryData(
        ['admin', 'categories'],
        previousCategories.map((c) => {
          const subtracted = sourceDeltaMap.get(c.id) || 0;
          const added = c.id === targetCategoryId ? totalActuallyMoving : 0;
          const net = added - subtracted;
          if (net === 0) return c;
          return {
            ...c,
            _count: {
              ...c._count,
              products: Math.max(0, (c._count?.products || 0) + net),
            },
          };
        })
      );
    }

    setSelectedProductIds((prev) => prev.filter((id) => !moveSet.has(id)));
    setBulkMovePickerState((prev) => ({ ...prev, isOpen: false }));
    setIsMovingProducts(true);

    try {
      const res = await api.admin.moveProducts({
        productIds: Array.from(moveSet),
        targetCategoryId,
      });

      toast.success(
        res.message || `تم نقل المنتجات إلى قسم "${targetCategory.name}" بنجاح`
      );
      queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'inventory', 'low-stock'] });
      queryClient.invalidateQueries({ queryKey: ['owner'] });
    } catch (err) {
      // Rollback optimistic caches & selection state on failure
      if (previousCategories !== undefined) {
        queryClient.setQueryData(['admin', 'categories'], previousCategories);
      }
      if (previousProducts !== undefined) {
        queryClient.setQueryData(['admin', 'products'], previousProducts);
      }
      setSelectedProductIds(previousSelectedIds);
      toast.error(err.message || 'فشل نقل المنتجات، تم التراجع عن التغييرات');
    } finally {
      setIsMovingProducts(false);
    }
  };

  const handleCategoryDragEnd = async (event) => {
    if (isCategorySearching) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = categories.findIndex((c) => c.id === active.id);
    const newIndex = categories.findIndex((c) => c.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const previousCategories = categories;
    const newCategories = arrayMove(categories, oldIndex, newIndex).map((cat, idx) => ({
      ...cat,
      displayOrder: idx,
    }));

    queryClient.setQueryData(['admin', 'categories'], newCategories);

    try {
      await api.admin.reorderCategories(
        newCategories.map((cat, idx) => ({
          id: cat.id,
          displayOrder: idx,
        }))
      );
      toast.success('تم تحديث ترتيب الأقسام بنجاح');
      queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    } catch (err) {
      queryClient.setQueryData(['admin', 'categories'], previousCategories);
      toast.error(err.message || 'فشل حفظ الترتيب الجديد للأقسام');
      queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] });
    }
  };

  const handleAddCategory = async (e) => {
    e?.preventDefault();
    if (!newCategoryName.trim()) {
      setCategoryModalError('اسم القسم مطلوب');
      return;
    }
    setIsCategoryActionLoading(true);
    setCategoryModalError('');
    try {
      const res = await api.admin.createCategory({ name: newCategoryName.trim() });
      if (res.success) {
        setShowAddCategoryModal(false);
        setNewCategoryName('');
        toast.success(res.message || 'تم إضافة القسم بنجاح');
        queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] });
        queryClient.invalidateQueries({ queryKey: ['categories'] });
      } else {
        setCategoryModalError(res.message || 'فشل إضافة القسم');
      }
    } catch (err) {
      setCategoryModalError(err.message || 'حدث خطأ أثناء إضافة القسم');
    } finally {
      setIsCategoryActionLoading(false);
    }
  };

  const openEditCategoryModal = (cat) => {
    setCategoryToEdit(cat);
    setEditCategoryName(cat.name);
    setCategoryModalError('');
  };

  const handleUpdateCategory = async (e) => {
    e?.preventDefault();
    if (!editCategoryName.trim()) {
      setCategoryModalError('اسم القسم لا يمكن أن يكون فارغاً');
      return;
    }
    setIsCategoryActionLoading(true);
    setCategoryModalError('');
    try {
      const res = await api.admin.updateCategory(categoryToEdit.id, {
        name: editCategoryName.trim(),
      });
      if (res.success) {
        setCategoryToEdit(null);
        setEditCategoryName('');
        toast.success(res.message || 'تم تحديث بيانات القسم بنجاح');
        queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] });
        queryClient.invalidateQueries({ queryKey: ['categories'] });
        queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      } else {
        setCategoryModalError(res.message || 'فشل تحديث القسم');
      }
    } catch (err) {
      setCategoryModalError(err.message || 'حدث خطأ أثناء تحديث القسم');
    } finally {
      setIsCategoryActionLoading(false);
    }
  };

  const handleToggleCategoryActive = async (category) => {
    const updatedStatus = !category.isActive;
    setIsTogglingCategory(true);
    try {
      const res = await api.admin.updateCategory(category.id, { isActive: updatedStatus });
      if (res.success) {
        toast.success(
          updatedStatus
            ? `تم تفعيل القسم "${category.name}" في المتجر`
            : `تم تعطيل القسم "${category.name}" في المتجر`
        );
        queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] });
        queryClient.invalidateQueries({ queryKey: ['categories'] });
      } else {
        toast.error(res.message || 'فشل تحديث حالة القسم');
      }
    } catch (err) {
      toast.error(err.message || 'حدث خطأ أثناء تحديث حالة القسم');
    } finally {
      setIsTogglingCategory(false);
    }
  };

  const handleDeleteCategory = (category) => {
    setCategoryToDelete(category);
  };

  const handleConfirmDeleteCategory = async (confirmName) => {
    if (!categoryToDelete || isDeletingCategory) return;
    const targetCategory = categoryToDelete;
    const removedProductIds = new Set(
      (productsByCategoryMap.get(targetCategory.id) || []).map((p) => p.id)
    );

    setIsDeletingCategory(true);
    try {
      const payload = deleteModalProductCount > 0 ? { confirmName } : undefined;
      const res = await api.admin.deleteCategory(targetCategory.id, payload);

      setCategoryToDelete(null);
      setExpandedCategoryIds((prev) => prev.filter((id) => id !== targetCategory.id));
      setSelectedProductIds((prev) => prev.filter((id) => !removedProductIds.has(id)));

      toast.success(res.message || `تم حذف القسم "${targetCategory.name}" بنجاح`);
      queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'inventory', 'low-stock'] });
      queryClient.invalidateQueries({ queryKey: ['owner'] });
    } catch (err) {
      toast.error(err.message || 'فشل حذف القسم');
    } finally {
      setIsDeletingCategory(false);
    }
  };

  // ── Receipt Actions with Invalidation ──────────────────────────────────────
  const handleVerifyReceipt = async (orderId, action, reason = '') => {
    try {
      await api.admin.verifyReceipt(orderId, action, reason);
      setShowRejectModal(false);
      setSelectedReceipt(null);
      setRejectReason('');
      queryClient.invalidateQueries({ queryKey: ['admin', 'receipts'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
      queryClient.invalidateQueries({ queryKey: ['my-orders'] });
      refreshNotifications();
    } catch (err) {
      alert(err.message || 'فشلت معالجة الإيصال');
    }
  };

  // ── Trader Actions with Invalidation ───────────────────────────────────────
  const handleApproveTrader = async (userId) => {
    try {
      await api.admin.approveTrader(userId);
      queryClient.invalidateQueries({ queryKey: ['admin', 'traders'] });
      refreshNotifications();
    } catch (err) {
      alert(err.message || 'فشل قبول التاجر');
    }
  };

  const handleRejectTrader = async (userId) => {
    const reason = prompt('أدخل سبب رفض اعتماد حساب التاجر:');
    if (reason === null) return;
    try {
      await api.admin.rejectTrader(userId, reason);
      queryClient.invalidateQueries({ queryKey: ['admin', 'traders'] });
      refreshNotifications();
    } catch (err) {
      alert(err.message || 'فشل رفض التاجر');
    }
  };

  // ── Order Status & Payment Status Update with Invalidation ─────────────────
  const executeUpdateOrderStatus = async () => {
    if (!statusModalOrder) return;
    setIsUpdatingOrder(true);
    try {
      const orderStatusChanged = newOrderStatus && newOrderStatus !== statusModalOrder.status;
      const paymentStatusChanged = newPaymentStatus && newPaymentStatus !== statusModalOrder.paymentStatus;

      const promises = [];
      if (orderStatusChanged) {
        promises.push(api.admin.updateOrderStatus(statusModalOrder.id, newOrderStatus));
      }
      if (paymentStatusChanged) {
        promises.push(api.admin.updatePaymentStatus(statusModalOrder.id, newPaymentStatus));
      }

      if (promises.length > 0) {
        await Promise.all(promises);
      }

      setStatusModalOrder(null);
      setShowDeliveredWarning(false);
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
      queryClient.invalidateQueries({ queryKey: ['my-orders'] });
      refreshNotifications();
    } catch (err) {
      alert(err.message || 'فشل تحديث بيانات الطلب');
    } finally {
      setIsUpdatingOrder(false);
    }
  };

  const handleUpdateOrderStatus = async () => {
    if (!statusModalOrder) return;

    const orderStatusChanged = newOrderStatus && newOrderStatus !== statusModalOrder.status;
    const paymentStatusChanged = newPaymentStatus && newPaymentStatus !== statusModalOrder.paymentStatus;

    if (!orderStatusChanged && !paymentStatusChanged) {
      setStatusModalOrder(null);
      return;
    }

    const isMarkingDelivered = newOrderStatus === 'DELIVERED';
    const isPaymentStillPending = newPaymentStatus === 'PENDING';
    const isNonCod = statusModalOrder.paymentMethod !== 'CASH_ON_DELIVERY';

    if (isMarkingDelivered && isPaymentStillPending && isNonCod) {
      setShowDeliveredWarning(true);
      return;
    }

    await executeUpdateOrderStatus();
  };

  const handleMarkPaymentStatus = async (orderId, paymentStatus = 'PAID') => {
    try {
      await api.admin.updatePaymentStatus(orderId, paymentStatus);
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
      queryClient.invalidateQueries({ queryKey: ['my-orders'] });
      if (statusModalOrder && statusModalOrder.id === orderId) {
        setStatusModalOrder((prev) => ({ ...prev, paymentStatus }));
        setNewPaymentStatus(paymentStatus);
      }
      refreshNotifications();
    } catch (err) {
      alert(err.message || 'فشل تحديث حالة الدفع');
    }
  };

  // ── Product CRUD & Form Handlers with Invalidation ─────────────────────────
  const validateProductForm = () => {
    const errors = {};
    if (!productForm.name || !productForm.name.trim()) {
      errors.name = 'اسم المنتج مطلوب ولا يمكن تركه فارغاً';
    }
    if (!productForm.sku || !productForm.sku.trim()) {
      errors.sku = 'كود الـ SKU مطلوب';
    }
    if (!productForm.categoryId) {
      errors.categoryId = 'يرجى اختيار القسم التابع له المنتج';
    }
    if (
      productForm.retailPrice === '' ||
      productForm.retailPrice === null ||
      isNaN(productForm.retailPrice) ||
      parseFloat(productForm.retailPrice) <= 0
    ) {
      errors.retailPrice = 'يرجى تحديد سعر قطاعي صالح أكبر من صفر';
    }
    return errors;
  };

  const updateFormField = (field, value) => {
    setProductForm((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleImageSelect = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('الملف المحدد ليس صورة صالحة. يرجى اختيار ملف صورة.');
      return;
    }
    setProductImageFile(file);
    setProductImagePreview(URL.createObjectURL(file));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingImage(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingImage(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingImage(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageSelect(e.dataTransfer.files[0]);
    }
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    const errors = validateProductForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});
    setIsSavingProduct(true);
    try {
      let savedProduct;
      if (editingProduct) {
        const res = await api.admin.updateProduct(editingProduct.id, productForm);
        savedProduct = res.data;
      } else {
        const res = await api.admin.createProduct(productForm);
        savedProduct = res.data;
      }

      if (productImageFile && savedProduct?.id) {
        const formData = new FormData();
        formData.append('image', productImageFile);
        await api.admin.uploadProductImage(savedProduct.id, formData);
      }

      const targetCatId = savedProduct?.categoryId || productForm.categoryId;
      if (targetCatId && activeSubTab === 'categories') {
        setExpandedCategoryIds((prev) =>
          prev.includes(targetCatId) ? prev : [...prev, targetCatId]
        );
      }

      setShowProductModal(false);
      setEditingProduct(null);
      setProductImageFile(null);
      setProductImagePreview(null);
      setFormErrors({});
      toast.success(
        editingProduct ? 'تم تحديث بيانات المنتج بنجاح' : 'تم إضافة المنتج بنجاح'
      );
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'inventory', 'low-stock'] });
      queryClient.invalidateQueries({ queryKey: ['owner'] });
    } catch (err) {
      toast.error(err.message || 'فشل حفظ المنتج');
    } finally {
      setIsSavingProduct(false);
    }
  };

  const handleDeleteProduct = (id) => {
    setDeleteConfirmation({
      isOpen: true,
      title: 'تعطيل / حذف المنتج',
      message: 'هل أنت متأكد من رغبتك في حذف أو تعطيل هذا المنتج من المتجر؟',
      confirmText: 'نعم، متابعة الإجراء',
      isDanger: true,
      onConfirm: async () => {
        try {
          const res = await api.admin.deleteProduct(id);
          setSelectedProductIds((prev) => prev.filter((itemId) => itemId !== id));
          toast.success(res.message || 'تم تنفيذ الإجراء بنجاح');
          queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
          queryClient.invalidateQueries({ queryKey: ['products'] });
          queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] });
          queryClient.invalidateQueries({ queryKey: ['categories'] });
          queryClient.invalidateQueries({ queryKey: ['admin', 'inventory', 'low-stock'] });
          queryClient.invalidateQueries({ queryKey: ['owner'] });
        } catch (err) {
          toast.error(err.message || 'فشل حذف المنتج');
        } finally {
          setDeleteConfirmation((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const openAddProductModal = (preselectedCategoryId = null) => {
    const resolvedCategoryId =
      typeof preselectedCategoryId === 'string' && preselectedCategoryId.trim()
        ? preselectedCategoryId.trim()
        : categories?.[0]?.id || '';
    setEditingProduct(null);
    setProductImageFile(null);
    setProductImagePreview(null);
    setFormErrors({});
    setProductForm({
      name: '',
      sku: `SKU-${Date.now().toString().slice(-5)}`,
      description: '',
      categoryId: resolvedCategoryId,
      retailPrice: '',
      minOrderQtyRetail: 1,
      minOrderQtyWholesale: 5,
      stockQuantity: 50,
      lowStockAlertAt: 10,
      isActive: true,
      pricingTiers: [
        { minQuantity: 5, maxQuantity: 10, price: '' },
        { minQuantity: 11, maxQuantity: null, price: '' },
      ],
    });
    setShowProductModal(true);
  };

  const openEditProductModal = (prod) => {
    setEditingProduct(prod);
    setProductImageFile(null);
    setProductImagePreview(prod.imageUrl ? getImageUrl(prod.imageUrl) : null);
    setFormErrors({});
    setProductForm({
      name: prod.name,
      sku: prod.sku,
      description: prod.description || '',
      categoryId: prod.categoryId,
      retailPrice: prod.retailPrice,
      minOrderQtyRetail: prod.minOrderQtyRetail,
      minOrderQtyWholesale: prod.minOrderQtyWholesale,
      stockQuantity: prod.stockQuantity,
      lowStockAlertAt: prod.lowStockAlertAt,
      isActive: prod.isActive,
      pricingTiers: prod.pricingTiers?.map((t) => ({
        minQuantity: t.minQuantity,
        maxQuantity: t.maxQuantity,
        price: t.price,
      })) || [],
    });
    setShowProductModal(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in">
      {/* Admin Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            لوحة تحكم إدارة النظام (Admin Dashboard)
            <span className="text-xs bg-purple-100 text-purple-800 px-2.5 py-0.5 rounded-full border border-purple-200">
              إدارة العمليات والمخزون
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            متابعة وتحديث الطلبات، تدقيق التحويلات البنكية، إدارة المنتجات ونواقص المخزن
          </p>
        </div>

        <button
          onClick={handleRefreshCurrentTab}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-smooth self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isTabFetching ? 'animate-spin' : ''}`} />
          <span>تحديث البيانات</span>
        </button>
      </div>

      {/* Sub-Tabs Nav */}
      <div className="liquid-glass-bar liquid-glass-bar--purple p-1.5 sm:p-2 rounded-[20px] relative z-10 shadow-sm border border-purple-200/60">
        <ScrollableRow
          mode="tabs"
          variant="purple"
          activeKey={activeSubTab}
          ariaLabel="أقسام لوحة تحكم الأدمن"
          className="gap-1.5 px-1 py-1"
        >
          <button
            type="button"
            data-scroll-item="orders"
            data-tab-active={activeSubTab === 'orders' ? 'true' : 'false'}
            aria-selected={activeSubTab === 'orders'}
            onClick={() => { setActiveSubTab('orders'); setSelectedProductIds([]); }}
            className={`shrink-0 px-3.5 py-2.5 min-h-[40px] rounded-xl text-xs font-bold transition-smooth flex items-center gap-2 whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 ${
              activeSubTab === 'orders'
                ? 'bg-purple-700 text-white shadow-sm shadow-purple-700/30'
                : 'text-slate-600 hover:bg-white/60 hover:text-purple-900'
            }`}
          >
            <Layers className="w-4 h-4 shrink-0" />
            <span>الطلبات النشطة</span>
            {orders.filter((o) => o.status !== 'DELIVERED' && o.status !== 'CANCELLED').length > 0 && (
              <span className="bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                {orders.filter((o) => o.status !== 'DELIVERED' && o.status !== 'CANCELLED').length}
              </span>
            )}
          </button>

          <button
            type="button"
            data-scroll-item="orders-archive"
            data-tab-active={activeSubTab === 'orders-archive' ? 'true' : 'false'}
            aria-selected={activeSubTab === 'orders-archive'}
            onClick={() => { setActiveSubTab('orders-archive'); setSelectedProductIds([]); }}
            className={`shrink-0 px-3.5 py-2.5 min-h-[40px] rounded-xl text-xs font-bold transition-smooth flex items-center gap-2 whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 ${
              activeSubTab === 'orders-archive'
                ? 'bg-purple-700 text-white shadow-sm shadow-purple-700/30'
                : 'text-slate-600 hover:bg-white/60 hover:text-purple-900'
            }`}
          >
            <Archive className="w-4 h-4 shrink-0" />
            <span>أرشيف الطلبات المكتملة</span>
            {orders.filter((o) => o.status === 'DELIVERED' || o.status === 'CANCELLED').length > 0 && (
              <span className="bg-emerald-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                {orders.filter((o) => o.status === 'DELIVERED' || o.status === 'CANCELLED').length}
              </span>
            )}
          </button>

          <button
            type="button"
            data-scroll-item="receipts"
            data-tab-active={activeSubTab === 'receipts' ? 'true' : 'false'}
            aria-selected={activeSubTab === 'receipts'}
            onClick={() => { setActiveSubTab('receipts'); setSelectedProductIds([]); }}
            className={`shrink-0 px-3.5 py-2.5 min-h-[40px] rounded-xl text-xs font-bold transition-smooth flex items-center gap-2 whitespace-nowrap relative focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 ${
              activeSubTab === 'receipts'
                ? 'bg-purple-700 text-white shadow-sm shadow-purple-700/30'
                : 'text-slate-600 hover:bg-white/60 hover:text-purple-900'
            }`}
          >
            <Building2 className="w-4 h-4 shrink-0" />
            <span>إيصالات التحويل البنكي المعلقة</span>
            {pendingReceipts.length > 0 && (
              <span className="bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                {pendingReceipts.length}
              </span>
            )}
          </button>

          <button
            type="button"
            data-scroll-item="products"
            data-tab-active={activeSubTab === 'products' ? 'true' : 'false'}
            aria-selected={activeSubTab === 'products'}
            onClick={() => { setActiveSubTab('products'); setSelectedProductIds([]); }}
            className={`shrink-0 px-3.5 py-2.5 min-h-[40px] rounded-xl text-xs font-bold transition-smooth flex items-center gap-2 whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 ${
              activeSubTab === 'products'
                ? 'bg-purple-700 text-white shadow-sm shadow-purple-700/30'
                : 'text-slate-600 hover:bg-white/60 hover:text-purple-900'
            }`}
          >
            <Package className="w-4 h-4 shrink-0" />
            <span>المنتجات والفئات السعرية</span>
          </button>

          <button
            type="button"
            data-scroll-item="categories"
            data-tab-active={activeSubTab === 'categories' ? 'true' : 'false'}
            aria-selected={activeSubTab === 'categories'}
            onClick={() => setActiveSubTab('categories')}
            className={`shrink-0 px-3.5 py-2.5 min-h-[40px] rounded-xl text-xs font-bold transition-smooth flex items-center gap-2 whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 ${
              activeSubTab === 'categories'
                ? 'bg-purple-700 text-white shadow-sm shadow-purple-700/30'
                : 'text-slate-600 hover:bg-white/60 hover:text-purple-900'
            }`}
          >
            <FolderTree className="w-4 h-4 shrink-0" />
            <span>إدارة الأقسام</span>
            {categories.length > 0 && (
              <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                {categories.length}
              </span>
            )}
          </button>

          <button
            type="button"
            data-scroll-item="inventory"
            data-tab-active={activeSubTab === 'inventory' ? 'true' : 'false'}
            aria-selected={activeSubTab === 'inventory'}
            onClick={() => { setActiveSubTab('inventory'); setSelectedProductIds([]); }}
            className={`shrink-0 px-3.5 py-2.5 min-h-[40px] rounded-xl text-xs font-bold transition-smooth flex items-center gap-2 whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 ${
              activeSubTab === 'inventory'
                ? 'bg-purple-700 text-white shadow-sm shadow-purple-700/30'
                : 'text-slate-600 hover:bg-white/60 hover:text-purple-900'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
            <span>نواقص المخزون</span>
            {lowStockProducts.length > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                {lowStockProducts.length}
              </span>
            )}
          </button>

          <button
            type="button"
            data-scroll-item="traders"
            data-tab-active={activeSubTab === 'traders' ? 'true' : 'false'}
            aria-selected={activeSubTab === 'traders'}
            onClick={() => { setActiveSubTab('traders'); setSelectedProductIds([]); }}
            className={`shrink-0 px-3.5 py-2.5 min-h-[40px] rounded-xl text-xs font-bold transition-smooth flex items-center gap-2 whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 ${
              activeSubTab === 'traders'
                ? 'bg-purple-700 text-white shadow-sm shadow-purple-700/30'
                : 'text-slate-600 hover:bg-white/60 hover:text-purple-900'
            }`}
          >
            <UserCheck className="w-4 h-4 shrink-0" />
            <span>طلبات اعتماد التجار</span>
            {pendingTraders.length > 0 && (
              <span className="bg-emerald-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                {pendingTraders.length}
              </span>
            )}
          </button>

          <button
            type="button"
            data-scroll-item="offers"
            data-tab-active={activeSubTab === 'offers' ? 'true' : 'false'}
            aria-selected={activeSubTab === 'offers'}
            onClick={() => { setActiveSubTab('offers'); setSelectedProductIds([]); }}
            className={`shrink-0 px-3.5 py-2.5 min-h-[40px] rounded-xl text-xs font-bold transition-smooth flex items-center gap-2 whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 ${
              activeSubTab === 'offers'
                ? 'bg-purple-700 text-white shadow-sm shadow-purple-700/30'
                : 'text-slate-600 hover:bg-white/60 hover:text-purple-900'
            }`}
          >
            <Flame className="w-4 h-4 shrink-0 text-orange-500" />
            <span>العروض والخصومات</span>
          </button>
        </ScrollableRow>
      </div>

      {/* ── SUB-TAB 1: ACTIVE ORDERS MANAGEMENT ───────────────────────────── */}
      {activeSubTab === 'orders' && (() => {
        const activeOrdersList = orders.filter((o) => o.status !== 'DELIVERED' && o.status !== 'CANCELLED');
        return (
          <div className="glass-card rounded-3xl border border-slate-200 overflow-hidden space-y-4">
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-purple-600" />
                  <span>الطلبات النشطة والجارية ({activeOrdersList.length})</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  الطلبات التي تتطلب إجراءات عمل (قيد المراجعة، قيد التجهيز، أو جاري الشحن). تنتقل الطلبات تلقائياً إلى الأرشيف عند اكتمال التسليم.
                </p>
              </div>
              <button
                onClick={() => { setActiveSubTab('orders-archive'); setSelectedProductIds([]); }}
                className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl text-xs font-bold transition-smooth border border-purple-200"
              >
                <Archive className="w-3.5 h-3.5" />
                <span>فتح أرشيف المكتملة</span>
              </button>
            </div>

            {isLoadingOrders ? (
              <div className="p-10 text-center text-slate-400 font-bold">
                <RefreshCw className="w-7 h-7 mx-auto mb-2 text-purple-600 animate-spin" />
                <div>جاري تحميل الطلبات النشطة...</div>
              </div>
            ) : activeOrdersList.length === 0 ? (
              <div className="p-8 sm:p-12 text-center">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center mx-auto mb-3 shadow-2xs">
                  <CheckCircle className="w-8 h-8 text-emerald-600" />
                </div>
                <div className="text-sm sm:text-base font-extrabold text-slate-800">لا توجد طلبات نشطة معلقة حالياً!</div>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  كل الطلبات تم إنجازها وتسليمها أو نقلها تلقائياً إلى أرشيف الطلبات المكتملة.
                </p>
                <button
                  onClick={() => { setActiveSubTab('orders-archive'); setSelectedProductIds([]); }}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl text-xs font-extrabold transition-smooth border border-purple-200 shadow-2xs active:scale-95"
                >
                  <Archive className="w-4 h-4" />
                  <span>تصفح أرشيف الطلبات المكتملة</span>
                </button>
              </div>
            ) : (
              <>
                {/* Mobile Cards View (md:hidden) */}
                <div className="md:hidden divide-y divide-slate-100 p-3 space-y-3">
                  {activeOrdersList.map((o) => (
                    <div
                      key={o.id}
                      className="p-3.5 bg-white/90 rounded-2xl border border-slate-200/80 shadow-xs space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-extrabold text-sm text-slate-900">
                          #{o.orderNumber}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {new Date(o.createdAt).toLocaleDateString('ar-EG')}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2 text-xs">
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-slate-800 truncate">{o.user?.name || 'عميل'}</div>
                          <div className="text-[11px] text-slate-400 font-mono break-all">{o.user?.phone || o.user?.email}</div>
                        </div>
                        <div className="text-left font-black text-emerald-700 text-sm shrink-0 whitespace-nowrap">
                          {o.totalAmount} ج.م
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
                        <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-semibold text-slate-700">
                          {o.orderType === 'WHOLESALE' ? 'جملة' : 'قطاعي'}
                        </span>

                        {o.paymentMethod === 'CASH_ON_DELIVERY' ? (
                          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-md text-[10px] font-extrabold">
                            <Banknote className="w-3 h-3 text-emerald-600" />
                            <span>دفع عند الاستلام</span>
                          </span>
                        ) : o.paymentMethod === 'BANK_TRANSFER' ? (
                          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-md text-[10px] font-bold">
                            <Building2 className="w-3 h-3 text-amber-600" />
                            <span>تحويل بنكي</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded-md text-[10px] font-bold">
                            <CreditCard className="w-3 h-3 text-blue-600" />
                            <span>أونلاين</span>
                          </span>
                        )}

                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            o.status === 'DELIVERED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : o.status === 'CANCELLED'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {o.status}
                        </span>

                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            o.paymentStatus === 'PAID'
                              ? 'bg-emerald-100 text-emerald-800'
                              : o.paymentStatus === 'FAILED'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {o.paymentStatus === 'PAID'
                            ? 'مدفوع'
                            : o.paymentStatus === 'FAILED'
                            ? 'فشل'
                            : 'معلق'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                        {o.paymentMethod === 'CASH_ON_DELIVERY' && o.paymentStatus !== 'PAID' && (
                          <button
                            onClick={() => handleMarkPaymentStatus(o.id, 'PAID')}
                            className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-smooth flex items-center justify-center gap-1 shadow-2xs"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>تحصيل نقدي</span>
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setStatusModalOrder(o);
                            setNewOrderStatus(o.status);
                            setNewPaymentStatus(o.paymentStatus);
                            setShowDeliveredWarning(false);
                          }}
                          className="flex-1 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded-xl text-xs font-bold transition-smooth text-center"
                        >
                          تعديل الحالة
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table View (hidden md:block) */}
                <div className="hidden md:block">
                  <ScrollableRow
                    mode="table"
                    variant="purple"
                    hasStickyStart
                    ariaLabel="جدول الطلبات النشطة"
                  >
                    <table className="w-full min-w-[880px] text-right text-xs">
                      <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-bold">
                        <tr>
                          <th className="sticky right-0 z-20 bg-slate-50 p-3 whitespace-nowrap border-l border-slate-200/80 shadow-[-4px_0_10px_-6px_rgba(15,23,42,0.12)]">
                            رقم الطلب
                          </th>
                          <th className="p-3 whitespace-nowrap">العميل</th>
                          <th className="p-3 whitespace-nowrap">النوع</th>
                          <th className="p-3 whitespace-nowrap">طريقة الدفع</th>
                          <th className="p-3 whitespace-nowrap">حالة الطلب</th>
                          <th className="p-3 whitespace-nowrap">حالة الدفع</th>
                          <th className="p-3 whitespace-nowrap">الإجمالي</th>
                          <th className="p-3 whitespace-nowrap">التاريخ</th>
                          <th className="p-3 text-center whitespace-nowrap">إجراء</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {activeOrdersList.map((o) => (
                          <tr key={o.id} className="group hover:bg-slate-50/80 transition-smooth">
                            <td className="sticky right-0 z-20 bg-white group-hover:bg-slate-50 p-3 font-mono font-bold text-slate-900 whitespace-nowrap border-l border-slate-100 shadow-[-4px_0_10px_-6px_rgba(15,23,42,0.12)] transition-smooth">
                              #{o.orderNumber}
                            </td>
                            <td className="p-3 min-w-[160px]">
                              <div className="font-bold text-slate-800">{o.user?.name}</div>
                              <div className="text-[10px] text-slate-400 break-all">{o.user?.email}</div>
                            </td>
                            <td className="p-3 whitespace-nowrap">
                              <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-semibold text-slate-700">
                                {o.orderType === 'WHOLESALE' ? 'جملة' : 'قطاعي'}
                              </span>
                            </td>
                            <td className="p-3 whitespace-nowrap">
                              {o.paymentMethod === 'CASH_ON_DELIVERY' ? (
                                <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-300 px-2.5 py-1 rounded-full text-[11px] font-extrabold shadow-2xs">
                                  <Banknote className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                  <span>دفع عند الاستلام</span>
                                </span>
                              ) : o.paymentMethod === 'BANK_TRANSFER' ? (
                                <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-md text-[11px] font-bold">
                                  <Building2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                  <span>تحويل بنكي</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded-md text-[11px] font-bold">
                                  <CreditCard className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                  <span>أونلاين</span>
                                </span>
                              )}
                            </td>
                            <td className="p-3 whitespace-nowrap">
                              <span
                                className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                  o.status === 'DELIVERED'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : o.status === 'CANCELLED'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {o.status}
                              </span>
                            </td>
                            <td className="p-3 whitespace-nowrap">
                              <span
                                className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                  o.paymentStatus === 'PAID'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : o.paymentStatus === 'FAILED'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {o.paymentStatus === 'PAID'
                                  ? 'مدفوع (PAID)'
                                  : o.paymentStatus === 'FAILED'
                                  ? 'فشل (FAILED)'
                                  : 'معلق (PENDING)'}
                              </span>
                            </td>
                            <td className="p-3 font-black text-emerald-700 whitespace-nowrap">{o.totalAmount} ج.م</td>
                            <td className="p-3 text-slate-500 text-[11px] whitespace-nowrap">
                              {new Date(o.createdAt).toLocaleDateString('ar-EG')}
                            </td>
                            <td className="p-3 text-center whitespace-nowrap">
                              <div className="flex items-center justify-center gap-1.5 flex-wrap">
                                {o.paymentMethod === 'CASH_ON_DELIVERY' && o.paymentStatus !== 'PAID' && (
                                  <button
                                    onClick={() => handleMarkPaymentStatus(o.id, 'PAID')}
                                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-smooth flex items-center gap-1 shadow-2xs"
                                    title="تأكيد تحصيل المبلغ نقداً واعتماد الدفع كـ PAID"
                                  >
                                    <CheckCircle className="w-3.5 h-3.5" />
                                    <span>تحصيل نقدي</span>
                                  </button>
                                )}
                                <button
                                  onClick={() => {
                                    setStatusModalOrder(o);
                                    setNewOrderStatus(o.status);
                                    setNewPaymentStatus(o.paymentStatus);
                                    setShowDeliveredWarning(false);
                                  }}
                                  className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded-lg text-xs font-bold transition-smooth"
                                >
                                  تعديل الحالة
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </ScrollableRow>
                </div>
              </>
            )}
          </div>
        );
      })()}

      {/* ── SUB-TAB 1.5: COMPLETED ORDERS ARCHIVE ───────────────────────────── */}
      {activeSubTab === 'orders-archive' && (() => {
        const completedRaw = orders.filter((o) => o.status === 'DELIVERED' || o.status === 'CANCELLED');

        // Apply Time and Search Filters
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfYesterday = new Date(startOfToday);
        startOfYesterday.setDate(startOfYesterday.getDate() - 1);
        const endOfYesterday = new Date(startOfToday.getTime() - 1);

        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        const filteredArchive = completedRaw.filter((o) => {
          const orderDate = new Date(o.updatedAt || o.createdAt);

          // Period Filter
          if (archivePeriod === 'TODAY' && orderDate < startOfToday) return false;
          if (archivePeriod === 'YESTERDAY' && (orderDate < startOfYesterday || orderDate > endOfYesterday)) return false;
          if (archivePeriod === 'WEEK' && orderDate < oneWeekAgo) return false;
          if (archivePeriod === 'MONTH' && orderDate < oneMonthAgo) return false;
          if (archivePeriod === 'CUSTOM') {
            if (archiveCustomStart && orderDate < new Date(archiveCustomStart)) return false;
            if (archiveCustomEnd) {
              const endLimit = new Date(archiveCustomEnd);
              endLimit.setHours(23, 59, 59, 999);
              if (orderDate > endLimit) return false;
            }
          }

          // Search Filter
          if (archiveSearch.trim()) {
            const q = archiveSearch.toLowerCase();
            const num = (o.orderNumber || '').toLowerCase();
            const name = (o.user?.name || '').toLowerCase();
            const email = (o.user?.email || '').toLowerCase();
            const phone = (o.user?.phone || '').toLowerCase();
            if (!num.includes(q) && !name.includes(q) && !email.includes(q) && !phone.includes(q)) {
              return false;
            }
          }

          return true;
        });

        // Totals of filtered archive
        const deliveredTotalRevenue = filteredArchive
          .filter((o) => o.status === 'DELIVERED')
          .reduce((sum, o) => sum + parseFloat(o.totalAmount || 0), 0);

        return (
          <div className="space-y-4">
            {/* Archive Header & Filters Bar */}
            <div className="glass-card p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                    <Archive className="w-5 h-5 text-emerald-600" />
                    <span>أرشيف الطلبات المكتملة والمنتهية</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      {filteredArchive.length} طلب
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    سجل شامل لجميع الطلبات المسلّمة والملغاة مع تواريخ الإتمام الدقيقة وإمكانية البحث والفرز الزمني.
                  </p>
                </div>

                {/* Quick Summary Badge */}
                <div className="flex items-center gap-3 bg-emerald-50/80 border border-emerald-200 px-4 py-2 rounded-2xl">
                  <div>
                    <div className="text-[10px] text-emerald-700 font-bold">إجمالي مبيعات الأرشيف المعروض</div>
                    <div className="text-sm font-black text-emerald-900">
                      {deliveredTotalRevenue.toLocaleString('ar-EG', { minimumFractionDigits: 2 })} ج.م
                    </div>
                  </div>
                </div>
              </div>

              {/* Filters Controls */}
              <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-600 flex items-center gap-1 ml-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  الفترة الزمنية:
                </span>

                {[
                  { id: 'ALL', label: 'الكل' },
                  { id: 'TODAY', label: 'اليوم' },
                  { id: 'YESTERDAY', label: 'الأمس' },
                  { id: 'WEEK', label: 'آخر 7 أيام' },
                  { id: 'MONTH', label: 'آخر 30 يوم' },
                  { id: 'CUSTOM', label: 'تاريخ مخصص' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setArchivePeriod(tab.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-smooth ${
                      archivePeriod === tab.id
                        ? 'bg-purple-700 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}

                {/* Search Box */}
                <div className="w-full sm:w-auto sm:flex-1 sm:min-w-[200px] relative sm:mr-auto">
                  <input
                    type="text"
                    placeholder="بحث برقم الطلب، العميل، الهاتف..."
                    value={archiveSearch}
                    onChange={(e) => setArchiveSearch(e.target.value)}
                    className="w-full pl-3 pr-8 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
                </div>
              </div>

              {/* Custom Date Inputs (if CUSTOM selected) */}
              {archivePeriod === 'CUSTOM' && (
                <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 pt-2 bg-purple-50/50 p-3 rounded-2xl border border-purple-100 text-xs">
                  <span className="font-bold text-purple-900">من تاريخ:</span>
                  <input
                    type="date"
                    value={archiveCustomStart}
                    onChange={(e) => setArchiveCustomStart(e.target.value)}
                    className="px-2.5 py-1 bg-white border border-purple-200 rounded-lg outline-none max-w-full"
                  />
                  <span className="font-bold text-purple-900">إلى تاريخ:</span>
                  <input
                    type="date"
                    value={archiveCustomEnd}
                    onChange={(e) => setArchiveCustomEnd(e.target.value)}
                    className="px-2.5 py-1 bg-white border border-purple-200 rounded-lg outline-none max-w-full"
                  />
                </div>
              )}
            </div>

            {/* Archive Table / Cards */}
            <div className="glass-card rounded-3xl border border-slate-200 overflow-hidden">
              {isLoadingOrders ? (
                <div className="p-10 text-center text-slate-400 font-bold">
                  <RefreshCw className="w-7 h-7 mx-auto mb-2 text-purple-600 animate-spin" />
                  <div>جاري تحميل الأرشيف...</div>
                </div>
              ) : filteredArchive.length === 0 ? (
                <div className="p-8 sm:p-12 text-center text-slate-400 font-bold">
                  <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto mb-3 shadow-2xs">
                    <Archive className="w-8 h-8 text-slate-400" />
                  </div>
                  <div className="text-sm font-extrabold text-slate-700">لا توجد طلبات مطابقة للفترة المحددة في الأرشيف</div>
                  <p className="text-xs text-slate-400 mt-1">جرب تغيير فلتر الفترة الزمنية أو البحث برقم آخر.</p>
                </div>
              ) : (
                <>
                  {/* Mobile Cards View (md:hidden) */}
                  <div className="md:hidden divide-y divide-slate-100 p-3 space-y-3">
                    {filteredArchive.map((o) => (
                      <div
                        key={o.id}
                        className="p-3.5 bg-white/90 rounded-2xl border border-slate-200/80 shadow-xs space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-extrabold text-sm text-slate-900">
                            #{o.orderNumber}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {new Date(o.updatedAt || o.createdAt).toLocaleDateString('ar-EG')}
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-2 text-xs">
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-slate-800 truncate">{o.user?.name || 'عميل'}</div>
                            <div className="text-[11px] text-slate-400 font-mono break-all">{o.user?.phone || o.user?.email}</div>
                          </div>
                          <div className="text-left font-black text-emerald-700 text-sm shrink-0 whitespace-nowrap">
                            {o.totalAmount} ج.م
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
                          <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-semibold text-slate-700">
                            {o.orderType === 'WHOLESALE' ? 'جملة' : 'قطاعي'}
                          </span>

                          {o.paymentMethod === 'CASH_ON_DELIVERY' ? (
                            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-md text-[10px] font-extrabold">
                              <Banknote className="w-3 h-3 text-emerald-600" />
                              <span>دفع استلام</span>
                            </span>
                          ) : o.paymentMethod === 'BANK_TRANSFER' ? (
                            <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-md text-[10px] font-bold">
                              <Building2 className="w-3 h-3 text-amber-600" />
                              <span>تحويل بنكي</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded-md text-[10px] font-bold">
                              <CreditCard className="w-3 h-3 text-blue-600" />
                              <span>أونلاين</span>
                            </span>
                          )}

                          <span
                            className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                              o.status === 'DELIVERED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {o.status === 'DELIVERED' ? 'تم التسليم بنجاح' : 'ملغي'}
                          </span>

                          <span
                            className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                              o.paymentStatus === 'PAID'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {o.paymentStatus === 'PAID' ? 'مدفوع' : 'معلق'}
                          </span>
                        </div>

                        <div className="pt-1 border-t border-slate-100">
                          <button
                            onClick={() => {
                              setStatusModalOrder(o);
                              setNewOrderStatus(o.status);
                              setNewPaymentStatus(o.paymentStatus);
                              setShowDeliveredWarning(false);
                            }}
                            className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-smooth text-center"
                          >
                            مراجعة / تعديل
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop Table View (hidden md:block) */}
                  <div className="hidden md:block">
                    <ScrollableRow
                      mode="table"
                      variant="purple"
                      hasStickyStart
                      ariaLabel="جدول أرشيف الطلبات المكتملة"
                    >
                      <table className="w-full min-w-[920px] text-right text-xs">
                        <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-bold">
                          <tr>
                            <th className="sticky right-0 z-20 bg-slate-50 p-3 whitespace-nowrap border-l border-slate-200/80 shadow-[-4px_0_10px_-6px_rgba(15,23,42,0.12)]">
                              رقم الطلب
                            </th>
                            <th className="p-3 whitespace-nowrap">العميل</th>
                            <th className="p-3 whitespace-nowrap">النوع</th>
                            <th className="p-3 whitespace-nowrap">طريقة الدفع</th>
                            <th className="p-3 whitespace-nowrap">الحالة النهائية</th>
                            <th className="p-3 whitespace-nowrap">حالة الدفع</th>
                            <th className="p-3 whitespace-nowrap">الإجمالي</th>
                            <th className="p-3 whitespace-nowrap">تاريخ الإتمام والتسليم</th>
                            <th className="p-3 text-center whitespace-nowrap">تفاصيل / إجراء</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredArchive.map((o) => (
                            <tr key={o.id} className="group hover:bg-slate-50/80 transition-smooth">
                              <td className="sticky right-0 z-20 bg-white group-hover:bg-slate-50 p-3 font-mono font-bold text-slate-900 whitespace-nowrap border-l border-slate-100 shadow-[-4px_0_10px_-6px_rgba(15,23,42,0.12)] transition-smooth">
                                #{o.orderNumber}
                              </td>
                              <td className="p-3 min-w-[160px]">
                                <div className="font-bold text-slate-800">{o.user?.name}</div>
                                <div className="text-[10px] text-slate-400 break-all">{o.user?.phone || o.user?.email}</div>
                              </td>
                              <td className="p-3 whitespace-nowrap">
                                <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-semibold text-slate-700">
                                  {o.orderType === 'WHOLESALE' ? 'جملة' : 'قطاعي'}
                                </span>
                              </td>
                              <td className="p-3 whitespace-nowrap">
                                {o.paymentMethod === 'CASH_ON_DELIVERY' ? (
                                  <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-[11px]">
                                    <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>دفع استلام</span>
                                  </span>
                                ) : o.paymentMethod === 'BANK_TRANSFER' ? (
                                  <span className="inline-flex items-center gap-1 text-amber-700 font-bold text-[11px]">
                                    <Building2 className="w-3.5 h-3.5 text-amber-600" />
                                    <span>تحويل بنكي</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-blue-700 font-bold text-[11px]">
                                    <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                                    <span>أونلاين</span>
                                  </span>
                                )}
                              </td>
                              <td className="p-3 whitespace-nowrap">
                                <span
                                  className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                    o.status === 'DELIVERED'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-red-100 text-red-800'
                                  }`}
                                >
                                  {o.status === 'DELIVERED' ? 'تم التسليم بنجاح' : 'ملغي'}
                                </span>
                              </td>
                              <td className="p-3 whitespace-nowrap">
                                <span
                                  className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                    o.paymentStatus === 'PAID'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-amber-100 text-amber-800'
                                  }`}
                                >
                                  {o.paymentStatus === 'PAID' ? 'مدفوع' : 'معلق'}
                                </span>
                              </td>
                              <td className="p-3 font-black text-emerald-700 whitespace-nowrap">{o.totalAmount} ج.م</td>
                              <td className="p-3 text-slate-600 text-[11px] whitespace-nowrap">
                                <div className="font-bold">
                                  {new Date(o.updatedAt || o.createdAt).toLocaleDateString('ar-EG')}
                                </div>
                                <div className="text-[10px] text-slate-400">
                                  {new Date(o.updatedAt || o.createdAt).toLocaleTimeString('ar-EG', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </div>
                              </td>
                              <td className="p-3 text-center whitespace-nowrap">
                                <button
                                  onClick={() => {
                                    setStatusModalOrder(o);
                                    setNewOrderStatus(o.status);
                                    setNewPaymentStatus(o.paymentStatus);
                                    setShowDeliveredWarning(false);
                                  }}
                                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-smooth"
                                >
                                  مراجعة / تعديل
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </ScrollableRow>
                  </div>
                </>
              )}
            </div>
          </div>
        );
      })()}

      {/* ── SUB-TAB 2: BANK RECEIPTS REVIEW ────────────────────────────────── */}
      {activeSubTab === 'receipts' && (
        <div className="space-y-4">
          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-amber-600 shrink-0" />
            <span>
              قائمة الطلبات التي اختار أصحابها الدفع بالتحويل البنكي وقاموا برفع صور الإيصالات بانتظار
              مراجعتك واعتمادها.
            </span>
          </div>

          {pendingReceipts.length === 0 ? (
            <div className="py-16 text-center glass-card rounded-3xl p-6 text-slate-400">
              <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
              <h4 className="font-bold text-slate-700">لا توجد إيصالات معلقة بانتظار المراجعة حالياً</h4>
              <p className="text-xs text-slate-400 mt-0.5">تم تدقيق واعتماد كافة الإيصالات المرفوعة بنجاح</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingReceipts.map((order) => (
                <div
                  key={order.id}
                  className="glass-card rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-xs font-mono font-bold text-slate-900">
                          #{order.orderNumber}
                        </span>
                        <h4 className="text-sm font-extrabold text-slate-800 mt-0.5">
                          العميل: {order.user?.name}
                        </h4>
                        <p className="text-xs text-slate-500">هاتف: {order.user?.phone || 'غير مسجل'}</p>
                      </div>
                      <div className="text-left">
                        <span className="text-xs text-slate-400">قيمة الطلب:</span>
                        <div className="text-base font-black text-emerald-700">
                          {order.totalAmount} ج.م
                        </div>
                      </div>
                    </div>

                    {/* Receipt Image Thumbnail & Zoom */}
                    <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                      <img
                        src={getImageUrl(order.receiptImageUrl)}
                        alt="إيصال"
                        className="w-20 h-20 object-cover rounded-xl border border-slate-200 shadow-sm cursor-pointer hover:opacity-80 transition-smooth"
                        onClick={() => setViewingReceipt(order)}
                        title="انقر لتكبير الإيصال"
                      />
                      <div className="space-y-1 text-xs">
                        <span className="font-bold text-slate-800">صورة الإيصال المرفقة:</span>
                        <p className="text-[11px] text-slate-500">
                          تحقق من رقم العملية وتطابق المبلغ مع الإجمالي.
                        </p>
                        <button
                          type="button"
                          onClick={() => setViewingReceipt(order)}
                          className="text-emerald-700 hover:underline font-bold text-xs flex items-center gap-1 mt-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>تكبير وفحص الإيصال</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => handleVerifyReceipt(order.id, 'APPROVE')}
                      className="flex-1 min-w-[160px] py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-smooth flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <Check className="w-4 h-4 shrink-0" />
                      <span>اعتماد الإيصال وتأكيد الدفع</span>
                    </button>
                    <button
                      onClick={() => {
                        setSelectedReceipt(order);
                        setShowRejectModal(true);
                      }}
                      className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-bold transition-smooth flex items-center justify-center gap-1.5"
                    >
                      <X className="w-4 h-4 shrink-0" />
                      <span>رفض الإيصال</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── SUB-TAB 3: PRODUCTS & TIERS ────────────────────────────────────── */}
      {activeSubTab === 'products' && (() => {
        const hasProductQuery = Boolean(debouncedProductSearch.trim());
        return (
          <div className="space-y-4">
            {/* Header & Search */}
            <div className="glass-card rounded-3xl border border-slate-200 p-4 sm:p-5 shadow-sm space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2 min-w-0">
                  <Package className="w-5 h-5 text-purple-700 shrink-0" />
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                    كتالوج المنتجات والشرائح
                  </h3>
                  <span className="text-xs bg-purple-100 text-purple-800 font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap">
                    {hasProductQuery
                      ? `${filteredProducts.length} من ${products.length} منتج`
                      : `${products.length} منتج`}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => openAddProductModal()}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-smooth shadow-sm shrink-0 w-full sm:w-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة منتج جديد</span>
                </button>
              </div>

              <SearchInput
                value={productSearch}
                onChange={setProductSearch}
                onClear={clearProductSearch}
                placeholder="ابحث باسم المنتج، كود الـ SKU، أو اسم القسم..."
                ariaLabel="البحث في المنتجات والفئات السعرية"
                accent="purple"
              />
            </div>

            <div className="glass-card rounded-3xl border border-slate-200 overflow-hidden">
              {isLoadingProducts ? (
                <ScrollableRow
                  mode="table"
                  variant="purple"
                  ariaLabel="جدول تحميل المنتجات"
                >
                  <table className="w-full min-w-[900px] text-right text-xs">
                    <tbody className="divide-y divide-slate-100">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <TableRowSkeleton key={i} columns={9} />
                      ))}
                    </tbody>
                  </table>
                </ScrollableRow>
              ) : products.length === 0 ? (
                <div className="py-16 px-4 text-center text-slate-400 space-y-2">
                  <Package className="w-12 h-12 text-slate-300 mx-auto" />
                  <h4 className="font-bold text-slate-700 text-sm">لا توجد منتجات مسجلة حالياً</h4>
                  <p className="text-xs text-slate-400">ابدأ بإضافة أول منتج إلى الكتالوج</p>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="py-16 px-4 text-center space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center mx-auto text-purple-600">
                    <Search className="w-7 h-7" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-sm text-slate-800">
                      لا توجد منتجات مطابقة لـ &ldquo;{debouncedProductSearch.trim()}&rdquo;
                    </h4>
                    <p className="text-xs text-slate-400">
                      جرب البحث باسم منتج آخر، أو كود SKU، أو اسم القسم
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={clearProductSearch}
                    className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold transition-smooth inline-flex items-center gap-1.5"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>مسح البحث</span>
                  </button>
                </div>
              ) : (
                <>
                  {/* Mobile & iPad Portrait Cards (lg:hidden) */}
                  <div className="lg:hidden grid grid-cols-1 md:grid-cols-2 gap-3 p-3 sm:p-4">
                    {filteredProducts.map((p) => (
                      <div
                        key={p.id}
                        className="p-3.5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-3 min-w-0"
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          {p.imageUrl ? (
                            <img
                              src={getImageUrl(p.imageUrl)}
                              alt={p.name}
                              className="w-12 h-12 object-cover rounded-xl border border-slate-200 shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 text-lg border border-slate-200 shrink-0">
                              📦
                            </div>
                          )}

                          <div className="flex-1 min-w-0 space-y-1">
                            <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 leading-snug break-words flex flex-wrap items-center gap-1.5">
                              <HighlightText
                                text={p.name}
                                query={debouncedProductSearch}
                                variant="purple"
                              />
                              {!p.isActive && (
                                <span className="text-[10px] bg-slate-200 text-slate-600 font-bold px-2 py-0.5 rounded-full">
                                  معطل
                                </span>
                              )}
                            </h4>
                            <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                              <span className="font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md break-all">
                                <HighlightText
                                  text={p.sku}
                                  query={debouncedProductSearch}
                                  variant="purple"
                                />
                              </span>
                              <span className="bg-purple-50 text-purple-800 font-bold px-2 py-0.5 rounded-full border border-purple-100">
                                <HighlightText
                                  text={p.category?.name || 'عام'}
                                  query={debouncedProductSearch}
                                  variant="purple"
                                />
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl text-xs">
                          <div>
                            <span className="text-[10px] text-slate-400 block">سعر القطاعي</span>
                            <span className="font-black text-slate-900">{p.retailPrice} ج.م</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block">المخزون الحالي</span>
                            <span
                              className={`inline-block font-bold px-2 py-0.5 rounded-full text-[11px] mt-0.5 ${
                                p.stockQuantity <= p.lowStockAlertAt
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {p.stockQuantity} وحدة
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block">حد التنبيه</span>
                            <span className="font-bold text-slate-700">{p.lowStockAlertAt} وحدة</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block">شرائح الجملة</span>
                            <span className="font-bold text-slate-700">{p.pricingTiers?.length || 0} شريحة</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => openEditProductModal(p)}
                            className="flex-1 py-2 bg-purple-50 hover:bg-purple-100 text-purple-800 rounded-xl text-xs font-bold transition-smooth flex items-center justify-center gap-1.5"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>تعديل</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(p.id)}
                            className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold transition-smooth flex items-center justify-center gap-1"
                            title="حذف/تعطيل"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>حذف</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop & Small Laptop Table (hidden lg:block) */}
                  <div className="hidden lg:block">
                    <ScrollableRow
                      mode="table"
                      variant="purple"
                      hasStickyStart
                      ariaLabel="جدول كتالوج المنتجات والفئات السعرية"
                    >
                      <table className="w-full min-w-[1080px] text-right text-xs">
                        <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-bold">
                          <tr>
                            <th className="p-3 w-16 whitespace-nowrap">الصورة</th>
                            <th className="sticky right-0 z-20 bg-slate-50 p-3 min-w-[190px] max-w-[260px] border-l border-slate-200/80 shadow-[-4px_0_10px_-6px_rgba(15,23,42,0.12)]">
                              المنتج
                            </th>
                            <th className="p-3 whitespace-nowrap">الـ SKU</th>
                            <th className="p-3 whitespace-nowrap">القسم</th>
                            <th className="p-3 whitespace-nowrap">سعر القطاعي</th>
                            <th className="p-3 whitespace-nowrap">المخزون الحالي</th>
                            <th className="p-3 whitespace-nowrap">حد التنبيه</th>
                            <th className="p-3 whitespace-nowrap">شرائح الجملة</th>
                            <th className="p-3 text-center whitespace-nowrap">إجراءات</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredProducts.map((p) => (
                            <tr key={p.id} className="group hover:bg-slate-50 transition-smooth">
                              <td className="p-3 w-16">
                                {p.imageUrl ? (
                                  <img
                                    src={getImageUrl(p.imageUrl)}
                                    alt={p.name}
                                    className="w-10 h-10 object-cover rounded-xl border border-slate-200 shadow-sm shrink-0"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 text-base border border-slate-200 shrink-0">
                                    📦
                                  </div>
                                )}
                              </td>
                              <td className="sticky right-0 z-20 bg-white group-hover:bg-slate-50 transition-smooth p-3 font-bold text-slate-900 min-w-[190px] max-w-[260px] border-l border-slate-100 shadow-[-4px_0_10px_-6px_rgba(15,23,42,0.12)]">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <HighlightText
                                    text={p.name}
                                    query={debouncedProductSearch}
                                    variant="purple"
                                  />
                                  {!p.isActive && (
                                    <span className="text-[10px] bg-slate-200 text-slate-600 font-bold px-2 py-0.5 rounded-full">
                                      معطل
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="p-3 font-mono text-slate-500 whitespace-nowrap">
                                <HighlightText
                                  text={p.sku}
                                  query={debouncedProductSearch}
                                  variant="purple"
                                />
                              </td>
                              <td className="p-3 text-slate-700 whitespace-nowrap">
                                <HighlightText
                                  text={p.category?.name || 'عام'}
                                  query={debouncedProductSearch}
                                  variant="purple"
                                />
                              </td>
                              <td className="p-3 font-bold text-slate-900 whitespace-nowrap">{p.retailPrice} ج.م</td>
                              <td className="p-3 whitespace-nowrap">
                                <span
                                  className={`font-bold px-2 py-0.5 rounded-full ${
                                    p.stockQuantity <= p.lowStockAlertAt
                                      ? 'bg-red-100 text-red-800'
                                      : 'bg-emerald-100 text-emerald-800'
                                  }`}
                                >
                                  {p.stockQuantity} وحدة
                                </span>
                              </td>
                              <td className="p-3 text-slate-500 whitespace-nowrap">{p.lowStockAlertAt} وحدة</td>
                              <td className="p-3 text-slate-600 whitespace-nowrap">
                                {p.pricingTiers?.length || 0} شريحة مسجلة
                              </td>
                              <td className="p-3 text-center whitespace-nowrap">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    onClick={() => openEditProductModal(p)}
                                    aria-label={`تعديل المنتج ${p.name}`}
                                    className="p-1.5 text-purple-700 hover:bg-purple-50 rounded-lg"
                                    title="تعديل المنتج"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteProduct(p.id)}
                                    aria-label={`حذف أو تعطيل المنتج ${p.name}`}
                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                                    title="حذف/تعطيل"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </ScrollableRow>
                  </div>
                </>
              )}
            </div>
          </div>
        );
      })()}

      {/* ── SUB-TAB 4: INVENTORY LOW STOCK ALERTS ──────────────────────────── */}
      {activeSubTab === 'inventory' && (() => {
        const hasInventoryQuery = Boolean(debouncedInventorySearch.trim());
        return (
          <div className="space-y-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
              <span>
                نظام التنبيهات الذكي: هذه المنتجات وصلت أو قاربت على النفاد بالمستودعات. يُرجى إعادة التوريد
                فوراً لتفادي تعطيل طلبات التجار.
              </span>
            </div>

            {lowStockProducts.length > 0 && (
              <div className="glass-card rounded-3xl border border-slate-200 p-4 sm:p-5 shadow-sm space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-sm text-slate-900">البحث في نواقص المخزون</h3>
                    <span className="text-xs bg-red-100 text-red-800 font-bold px-2.5 py-0.5 rounded-full">
                      {hasInventoryQuery
                        ? `${filteredLowStockProducts.length} من ${lowStockProducts.length} منتج`
                        : `${lowStockProducts.length} منتج`}
                    </span>
                  </div>
                </div>
                <SearchInput
                  value={inventorySearch}
                  onChange={setInventorySearch}
                  onClear={clearInventorySearch}
                  placeholder="ابحث في النواقص باسم المنتج، كود الـ SKU، أو القسم..."
                  ariaLabel="البحث في نواقص المخزون"
                  accent="purple"
                  size="sm"
                />
              </div>
            )}

            {isLoadingLowStock ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="glass-card rounded-3xl border border-slate-200 p-5 h-44 animate-pulse bg-slate-100/70" />
                ))}
              </div>
            ) : lowStockProducts.length === 0 ? (
              <div className="py-16 text-center glass-card rounded-3xl p-6 text-slate-400">
                <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
                <h4 className="font-bold text-slate-700">المخزون في المستويات الآمنة بالكامل</h4>
                <p className="text-xs text-slate-400 mt-0.5">لا توجد منتجات منخفضة المخزون حالياً</p>
              </div>
            ) : filteredLowStockProducts.length === 0 ? (
              <div className="py-14 px-4 text-center glass-card rounded-3xl border border-slate-200 space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center mx-auto text-purple-600">
                  <Search className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-extrabold text-sm text-slate-800">
                    لا توجد نواقص مطابقة لـ &ldquo;{debouncedInventorySearch.trim()}&rdquo;
                  </h4>
                  <p className="text-xs text-slate-400">جرب البحث باسم منتج آخر أو كود SKU</p>
                </div>
                <button
                  type="button"
                  onClick={clearInventorySearch}
                  className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold transition-smooth inline-flex items-center gap-1.5"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>مسح البحث</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredLowStockProducts.map((p) => (
                  <div
                    key={p.id}
                    className="glass-card rounded-3xl border border-red-200 p-5 shadow-sm space-y-3 min-w-0"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-sm text-slate-900 break-words">
                          <HighlightText
                            text={p.name}
                            query={debouncedInventorySearch}
                            variant="purple"
                          />
                        </h4>
                        <p className="text-xs text-slate-400 font-mono truncate">
                          كود:{' '}
                          <HighlightText
                            text={p.sku}
                            query={debouncedInventorySearch}
                            variant="purple"
                          />
                        </p>
                      </div>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${
                          p.stockQuantity <= 0
                            ? 'bg-red-600 text-white'
                            : 'bg-amber-500 text-white'
                        }`}
                      >
                        {p.stockQuantity <= 0 ? 'نفد المخزون' : `متبقي ${p.stockQuantity}`}
                      </span>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl text-xs space-y-1 text-slate-600">
                      <div className="flex justify-between gap-2">
                        <span>حد التنبيه المعين:</span>
                        <span className="font-bold text-slate-800">{p.lowStockAlertAt} وحدة</span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span>القسم:</span>
                        <span className="font-semibold text-slate-800 truncate">
                          <HighlightText
                            text={p.category?.name || 'عام'}
                            query={debouncedInventorySearch}
                            variant="purple"
                          />
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => openEditProductModal(p)}
                      className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-smooth"
                    >
                      تزويد كمية المخزن الآن
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })()}

      {/* ── SUB-TAB 5: PENDING TRADERS ─────────────────────────────────────── */}
      {activeSubTab === 'traders' && (
        <div className="space-y-4">
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>
              طلبات التجار الجدد: راجع السجل التجاري والبطاقة الضريبية للموافقة على تحويل حسابهم إلى تاجر
              جملة معتمد.
            </span>
          </div>

          {pendingTraders.length === 0 ? (
            <div className="py-16 text-center glass-card rounded-3xl p-6 text-slate-400">
              <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
              <h4 className="font-bold text-slate-700">لا توجد طلبات تجار معلقة حالياً</h4>
              <p className="text-xs text-slate-400 mt-0.5">تمت معالجة كافة طلبات الانضمام بنجاح</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingTraders.map((trader) => (
                <div
                  key={trader.id}
                  className="glass-card rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <h4 className="font-extrabold text-sm text-slate-900 break-words">{trader.name}</h4>
                        <p className="text-xs text-slate-500 break-all">{trader.email}</p>
                      </div>
                      <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full border border-amber-300 shrink-0">
                        قيد المراجعة
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1.5 text-slate-700">
                      <div className="flex justify-between gap-2">
                        <span className="text-slate-400 shrink-0">اسم المؤسسة:</span>
                        <span className="font-bold text-left break-words min-w-0">{trader.businessName || 'غير مدخل'}</span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-slate-400 shrink-0">السجل الضريبي:</span>
                        <span className="font-mono font-bold text-left break-all min-w-0">{trader.taxId || 'غير مدخل'}</span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-slate-400 shrink-0">الهاتف:</span>
                        <span className="font-mono text-left break-all min-w-0">{trader.phone || 'غير مسجل'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => handleApproveTrader(trader.id)}
                      className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-smooth flex items-center justify-center gap-1.5"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>الموافقة واعتماد التاجر</span>
                    </button>
                    <button
                      onClick={() => handleRejectTrader(trader.id)}
                      className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl text-xs font-bold transition-smooth flex items-center gap-1.5 border border-red-200"
                    >
                      <UserX className="w-4 h-4" />
                      <span>رفض</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── SUB-TAB 6: CATEGORIES WORKSPACE ─────────────────────────────────── */}
      {activeSubTab === 'categories' && (
        <div
          className={`space-y-4 animate-fade-in ${
            activeSelectedProductIds.length > 0 ? 'pb-24' : ''
          }`}
        >
          {/* Header Card */}
          <div className="glass-card rounded-3xl border border-slate-200 p-4 sm:p-5 shadow-sm space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <FolderTree className="w-5 h-5 text-purple-700 shrink-0" />
                  <h3 className="font-extrabold text-base text-slate-900">
                    إدارة الأقسام وتصنيفات المتجر
                  </h3>
                  <span className="text-xs bg-purple-100 text-purple-800 font-bold px-2.5 py-0.5 rounded-full">
                    {isCategorySearching
                      ? `${categoryWorkspaceEntries.length} من ${categories.length} أقسام`
                      : `${categories.length} أقسام`}
                  </span>
                  {isCategorySearching && totalMatchedProductsInCategories > 0 && (
                    <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full">
                      {totalMatchedProductsInCategories} منتج مطابق
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  انقر على أي قسم لعرض وإدارة منتجاته، نقل المنتجات فردياً أو جماعياً، إعادة الترتيب بالسحب والإفلات، أو البحث في جميع الأقسام والمنتجات دفعة واحدة.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setNewCategoryName('');
                  setCategoryModalError('');
                  setShowAddCategoryModal(true);
                }}
                aria-label="إضافة قسم جديد للمتجر"
                className="px-4 py-2.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold transition-smooth flex items-center justify-center gap-2 shadow-sm shrink-0 w-full md:w-auto"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة قسم جديد</span>
              </button>
            </div>

            {/* Unified Category + Product Search */}
            <div className="pt-3 border-t border-slate-100">
              <SearchInput
                value={categorySearch}
                onChange={setCategorySearch}
                onClear={clearCategorySearch}
                placeholder="ابحث باسم القسم، اسم المنتج، أو كود الـ SKU عبر جميع الأقسام..."
                ariaLabel="البحث في الأقسام والمنتجات"
                accent="purple"
              />
            </div>
          </div>

          {/* Drag & Drop Notice / Search Mode Notice */}
          {isCategorySearching ? (
            <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-2xl text-xs text-amber-900 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Search className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  تم إيقاف إعادة الترتيب بالسحب مؤقتاً أثناء البحث، وتُفتح الأقسام التي تحتوي على منتجات مطابقة تلقائياً.
                </span>
              </div>
              <button
                type="button"
                onClick={clearCategorySearch}
                className="text-xs font-extrabold text-amber-900 underline hover:text-amber-700 shrink-0"
              >
                إنهاء البحث
              </button>
            </div>
          ) : (
            <div className="p-3 bg-purple-50/70 border border-purple-200/80 rounded-2xl text-xs text-purple-900 flex items-center gap-2">
              <GripVertical className="w-4 h-4 text-purple-600 shrink-0" />
              <span>
                💡 <strong>طريقة العمل:</strong> اسحب أي قسم من أيقونة المقبض (⋮⋮) لتغيير ترتيبه بالمتجر، أو انقر على اسم القسم لفتح مساحة إدارة منتجاته.
              </span>
            </div>
          )}

          {/* Categories List */}
          {isLoadingCategories ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="glass-card p-4 rounded-2xl border border-slate-200 animate-pulse h-16 bg-slate-100/70"
                />
              ))}
            </div>
          ) : categories.length === 0 ? (
            <div className="py-16 text-center glass-card rounded-3xl p-6 text-slate-400 border border-slate-200">
              <FolderTree className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <h4 className="font-bold text-slate-700">لا توجد أقسام مسجلة حالياً</h4>
              <p className="text-xs text-slate-400 mt-1 mb-4">
                ابدأ بإضافة أول قسم لتصنيف المنتجات في متجرك
              </p>
              <button
                type="button"
                onClick={() => {
                  setNewCategoryName('');
                  setCategoryModalError('');
                  setShowAddCategoryModal(true);
                }}
                className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold transition-smooth inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة قسم الآن</span>
              </button>
            </div>
          ) : categoryWorkspaceEntries.length === 0 ? (
            <div className="py-16 px-4 text-center glass-card rounded-3xl border border-slate-200 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center mx-auto text-purple-600">
                <Search className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h4 className="font-extrabold text-sm text-slate-800">
                  لا توجد أقسام أو منتجات مطابقة لـ &ldquo;{debouncedCategorySearch.trim()}&rdquo;
                </h4>
                <p className="text-xs text-slate-400">
                  جرب البحث باسم قسم آخر، اسم منتج، أو كود SKU
                </p>
              </div>
              <button
                type="button"
                onClick={clearCategorySearch}
                className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold transition-smooth inline-flex items-center gap-1.5"
              >
                <X className="w-3.5 h-3.5" />
                <span>مسح البحث</span>
              </button>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleCategoryDragEnd}
            >
              <SortableContext
                items={categoryWorkspaceEntries.map((entry) => entry.category.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2.5">
                  {categoryWorkspaceEntries.map((entry, index) => {
                    const {
                      category,
                      allProducts,
                      displayedProducts,
                      matchedProductCount,
                      categoryMatched,
                      showingAll,
                    } = entry;

                    const isExpanded = isCategorySearching
                      ? (searchExpandedOverrides[category.id] ?? matchedProductCount > 0)
                      : expandedCategoryIds.includes(category.id);

                    const totalCount = isLoadingProducts
                      ? category._count?.products || 0
                      : allProducts.length;

                    const otherCategories = categories.filter(
                      (c) => c.id !== category.id
                    );

                    return (
                      <SortableCategoryItem
                        key={category.id}
                        category={category}
                        index={index}
                        totalProductsInCategory={totalCount}
                        displayedProducts={displayedProducts}
                        matchedProductCount={matchedProductCount}
                        isExpanded={isExpanded}
                        isSearching={isCategorySearching}
                        searchQuery={debouncedCategorySearch}
                        categoryMatched={categoryMatched}
                        showingAllInCategory={showingAll}
                        isProductsLoading={isLoadingProducts}
                        isDragDisabled={isCategorySearching}
                        isToggling={isTogglingCategory}
                        isMovingProducts={isMovingProducts}
                        otherCategories={otherCategories}
                        selectedProductIdSet={selectedProductIdSet}
                        onToggleExpand={handleToggleCategoryExpand}
                        onToggleShowAllInCategory={handleToggleShowAllInCategory}
                        onEdit={openEditCategoryModal}
                        onDelete={handleDeleteCategory}
                        onToggleActive={handleToggleCategoryActive}
                        onAddProductInCategory={openAddProductModal}
                        onEditProduct={openEditProductModal}
                        onDeleteProduct={handleDeleteProduct}
                        onMoveSingleProduct={(productId, targetCatId) =>
                          handleMoveProducts([productId], targetCatId)
                        }
                        onToggleSelectProduct={handleToggleSelectProduct}
                        onToggleSelectCategoryAll={handleToggleSelectCategoryAll}
                      />
                    );
                  })}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      )}

      {/* ── SUB-TAB 7: OFFERS & DISCOUNTS MANAGEMENT ────────────────────────── */}
      {activeSubTab === 'offers' && (
        <OffersManagementPanel showToast={showToast} />
      )}

      {/* ── MODAL: ADD CATEGORY ────────────────────────────────────────────── */}
      <Modal
        isOpen={showAddCategoryModal}
        onClose={() => setShowAddCategoryModal(false)}
        className="max-w-sm"
      >
        <div className="bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4 text-right">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <FolderTree className="w-4 h-4 text-purple-700" />
              <h3 className="font-bold text-sm text-slate-900">إضافة قسم جديد</h3>
            </div>
            <button
              onClick={() => setShowAddCategoryModal(false)}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleAddCategory} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                اسم القسم <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                autoFocus
                placeholder="مثال: أدوات كهربائية، أدوات صحية..."
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
              />
            </div>

            {categoryModalError && (
              <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-bold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{categoryModalError}</span>
              </div>
            )}

            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <button
                type="submit"
                disabled={isCategoryActionLoading || !newCategoryName.trim()}
                className="flex-1 py-2.5 bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-smooth flex items-center justify-center gap-1.5"
              >
                {isCategoryActionLoading ? (
                  <span>جاري الحفظ...</span>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>حفظ القسم</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowAddCategoryModal(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-smooth"
              >
                إلغاء
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* ── MODAL: EDIT / RENAME CATEGORY ─────────────────────────────────── */}
      <Modal
        isOpen={Boolean(categoryToEdit)}
        onClose={() => setCategoryToEdit(null)}
        className="max-w-sm"
      >
        {categoryToEdit && (
          <div className="bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4 text-right">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-purple-700" />
                <h3 className="font-bold text-sm text-slate-900">تعديل اسم القسم</h3>
              </div>
              <button
                onClick={() => setCategoryToEdit(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  اسم القسم الجديد <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  autoFocus
                  placeholder="أدخل الاسم الجديد للقسم..."
                  value={editCategoryName}
                  onChange={(e) => setEditCategoryName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                />
              </div>

              {categoryModalError && (
                <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-bold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{categoryModalError}</span>
                </div>
              )}

              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={isCategoryActionLoading || !editCategoryName.trim()}
                  className="flex-1 py-2.5 bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-smooth flex items-center justify-center gap-1.5"
                >
                  {isCategoryActionLoading ? (
                    <span>جاري التحديث...</span>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>حفظ التعديل</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryToEdit(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-smooth"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        )}
      </Modal>

      {/* ── MODAL: ORDER STATUS & PAYMENT UPDATE ─────────────────────────── */}
      <Modal
        isOpen={Boolean(statusModalOrder)}
        onClose={() => {
          setStatusModalOrder(null);
          setShowDeliveredWarning(false);
        }}
        className="max-w-md"
      >
        {statusModalOrder && (
          <div className="bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4 text-right">
            {/* Modal Header */}
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                  <span>تحديث حالة الطلب #{statusModalOrder.orderNumber}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    {statusModalOrder.orderType === 'WHOLESALE' ? 'طلب جملة' : 'طلب قطاعي'}
                  </span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  العميل: {statusModalOrder.user?.name || 'مستخدم'} | الإجمالي: {statusModalOrder.totalAmount} ج.م
                </p>
              </div>
              <button
                onClick={() => {
                  setStatusModalOrder(null);
                  setShowDeliveredWarning(false);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-smooth"
              >
                ✕
              </button>
            </div>

            {/* Field 1: Order Status */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                <span>حالة الطلب (Order Status):</span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    statusModalOrder.status === 'DELIVERED'
                      ? 'bg-emerald-100 text-emerald-800'
                      : statusModalOrder.status === 'CANCELLED'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  الحالية: {statusModalOrder.status}
                </span>
              </label>
              <select
                value={newOrderStatus}
                onChange={(e) => {
                  setNewOrderStatus(e.target.value);
                  setShowDeliveredWarning(false);
                }}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-smooth"
              >
                <option value="PENDING">قيد الانتظار (PENDING)</option>
                <option value="CONFIRMED">تم التأكيد (CONFIRMED)</option>
                <option value="PROCESSING">جاري التجهيز (PROCESSING)</option>
                <option value="SHIPPED">تم الشحن (SHIPPED)</option>
                <option value="DELIVERED">تم التوصيل (DELIVERED)</option>
                <option value="CANCELLED">إلغاء الطلب (CANCELLED - استرجاع المخزون)</option>
              </select>
            </div>

            {newOrderStatus === 'CANCELLED' && (
              <p className="text-[11px] text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200 leading-relaxed font-semibold">
                ⚠️ تنبيه: إلغاء هذا الطلب سيقوم تلقائياً بإعادة كميات كافة المنتجات إلى مخزن النظام وتعديل
                رصيد المخزون فورياً.
              </p>
            )}

            {/* Field 2: Payment Status & Method */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                <span className="text-slate-500 font-bold">طريقة الدفع:</span>
                <span className="inline-flex items-center gap-1.5 font-extrabold text-slate-800">
                  {statusModalOrder.paymentMethod === 'CASH_ON_DELIVERY' ? (
                    <>
                      <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                      <span>دفع عند الاستلام (COD)</span>
                    </>
                  ) : statusModalOrder.paymentMethod === 'BANK_TRANSFER' ? (
                    <>
                      <Building2 className="w-3.5 h-3.5 text-amber-600" />
                      <span>تحويل بنكي</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                      <span>دفع أونلاين</span>
                    </>
                  )}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>حالة الدفع (Payment Status):</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      newPaymentStatus === 'PAID'
                        ? 'bg-emerald-100 text-emerald-800'
                        : newPaymentStatus === 'FAILED'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {newPaymentStatus === 'PAID'
                      ? 'مدفوع (PAID)'
                      : newPaymentStatus === 'FAILED'
                      ? 'فشل (FAILED)'
                      : 'معلق (PENDING)'}
                  </span>
                </label>
                <select
                  value={newPaymentStatus}
                  onChange={(e) => {
                    setNewPaymentStatus(e.target.value);
                    setShowDeliveredWarning(false);
                  }}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-smooth"
                >
                  <option value="PENDING">معلق (PENDING) — بانتظار الدفع أو المراجعة</option>
                  <option value="PAID">مدفوع (PAID) — تم تأكيد واستلام المبلغ</option>
                  <option value="FAILED">فشل الدفع (FAILED) — تعذر التحصيل أو تم الرفض</option>
                </select>
              </div>

              {/* Quick shortcut if COD and not marked PAID yet */}
              {statusModalOrder.paymentMethod === 'CASH_ON_DELIVERY' && newPaymentStatus !== 'PAID' && (
                <div className="pt-2 border-t border-slate-200 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setNewPaymentStatus('PAID')}
                    className="text-[11px] text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1 hover:underline"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>تحديد سريع كـ مدفوع (PAID)</span>
                  </button>
                </div>
              )}
            </div>

            {/* Requirement 3 Confirmation Warning: DELIVERED with PENDING payment */}
            {showDeliveredWarning && (
              <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-300 text-amber-900 text-xs space-y-2 animate-fade-in">
                <div className="flex items-center gap-2 font-black text-amber-900">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>تنبيه: الدفع غير مؤكد لهذا الطلب</span>
                </div>
                <p className="leading-relaxed">
                  طريقة الدفع لهذا الطلب هي (
                  <strong>
                    {statusModalOrder.paymentMethod === 'BANK_TRANSFER' ? 'تحويل بنكي' : 'دفع أونلاين'}
                  </strong>
                  ) وحالة الدفع ما زالت <strong>معلقة (PENDING)</strong>.
                </p>
                <p className="text-[11px] text-amber-800 font-medium">
                  هل أنت متأكد من رغبتك في نقل الطلب إلى حالة <strong>تم التوصيل (DELIVERED)</strong> بدون تأكيد الدفع؟
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={executeUpdateOrderStatus}
                    disabled={isUpdatingOrder}
                    className="flex-1 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-smooth shadow-xs"
                  >
                    {isUpdatingOrder ? 'جاري الحفظ...' : 'نعم، تأكيد التوصيل'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeliveredWarning(false)}
                    className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-smooth"
                  >
                    تراجع لتعديل الدفع
                  </button>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {!showDeliveredWarning && (
              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleUpdateOrderStatus}
                  disabled={isUpdatingOrder}
                  className="flex-1 py-2.5 bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-smooth flex items-center justify-center gap-1.5 shadow-sm"
                >
                  {isUpdatingOrder ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>جاري الحفظ...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>حفظ التغييرات</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStatusModalOrder(null);
                    setShowDeliveredWarning(false);
                  }}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-smooth"
                >
                  إلغاء
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ── MODAL: REJECT RECEIPT WITH REASON ──────────────────────────────── */}
      <Modal
        isOpen={Boolean(showRejectModal && selectedReceipt)}
        onClose={() => setShowRejectModal(false)}
        className="max-w-sm"
      >
        {selectedReceipt && (
          <div className="bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4 text-right">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">
                رفض إيصال الطلب #{selectedReceipt.orderNumber}
              </h3>
              <button
                onClick={() => setShowRejectModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-smooth"
              >
                ✕
              </button>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                سبب الرفض (سيتم إخطار العميل به):
              </label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="مثال: صورة الإيصال غير واضحة أو المبلغ غير مطابق..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleVerifyReceipt(selectedReceipt.id, 'REJECT', rejectReason)}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-smooth"
              >
                تأكيد رفض الإيصال
              </button>
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-smooth"
              >
                إلغاء
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── MODAL: PRODUCT ADD / EDIT ──────────────────────────────────────── */}
      <Modal
        isOpen={showProductModal}
        onClose={() => {
          setShowProductModal(false);
          setFormErrors({});
        }}
        className="max-w-5xl"
      >
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 my-auto max-h-[92vh] flex flex-col text-right">
            {/* Modal Header */}
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-3">
                <span className="p-2.5 bg-purple-100 text-purple-700 rounded-2xl shadow-sm">
                  <Package className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-black text-lg text-slate-900 tracking-tight">
                    {editingProduct ? 'تعديل بيانات المنتج' : 'إضافة منتج جديد للكتالوج'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {editingProduct
                      ? `تحديث التسعير والمخزون وشرائح الجملة للمنتج (${editingProduct.sku})`
                      : 'أدخل تفاصيل المنتج وشرائح أسعار الجملة وصورة العرض'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowProductModal(false);
                  setFormErrors({});
                }}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-smooth"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSaveProduct} className="flex-1 overflow-y-auto space-y-6 pl-1 pr-1">
              {/* 2-Column Responsive Desktop Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* ── COLUMN 1: Basic Info & Image ───────────────────────────── */}
                <div className="space-y-5">
                  {/* Section 1: البيانات الأساسية */}
                  <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200/90 space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200/70">
                      <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                        <Tag className="w-4 h-4 text-purple-700" />
                        <span>البيانات الأساسية</span>
                      </h4>
                      <span className="text-[11px] bg-purple-100 text-purple-800 font-bold px-2.5 py-0.5 rounded-full">
                        مطلوب
                      </span>
                    </div>

                    {/* Product Name (Prominent full-width first field) */}
                    <div>
                      <label className="block text-slate-800 font-bold mb-1.5 text-xs">
                        اسم المنتج <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="مثال: شنيور بوش لاسلكي 18 فولت احترافي"
                        value={productForm.name}
                        onChange={(e) => updateFormField('name', e.target.value)}
                        className={`w-full bg-white border rounded-xl px-4 py-2.5 text-sm font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-smooth shadow-sm ${
                          formErrors.name ? 'border-red-500 bg-red-50/30' : 'border-slate-300'
                        }`}
                      />
                      {formErrors.name && (
                        <p className="text-[11px] text-red-600 font-bold mt-1.5 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{formErrors.name}</span>
                        </p>
                      )}
                    </div>

                    {/* SKU & Category Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-700 font-bold mb-1 text-xs">
                          كود المنتج (SKU) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="SKU-XXXXX"
                          value={productForm.sku}
                          onChange={(e) => updateFormField('sku', e.target.value)}
                          className={`w-full bg-white border rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-smooth shadow-sm ${
                            formErrors.sku ? 'border-red-500 bg-red-50/30' : 'border-slate-300'
                          }`}
                        />
                        {formErrors.sku && (
                          <p className="text-[11px] text-red-600 font-bold mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 shrink-0" />
                            <span>{formErrors.sku}</span>
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-slate-700 font-bold mb-1 text-xs">
                          القسم <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={productForm.categoryId}
                          onChange={(e) => updateFormField('categoryId', e.target.value)}
                          className={`w-full bg-white border rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-smooth shadow-sm ${
                            formErrors.categoryId ? 'border-red-500 bg-red-50/30' : 'border-slate-300'
                          }`}
                        >
                          <option value="">اختر القسم...</option>
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name} {!c.isActive ? '(غير نشط)' : ''}
                            </option>
                          ))}
                        </select>
                        {formErrors.categoryId && (
                          <p className="text-[11px] text-red-600 font-bold mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 shrink-0" />
                            <span>{formErrors.categoryId}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Active Toggle Switch */}
                    <div className="pt-2 flex items-center justify-between text-xs border-t border-slate-200/50">
                      <div>
                        <span className="font-bold text-slate-800 block">حالة تفعيل المنتج</span>
                        <span className="text-[11px] text-slate-400">إظهار أو إخفاء المنتج من متجر العملاء والتجار</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={productForm.isActive}
                          onChange={(e) => updateFormField('isActive', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                      </label>
                    </div>
                  </div>

                  {/* Section 2: الصورة (Visual Drag & Drop + Large Preview) */}
                  <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200/90 space-y-3.5">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200/70">
                      <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-purple-700" />
                        <span>صورة المنتج</span>
                      </h4>
                      <span className="text-[11px] bg-slate-200/80 text-slate-700 font-bold px-2 py-0.5 rounded-full">
                        Cloudinary CDN
                      </span>
                    </div>

                    {productImagePreview ? (
                      /* Large Image Preview Card */
                      <div className="relative rounded-2xl overflow-hidden border border-slate-300 bg-slate-900/5 shadow-sm group">
                        <div className="h-44 sm:h-48 w-full flex items-center justify-center p-3 bg-gradient-to-b from-slate-100 to-slate-200/50">
                          <img
                            src={productImagePreview}
                            alt="معاينة المنتج"
                            className="max-h-full max-w-full object-contain rounded-xl drop-shadow-md group-hover:scale-105 transition-smooth"
                          />
                        </div>
                        {/* Control Bar */}
                        <div className="p-3 bg-white/95 backdrop-blur-md border-t border-slate-200 flex items-center justify-between">
                          <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                            تم تحديد الصورة بنجاح
                          </span>
                          <div className="flex items-center gap-2">
                            <label className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl cursor-pointer text-xs font-bold transition-smooth flex items-center gap-1 shadow-sm">
                              <Upload className="w-3 h-3 text-purple-700" />
                              <span>تغيير</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleImageSelect(e.target.files?.[0])}
                              />
                            </label>
                            <button
                              type="button"
                              onClick={() => {
                                setProductImageFile(null);
                                setProductImagePreview(null);
                              }}
                              className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold transition-smooth flex items-center gap-1"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>إزالة</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Visual Drag & Drop Upload Zone */
                      <label
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-smooth space-y-2.5 ${
                          isDraggingImage
                            ? 'border-purple-600 bg-purple-50/80 scale-[1.01]'
                            : 'border-slate-300 hover:border-purple-400 bg-white hover:bg-purple-50/30'
                        }`}
                      >
                        <div className="w-14 h-14 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center shadow-sm">
                          <Upload className="w-6 h-6" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-extrabold text-slate-800">
                            اسحب الصورة وأفلتها هنا أو <span className="text-purple-700 underline">انقر للتصفح</span>
                          </p>
                          <p className="text-[11px] text-slate-400">
                            يدعم صيغ JPG, PNG, WEBP بدقة عالية (حد أقصى 5MB)
                          </p>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleImageSelect(e.target.files?.[0])}
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* ── COLUMN 2: Pricing, Stock & Wholesale Tiers ─────────────── */}
                <div className="space-y-5">
                  {/* Section 3: التسعير والمخزون (Row Grid of 3 Fields) */}
                  <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200/90 space-y-3.5">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200/70">
                      <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-emerald-600" />
                        <span>التسعير والمخزون</span>
                      </h4>
                      <span className="text-[11px] text-slate-400 font-semibold">مستويات الأسعار والأمان</span>
                    </div>

                    {/* 3 Fields in a Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-slate-700 font-bold mb-1 text-xs">
                          سعر القطاعي <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={productForm.retailPrice}
                            onChange={(e) => updateFormField('retailPrice', e.target.value)}
                            className={`w-full bg-white border rounded-xl pl-8 pr-3 py-2.5 text-xs font-black text-emerald-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-smooth shadow-sm ${
                              formErrors.retailPrice ? 'border-red-500 bg-red-50/30' : 'border-slate-300'
                            }`}
                          />
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">
                            ج.م
                          </span>
                        </div>
                        {formErrors.retailPrice && (
                          <p className="text-[10px] text-red-600 font-bold mt-1">
                            {formErrors.retailPrice}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-slate-700 font-bold mb-1 text-xs">
                          المخزون الحالي
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            placeholder="0"
                            value={productForm.stockQuantity}
                            onChange={(e) => updateFormField('stockQuantity', e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-smooth shadow-sm"
                          />
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">
                            وحدة
                          </span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-slate-700 font-bold mb-1 text-xs">
                          حد تنبيه النواقص
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            placeholder="10"
                            value={productForm.lowStockAlertAt}
                            onChange={(e) => updateFormField('lowStockAlertAt', e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-xs font-bold text-amber-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-smooth shadow-sm"
                          />
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">
                            وحدة
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section 4: شرائح أسعار الجملة (Wholesale Pricing Tiers) */}
                  <div className="bg-purple-50/50 p-5 rounded-2xl border border-purple-200 space-y-3.5">
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-purple-200/70">
                      <div>
                        <h4 className="font-extrabold text-sm text-purple-950 flex items-center gap-2">
                          <Boxes className="w-4 h-4 text-purple-700" />
                          <span>شرائح أسعار الجملة (Wholesale Tiers)</span>
                        </h4>
                        <p className="text-[11px] text-purple-700 mt-0.5">
                          تخفيضات كمية آلية لتجار الجملة المعتمدين
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setProductForm({
                            ...productForm,
                            pricingTiers: [
                              ...productForm.pricingTiers,
                              { minQuantity: 20, maxQuantity: null, price: '' },
                            ],
                          })
                        }
                        className="flex items-center gap-1.5 text-xs bg-purple-700 hover:bg-purple-800 text-white font-bold px-3 py-1.5 rounded-xl transition-smooth shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ إضافة شريحة جديدة</span>
                      </button>
                    </div>

                    {/* Tiers List */}
                    {productForm.pricingTiers.length === 0 ? (
                      <div className="text-center p-5 bg-white/80 rounded-xl border border-dashed border-purple-200 text-slate-400 text-xs">
                        لا توجد شرائح جملة محددة حالياً. انقر زر "إضافة شريحة جديدة" أعلاه لتقديم أسعار مخفضة للكميات الكبيرة.
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {productForm.pricingTiers.map((tier, idx) => (
                          <div
                            key={idx}
                            className="bg-white p-3 rounded-xl border border-purple-100 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5"
                          >
                            <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-black flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>

                            {/* Range: From X to Y units */}
                            <div className="flex items-center gap-1.5 flex-1">
                              <span className="text-[11px] font-bold text-slate-500 shrink-0">من</span>
                              <input
                                type="number"
                                placeholder="الحد الأدنى"
                                value={tier.minQuantity}
                                onChange={(e) => {
                                  const newTiers = [...productForm.pricingTiers];
                                  newTiers[idx].minQuantity = e.target.value;
                                  setProductForm({ ...productForm, pricingTiers: newTiers });
                                }}
                                className="w-18 sm:w-20 bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs font-bold text-center focus:bg-white"
                              />
                              <span className="text-[11px] font-bold text-slate-500 shrink-0">إلى</span>
                              <input
                                type="number"
                                placeholder="فارغ لأكثر"
                                value={tier.maxQuantity || ''}
                                onChange={(e) => {
                                  const newTiers = [...productForm.pricingTiers];
                                  newTiers[idx].maxQuantity = e.target.value || null;
                                  setProductForm({ ...productForm, pricingTiers: newTiers });
                                }}
                                className="w-18 sm:w-20 bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs text-center focus:bg-white"
                              />
                              <span className="text-[11px] text-slate-400 shrink-0">وحدة =</span>
                            </div>

                            {/* Price per unit */}
                            <div className="flex items-center gap-2 justify-between sm:justify-start">
                              <div className="relative">
                                <input
                                  type="number"
                                  step="0.01"
                                  placeholder="0.00"
                                  value={tier.price}
                                  onChange={(e) => {
                                    const newTiers = [...productForm.pricingTiers];
                                    newTiers[idx].price = e.target.value;
                                    setProductForm({ ...productForm, pricingTiers: newTiers });
                                  }}
                                  className="w-24 bg-slate-50 border border-slate-200 rounded-lg pl-7 pr-2 p-1.5 text-xs font-black text-emerald-700 text-left focus:bg-white"
                                />
                                <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">
                                  ج.م
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  const newTiers = productForm.pricingTiers.filter((_, i) => i !== idx);
                                  setProductForm({ ...productForm, pricingTiers: newTiers });
                                }}
                                className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-smooth"
                                title="حذف الشريحة"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Section 5: الوصف (Full Width across bottom) ─────────────── */}
              <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200/90 space-y-2">
                <label className="block text-slate-800 font-extrabold text-xs flex items-center gap-2">
                  <FileText className="w-4 h-4 text-purple-700" />
                  <span>وصف ومواصفات المنتج</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="أدخل مواصفات ومميزات المنتج الفنية والمحتويات المرفقة بالعلبة لمساعدة العملاء والتجار في اتخاذ قرار الشراء..."
                  value={productForm.description}
                  onChange={(e) => updateFormField('description', e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs leading-relaxed text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-smooth shadow-sm"
                />
              </div>
            </form>

            {/* Modal Footer / Actions */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3 shrink-0">
              <span className="text-[11px] text-slate-400 hidden sm:inline">
                * الحقول المميزة بعلامة النجمة مطلوبة
              </span>
              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    setShowProductModal(false);
                    setFormErrors({});
                  }}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-smooth"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleSaveProduct}
                  disabled={isSavingProduct}
                  className="flex-1 sm:flex-initial px-7 py-2.5 bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-lg shadow-purple-700/25 transition-smooth flex items-center justify-center gap-2"
                >
                  {isSavingProduct ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>جاري الحفظ ورفع الصورة...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>{editingProduct ? 'تحديث بيانات المنتج' : 'حفظ ونشر المنتج'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
      </Modal>

      {/* ── MODAL: VIEW / ZOOM RECEIPT FULL DETAILS ───────────────────────── */}
      <Modal
        isOpen={Boolean(viewingReceipt)}
        onClose={() => setViewingReceipt(null)}
        className="max-w-2xl"
        backdropClassName="bg-slate-950/80 backdrop-blur-md"
      >
        {viewingReceipt && (
          <div className="bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4 my-8 text-right">
            {/* Modal Header */}
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                  <Building2 className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-black text-base text-slate-900">
                    تدقيق إيصال التحويل البنكي #{viewingReceipt.orderNumber}
                  </h3>
                  <p className="text-xs text-slate-500">
                    العميل: {viewingReceipt.user?.name} | {viewingReceipt.user?.phone || 'بدون هاتف'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewingReceipt(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-smooth"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Receipt Image Display */}
            <div className="relative bg-slate-950/5 rounded-2xl border border-slate-200 overflow-hidden flex items-center justify-center p-2 min-h-[300px] max-h-[60vh]">
              {viewingReceipt.receiptImageUrl ? (
                <img
                  src={getImageUrl(viewingReceipt.receiptImageUrl)}
                  alt="إيصال التحويل البنكي"
                  className="max-h-[56vh] w-auto max-w-full object-contain rounded-xl shadow-md"
                />
              ) : (
                <div className="text-center p-8 text-slate-400 space-y-2">
                  <span className="text-4xl">🧾</span>
                  <p className="font-bold text-xs">لا يوجد رابط صورة صالح للإيصال</p>
                </div>
              )}
            </div>

            {/* Info Badges & Details */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
              <div>
                <span className="text-slate-400 block text-[11px]">قيمة الطلب المستحقة:</span>
                <span className="font-black text-sm text-emerald-700">
                  {viewingReceipt.totalAmount} ج.م
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">تاريخ الطلب:</span>
                <span className="font-bold text-slate-800">
                  {new Date(viewingReceipt.createdAt).toLocaleDateString('ar-EG')}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">نوع الطلب:</span>
                <span className="font-bold text-slate-800">
                  {viewingReceipt.orderType === 'WHOLESALE' ? 'طلب جملة (B2B)' : 'طلب قطاعي (B2C)'}
                </span>
              </div>
            </div>

            {/* Actions Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
              {viewingReceipt.receiptImageUrl && (
                <a
                  href={getImageUrl(viewingReceipt.receiptImageUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-smooth flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>فتح الصورة بحجمها الأصلي</span>
                </a>
              )}

              <div className="flex items-center gap-2 mr-auto">
                <button
                  type="button"
                  onClick={() => {
                    const orderToReject = viewingReceipt;
                    setViewingReceipt(null);
                    setSelectedReceipt(orderToReject);
                    setShowRejectModal(true);
                  }}
                  className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-bold transition-smooth flex items-center gap-1.5"
                >
                  <X className="w-4 h-4" />
                  <span>رفض الإيصال</span>
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const orderId = viewingReceipt.id;
                    setViewingReceipt(null);
                    await handleVerifyReceipt(orderId, 'APPROVE');
                  }}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-smooth flex items-center gap-1.5 shadow-sm"
                >
                  <Check className="w-4 h-4" />
                  <span>اعتماد الإيصال وتأكيد الدفع</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* ── FLOATING BULK MOVE BAR (Categories Workspace) ──────────────────── */}
      {activeSubTab === 'categories' &&
        activeSelectedProductIds.length > 0 &&
        createPortal(
          <div
            dir="rtl"
            role="region"
            aria-label="شريط النقل الجماعي للمنتجات المحددة"
            className="fixed bottom-3 sm:bottom-5 left-3 right-3 z-40 pointer-events-none flex justify-center"
          >
            <div className="pointer-events-auto w-full max-w-2xl bg-slate-900/95 backdrop-blur-md text-white rounded-2xl border border-purple-400/30 shadow-2xl px-3.5 py-3 sm:px-5 sm:py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 animate-fade-in">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-8 h-8 rounded-xl bg-purple-600/30 border border-purple-400/40 text-purple-200 flex items-center justify-center font-black text-xs shrink-0">
                  {activeSelectedProductIds.length}
                </span>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-extrabold truncate">
                    تم تحديد {activeSelectedProductIds.length}{' '}
                    {activeSelectedProductIds.length === 1 ? 'منتج' : 'منتجات'}
                  </p>
                  <p className="text-[10px] text-slate-300 truncate">
                    انقل المنتجات المحددة إلى قسم آخر بنقرة واحدة
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  disabled={isMovingProducts || categories.length < 2}
                  onClick={() =>
                    setBulkMovePickerState((prev) => ({
                      isOpen: true,
                      session: prev.session + 1,
                    }))
                  }
                  aria-label="نقل المنتجات المحددة إلى قسم آخر"
                  title={
                    categories.length < 2
                      ? 'أضف قسماً آخر لتتمكن من نقل المنتجات'
                      : 'نقل إلى قسم...'
                  }
                  className="flex-1 sm:flex-initial px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-xl text-xs font-extrabold transition-smooth flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  <span>نقل إلى قسم...</span>
                </button>
                <button
                  type="button"
                  disabled={isMovingProducts}
                  onClick={() => setSelectedProductIds([])}
                  aria-label="إلغاء تحديد المنتجات"
                  className="px-3 py-2 bg-white/10 hover:bg-white/20 text-slate-200 rounded-xl text-xs font-bold transition-smooth flex items-center justify-center gap-1"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>إلغاء التحديد</span>
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* ── MODAL: DELETE CATEGORY (WITH TYPE-TO-CONFIRM FOR POPULATED) ─────── */}
      <CategoryDeleteModal
        category={categoryToDelete}
        productCount={deleteModalProductCount}
        isLoading={isDeletingCategory}
        onClose={() => {
          if (!isDeletingCategory) setCategoryToDelete(null);
        }}
        onConfirm={handleConfirmDeleteCategory}
      />

      {/* ── MODAL: BULK MOVE CATEGORY PICKER ────────────────────────────────── */}
      <CategoryPickerModal
        isOpen={bulkMovePickerState.isOpen}
        sessionKey={bulkMovePickerState.session}
        categories={categories}
        selectedCount={activeSelectedProductIds.length}
        excludedCategoryId={pickerExcludedCategoryId}
        isLoading={isMovingProducts}
        onClose={() => {
          if (!isMovingProducts) {
            setBulkMovePickerState((prev) => ({ ...prev, isOpen: false }));
          }
        }}
        onConfirm={(targetCategoryId) =>
          handleMoveProducts(activeSelectedProductIds, targetCategoryId)
        }
      />

      {/* ── CONFIRMATION MODAL ──────────────────────────────────────────────── */}
      <ConfirmModal
        isOpen={deleteConfirmation.isOpen}
        onClose={() => setDeleteConfirmation((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={deleteConfirmation.onConfirm}
        title={deleteConfirmation.title}
        message={deleteConfirmation.message}
        confirmText={deleteConfirmation.confirmText}
        cancelText="إلغاء"
        isDanger={deleteConfirmation.isDanger}
      />

      {/* ── ARABIC TOAST NOTIFICATIONS ──────────────────────────────────────── */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
};
