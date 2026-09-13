import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { NotificationProvider } from './context/NotificationContext';
import { Header } from './components/Header';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { AuthModal } from './components/AuthModal';
import { StoreView } from './views/StoreView';
import { OrdersView } from './views/OrdersView';
import { AdminView } from './views/AdminView';
import { OwnerView } from './views/OwnerView';

const MainApp = () => {
  const { isAuthenticated, role } = useAuth();
  const [activeTab, setActiveTab] = useState('store'); // 'store' | 'orders' | 'admin' | 'owner'
  const [targetOrderId, setTargetOrderId] = useState(null);
  const [initialAdminTab, setInitialAdminTab] = useState('orders');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // If user logs out or lacks permissions, redirect to store
  useEffect(() => {
    if (!isAuthenticated && (activeTab === 'orders' || activeTab === 'admin' || activeTab === 'owner')) {
      setActiveTab('store');
    } else if (isAuthenticated && role === 'CUSTOMER' && (activeTab === 'admin' || activeTab === 'owner')) {
      setActiveTab('store');
    }
  }, [isAuthenticated, role, activeTab]);

  const handleAuthSuccess = (authUser) => {
    setIsAuthOpen(false);
    if (authUser?.role === 'ADMIN') {
      setActiveTab('admin');
    } else if (authUser?.role === 'OWNER') {
      setActiveTab('owner');
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
      />

      {/* Main View Area */}
      <main className="flex-1 pb-16">
        {activeTab === 'store' && (
          <StoreView onOpenCart={() => setIsCartOpen(true)} />
        )}
        {activeTab === 'orders' && <OrdersView initialSelectedOrderId={targetOrderId} />}
        {activeTab === 'admin' && <AdminView initialSubTab={initialAdminTab} />}
        {activeTab === 'owner' && <OwnerView />}
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

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-900 text-sm">منصة العمدة</span>
            <span>•</span>
            <span>بوابة تجارة الجملة والتجزئة الذكية B2B & B2C</span>
          </div>
          <div className="text-slate-400">
            © {new Date().getFullYear()} El-Omda Platform. جميع الحقوق محفوظة.
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
