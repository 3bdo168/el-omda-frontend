import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  Filter,
  ShoppingBag,
  Plus,
  Minus,
  Check,
  AlertTriangle,
  Info,
  Layers,
  Sparkles,
  ArrowUpDown,
  Tag,
  Boxes,
  Eye,
  ExternalLink,
  X,
  RefreshCw,
} from 'lucide-react';
import { api, getImageUrl } from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/Modal';
import { ProductCardSkeleton } from '../components/Skeleton';

export const StoreView = ({ onOpenCart }) => {
  const { addToCart, items } = useCart();
  const { user, isTrader, isApprovedTrader } = useAuth();

  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [activeSearchQuery, setActiveSearchQuery] = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [selectedProductDetails, setSelectedProductDetails] = useState(null);
  const [modalQty, setModalQty] = useState(1);
  const [justAddedFeedback, setJustAddedFeedback] = useState(false);

  // Local quantity map for inputs
  const [qtyMap, setQtyMap] = useState({});

  // Fetch Categories using React Query (default 60s staleTime)
  const { data: categories = [] } = useQuery({
    queryKey: ['categories', 'store'],
    queryFn: async () => {
      const catsRes = await api.getCategories();
      if (catsRes.success) {
        return (catsRes.data || []).filter(
          (c) => c.isActive !== false && (c._count?.products || 0) > 0
        );
      }
      return [];
    },
  });

  // Fetch Products using React Query with short staleTime (10s) for real-time stock & pricing
  const {
    data: products = [],
    isLoading: isLoadingProducts,
    isFetching: isFetchingProducts,
  } = useQuery({
    queryKey: ['products', { selectedCategory, inStockOnly, search: activeSearchQuery }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCategory) params.append('categoryId', selectedCategory);
      if (inStockOnly) params.append('inStockOnly', 'true');
      if (activeSearchQuery) params.append('search', activeSearchQuery);

      const res = await api.getProducts(params.toString());
      if (res.success && res.data) {
        return res.data;
      }
      return [];
    },
    staleTime: 10 * 1000, // 10 seconds for real-time stock and pricing
  });

  const calculateEffectivePrice = (product, quantity) => {
    if (!product) return { unitPrice: 0, total: 0, activeTier: null, isWholesaleApplied: false, savings: 0 };
    const retail = parseFloat(product.retailPrice) || 0;
    let effective = retail;
    let activeTier = null;

    if (product.pricingTiers && product.pricingTiers.length > 0) {
      for (const tier of product.pricingTiers) {
        const min = tier.minQuantity;
        const max = tier.maxQuantity || Infinity;
        if (quantity >= min && quantity <= max) {
          effective = parseFloat(tier.price) || retail;
          activeTier = tier;
          break;
        }
      }
    }

    return {
      unitPrice: effective,
      total: effective * quantity,
      activeTier,
      isWholesaleApplied: activeTier !== null && effective < retail,
      savings: activeTier ? (retail - effective) * quantity : 0,
    };
  };

  const openProductDetails = (product) => {
    const minQty = isTrader ? (product.minOrderQtyWholesale || 1) : (product.minOrderQtyRetail || 1);
    const currentQty = qtyMap[product.id] || minQty;
    setModalQty(currentQty);
    setJustAddedFeedback(false);
    setSelectedProductDetails(product);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setActiveSearchQuery(searchInput.trim());
  };

  const handleQtyChange = (productId, val, minQty) => {
    const num = parseInt(val, 10);
    setQtyMap((prev) => ({
      ...prev,
      [productId]: isNaN(num) ? minQty : Math.max(minQty, num),
    }));
  };

  const getQty = (product) => {
    const minQty = isTrader ? product.minOrderQtyWholesale || 1 : product.minOrderQtyRetail || 1;
    return qtyMap[product.id] || minQty;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-950 text-white p-8 sm:p-12 shadow-2xl shadow-emerald-950/20">
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>بوابة التوريد والتجارة الذكية</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
            مستودعات بيت الجملة <span className="text-sm font-normal text-emerald-200/80 whitespace-nowrap">تبع مؤسسه صلى على النبى</span> لتجارة الجملة والتجزئة
          </h2>
          <p className="text-sm text-emerald-100/90 leading-relaxed">
            أفضل الأسعار المباشرة من المصنع للمستهلك وللتجار. خصومات تصاعدية لطلبات الجملة
            وإمكانية الدفع بالتحويل البنكي أو الدفع الإلكتروني الفوري.
          </p>

          {isTrader && (
            <div className="p-3 bg-emerald-700/50 backdrop-blur-md rounded-xl border border-emerald-500/30 text-xs text-emerald-100 flex items-center gap-2">
              <Boxes className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                أنت تتصفح حالياً بصفة <strong>تاجر جملة</strong>. تُطبق أسعار الشرائح (Wholesale
                Pricing Tiers) تلقائياً بناءً على حجم طلبك!
              </span>
            </div>
          )}
        </div>

        {/* Decorative background shape */}
        <div className="absolute -left-12 -bottom-12 w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Filters & Search Bar */}
      <div className="glass-card p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Categories Chips */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-smooth ${
              selectedCategory === ''
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            جميع الأقسام
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-smooth ${
                selectedCategory === cat.id
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {cat.name} ({cat._count?.products || 0})
            </button>
          ))}
        </div>

        {/* Search & Stock Toggle */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <label className="flex items-center gap-2 text-xs font-bold text-slate-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => setInStockOnly(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
            />
            <span>المتوفر بالمخزن فقط</span>
          </label>

          <form onSubmit={handleSearchSubmit} className="relative w-full md:w-64">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                if (!e.target.value.trim()) setActiveSearchQuery('');
              }}
              placeholder="ابحث بالاسم أو كود SKU..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 pl-9 text-xs focus:outline-none focus:border-emerald-500 font-medium"
            />
            <button
              type="submit"
              className="absolute left-2.5 top-2.5 text-slate-400 hover:text-emerald-600 transition-smooth"
            >
              <Search className="w-4 h-4" />
            </button>
          </form>

          {isFetchingProducts && !isLoadingProducts && (
            <div
              title="جاري تحديث الأسعار والمخزون في الخلفية..."
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-bold animate-pulse"
            >
              <RefreshCw className="w-3 h-3 animate-spin text-emerald-600" />
              <span>تحديث فوري</span>
            </div>
          )}
        </div>
      </div>

      {/* Products Grid */}
      {isLoadingProducts ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="py-20 text-center text-slate-400 glass-card rounded-3xl">
          <ShoppingBag className="w-16 h-16 stroke-[1.2] mx-auto mb-3 text-slate-300" />
          <h3 className="font-extrabold text-base text-slate-700">لا توجد منتجات مطابقة</h3>
          <p className="text-xs text-slate-400 mt-1">جرب تغيير معايير البحث أو اختيار قسم آخر</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => {
            const minQty = isTrader
              ? product.minOrderQtyWholesale || 1
              : product.minOrderQtyRetail || 1;
            const currentQty = getQty(product);
            const isOutOfStock = product.stockQuantity <= 0;
            const isLowStock =
              !isOutOfStock && product.stockQuantity <= product.lowStockAlertAt;

            return (
              <div
                key={product.id}
                className="glass-card rounded-3xl overflow-hidden border border-slate-200/90 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-smooth flex flex-col group"
              >
                {/* Product Image / Placeholder - Clickable for Expanded Details */}
                <div
                  onClick={() => openProductDetails(product)}
                  className="relative h-52 bg-slate-100 flex items-center justify-center overflow-hidden cursor-pointer group/img select-none"
                  title="انقر لعرض تفاصيل وصورة المنتج بشكل أوسع"
                >
                  {product.imageUrl ? (
                    <img
                      src={getImageUrl(product.imageUrl)}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover/img:scale-108 transition-smooth duration-500"
                    />
                  ) : (
                    <span className="text-5xl group-hover/img:scale-110 transition-smooth select-none">
                      📦
                    </span>
                  )}

                  {/* Hover Overlay Hint */}
                  <div className="absolute inset-0 bg-slate-950/25 opacity-0 group-hover/img:opacity-100 transition-smooth flex items-center justify-center p-2 pointer-events-none">
                    <span className="bg-white/95 backdrop-blur-md text-slate-900 text-[11px] font-extrabold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 scale-90 group-hover/img:scale-100 transition-smooth">
                      <Eye className="w-3.5 h-3.5 text-emerald-600" />
                      <span>عرض تفاصيل المنتج</span>
                    </span>
                  </div>

                  {/* Badges */}
                  <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-end pointer-events-none">
                    <span className="text-[10px] font-bold bg-white/90 backdrop-blur-md text-slate-700 px-2 py-0.5 rounded-full border border-slate-200 shadow-sm">
                      {product.category?.name || 'قسم عام'}
                    </span>
                    {isOutOfStock ? (
                      <span className="text-[10px] font-bold bg-red-600 text-white px-2 py-0.5 rounded-full shadow-sm">
                        نفد المخزون
                      </span>
                    ) : isLowStock ? (
                      <span className="text-[10px] font-bold bg-amber-500 text-white px-2 py-0.5 rounded-full shadow-sm">
                        متبقي {product.stockQuantity} فقط
                      </span>
                    ) : null}
                  </div>

                  {/* SKU pill */}
                  <div className="absolute bottom-2 left-2 bg-slate-900/60 backdrop-blur-md text-white text-[10px] font-mono px-2 py-0.5 rounded-md pointer-events-none">
                    {product.sku}
                  </div>
                </div>

                {/* Details Body */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3
                      onClick={() => openProductDetails(product)}
                      className="font-bold text-sm text-slate-900 line-clamp-1 group-hover:text-emerald-700 transition-smooth cursor-pointer"
                      title="عرض التفاصيل"
                    >
                      {product.name}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                      {product.description || 'منتج عالي الجودة متوفر للتسليم الفوري من المخازن'}
                    </p>
                  </div>

                  {/* Pricing Details */}
                  <div className="pt-2 border-t border-slate-100 space-y-1.5">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-slate-500">سعر القطاعي:</span>
                      <span className="font-extrabold text-base text-slate-900">
                        {parseFloat(product.retailPrice).toFixed(2)} ج.م
                      </span>
                    </div>

                    {/* Wholesale Tiers Preview if available */}
                    {product.pricingTiers && product.pricingTiers.length > 0 && (
                      <div className="bg-emerald-50/70 p-2 rounded-xl border border-emerald-200 text-[11px] text-emerald-900 space-y-1">
                        <div className="font-bold flex items-center justify-between">
                          <span>شرائح الجملة (Wholesale):</span>
                          <button
                            type="button"
                            onClick={() => openProductDetails(product)}
                            className="text-[10px] text-emerald-700 font-bold hover:underline"
                          >
                            عرض التفاصيل
                          </button>
                        </div>
                        {product.pricingTiers.slice(0, 2).map((tier, idx) => (
                          <div key={idx} className="flex justify-between text-[10px] text-slate-700">
                            <span>
                              من {tier.minQuantity} {tier.maxQuantity ? `إلى ${tier.maxQuantity}` : 'فأكثر'}:
                            </span>
                            <span className="font-bold text-emerald-800">
                              {parseFloat(tier.price).toFixed(2)} ج.م / وحدة
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span>الحد الأدنى للطلب:</span>
                      <span className="font-bold text-slate-700">
                        {minQty} {isTrader ? 'وحدات (جملة)' : 'وحدة (قطاعي)'}
                      </span>
                    </div>
                  </div>

                  {/* Actions & Stepper */}
                  <div className="pt-2 flex items-center gap-2">
                    {/* Stepper */}
                    <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 p-1">
                      <button
                        disabled={isOutOfStock || currentQty <= minQty}
                        onClick={() => handleQtyChange(product.id, currentQty - 1, minQty)}
                        className="p-1 text-slate-600 hover:bg-white rounded-lg transition-smooth disabled:opacity-40"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <input
                        disabled={isOutOfStock}
                        type="number"
                        min={minQty}
                        max={product.stockQuantity}
                        value={currentQty}
                        onChange={(e) => handleQtyChange(product.id, e.target.value, minQty)}
                        className="w-10 text-center bg-transparent text-xs font-bold focus:outline-none"
                      />
                      <button
                        disabled={isOutOfStock || currentQty >= product.stockQuantity}
                        onClick={() => handleQtyChange(product.id, currentQty + 1, minQty)}
                        className="p-1 text-slate-600 hover:bg-white rounded-lg transition-smooth disabled:opacity-40"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Add to Cart Button */}
                    <button
                      disabled={isOutOfStock}
                      onClick={() => {
                        addToCart(product, currentQty);
                        onOpenCart();
                      }}
                      className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-smooth ${
                        isOutOfStock
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/30'
                      }`}
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>{isOutOfStock ? 'نفد' : 'إضافة للسلة'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── PRODUCT DETAILS & IMAGE EXPANDED MODAL ──────────────────────── */}
      <Modal
        isOpen={Boolean(selectedProductDetails)}
        onClose={() => setSelectedProductDetails(null)}
        className="max-w-3xl"
      >
        {selectedProductDetails && (() => {
          const prod = selectedProductDetails;
          const minQty = isTrader
            ? prod.minOrderQtyWholesale || 1
            : prod.minOrderQtyRetail || 1;
          const isOutOfStock = prod.stockQuantity <= 0;
          const isLowStock =
            !isOutOfStock && prod.stockQuantity <= prod.lowStockAlertAt;
          const { unitPrice, total, isWholesaleApplied, savings } =
            calculateEffectivePrice(prod, modalQty);

          return (
            <div className="bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-200 text-right">
              {/* Modal Header */}
              <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full border border-emerald-200">
                    {prod.category?.name || 'قسم عام'}
                  </span>
                  <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                    كود: {prod.sku}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedProductDetails(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-smooth"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body: 2 Columns on Desktop */}
              <div className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-start max-h-[75vh] overflow-y-auto">
                {/* Column 1: Large Image & Gallery */}
                <div className="space-y-3">
                  <div className="relative aspect-square rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center group/preview select-none">
                    {prod.imageUrl ? (
                      <img
                        src={getImageUrl(prod.imageUrl)}
                        alt={prod.name}
                        className="w-full h-full object-cover object-center group-hover/preview:scale-105 transition-smooth duration-500"
                      />
                    ) : (
                      <div className="text-center p-8 space-y-2 select-none">
                        <span className="text-6xl">📦</span>
                        <p className="text-xs font-bold text-slate-400">صورة المنتج غير متوفرة</p>
                      </div>
                    )}

                    {/* Stock Status Badge */}
                    <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-end pointer-events-none">
                      {isOutOfStock ? (
                        <span className="text-xs font-extrabold bg-red-600 text-white px-3 py-1 rounded-full shadow-md">
                          نفد المخزون
                        </span>
                      ) : isLowStock ? (
                        <span className="text-xs font-extrabold bg-amber-500 text-white px-3 py-1 rounded-full shadow-md">
                          متبقي {prod.stockQuantity} فقط بالمخزن
                        </span>
                      ) : (
                        <span className="text-xs font-extrabold bg-emerald-600 text-white px-3 py-1 rounded-full shadow-md">
                          متوفر للتسليم الفوري
                        </span>
                      )}
                    </div>

                    {/* Full Size Link Button */}
                    {prod.imageUrl && (
                      <a
                        href={getImageUrl(prod.imageUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute bottom-3 left-3 px-3 py-1.5 bg-slate-900/75 hover:bg-slate-900 text-white rounded-xl text-xs font-bold backdrop-blur-md transition-smooth flex items-center gap-1.5 shadow-md"
                        title="فتح الصورة الأصلية بالحجم الكامل"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>فتح بالحجم الأصلي</span>
                      </a>
                    )}
                  </div>

                  {/* Stock Info Bar */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs text-slate-600">
                    <span>الرصيد الفعلي في المخزن:</span>
                    <span className="font-extrabold text-slate-900">{prod.stockQuantity} وحدة</span>
                  </div>
                </div>

                {/* Column 2: Details, Pricing Tiers, and Order Action */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight leading-snug">
                      {prod.name}
                    </h3>
                    <p className="text-xs text-slate-600 mt-2 leading-relaxed whitespace-pre-line">
                      {prod.description || 'منتج ممتاز متوفر من مستودعات بيت الجملة (تبع مؤسسه صلى على النبى) بأعلى معايير الجودة والضمان المباشر.'}
                    </p>
                  </div>

                  {/* Pricing Overview Card */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50/90 to-teal-50/60 border border-emerald-200/80 space-y-3">
                    <div className="flex items-baseline justify-between">
                      <div>
                        <span className="text-xs text-slate-500 font-bold block">السعر القطاعي الأساسي:</span>
                        <div className="text-2xl font-black text-slate-900 mt-0.5">
                          {parseFloat(prod.retailPrice).toFixed(2)}{' '}
                          <span className="text-xs font-bold text-slate-500">ج.م / وحدة</span>
                        </div>
                      </div>
                      <div className="text-left">
                        <span className="text-xs text-slate-500 font-bold block">الحد الأدنى للطلب:</span>
                        <span className="text-xs font-extrabold text-emerald-800 bg-white px-2.5 py-1 rounded-lg border border-emerald-200">
                          {minQty} {isTrader ? 'وحدات (جملة)' : 'وحدة (قطاعي)'}
                        </span>
                      </div>
                    </div>

                    {/* Wholesale Tiers Table */}
                    {prod.pricingTiers && prod.pricingTiers.length > 0 && (
                      <div className="pt-3 border-t border-emerald-200/70 space-y-2">
                        <div className="flex items-center justify-between text-xs font-extrabold text-emerald-950">
                          <span className="flex items-center gap-1.5">
                            <Tag className="w-3.5 h-3.5 text-emerald-700" />
                            <span>جدول خصومات أسعار الجملة:</span>
                          </span>
                          <span className="text-[11px] text-emerald-700 font-normal">تُطبق تلقائياً حسب الكمية</span>
                        </div>

                        <div className="space-y-1.5">
                          {prod.pricingTiers.map((tier, idx) => {
                            const isCurrent =
                              modalQty >= tier.minQuantity &&
                              (tier.maxQuantity ? modalQty <= tier.maxQuantity : true);
                            return (
                              <div
                                key={idx}
                                className={`px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-smooth ${
                                  isCurrent
                                    ? 'bg-emerald-600 text-white font-black shadow-sm ring-2 ring-emerald-600/30'
                                    : 'bg-white/90 text-slate-700 border border-emerald-100 font-medium'
                                }`}
                              >
                                <span>
                                  من {tier.minQuantity} {tier.maxQuantity ? `إلى ${tier.maxQuantity}` : 'فأكثر'} وحدة:
                                </span>
                                <span className={`font-black ${isCurrent ? 'text-white' : 'text-emerald-800'}`}>
                                  {parseFloat(tier.price).toFixed(2)} ج.م
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Quantity Stepper & Calculation */}
                  {!isOutOfStock && (
                    <div className="space-y-3 pt-1">
                      <label className="block text-xs font-bold text-slate-700">حدد الكمية المطلوبة:</label>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center border-2 border-slate-200 rounded-2xl bg-slate-50 p-1">
                          <button
                            type="button"
                            disabled={modalQty <= minQty}
                            onClick={() => setModalQty((q) => Math.max(minQty, q - 1))}
                            className="w-9 h-9 flex items-center justify-center text-slate-700 hover:bg-white rounded-xl transition-smooth disabled:opacity-30"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <input
                            type="number"
                            min={minQty}
                            max={prod.stockQuantity}
                            value={modalQty}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10);
                              if (!isNaN(val)) {
                                setModalQty(Math.min(prod.stockQuantity, Math.max(minQty, val)));
                              }
                            }}
                            className="w-16 text-center bg-transparent text-sm font-black text-slate-900 focus:outline-none"
                          />
                          <button
                            type="button"
                            disabled={modalQty >= prod.stockQuantity}
                            onClick={() => setModalQty((q) => Math.min(prod.stockQuantity, q + 1))}
                            className="w-9 h-9 flex items-center justify-center text-slate-700 hover:bg-white rounded-xl transition-smooth disabled:opacity-30"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Live Total Display */}
                        <div className="flex-1 text-left bg-slate-50 p-2.5 rounded-2xl border border-slate-200">
                          <span className="text-[10px] text-slate-400 block">
                            إجمالي المبلغ ({modalQty} وحدة × {unitPrice.toFixed(2)}):
                          </span>
                          <div className="text-base font-black text-emerald-700">
                            {total.toFixed(2)} ج.م
                          </div>
                        </div>
                      </div>

                      {isWholesaleApplied && (
                        <div className="p-2 bg-emerald-100/70 border border-emerald-300 rounded-xl text-[11px] font-bold text-emerald-900 flex items-center gap-1.5 animate-fade-in">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                          <span>سعر الجملة مفعل! توفير إجمالي: {savings.toFixed(2)} ج.م</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
                    <button
                      type="button"
                      disabled={isOutOfStock}
                      onClick={() => {
                        addToCart(prod, modalQty);
                        setJustAddedFeedback(true);
                        setTimeout(() => setJustAddedFeedback(false), 2000);
                      }}
                      className={`w-full sm:flex-1 py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-smooth shadow-md ${
                        isOutOfStock
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          : justAddedFeedback
                          ? 'bg-emerald-800 text-white'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/25'
                      }`}
                    >
                      {justAddedFeedback ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-300" />
                          <span>تمت الإضافة للسلة بنجاح!</span>
                        </>
                      ) : (
                        <>
                          <ShoppingBag className="w-4 h-4" />
                          <span>{isOutOfStock ? 'المنتج غير متوفر' : 'إضافة إلى السلة'}</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      disabled={isOutOfStock}
                      onClick={() => {
                        addToCart(prod, modalQty);
                        setSelectedProductDetails(null);
                        onOpenCart();
                      }}
                      className="w-full sm:w-auto py-3 px-5 rounded-xl font-bold text-xs bg-slate-900 hover:bg-slate-800 text-white transition-smooth shadow-sm whitespace-nowrap"
                    >
                      متابعة الشراء
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
};
