import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Flame,
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Check,
  X,
  Package,
  Calendar,
  Percent,
  DollarSign,
  Upload,
  Image as ImageIcon,
  Tag,
  Clock,
  AlertCircle,
  RefreshCw,
  Search,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { api, getImageUrl } from '../services/api';
import { Modal, ConfirmModal } from './Modal';
import { SearchInput } from './SearchInput';

export const OffersManagementPanel = ({ showToast }) => {
  const queryClient = useQueryClient();

  const notify = (msg, type = 'info') => {
    if (typeof showToast === 'function') {
      try {
        showToast(msg, type);
      } catch (e) {
        console.log(msg);
      }
    }
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);
  const [expandedOfferId, setExpandedOfferId] = useState(null);

  // Add Product to Offer Modal
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [targetOfferForItems, setTargetOfferForItems] = useState(null);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [itemCustomPrice, setItemCustomPrice] = useState('');
  const [itemDiscountType, setItemDiscountType] = useState('PERCENTAGE');
  const [itemDiscountValue, setItemDiscountValue] = useState('');
  const [productSearch, setProductSearch] = useState('');

  // Edit Offer Item Modal
  const [editingItem, setEditingItem] = useState(null);
  const [editItemCustomPrice, setEditItemCustomPrice] = useState('');
  const [editItemDiscountType, setEditItemDiscountType] = useState('PERCENTAGE');
  const [editItemDiscountValue, setEditItemDiscountValue] = useState('');

  // Delete Confirm Modal
  const [deleteModalState, setDeleteModalState] = useState({
    isOpen: false,
    type: 'OFFER', // 'OFFER' or 'ITEM'
    targetId: null,
    secondaryId: null,
    title: '',
  });

  // Banner Upload state
  const [uploadingBannerOfferId, setUploadingBannerOfferId] = useState(null);

  // Form State for Offer Create/Edit
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    discountType: 'PERCENTAGE',
    discountValue: '',
    startDate: '',
    endDate: '',
    isActive: true,
    isVisible: true,
    displayOrder: 0,
  });

  // ── Queries ──
  const { data: offers = [], isLoading: isLoadingOffers, refetch: refetchOffers } = useQuery({
    queryKey: ['admin', 'offers'],
    queryFn: async () => {
      const res = await api.admin.getOffers();
      return res.success ? res.data : [];
    },
  });

  const { data: allProducts = [] } = useQuery({
    queryKey: ['admin', 'products'],
    queryFn: async () => {
      const res = await api.admin.getProducts();
      return res.success ? res.data : [];
    },
  });

  // ── Mutations ──
  const createOfferMutation = useMutation({
    mutationFn: (data) => api.admin.createOffer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'offers'] });
      queryClient.invalidateQueries({ queryKey: ['offers', 'public'] });
      setIsOfferModalOpen(false);
      resetForm();
      notify('تم إنشاء العرض بنجاح', 'success');
    },
    onError: (err) => {
      notify(err.message || 'فشل إنشاء العرض', 'error');
    },
  });

  const updateOfferMutation = useMutation({
    mutationFn: ({ id, data }) => api.admin.updateOffer(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'offers'] });
      queryClient.invalidateQueries({ queryKey: ['offers', 'public'] });
      setIsOfferModalOpen(false);
      resetForm();
      notify('تم تعديل العرض بنجاح', 'success');
    },
    onError: (err) => {
      notify(err.message || 'فشل تعديل العرض', 'error');
    },
  });

  const deleteOfferMutation = useMutation({
    mutationFn: (id) => api.admin.deleteOffer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'offers'] });
      queryClient.invalidateQueries({ queryKey: ['offers', 'public'] });
      setDeleteModalState({ isOpen: false, type: 'OFFER', targetId: null, secondaryId: null, title: '' });
      notify('تم حذف العرض بنجاح', 'success');
    },
    onError: (err) => {
      notify(err.message || 'فشل حذف العرض', 'error');
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: (id) => api.admin.toggleOffer(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'offers'] });
      queryClient.invalidateQueries({ queryKey: ['offers', 'public'] });
      notify(res.message || 'تم تحديث حالة العرض', 'success');
    },
  });

  const toggleVisibilityMutation = useMutation({
    mutationFn: (id) => api.admin.toggleOfferVisibility(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'offers'] });
      queryClient.invalidateQueries({ queryKey: ['offers', 'public'] });
      notify(res.message || 'تم تحديث ظهور العرض للعملاء', 'success');
    },
  });

  const addItemMutation = useMutation({
    mutationFn: ({ offerId, itemData }) => api.admin.addOfferItems(offerId, itemData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'offers'] });
      queryClient.invalidateQueries({ queryKey: ['offers', 'public'] });
      setIsAddItemModalOpen(false);
      setSelectedProductId('');
      setItemCustomPrice('');
      setItemDiscountValue('');
      notify('تمت إضافة المنتج للعرض بنجاح', 'success');
    },
    onError: (err) => {
      notify(err.message || 'فشل إضافة المنتج للعرض', 'error');
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: ({ offerId, itemId, data }) => api.admin.updateOfferItem(offerId, itemId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'offers'] });
      queryClient.invalidateQueries({ queryKey: ['offers', 'public'] });
      setEditingItem(null);
      notify('تم تعديل خصم المنتج بالعرض', 'success');
    },
    onError: (err) => {
      notify(err.message || 'فشل تعديل المنتج', 'error');
    },
  });

  const removeItemMutation = useMutation({
    mutationFn: ({ offerId, itemId }) => api.admin.removeOfferItem(offerId, itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'offers'] });
      queryClient.invalidateQueries({ queryKey: ['offers', 'public'] });
      setDeleteModalState({ isOpen: false, type: 'OFFER', targetId: null, secondaryId: null, title: '' });
      notify('تم حذف المنتج من العرض', 'success');
    },
    onError: (err) => {
      notify(err.message || 'فشل حذف المنتج من العرض', 'error');
    },
  });

  // ── Form Handlers ──
  const resetForm = () => {
    setEditingOffer(null);
    setFormData({
      title: '',
      description: '',
      discountType: 'PERCENTAGE',
      discountValue: '',
      startDate: '',
      endDate: '',
      isActive: true,
      isVisible: true,
      displayOrder: 0,
    });
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsOfferModalOpen(true);
  };

  const handleOpenEdit = (offer) => {
    setEditingOffer(offer);
    setFormData({
      title: offer.title || '',
      description: offer.description || '',
      discountType: offer.discountType || 'PERCENTAGE',
      discountValue: offer.discountValue ? parseFloat(offer.discountValue) : '',
      startDate: offer.startDate ? new Date(offer.startDate).toISOString().slice(0, 16) : '',
      endDate: offer.endDate ? new Date(offer.endDate).toISOString().slice(0, 16) : '',
      isActive: offer.isActive ?? true,
      isVisible: offer.isVisible ?? true,
      displayOrder: offer.displayOrder || 0,
    });
    setIsOfferModalOpen(true);
  };

  const handleSubmitOffer = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      notify('يرجى إدخال عنوان العرض', 'error');
      return;
    }

    const payload = {
      title: formData.title.trim(),
      description: formData.description.trim() || null,
      discountType: formData.discountValue ? formData.discountType : null,
      discountValue: formData.discountValue ? parseFloat(formData.discountValue) : null,
      startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
      endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
      isActive: formData.isActive,
      isVisible: formData.isVisible,
      displayOrder: parseInt(formData.displayOrder, 10) || 0,
    };

    if (editingOffer) {
      updateOfferMutation.mutate({ id: editingOffer.id, data: payload });
    } else {
      createOfferMutation.mutate(payload);
    }
  };

  const handleBannerFileChange = async (offerId, file) => {
    if (!file) return;
    try {
      setUploadingBannerOfferId(offerId);
      const fd = new FormData();
      fd.append('banner', file);
      const res = await api.admin.uploadOfferBanner(offerId, fd);
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: ['admin', 'offers'] });
        queryClient.invalidateQueries({ queryKey: ['offers', 'public'] });
        notify('تم رفع صورة البانر بنجاح', 'success');
      }
    } catch (err) {
      notify(err.message || 'فشل رفع صورة البانر', 'error');
    } finally {
      setUploadingBannerOfferId(null);
    }
  };

  const handleAddItemSubmit = (e) => {
    e.preventDefault();
    if (!selectedProductId) {
      notify('يرجى اختيار منتج لإضافته للعرض', 'error');
      return;
    }

    const itemData = {
      productId: selectedProductId,
      customPrice: itemCustomPrice ? parseFloat(itemCustomPrice) : null,
      discountType: itemDiscountValue ? itemDiscountType : null,
      discountValue: itemDiscountValue ? parseFloat(itemDiscountValue) : null,
    };

    addItemMutation.mutate({ offerId: targetOfferForItems.id, itemData });
  };

  const handleEditItemSubmit = (e) => {
    e.preventDefault();
    if (!editingItem) return;

    const updateData = {
      customPrice: editItemCustomPrice ? parseFloat(editItemCustomPrice) : null,
      discountType: editItemDiscountValue ? editItemDiscountType : null,
      discountValue: editItemDiscountValue ? parseFloat(editItemDiscountValue) : null,
    };

    updateItemMutation.mutate({
      offerId: editingItem.offerId,
      itemId: editingItem.id,
      data: updateData,
    });
  };

  // Filter offers by search query
  const filteredOffers = offers.filter((o) =>
    o.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in" dir="rtl">
      {/* ── Header Toolbar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-orange-50 via-amber-50 to-red-50 p-4 sm:p-6 rounded-3xl border border-orange-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-orange-600 text-white rounded-2xl shadow-sm">
              <Flame className="w-5 h-5" />
            </span>
            <h3 className="text-lg sm:text-xl font-black text-slate-900">إدارة العروض والخصومات</h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            أنشئ عروضاً خاصة، وحدد المنتجات، وقم بإظهار أو إخفاء صفحة وعناصر العروض من المتجر بنقرة واحدة
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => refetchOffers()}
            className="p-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-2xl text-xs font-bold transition-smooth"
            title="تحديث البيانات"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingOffers ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="px-5 py-2.5 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-black text-xs sm:text-sm rounded-2xl transition-smooth shadow-md shadow-orange-600/30 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>إنشاء عرض جديد</span>
          </button>
        </div>
      </div>

      {/* ── Search Bar ── */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            onClear={() => setSearchQuery('')}
            placeholder="ابحث في العروض..."
            ariaLabel="البحث في العروض"
            accent="orange"
            size="md"
          />
        </div>
        <div className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-2.5 rounded-2xl">
          إجمالي: {offers.length} عرض
        </div>
      </div>

      {/* ── Offers List ── */}
      {isLoadingOffers ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-slate-100 rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : filteredOffers.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-slate-200 p-8 space-y-3">
          <Flame className="w-12 h-12 text-slate-300 mx-auto" />
          <h4 className="font-black text-slate-700 text-base">لا توجد عروض مسجلة</h4>
          <p className="text-xs text-slate-400">انقر على زر "إنشاء عرض جديد" لإضافة أول عرض لمتجرك</p>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl transition-smooth"
          >
            + إنشاء عرض جديد
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOffers.map((offer) => {
            const isExpanded = expandedOfferId === offer.id;
            const itemsCount = offer.items?.length || 0;

            return (
              <div
                key={offer.id}
                className={`bg-white rounded-3xl border transition-all overflow-hidden ${
                  !offer.isActive
                    ? 'border-slate-200 bg-slate-50/60 opacity-80'
                    : !offer.isVisible
                    ? 'border-amber-300 bg-amber-50/20'
                    : 'border-orange-200 hover:border-orange-300 shadow-sm'
                }`}
              >
                {/* Offer Header Row */}
                <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left: Banner Thumbnail + Title & Dates */}
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    {/* Banner / Placeholder */}
                    <div className="w-16 h-16 rounded-2xl bg-orange-100 border border-orange-200 overflow-hidden shrink-0 flex items-center justify-center relative group">
                      {offer.bannerUrl ? (
                        <img
                          src={getImageUrl(offer.bannerUrl)}
                          alt={offer.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Flame className="w-7 h-7 text-orange-500" />
                      )}

                      {/* Upload overlay */}
                      <label
                        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-smooth flex items-center justify-center cursor-pointer text-white"
                        title="تغيير صورة البانر"
                      >
                        <Upload className="w-4 h-4" />
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleBannerFileChange(offer.id, e.target.files?.[0])}
                        />
                      </label>
                    </div>

                    {/* Details */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-black text-base text-slate-900 truncate">{offer.title}</h4>

                        {/* Status Badges */}
                        {offer.isActive ? (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            مفعّل
                          </span>
                        ) : (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">
                            معطل
                          </span>
                        )}

                        {offer.isVisible ? (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 flex items-center gap-1">
                            <Eye className="w-3 h-3" /> ظاهر للعملاء
                          </span>
                        ) : (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 flex items-center gap-1">
                            <EyeOff className="w-3 h-3" /> مخفي عن العملاء
                          </span>
                        )}

                        {offer.discountValue && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                            خصم {offer.discountValue}{offer.discountType === 'PERCENTAGE' ? '%' : ' ج.م'}
                          </span>
                        )}
                      </div>

                      {offer.description && (
                        <p className="text-xs text-slate-500 mt-1 line-clamp-1">{offer.description}</p>
                      )}

                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 mt-1.5">
                        <span>الترتيب: #{offer.displayOrder}</span>
                        {offer.startDate && (
                          <span>من: {new Date(offer.startDate).toLocaleDateString('ar-EG')}</span>
                        )}
                        {offer.endDate && (
                          <span className="text-orange-600 font-bold">
                            حتى: {new Date(offer.endDate).toLocaleDateString('ar-EG')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Controls & Actions */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {/* Toggle Active Button */}
                    <button
                      type="button"
                      onClick={() => toggleActiveMutation.mutate(offer.id)}
                      disabled={toggleActiveMutation.isPending}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-smooth flex items-center gap-1.5 ${
                        offer.isActive
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                      }`}
                      title={offer.isActive ? 'إيقاف تفعيل العرض' : 'تفعيل العرض'}
                    >
                      {offer.isActive ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                      <span>{offer.isActive ? 'مفعّل' : 'معطّل'}</span>
                    </button>

                    {/* Toggle Visibility (Show / Hide) */}
                    <button
                      type="button"
                      onClick={() => toggleVisibilityMutation.mutate(offer.id)}
                      disabled={toggleVisibilityMutation.isPending}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-smooth flex items-center gap-1.5 ${
                        offer.isVisible
                          ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                          : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                      }`}
                      title={offer.isVisible ? 'إخفاء العرض عن العملاء' : 'إظهار العرض للعملاء'}
                    >
                      {offer.isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      <span>{offer.isVisible ? 'ظاهر' : 'مخفي'}</span>
                    </button>

                    {/* Items Count & Expand */}
                    <button
                      type="button"
                      onClick={() => setExpandedOfferId(isExpanded ? null : offer.id)}
                      className="px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-800 border border-orange-200 rounded-xl text-xs font-black transition-smooth flex items-center gap-1.5"
                    >
                      <Package className="w-3.5 h-3.5" />
                      <span>{itemsCount} منتج</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    {/* Edit */}
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(offer)}
                      className="p-2 text-slate-600 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-smooth"
                      title="تعديل العرض"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() =>
                        setDeleteModalState({
                          isOpen: true,
                          type: 'OFFER',
                          targetId: offer.id,
                          secondaryId: null,
                          title: `هل أنت متأكد من حذف العرض "${offer.title}"؟`,
                        })
                      }
                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-smooth"
                      title="حذف العرض"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Expanded Products Section */}
                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50/70 p-4 sm:p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-orange-600" />
                        <h5 className="font-black text-sm text-slate-800">
                          المنتجات المشمولة في هذا العرض ({itemsCount})
                        </h5>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setTargetOfferForItems(offer);
                          setSelectedProductId('');
                          setItemCustomPrice('');
                          setItemDiscountValue('');
                          setIsAddItemModalOpen(true);
                        }}
                        className="px-3.5 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-black transition-smooth flex items-center gap-1.5 shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>إضافة منتج لهذا العرض</span>
                      </button>
                    </div>

                    {itemsCount === 0 ? (
                      <div className="py-8 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
                        <Package className="w-8 h-8 text-slate-300 mx-auto mb-1" />
                        <p className="text-xs font-bold">لا توجد منتجات مضافة لهذا العرض بعد</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">انقر على "إضافة منتج" لإدراج منتجات بأسعار أو خصومات مخصصة</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {offer.items.map((item) => {
                          const prod = item.product;
                          if (!prod) return null;
                          const retail = parseFloat(prod.retailPrice) || 0;
                          let offerPriceText = '';

                          if (item.customPrice != null) {
                            offerPriceText = `سعر مخصص: ${parseFloat(item.customPrice).toFixed(2)} ج.م`;
                          } else if (item.discountValue != null) {
                            offerPriceText = `خصم: ${item.discountValue}${item.discountType === 'PERCENTAGE' ? '%' : ' ج.م'}`;
                          } else if (offer.discountValue != null) {
                            offerPriceText = `خصم العرض: ${offer.discountValue}${offer.discountType === 'PERCENTAGE' ? '%' : ' ج.م'}`;
                          } else {
                            offerPriceText = `السعر: ${retail.toFixed(2)} ج.م`;
                          }

                          return (
                            <div
                              key={item.id}
                              className="bg-white rounded-2xl p-3 border border-slate-200 flex items-center justify-between gap-3 shadow-xs"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
                                  {prod.imageUrl ? (
                                    <img
                                      src={getImageUrl(prod.imageUrl)}
                                      alt={prod.name}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <span className="text-xl">📦</span>
                                  )}
                                </div>

                                <div className="min-w-0">
                                  <h6 className="font-bold text-xs text-slate-900 truncate">{prod.name}</h6>
                                  <div className="text-[11px] text-slate-400">
                                    أصلي: <span className="line-through">{retail.toFixed(2)}</span> ج.م
                                  </div>
                                  <div className="text-[11px] font-black text-orange-600 truncate">
                                    {offerPriceText}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingItem({ ...item, offerId: offer.id });
                                    setEditItemCustomPrice(item.customPrice || '');
                                    setEditItemDiscountType(item.discountType || 'PERCENTAGE');
                                    setEditItemDiscountValue(item.discountValue || '');
                                  }}
                                  className="p-1.5 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-smooth"
                                  title="تعديل سعر / خصم المنتج"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    setDeleteModalState({
                                      isOpen: true,
                                      type: 'ITEM',
                                      targetId: offer.id,
                                      secondaryId: item.id,
                                      title: `هل تريد إزالة المنتج "${prod.name}" من هذا العرض؟`,
                                    })
                                  }
                                  className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-smooth"
                                  title="إزالة من العرض"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modal: Create / Edit Offer ── */}
      <Modal
        isOpen={isOfferModalOpen}
        onClose={() => setIsOfferModalOpen(false)}
        className="max-w-xl"
      >
        <div className="p-6 bg-white rounded-3xl text-right space-y-5" dir="rtl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-600" />
              <span>{editingOffer ? 'تعديل بيانات العرض' : 'إنشاء عرض ترويجي جديد'}</span>
            </h3>
            <button
              type="button"
              onClick={() => setIsOfferModalOpen(false)}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmitOffer} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                عنوان العرض <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="مثال: عرض نهاية الأسبوع - خصومات الشتاء"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">وصف تفصيلي للعرض</label>
              <textarea
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="أضف وصفاً جذاباً يوضح تفاصيل العرض للعملاء..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              />
            </div>

            {/* Global Discount Settings for Offer */}
            <div className="p-4 rounded-2xl bg-orange-50/70 border border-orange-200/80 space-y-3">
              <span className="text-xs font-black text-orange-950 block">خصم العرض العام (اختياري يُطبق على جميع منتجات العرض):</span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">نوع الخصم</label>
                  <select
                    value={formData.discountType}
                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white"
                  >
                    <option value="PERCENTAGE">نسبة مئوية (%)</option>
                    <option value="FIXED_AMOUNT">مبلغ ثابت (ج.م)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">قيمة الخصم</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                    placeholder="مثال: 15 أو 50"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Date Range for Countdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">تاريخ البدء (اختياري)</label>
                <input
                  type="datetime-local"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-700"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">تاريخ الانتهاء (للعداد التنازلي)</label>
                <input
                  type="datetime-local"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-700"
                />
              </div>
            </div>

            {/* Toggles */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <label className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-orange-600 rounded"
                />
                <span className="text-xs font-bold text-slate-700">تفعيل العرض</span>
              </label>

              <label className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isVisible}
                  onChange={(e) => setFormData({ ...formData, isVisible: e.target.checked })}
                  className="w-4 h-4 text-orange-600 rounded"
                />
                <span className="text-xs font-bold text-slate-700">إظهار للعملاء في المتجر</span>
              </label>
            </div>

            <div className="pt-3 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsOfferModalOpen(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={createOfferMutation.isPending || updateOfferMutation.isPending}
                className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-black shadow-md shadow-orange-600/25"
              >
                {editingOffer ? 'حفظ التعديلات' : 'إنشاء العرض'}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* ── Modal: Add Product to Offer ── */}
      <Modal
        isOpen={isAddItemModalOpen}
        onClose={() => setIsAddItemModalOpen(false)}
        className="max-w-md"
      >
        <div className="p-6 bg-white rounded-3xl text-right space-y-4" dir="rtl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h4 className="font-black text-slate-900 text-sm flex items-center gap-2">
              <Package className="w-4 h-4 text-orange-600" />
              <span>إضافة منتج إلى "{targetOfferForItems?.title}"</span>
            </h4>
            <button
              type="button"
              onClick={() => setIsAddItemModalOpen(false)}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleAddItemSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">اختر المنتج</label>
              <select
                required
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-white"
              >
                <option value="">-- اضغط لاختيار منتج من القائمة --</option>
                {allProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (السعر الأصلي: {parseFloat(p.retailPrice).toFixed(2)} ج.م)
                  </option>
                ))}
              </select>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <span className="text-xs font-black text-slate-800 block">حدد سعر العرض أو الخصم الخاص:</span>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  1. تحديد سعر ثابت بديل للقطعة (ج.م)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={itemCustomPrice}
                  onChange={(e) => setItemCustomPrice(e.target.value)}
                  placeholder="مثال: 99.00 بدلاً من 150"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white"
                />
              </div>

              <div className="text-center text-[10px] text-slate-400 font-bold">— أو —</div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">نوع الخصم</label>
                  <select
                    value={itemDiscountType}
                    onChange={(e) => setItemDiscountType(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs bg-white"
                  >
                    <option value="PERCENTAGE">نسبة مئوية (%)</option>
                    <option value="FIXED_AMOUNT">مبلغ خصم (ج.م)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">قيمة الخصم</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={itemDiscountValue}
                    onChange={(e) => setItemDiscountValue(e.target.value)}
                    placeholder="مثال: 20"
                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs bg-white"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAddItemModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={addItemMutation.isPending}
                className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-black shadow-md shadow-orange-600/25"
              >
                إضافة المنتج للعرض
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* ── Modal: Edit Offer Item ── */}
      <Modal
        isOpen={Boolean(editingItem)}
        onClose={() => setEditingItem(null)}
        className="max-w-md"
      >
        {editingItem && (
          <div className="p-6 bg-white rounded-3xl text-right space-y-4" dir="rtl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="font-black text-slate-900 text-sm">
                تعديل سعر العرض لـ "{editingItem.product?.name}"
              </h4>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditItemSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">سعر بديل للقطعة (ج.م)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editItemCustomPrice}
                  onChange={(e) => setEditItemCustomPrice(e.target.value)}
                  placeholder="اتركه فارغاً إذا أردت استخدام نسبة الخصم"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">نوع الخصم</label>
                  <select
                    value={editItemDiscountType}
                    onChange={(e) => setEditItemDiscountType(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-200 text-xs"
                  >
                    <option value="PERCENTAGE">نسبة مئوية (%)</option>
                    <option value="FIXED_AMOUNT">مبلغ خصم (ج.م)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">قيمة الخصم</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editItemDiscountValue}
                    onChange={(e) => setEditItemDiscountValue(e.target.value)}
                    placeholder="مثال: 15"
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={updateItemMutation.isPending}
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-black shadow-md shadow-orange-600/25"
                >
                  حفظ التعديلات
                </button>
              </div>
            </form>
          </div>
        )}
      </Modal>

      {/* ── Modal: Delete Confirm ── */}
      <ConfirmModal
        isOpen={deleteModalState.isOpen}
        onClose={() => setDeleteModalState({ ...deleteModalState, isOpen: false })}
        onConfirm={() => {
          if (deleteModalState.type === 'OFFER') {
            deleteOfferMutation.mutate(deleteModalState.targetId);
          } else {
            removeItemMutation.mutate({
              offerId: deleteModalState.targetId,
              itemId: deleteModalState.secondaryId,
            });
          }
        }}
        title="تأكيد الحذف"
        message={deleteModalState.title}
        confirmText="نعم، احذف"
        cancelText="إلغاء"
        isDanger
      />
    </div>
  );
};
