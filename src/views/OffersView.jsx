import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Flame,
  Tag,
  Clock,
  Sparkles,
  ShoppingBag,
  Percent,
  Check,
  Plus,
  Minus,
  Eye,
  ExternalLink,
  X,
  AlertCircle,
  Package,
  ArrowRight,
  TrendingDown,
  Gift,
} from 'lucide-react';
import { api, getImageUrl } from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/Modal';

// Countdown Timer Component
const OfferCountdown = ({ endDate }) => {
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    if (!endDate) return;

    const calcTime = () => {
      const diff = new Date(endDate).getTime() - new Date().getTime();
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: true });
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);
      setTimeLeft({ days, hours, minutes, seconds, expired: false });
    };

    calcTime();
    const interval = setInterval(calcTime, 1000);
    return () => clearInterval(interval);
  }, [endDate]);

  if (!timeLeft) return null;
  if (timeLeft.expired) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-100/90 text-red-700 text-xs font-bold rounded-full">
        <Clock className="w-3.5 h-3.5" />
        انتهى العرض
      </span>
    );
  }

  return (
    <div className="flex items-center gap-1.5 text-xs font-bold text-orange-950 bg-orange-100/80 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-orange-200 shadow-sm" dir="ltr">
      <div className="flex items-center gap-1">
        <span className="bg-orange-600 text-white px-1.5 py-0.5 rounded-md font-mono text-[11px]">{String(timeLeft.seconds).padStart(2, '0')}</span>
        <span>:</span>
        <span className="bg-orange-600 text-white px-1.5 py-0.5 rounded-md font-mono text-[11px]">{String(timeLeft.minutes).padStart(2, '0')}</span>
        <span>:</span>
        <span className="bg-orange-600 text-white px-1.5 py-0.5 rounded-md font-mono text-[11px]">{String(timeLeft.hours).padStart(2, '0')}</span>
        {timeLeft.days > 0 && (
          <>
            <span>:</span>
            <span className="bg-orange-600 text-white px-1.5 py-0.5 rounded-md font-mono text-[11px]">{timeLeft.days}d</span>
          </>
        )}
      </div>
      <Clock className="w-3.5 h-3.5 text-orange-600 ml-1" />
      <span className="text-[11px] text-orange-800 font-bold" dir="rtl">متبقي:</span>
    </div>
  );
};

export const OffersView = ({ onOpenCart }) => {
  const { addToCart } = useCart();
  const { isTrader } = useAuth();

  const [selectedOfferId, setSelectedOfferId] = useState('ALL');
  const [selectedProductDetails, setSelectedProductDetails] = useState(null);
  const [modalQty, setModalQty] = useState(1);
  const [qtyMap, setQtyMap] = useState({});
  const [justAddedMap, setJustAddedMap] = useState({});

  // Fetch public offers
  const { data: offers = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['offers', 'public'],
    queryFn: async () => {
      const res = await api.getOffers();
      if (res && res.success && res.data) {
        return res.data;
      }
      return [];
    },
    staleTime: 10 * 1000,
  });

  // Calculate effective offer price for an item
  const getItemPricing = (offer, item) => {
    const product = item.product || {};
    const retail = parseFloat(product.retailPrice) || 0;
    let finalPrice = retail;
    let discountLabel = '';
    let savings = 0;

    // 1. Custom price set on item
    if (item.customPrice != null) {
      finalPrice = parseFloat(item.customPrice);
    }
    // 2. Specific discount on item
    else if (item.discountType && item.discountValue != null) {
      const val = parseFloat(item.discountValue);
      if (item.discountType === 'PERCENTAGE') {
        finalPrice = retail - (retail * val) / 100;
        discountLabel = `${val}%`;
      } else {
        finalPrice = Math.max(0, retail - val);
        discountLabel = `${val} ج.م`;
      }
    }
    // 3. Global offer discount
    else if (offer.discountType && offer.discountValue != null) {
      const val = parseFloat(offer.discountValue);
      if (offer.discountType === 'PERCENTAGE') {
        finalPrice = retail - (retail * val) / 100;
        discountLabel = `${val}%`;
      } else {
        finalPrice = Math.max(0, retail - val);
        discountLabel = `${val} ج.م`;
      }
    }

    finalPrice = Math.max(0, finalPrice);
    savings = Math.max(0, retail - finalPrice);

    if (!discountLabel && savings > 0 && retail > 0) {
      const pct = Math.round((savings / retail) * 100);
      discountLabel = `${pct}%`;
    }

    return {
      originalPrice: retail,
      finalPrice,
      savings,
      discountLabel,
    };
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

  const handleAddToCart = (product, offer, item, quantity) => {
    const pricing = getItemPricing(offer, item);
    // Add product to cart with custom offer unit price override
    const productWithOfferPrice = {
      ...product,
      retailPrice: pricing.finalPrice,
      isOfferItem: true,
      offerTitle: offer.title,
      originalPrice: pricing.originalPrice,
    };
    addToCart(productWithOfferPrice, quantity);

    setJustAddedMap((prev) => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setJustAddedMap((prev) => ({ ...prev, [product.id]: false }));
    }, 2000);
  };

  // Filter offers by selection
  const displayedOffers = useMemo(() => {
    if (selectedOfferId === 'ALL') return offers;
    return offers.filter((o) => o.id === selectedOfferId);
  }, [offers, selectedOfferId]);

  const totalOfferItemsCount = useMemo(() => {
    return offers.reduce((sum, o) => sum + (o.items?.length || 0), 0);
  }, [offers]);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in" dir="rtl">
        <div className="h-56 bg-gradient-to-r from-orange-200 via-amber-200 to-red-200 rounded-3xl animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-80 bg-slate-200 rounded-3xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-6 sm:space-y-10 animate-fade-in" dir="rtl">
      {/* ─── Hero Banner: Distinct Fiery Promotion Theme ─── */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-amber-600 via-orange-600 to-red-700 text-white p-6 sm:p-10 md:p-14 shadow-2xl shadow-orange-950/20">
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 border border-white/30 text-white text-xs font-black backdrop-blur-md shadow-sm">
            <Flame className="w-4 h-4 text-yellow-300 animate-bounce" />
            <span>عروض وتخفيضات بيت الجملة الكبرى</span>
            <span className="bg-yellow-400 text-slate-900 text-[10px] font-black px-2 py-0.5 rounded-full">خصومات حصرية</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight drop-shadow-md">
            وفّر أكتر مع أقوى العروض 🔥
          </h1>

          <p className="text-sm sm:text-base text-orange-100 leading-relaxed font-medium">
            تخفيضات فورية وأسعار استثنائية على منتجات مختارة بالجملة والقطاعي. الكميات محدودة والعروض سارية لفترة مؤقتة أو حتى نفاد الكمية!
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <div className="bg-black/25 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/20 flex items-center gap-2 text-xs font-bold">
              <Gift className="w-4 h-4 text-yellow-300" />
              <span>{offers.length} عروض نشطة حالياً</span>
            </div>
            <div className="bg-black/25 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/20 flex items-center gap-2 text-xs font-bold">
              <Tag className="w-4 h-4 text-yellow-300" />
              <span>{totalOfferItemsCount} منتج بتخفيضات خاصة</span>
            </div>
          </div>
        </div>

        {/* Decorative glowing balls */}
        <div className="absolute -left-12 -bottom-12 w-96 h-96 bg-yellow-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -right-12 -top-12 w-80 h-80 bg-red-500/30 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* ─── Empty State: When Admin has hidden or disabled all offers ─── */}
      {offers.length === 0 ? (
        <div className="py-20 text-center glass-card rounded-3xl p-8 max-w-xl mx-auto space-y-4 border border-orange-200 shadow-lg">
          <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto text-orange-600">
            <Flame className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-black text-slate-800">لا توجد عروض متاحة حالياً</h3>
          <p className="text-sm text-slate-500 leading-relaxed">
            يقوم فريق العمل بتجهيز باقة مميزة من العروض والخصومات الحصرية، انتظرونا قريباً أو تصفح باقي منتجات المتجر بأسعارها المعتادة.
          </p>
          <a
            href="/?tab=store"
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-2xl transition-smooth shadow-md shadow-emerald-600/25"
          >
            <Package className="w-4 h-4" />
            <span>تصفح كافة منتجات المتجر</span>
          </a>
        </div>
      ) : (
        <>
          {/* ─── Offer Filter Chips ─── */}
          {offers.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none" dir="rtl">
              <button
                type="button"
                onClick={() => setSelectedOfferId('ALL')}
                className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-smooth whitespace-nowrap flex items-center gap-2 ${
                  selectedOfferId === 'ALL'
                    ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-orange-50'
                }`}
              >
                <Flame className="w-4 h-4 text-orange-400" />
                <span>جميع العروض ({offers.length})</span>
              </button>

              {offers.map((offer) => (
                <button
                  key={offer.id}
                  type="button"
                  onClick={() => setSelectedOfferId(offer.id)}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-smooth whitespace-nowrap flex items-center gap-2 ${
                    selectedOfferId === offer.id
                      ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-orange-50'
                  }`}
                >
                  <Tag className="w-3.5 h-3.5" />
                  <span>{offer.title}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-black/10">
                    {offer.items?.length || 0}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* ─── Offers Sections ─── */}
          <div className="space-y-12">
            {displayedOffers.map((offer) => (
              <div
                key={offer.id}
                className="bg-white rounded-3xl border-2 border-orange-200/80 shadow-xl overflow-hidden hover:border-orange-400 transition-smooth"
              >
                {/* Offer Section Header */}
                <div className="bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-red-500/10 p-5 sm:p-7 border-b border-orange-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="px-2.5 py-1 rounded-xl bg-orange-600 text-white text-xs font-black flex items-center gap-1 shadow-sm">
                        <Flame className="w-3.5 h-3.5" />
                        عرض خاص
                      </span>
                      <h2 className="text-xl sm:text-2xl font-black text-slate-900">{offer.title}</h2>
                      {offer.discountValue && (
                        <span className="px-2.5 py-1 rounded-xl bg-red-100 text-red-700 border border-red-200 text-xs font-black">
                          خصم إضافي {offer.discountValue}{offer.discountType === 'PERCENTAGE' ? '%' : ' ج.م'}
                        </span>
                      )}
                    </div>
                    {offer.description && (
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-3xl">
                        {offer.description}
                      </p>
                    )}
                  </div>

                  {/* Countdown Timer if endDate set */}
                  {offer.endDate && <OfferCountdown endDate={offer.endDate} />}
                </div>

                {/* Banner if available */}
                {offer.bannerUrl && (
                  <div className="w-full max-h-64 overflow-hidden border-b border-orange-100">
                    <img
                      src={getImageUrl(offer.bannerUrl)}
                      alt={offer.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Offer Products Grid */}
                <div className="p-4 sm:p-6 lg:p-8 bg-slate-50/50">
                  {(!offer.items || offer.items.length === 0) ? (
                    <div className="py-12 text-center text-slate-400">
                      <Package className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                      <p className="font-bold text-sm">سيتم إضافة منتجات هذا العرض قريباً</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {offer.items.map((item) => {
                        const product = item.product;
                        if (!product) return null;

                        const minQty = isTrader
                          ? product.minOrderQtyWholesale || 1
                          : product.minOrderQtyRetail || 1;
                        const currentQty = getQty(product);
                        const isOutOfStock = product.stockQuantity <= 0;
                        const pricing = getItemPricing(offer, item);
                        const isAdded = justAddedMap[product.id];

                        return (
                          <div
                            key={item.id}
                            className="bg-white rounded-3xl overflow-hidden border-2 border-orange-100 hover:border-orange-400 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group relative"
                          >
                            {/* Discount Ribbons / Badges */}
                            <div className="absolute top-3 right-3 z-10 flex flex-col gap-1 items-end pointer-events-none">
                              {pricing.discountLabel && (
                                <span className="bg-red-600 text-white font-black text-xs px-2.5 py-1 rounded-full shadow-md flex items-center gap-1 animate-pulse">
                                  <Percent className="w-3 h-3" />
                                  <span>خصم {pricing.discountLabel}</span>
                                </span>
                              )}
                              {pricing.savings > 0 && (
                                <span className="bg-amber-500 text-white font-black text-[10px] px-2 py-0.5 rounded-full shadow-sm">
                                  وفرت {pricing.savings.toFixed(2)} ج.م
                                </span>
                              )}
                            </div>

                            {/* Product Image */}
                            <div
                              onClick={() => {
                                setSelectedProductDetails({ product, offer, item, pricing });
                                setModalQty(currentQty);
                              }}
                              className="relative h-48 bg-gradient-to-b from-orange-50/50 to-slate-100 flex items-center justify-center overflow-hidden cursor-pointer select-none"
                            >
                              {product.imageUrl ? (
                                <img
                                  src={getImageUrl(product.imageUrl)}
                                  alt={product.name}
                                  className="w-full h-full object-cover group-hover:scale-108 transition-smooth duration-500"
                                />
                              ) : (
                                <span className="text-5xl group-hover:scale-110 transition-smooth">
                                  📦
                                </span>
                              )}

                              <div className="absolute inset-0 bg-slate-950/20 opacity-0 group-hover:opacity-100 transition-smooth flex items-center justify-center">
                                <span className="bg-white/95 text-slate-900 text-xs font-black px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
                                  <Eye className="w-3.5 h-3.5 text-orange-600" />
                                  <span>عرض التفاصيل</span>
                                </span>
                              </div>

                              {/* Category pill */}
                              <div className="absolute bottom-2 left-2 bg-slate-900/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                                {product.category?.name || 'قسم عام'}
                              </div>
                            </div>

                            {/* Details Body */}
                            <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                              <div>
                                <h3
                                  onClick={() => {
                                    setSelectedProductDetails({ product, offer, item, pricing });
                                    setModalQty(currentQty);
                                  }}
                                  className="font-black text-sm text-slate-900 line-clamp-1 group-hover:text-orange-600 transition-smooth cursor-pointer"
                                >
                                  {product.name}
                                </h3>
                                <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                                  {product.description || 'منتج عالي الجودة متاح ضمن عروض بيت الجملة الحصرية'}
                                </p>
                              </div>

                              {/* Pricing Box - Strikethrough & Big Discount Price */}
                              <div className="p-2.5 rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50/60 border border-orange-200/80 space-y-1">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-slate-400 font-bold">السعر قبل العرض:</span>
                                  <span className="line-through text-slate-400 font-bold">
                                    {pricing.originalPrice.toFixed(2)} ج.م
                                  </span>
                                </div>
                                <div className="flex items-baseline justify-between pt-0.5">
                                  <span className="text-xs font-black text-orange-800">سعر العرض:</span>
                                  <div className="text-lg font-black text-red-600">
                                    {pricing.finalPrice.toFixed(2)}{' '}
                                    <span className="text-[10px] font-bold text-slate-600">ج.م</span>
                                  </div>
                                </div>
                              </div>

                              {/* Stepper + Add to Cart */}
                              <div className="pt-1 flex items-center gap-2">
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
                                    className="w-10 text-center bg-transparent text-xs font-black focus:outline-none"
                                  />
                                  <button
                                    disabled={isOutOfStock || currentQty >= product.stockQuantity}
                                    onClick={() => handleQtyChange(product.id, currentQty + 1, minQty)}
                                    className="p-1 text-slate-600 hover:bg-white rounded-lg transition-smooth disabled:opacity-40"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                <button
                                  disabled={isOutOfStock}
                                  onClick={() => handleAddToCart(product, offer, item, currentQty)}
                                  className={`flex-1 py-2 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition-smooth ${
                                    isOutOfStock
                                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                      : isAdded
                                      ? 'bg-emerald-600 text-white shadow-md'
                                      : 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white shadow-md shadow-orange-600/30'
                                  }`}
                                >
                                  {isAdded ? (
                                    <>
                                      <Check className="w-3.5 h-3.5" />
                                      <span>تمت الإضافة!</span>
                                    </>
                                  ) : (
                                    <>
                                      <ShoppingBag className="w-3.5 h-3.5" />
                                      <span>{isOutOfStock ? 'نفد المخزون' : 'أضف بالعرض'}</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── Expanded Offer Product Modal ── */}
      <Modal
        isOpen={Boolean(selectedProductDetails)}
        onClose={() => setSelectedProductDetails(null)}
        className="max-w-2xl"
      >
        {selectedProductDetails && (() => {
          const { product, offer, item, pricing } = selectedProductDetails;
          const minQty = isTrader
            ? product.minOrderQtyWholesale || 1
            : product.minOrderQtyRetail || 1;
          const isOutOfStock = product.stockQuantity <= 0;
          const totalDiscounted = pricing.finalPrice * modalQty;
          const totalOriginal = pricing.originalPrice * modalQty;
          const totalSaved = (pricing.originalPrice - pricing.finalPrice) * modalQty;

          return (
            <div className="bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-200 text-right p-6 space-y-6" dir="rtl">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="bg-orange-600 text-white px-2.5 py-1 rounded-xl text-xs font-black flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5" />
                    عرض: {offer.title}
                  </span>
                  {pricing.discountLabel && (
                    <span className="bg-red-100 text-red-700 px-2.5 py-1 rounded-xl text-xs font-black">
                      خصم {pricing.discountLabel}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedProductDetails(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-smooth"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="aspect-square rounded-2xl bg-orange-50/50 border border-orange-100 overflow-hidden flex items-center justify-center">
                  {product.imageUrl ? (
                    <img
                      src={getImageUrl(product.imageUrl)}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-7xl">📦</span>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-black text-slate-900">{product.name}</h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      {product.description || 'منتج عالي الجودة مشمول ضمن باقة عروض وتخفيضات بيت الجملة.'}
                    </p>
                  </div>

                  {/* Pricing Breakdown */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50/80 border border-orange-200 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">السعر الأصلي:</span>
                      <span className="line-through text-slate-400 font-bold">{pricing.originalPrice.toFixed(2)} ج.م</span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs font-black text-orange-900">سعر العرض للقطعة:</span>
                      <span className="text-2xl font-black text-red-600">{pricing.finalPrice.toFixed(2)} ج.م</span>
                    </div>
                    {totalSaved > 0 && (
                      <div className="pt-2 border-t border-orange-200/60 flex justify-between text-xs font-black text-emerald-700">
                        <span>إجمالي التوفير:</span>
                        <span>{totalSaved.toFixed(2)} ج.م 🔥</span>
                      </div>
                    )}
                  </div>

                  {/* Quantity Stepper */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 p-1">
                      <button
                        type="button"
                        disabled={modalQty <= minQty}
                        onClick={() => setModalQty((q) => Math.max(minQty, q - 1))}
                        className="w-8 h-8 flex items-center justify-center text-slate-700 hover:bg-white rounded-lg transition-smooth disabled:opacity-30"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <input
                        type="number"
                        min={minQty}
                        max={product.stockQuantity}
                        value={modalQty}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          if (!isNaN(val)) setModalQty(Math.max(minQty, Math.min(product.stockQuantity, val)));
                        }}
                        className="w-12 text-center bg-transparent text-sm font-black focus:outline-none"
                      />
                      <button
                        type="button"
                        disabled={modalQty >= product.stockQuantity}
                        onClick={() => setModalQty((q) => Math.min(product.stockQuantity, q + 1))}
                        className="w-8 h-8 flex items-center justify-center text-slate-700 hover:bg-white rounded-lg transition-smooth disabled:opacity-30"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex-1 text-left bg-slate-50 p-2 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-400 block">الإجمالي بعد الخصم:</span>
                      <span className="text-sm font-black text-red-600">{totalDiscounted.toFixed(2)} ج.م</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isOutOfStock}
                    onClick={() => {
                      handleAddToCart(product, offer, item, modalQty);
                      setSelectedProductDetails(null);
                      if (onOpenCart) onOpenCart();
                    }}
                    className="w-full py-3 px-4 rounded-xl font-black text-xs bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white shadow-lg shadow-orange-600/30 transition-smooth flex items-center justify-center gap-2"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>أضف إلى السلة واستكمل الشراء</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
};
