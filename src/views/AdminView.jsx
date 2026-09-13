import React, { useState, useEffect } from 'react';
import {
  Package,
  Layers,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
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

const SortableCategoryItem = ({
  category,
  index,
  onEdit,
  onDelete,
  onToggleActive,
  isToggling,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.6 : 1,
  };

  const productCount = category._count?.products || 0;
  const hasProducts = productCount > 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`glass-card p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
        isDragging
          ? 'border-purple-500 shadow-xl bg-purple-50/90 scale-[1.01]'
          : category.isActive
          ? 'border-slate-200 hover:border-slate-300 bg-white'
          : 'border-slate-200 bg-slate-50/70 opacity-85'
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          {...attributes}
          {...listeners}
          title="اسحب لإعادة الترتيب"
          className="cursor-grab active:cursor-grabbing p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-smooth touch-none"
        >
          <GripVertical className="w-5 h-5" />
        </button>

        <span className="w-7 h-7 rounded-xl bg-purple-50 text-purple-700 text-xs font-bold flex items-center justify-center shrink-0 border border-purple-100">
          {index + 1}
        </span>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-extrabold text-sm text-slate-900 truncate">
              {category.name}
            </h4>
            {!category.isActive && (
              <span className="text-[10px] bg-slate-200 text-slate-600 font-bold px-2 py-0.5 rounded-full">
                غير نشط
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 font-medium">
            الترتيب المعروض: #{category.displayOrder}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0 self-end sm:self-center">
        {/* Product Count Badge */}
        <span
          className={`text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 ${
            hasProducts
              ? 'bg-purple-100 text-purple-800'
              : 'bg-slate-100 text-slate-500'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          <span>{productCount} منتج</span>
        </span>

        {/* Active/Inactive Toggle Button */}
        <button
          type="button"
          onClick={() => onToggleActive(category)}
          disabled={isToggling}
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
          title="تعديل اسم القسم"
          className="p-2 text-slate-600 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-smooth"
        >
          <Edit2 className="w-4 h-4" />
        </button>

        {/* Delete Button with Tooltip */}
        <div className="relative group">
          <button
            type="button"
            onClick={() => onDelete(category)}
            disabled={hasProducts}
            title={
              hasProducts
                ? 'لا يمكن حذف قسم يحتوي على منتجات مرتبطة. يرجى نقل أو حذف تلك المنتجات أولاً'
                : 'حذف القسم'
            }
            className={`p-2 rounded-xl transition-smooth ${
              hasProducts
                ? 'text-slate-300 cursor-not-allowed bg-slate-50'
                : 'text-red-500 hover:text-red-700 hover:bg-red-50'
            }`}
          >
            <Trash2 className="w-4 h-4" />
          </button>
          {hasProducts && (
            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block z-20 w-52 p-2 bg-slate-900 text-white text-[11px] rounded-xl shadow-xl text-center pointer-events-none">
              لا يمكن حذف قسم يحتوي على منتجات مرتبطة ({productCount} منتج)
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const AdminView = ({ initialSubTab = 'orders' }) => {
  const [activeSubTab, setActiveSubTab] = useState(initialSubTab); // 'orders' | 'receipts' | 'products' | 'inventory' | 'traders'
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  // Data States
  const [orders, setOrders] = useState([]);
  const [pendingReceipts, setPendingReceipts] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [pendingTraders, setPendingTraders] = useState([]);

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

  const { refreshNotifications } = useNotifications();

  useEffect(() => {
    loadTabData(activeSubTab);
  }, [activeSubTab]);

  const loadTabData = async (tab) => {
    setIsLoading(true);
    try {
      if (tab === 'orders') {
        const res = await api.admin.getOrders();
        if (res.success) setOrders(res.data || []);
      } else if (tab === 'receipts') {
        const res = await api.admin.getPendingReceipts();
        if (res.success) setPendingReceipts(res.data || []);
      } else if (tab === 'products') {
        const [resProd, catRes] = await Promise.all([
          api.getProducts('limit=100'),
          api.admin.getCategories(),
        ]);
        if (resProd.success) setProducts(resProd.data || []);
        if (catRes.success) setCategories(catRes.data || []);
      } else if (tab === 'categories') {
        const catRes = await api.admin.getCategories();
        if (catRes.success) setCategories(catRes.data || []);
      } else if (tab === 'inventory') {
        const res = await api.admin.getLowStock();
        if (res.success) setLowStockProducts(res.data || []);
      } else if (tab === 'traders') {
        const res = await api.admin.getPendingTraders();
        if (res.success) setPendingTraders(res.data || []);
      }
    } catch (err) {
      console.error(`Failed to load ${tab}:`, err);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Category Management Actions ──────────────────────────────────────────
  const handleCategoryDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = categories.findIndex((c) => c.id === active.id);
    const newIndex = categories.findIndex((c) => c.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const newCategories = arrayMove(categories, oldIndex, newIndex).map((cat, idx) => ({
      ...cat,
      displayOrder: idx,
    }));

    setCategories(newCategories);

    try {
      await api.admin.reorderCategories(
        newCategories.map((cat, idx) => ({
          id: cat.id,
          displayOrder: idx,
        }))
      );
    } catch (err) {
      console.error('Failed to save reordered categories:', err);
      const res = await api.admin.getCategories();
      if (res.success) setCategories(res.data || []);
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
        const catRes = await api.admin.getCategories();
        if (catRes.success) setCategories(catRes.data || []);
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
        const catRes = await api.admin.getCategories();
        if (catRes.success) setCategories(catRes.data || []);
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
    setCategories((prev) =>
      prev.map((c) => (c.id === category.id ? { ...c, isActive: updatedStatus } : c))
    );
    try {
      const res = await api.admin.updateCategory(category.id, { isActive: updatedStatus });
      if (!res.success) {
        setCategories((prev) =>
          prev.map((c) => (c.id === category.id ? { ...c, isActive: !updatedStatus } : c))
        );
      }
    } catch (err) {
      console.error('Failed to update category status:', err);
      setCategories((prev) =>
        prev.map((c) => (c.id === category.id ? { ...c, isActive: !updatedStatus } : c))
      );
    } finally {
      setIsTogglingCategory(false);
    }
  };

  const handleDeleteCategory = (category) => {
    const productCount = category._count?.products || 0;
    if (productCount > 0) {
      alert('لا يمكن حذف قسم يحتوي على منتجات مرتبطة. يرجى نقل أو حذف تلك المنتجات أولاً');
      return;
    }
    setDeleteConfirmation({
      isOpen: true,
      title: 'حذف القسم',
      message: `هل أنت متأكد من رغبتك في حذف القسم "${category.name}" نهائياً؟`,
      confirmText: 'نعم، احذف القسم',
      isDanger: true,
      onConfirm: async () => {
        try {
          const res = await api.admin.deleteCategory(category.id);
          if (res.success) {
            setCategories((prev) => prev.filter((c) => c.id !== category.id));
          } else {
            alert(res.message || 'فشل حذف القسم');
          }
        } catch (err) {
          alert(err.message || 'فشل حذف القسم');
        } finally {
          setDeleteConfirmation((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  // ── Receipt Actions ────────────────────────────────────────────────────────
  const handleVerifyReceipt = async (orderId, action, reason = '') => {
    try {
      await api.admin.verifyReceipt(orderId, action, reason);
      setShowRejectModal(false);
      setSelectedReceipt(null);
      setRejectReason('');
      loadTabData('receipts');
      refreshNotifications();
    } catch (err) {
      alert(err.message || 'فشلت معالجة الإيصال');
    }
  };

  // ── Trader Actions ─────────────────────────────────────────────────────────
  const handleApproveTrader = async (userId) => {
    try {
      await api.admin.approveTrader(userId);
      loadTabData('traders');
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
      loadTabData('traders');
      refreshNotifications();
    } catch (err) {
      alert(err.message || 'فشل رفض التاجر');
    }
  };

  // ── Order Status & Payment Status Update ──────────────────────────────────
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
      loadTabData('orders');
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

    // Warning confirmation: if marking as DELIVERED while paymentStatus is PENDING for non-COD orders
    const isMarkingDelivered = newOrderStatus === 'DELIVERED';
    const isPaymentStillPending = newPaymentStatus === 'PENDING';
    const isNonCod = statusModalOrder.paymentMethod !== 'CASH_ON_DELIVERY';

    if (isMarkingDelivered && isPaymentStillPending && isNonCod) {
      setShowDeliveredWarning(true);
      return;
    }

    await executeUpdateOrderStatus();
  };

  // ── Order Payment Status Quick Action (e.g. COD Cash Collected) ───────────
  const handleMarkPaymentStatus = async (orderId, paymentStatus = 'PAID') => {
    try {
      await api.admin.updatePaymentStatus(orderId, paymentStatus);
      loadTabData('orders');
      if (statusModalOrder && statusModalOrder.id === orderId) {
        setStatusModalOrder((prev) => ({ ...prev, paymentStatus }));
        setNewPaymentStatus(paymentStatus);
      }
      refreshNotifications();
    } catch (err) {
      alert(err.message || 'فشل تحديث حالة الدفع');
    }
  };

  // ── Product CRUD & Form Handlers ──────────────────────────────────────────
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
      alert('الملف المحدد ليس صورة صالحة. يرجى اختيار ملف صورة.');
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

      // If an image file was selected, upload it to Cloudinary
      if (productImageFile && savedProduct?.id) {
        const formData = new FormData();
        formData.append('image', productImageFile);
        await api.admin.uploadProductImage(savedProduct.id, formData);
      }

      setShowProductModal(false);
      setEditingProduct(null);
      setProductImageFile(null);
      setProductImagePreview(null);
      setFormErrors({});
      loadTabData('products');
    } catch (err) {
      alert(err.message || 'فشل حفظ المنتج');
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
          alert(res.message);
          loadTabData('products');
        } catch (err) {
          alert(err.message || 'فشل حذف المنتج');
        } finally {
          setDeleteConfirmation((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const openAddProductModal = async () => {
    let cats = categories;
    if (!cats || cats.length === 0) {
      const catRes = await api.admin.getCategories();
      if (catRes.success && catRes.data) {
        cats = catRes.data;
        setCategories(cats);
      }
    }
    setEditingProduct(null);
    setProductImageFile(null);
    setProductImagePreview(null);
    setFormErrors({});
    setProductForm({
      name: '',
      sku: `SKU-${Date.now().toString().slice(-5)}`,
      description: '',
      categoryId: cats?.[0]?.id || '',
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

  const openEditProductModal = async (prod) => {
    if (!categories || categories.length === 0) {
      const catRes = await api.admin.getCategories();
      if (catRes.success && catRes.data) {
        setCategories(catRes.data);
      }
    }
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
          onClick={() => loadTabData(activeSubTab)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-smooth self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>تحديث البيانات</span>
        </button>
      </div>

      {/* Sub-Tabs Nav */}
      <div className="glass-card p-1.5 rounded-2xl flex items-center gap-1.5 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('orders')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-smooth flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === 'orders'
              ? 'bg-purple-700 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>إدارة الطلبات</span>
        </button>

        <button
          onClick={() => setActiveSubTab('receipts')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-smooth flex items-center gap-2 whitespace-nowrap relative ${
            activeSubTab === 'receipts'
              ? 'bg-purple-700 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>إيصالات التحويل البنكي المعلقة</span>
          {pendingReceipts.length > 0 && (
            <span className="bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
              {pendingReceipts.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('products')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-smooth flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === 'products'
              ? 'bg-purple-700 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>المنتجات والفئات السعرية</span>
        </button>

        <button
          onClick={() => setActiveSubTab('categories')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-smooth flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === 'categories'
              ? 'bg-purple-700 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FolderTree className="w-4 h-4" />
          <span>إدارة الأقسام</span>
          {categories.length > 0 && (
            <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
              {categories.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('inventory')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-smooth flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === 'inventory'
              ? 'bg-purple-700 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <span>نواقص المخزون</span>
          {lowStockProducts.length > 0 && (
            <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
              {lowStockProducts.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('traders')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-smooth flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === 'traders'
              ? 'bg-purple-700 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>طلبات اعتماد التجار</span>
          {pendingTraders.length > 0 && (
            <span className="bg-emerald-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
              {pendingTraders.length}
            </span>
          )}
        </button>
      </div>

      {/* ── SUB-TAB 1: ORDERS MANAGEMENT ───────────────────────────────────── */}
      {activeSubTab === 'orders' && (
        <div className="glass-card rounded-3xl border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-800">
              قائمة جميع الطلبات بالمنصة ({orders.length})
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-bold">
                <tr>
                  <th className="p-3">رقم الطلب</th>
                  <th className="p-3">العميل</th>
                  <th className="p-3">النوع</th>
                  <th className="p-3">طريقة الدفع</th>
                  <th className="p-3">حالة الطلب</th>
                  <th className="p-3">حالة الدفع</th>
                  <th className="p-3">الإجمالي</th>
                  <th className="p-3">التاريخ</th>
                  <th className="p-3 text-center">إجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/80 transition-smooth">
                    <td className="p-3 font-mono font-bold text-slate-900">#{o.orderNumber}</td>
                    <td className="p-3">
                      <div className="font-bold text-slate-800">{o.user?.name}</div>
                      <div className="text-[10px] text-slate-400">{o.user?.email}</div>
                    </td>
                    <td className="p-3">
                      <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-semibold text-slate-700">
                        {o.orderType === 'WHOLESALE' ? 'جملة' : 'قطاعي'}
                      </span>
                    </td>
                    <td className="p-3">
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
                    <td className="p-3">
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
                    <td className="p-3">
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
                    <td className="p-3 font-black text-emerald-700">{o.totalAmount} ج.م</td>
                    <td className="p-3 text-slate-500 text-[11px]">
                      {new Date(o.createdAt).toLocaleDateString('ar-EG')}
                    </td>
                    <td className="p-3 text-center">
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
          </div>
        </div>
      )}

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
                  <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                    <button
                      onClick={() => handleVerifyReceipt(order.id, 'APPROVE')}
                      className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-smooth flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <Check className="w-4 h-4" />
                      <span>اعتماد الإيصال وتأكيد الدفع</span>
                    </button>
                    <button
                      onClick={() => {
                        setSelectedReceipt(order);
                        setShowRejectModal(true);
                      }}
                      className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-bold transition-smooth flex items-center gap-1.5"
                    >
                      <X className="w-4 h-4" />
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
      {activeSubTab === 'products' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-800">كتالوج المنتجات والشرائح ({products.length})</h3>
            <button
              onClick={openAddProductModal}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-smooth shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة منتج جديد</span>
            </button>
          </div>

          <div className="glass-card rounded-3xl border border-slate-200 overflow-hidden">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-bold">
                <tr>
                  <th className="p-3">الصورة</th>
                  <th className="p-3">المنتج</th>
                  <th className="p-3">الـ SKU</th>
                  <th className="p-3">القسم</th>
                  <th className="p-3">سعر القطاعي</th>
                  <th className="p-3">المخزون الحالي</th>
                  <th className="p-3">حد التنبيه</th>
                  <th className="p-3">شرائح الجملة</th>
                  <th className="p-3 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-smooth">
                    <td className="p-3">
                      {p.imageUrl ? (
                        <img
                          src={getImageUrl(p.imageUrl)}
                          alt={p.name}
                          className="w-10 h-10 object-cover rounded-xl border border-slate-200 shadow-sm"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 text-base border border-slate-200">
                          📦
                        </div>
                      )}
                    </td>
                    <td className="p-3 font-bold text-slate-900">{p.name}</td>
                    <td className="p-3 font-mono text-slate-500">{p.sku}</td>
                    <td className="p-3 text-slate-700">{p.category?.name || 'عام'}</td>
                    <td className="p-3 font-bold text-slate-900">{p.retailPrice} ج.م</td>
                    <td className="p-3">
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
                    <td className="p-3 text-slate-500">{p.lowStockAlertAt} وحدة</td>
                    <td className="p-3 text-slate-600">
                      {p.pricingTiers?.length || 0} شريحة مسجلة
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => openEditProductModal(p)}
                          className="p-1.5 text-purple-700 hover:bg-purple-50 rounded-lg"
                          title="تعديل المنتج"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(p.id)}
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
          </div>
        </div>
      )}

      {/* ── SUB-TAB 4: INVENTORY LOW STOCK ALERTS ──────────────────────────── */}
      {activeSubTab === 'inventory' && (
        <div className="space-y-4">
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-900 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
            <span>
              نظام التنبيهات الذكي: هذه المنتجات وصلت أو قاربت على النفاد بالمستودعات. يُرجى إعادة التوريد
              فوراً لتفادي تعطيل طلبات التجار.
            </span>
          </div>

          {lowStockProducts.length === 0 ? (
            <div className="py-16 text-center glass-card rounded-3xl p-6 text-slate-400">
              <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
              <h4 className="font-bold text-slate-700">المخزون في المستويات الآمنة بالكامل</h4>
              <p className="text-xs text-slate-400 mt-0.5">لا توجد منتجات منخفضة المخزون حالياً</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {lowStockProducts.map((p) => (
                <div
                  key={p.id}
                  className="glass-card rounded-3xl border border-red-200 p-5 shadow-sm space-y-3"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{p.name}</h4>
                      <p className="text-xs text-slate-400 font-mono">كود: {p.sku}</p>
                    </div>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        p.stockQuantity <= 0
                          ? 'bg-red-600 text-white'
                          : 'bg-amber-500 text-white'
                      }`}
                    >
                      {p.stockQuantity <= 0 ? 'نفد المخزون' : `متبقي ${p.stockQuantity}`}
                    </span>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl text-xs space-y-1 text-slate-600">
                    <div className="flex justify-between">
                      <span>حد التنبيه المعين:</span>
                      <span className="font-bold text-slate-800">{p.lowStockAlertAt} وحدة</span>
                    </div>
                    <div className="flex justify-between">
                      <span>القسم:</span>
                      <span>{p.category?.name || 'عام'}</span>
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
      )}

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
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-900">{trader.name}</h4>
                        <p className="text-xs text-slate-500">{trader.email}</p>
                      </div>
                      <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full border border-amber-300">
                        قيد المراجعة
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1.5 text-slate-700">
                      <div className="flex justify-between">
                        <span className="text-slate-400">اسم المؤسسة:</span>
                        <span className="font-bold">{trader.businessName || 'غير مدخل'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">السجل الضريبي:</span>
                        <span className="font-mono font-bold">{trader.taxId || 'غير مدخل'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">الهاتف:</span>
                        <span className="font-mono">{trader.phone || 'غير مسجل'}</span>
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

      {/* ── SUB-TAB 6: CATEGORIES MANAGEMENT ─────────────────────────────────── */}
      {activeSubTab === 'categories' && (
        <div className="space-y-4 animate-fade-in">
          {/* Header Card */}
          <div className="glass-card rounded-3xl border border-slate-200 p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <FolderTree className="w-5 h-5 text-purple-700" />
                <h3 className="font-extrabold text-base text-slate-900">إدارة الأقسام وتصنيفات المتجر</h3>
                <span className="text-xs bg-purple-100 text-purple-800 font-bold px-2.5 py-0.5 rounded-full">
                  {categories.length} أقسام
                </span>
              </div>
              <p className="text-xs text-slate-500">
                يمكنك إعادة ترتيب الأقسام بالسحب والإفلات، تفعيل أو تعطيل ظهورها بالمتجر، وإضافة أو تعديل الأقسام.
              </p>
            </div>

            <button
              onClick={() => {
                setNewCategoryName('');
                setCategoryModalError('');
                setShowAddCategoryModal(true);
              }}
              className="px-4 py-2.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold transition-smooth flex items-center justify-center gap-2 shadow-sm shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>+ إضافة قسم جديد</span>
            </button>
          </div>

          {/* Drag & Drop Notice */}
          <div className="p-3 bg-purple-50/70 border border-purple-200/80 rounded-2xl text-xs text-purple-900 flex items-center gap-2">
            <GripVertical className="w-4 h-4 text-purple-600 shrink-0" />
            <span>
              💡 <strong>طريقة الترتيب:</strong> اسحب أي قسم من أيقونة المقبض (⋮⋮) لتحريكه للأعلى أو للأسفل. يتم حفظ الترتيب الجديد تلقائياً ويظهر للعملاء بنفس الترتيب فورياً.
            </span>
          </div>

          {/* Categories List */}
          {categories.length === 0 ? (
            <div className="py-16 text-center glass-card rounded-3xl p-6 text-slate-400 border border-slate-200">
              <FolderTree className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <h4 className="font-bold text-slate-700">لا توجد أقسام مسجلة حالياً</h4>
              <p className="text-xs text-slate-400 mt-1 mb-4">ابدأ بإضافة أول قسم لتصنيف المنتجات في متجرك</p>
              <button
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
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleCategoryDragEnd}
            >
              <SortableContext
                items={categories.map((c) => c.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2.5">
                  {categories.map((category, index) => (
                    <SortableCategoryItem
                      key={category.id}
                      category={category}
                      index={index}
                      onEdit={openEditCategoryModal}
                      onDelete={handleDeleteCategory}
                      onToggleActive={handleToggleCategoryActive}
                      isToggling={isTogglingCategory}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
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

      {/* ── CONFIRMATION MODAL ──────────────────────────────────────────────── */}
      <ConfirmModal
        isOpen={deleteConfirmation.isOpen}
        onClose={() => setDeleteConfirmation((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={deleteConfirmation.onConfirm}
        title={deleteConfirmation.title}
        message={deleteConfirmation.message}
        confirmText={deleteConfirmation.confirmText}
        isDanger={deleteConfirmation.isDanger}
      />
    </div>
  );
};
