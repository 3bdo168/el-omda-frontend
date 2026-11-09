import React, { useState, useEffect } from 'react';
import { ShieldAlert } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { NotificationProvider } from './context/NotificationContext';
import { Header } from './components/Header';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { AuthModal } from './components/AuthModal';
import { ChangePasswordModal } from './components/ChangePasswordModal';
import { StoreView } from './views/StoreView';
import { OrdersView } from './views/OrdersView';
import { AdminView } from './views/AdminView';
import { OwnerView } from './views/OwnerView';
import { EmployeeView } from './views/EmployeeView';

const getInitialTab = () => {
  if (typeof window === 'undefined') return 'store';
  const path = window.location.pathname.replace(/^\/+/, '').split('/')[0].toLowerCase();
  if (path && ['store', 'orders', 'admin', 'owner', 'employee'].includes(path)) {
    return path;
  }
  const params = new URLSearchParams(window.location.search);
  const tabParam = params.get('tab')?.toLowerCase();
  if (tabParam && ['store', 'orders', 'admin', 'owner', 'employee'].includes(tabParam)) {
    return tabParam;
  }
  const hash = window.location.hash.replace(/^#\/?/, '').toLowerCase();
  if (hash && ['store', 'orders', 'admin', 'owner', 'employee'].includes(hash)) {
    return hash;
  }
  return 'store';
};

const MainApp = () => {
  const { isAuthenticated, role } = useAuth();
  const [activeTab, setActiveTabState] = useState(getInitialTab);
  const [targetOrderId, setTargetOrderId] = useState(null);
  const [initialAdminTab, setInitialAdminTab] = useState('orders');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  const setActiveTab = (tab) => {
    setActiveTabState(tab);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location);
      if (tab === 'store') {
        url.searchParams.delete('tab');
      } else {
        url.searchParams.set('tab', tab);
      }
      window.history.replaceState(null, '', url.pathname + (url.searchParams.toString() ? `?${url.searchParams}` : '') + url.hash);
    }
  };

  // Sync with browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const tab = getInitialTab();
      setActiveTabState(tab);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Strict route guard:
  // - If user is not authenticated, protected views redirect to 'store'
  // - If user is OWNER or any non-EMPLOYEE, accessing 'employee' redirects to 'owner' (or 'store')
  // - If user is CUSTOMER, accessing admin/owner/employee redirects to 'store'
  useEffect(() => {
    if (!isAuthenticated) {
      if (activeTab !== 'store') {
        setActiveTab('store');
      }
      return;
    }

    // Role-based protection
    if (activeTab === 'employee' && role !== 'EMPLOYEE') {
      // If Owner tries to access employee dashboard, redirect to owner home
      if (role === 'OWNER') {
        setActiveTab('owner');
      } else {
        setActiveTab('store');
      }
      return;
    }

    if (activeTab === 'owner' && role !== 'OWNER') {
      setActiveTab('store');
      return;
    }

    if (activeTab === 'admin' && role !== 'ADMIN' && role !== 'OWNER') {
      setActiveTab('store');
      return;
    }
  }, [isAuthenticated, role, activeTab]);

  const handleAuthSuccess = (authUser) => {
    setIsAuthOpen(false);
    if (authUser?.role === 'ADMIN') {
      setActiveTab('admin');
    } else if (authUser?.role === 'OWNER') {
      setActiveTab('owner');
    } else if (authUser?.role === 'EMPLOYEE') {
      setActiveTab('employee');
    }
  };

  const handleNotificationNavigate = (notification) => {
    if (!notification) return;
    const type = notification.type;
    const metadata = notification.metadata || {};

    if (type === 'ORDER_STATUS' || type === 'PAYMENT_STATUS') {
      if (role === 'ADMIN') {
        setInitialAdminTab('orders');
        setActiveTab('admin');
      } else if (role === 'OWNER') {
        setActiveTab('owner');
      } else {
        if (metadata.orderId) {
          setTargetOrderId(metadata.orderId);
        }
        setActiveTab('orders');
      }
    } else if (type === 'LOW_STOCK') {
      if (role === 'ADMIN' || role === 'OWNER') {
        setInitialAdminTab('inventory');
        setActiveTab('admin');
      }
    } else if (type === 'MERCHANT_REGISTRATION') {
      if (role === 'ADMIN' || role === 'OWNER') {
        setInitialAdminTab('traders');
        setActiveTab('admin');
      }
    } else if (type === 'RECEIPT_UPLOADED' || type === 'BANK_TRANSFER') {
      if (role === 'ADMIN' || role === 'OWNER') {
        setInitialAdminTab('receipts');
        setActiveTab('admin');
      }
    } else if (type === 'MERCHANT_STATUS') {
      setActiveTab('store');
    } else {
      if (metadata.orderId) {
        setTargetOrderId(metadata.orderId);
        setActiveTab('orders');
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-emerald-500 selection:text-white">
      {/* Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onNotificationNavigate={handleNotificationNavigate}
        onOpenSearch={() => {
          if (activeTab !== 'store') setActiveTab('store');
          setIsMobileSearchOpen(true);
        }}
      />

      {/* Main View Area — Morphing Crossfade Transition */}
      <main className="flex-1 pb-16 overflow-x-hidden">
        <div key={activeTab} className="animate-view-morph">
          {activeTab === 'store' && (
            <StoreView
              onOpenCart={() => setIsCartOpen(true)}
              isMobileSearchOpen={isMobileSearchOpen}
              setIsMobileSearchOpen={setIsMobileSearchOpen}
            />
          )}
          {activeTab === 'orders' && <OrdersView initialSelectedOrderId={targetOrderId} />}
          {activeTab === 'admin' && <AdminView initialSubTab={initialAdminTab} />}
          {activeTab === 'owner' && (role === 'OWNER' ? <OwnerView /> : null)}
          {activeTab === 'employee' && (
            role === 'EMPLOYEE' ? (
              <EmployeeView />
            ) : (
              <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-3xl border border-red-200 text-center shadow-lg animate-fade-in" dir="rtl">
                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShieldAlert className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-black text-slate-900 mb-2">403 — غير مصرّح بالدخول</h2>
                <p className="text-sm text-slate-600 mb-6">
                  لوحة تحكم الموظف مخصصة لحسابات الموظفين فقط، ولا يمكن الوصول إليها بصلاحيات {role === 'OWNER' ? 'المالك' : role || 'الزائر'}.
                </p>
                <button
                  onClick={() => setActiveTab(role === 'OWNER' ? 'owner' : 'store')}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-smooth shadow-md"
                >
                  {role === 'OWNER' ? 'العودة إلى لوحة المالك' : 'العودة إلى المتجر'}
                </button>
              </div>
            )
          )}
        </div>
      </main>

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onProceedToCheckout={() => {
          setIsCartOpen(false);
          setIsCheckoutOpen(true);
        }}
      />

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onSuccessOrder={() => {
          setIsCheckoutOpen(false);
          setActiveTab('orders');
        }}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={handleAuthSuccess}
      />

      {/* Force Change Password Modal (if required) */}
      <ChangePasswordModal />

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
            <span className="font-extrabold text-slate-900 text-sm">
              بيت الجملة <span className="font-normal text-[10px] text-slate-500 whitespace-nowrap">تبع مؤسسه صلى على النبى</span>
            </span>
            <span className="hidden sm:inline">•</span>
            <span className="text-center">بوابة تجارة الجملة والتجزئة الذكية B2B & B2C</span>
          </div>
          <div className="text-slate-400">
            © {new Date().getFullYear()} بيت الجملة <span className="font-normal text-[10px] text-slate-400 whitespace-nowrap">تبع مؤسسه صلى على النبى</span>. جميع الحقوق محفوظة.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <NotificationProvider>
          <MainApp />
        </NotificationProvider>
      </CartProvider>
    </AuthProvider>
  );
}
