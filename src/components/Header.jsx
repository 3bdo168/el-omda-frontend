import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  ShoppingBag,
  Bell,
  User,
  UserRound,
  LogOut,
  ShieldAlert,
  Crown,
  Layers,
  ChevronDown,
  ChevronLeft,
  CheckCircle2,
  BadgeCheck,
  Sparkles,
  Menu,
  X,
  LayoutGrid,
  ClipboardList,
  SlidersHorizontal,
  Package,
  CreditCard,
  AlertTriangle,
  UserCheck,
  Briefcase,
  Search,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useNotifications } from '../context/NotificationContext';

export const NAV_CONFIG = [
  {
    id: 'store',
    label: 'المتجر والمنتجات',
    mobileLabel: 'المتجر والمنتجات',
    icon: LayoutGrid,
    requireAuth: false,
    allowedRoles: ['*'],
    activeClassDesktop: 'header-nav-pill--active',
    activeClassMobile: 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25',
    inactiveClassMobile: 'bg-slate-50 text-slate-700 hover:bg-slate-100',
    arrowColorMobile: 'text-slate-400',
  },
  {
    id: 'orders',
    label: 'سجل طلباتي',
    mobileLabel: 'سجل طلباتي',
    icon: ClipboardList,
    requireAuth: true,
    allowedRoles: ['CUSTOMER', 'TRADER', 'ADMIN', 'OWNER', 'EMPLOYEE'],
    activeClassDesktop: 'header-nav-pill--active',
    activeClassMobile: 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25',
    inactiveClassMobile: 'bg-slate-50 text-slate-700 hover:bg-slate-100',
    arrowColorMobile: 'text-slate-400',
  },
  {
    id: 'admin',
    label: 'لوحة الأدمن',
    mobileLabel: 'لوحة تحكم الأدمن',
    icon: SlidersHorizontal,
    requireAuth: true,
    allowedRoles: ['ADMIN', 'OWNER'],
    activeClassDesktop: 'header-nav-pill--active-purple',
    activeClassMobile: 'bg-purple-700 text-white shadow-md shadow-purple-700/25',
    inactiveClassMobile: 'bg-purple-50/60 text-purple-800 hover:bg-purple-50',
    arrowColorMobile: 'text-purple-400',
  },
  {
    id: 'owner',
    label: 'لوحة المالك',
    mobileLabel: 'لوحة تحكم المالك',
    icon: Crown,
    requireAuth: true,
    allowedRoles: ['OWNER'],
    activeClassDesktop: 'header-nav-pill--active-amber',
    activeClassMobile: 'bg-amber-600 text-white shadow-md shadow-amber-600/25',
    inactiveClassMobile: 'bg-amber-50/60 text-amber-800 hover:bg-amber-50',
    arrowColorMobile: 'text-amber-400',
  },
  {
    id: 'employee',
    label: 'لوحة الموظف',
    mobileLabel: 'لوحة الموظف',
    icon: Briefcase,
    requireAuth: true,
    allowedRoles: ['EMPLOYEE'], // Strictly EMPLOYEE only. OWNER is completely excluded.
    activeClassDesktop: 'header-nav-pill--active-indigo',
    activeClassMobile: 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25',
    inactiveClassMobile: 'bg-indigo-50/60 text-indigo-800 hover:bg-indigo-50',
    arrowColorMobile: 'text-indigo-400',
  },
];

export const Header = ({ activeTab, setActiveTab, onOpenCart, onOpenAuth, onNotificationNavigate, onOpenSearch }) => {
  const { user, isAuthenticated, role, isTrader, logout, switchRole } = useAuth();
  const { totalCount } = useCart();
  const { unreadCount, notifications, markAsRead, markAllAsRead } = useNotifications();

  const handleNotificationItemClick = (n) => {
    markAsRead(n.id);
    setShowNotifications(false);
    if (onNotificationNavigate) {
      onNotificationNavigate(n);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'ORDER_STATUS':
        return <Package className="w-3.5 h-3.5 text-blue-600" />;
      case 'PAYMENT_STATUS':
        return <CreditCard className="w-3.5 h-3.5 text-emerald-600" />;
      case 'LOW_STOCK':
        return <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />;
      case 'MERCHANT_STATUS':
      case 'MERCHANT_REGISTRATION':
        return <UserCheck className="w-3.5 h-3.5 text-purple-600" />;
      default:
        return <Bell className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  const [showNotifications, setShowNotifications] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showMobileRoleOptions, setShowMobileRoleOptions] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [accountMenuMounted, setAccountMenuMounted] = useState(false);

  const notificationsRef = useRef(null);
  const roleMenuRef = useRef(null);
  const accountMenuRef = useRef(null);

  useEffect(() => {
    setShowAccountMenu(false);
  }, [activeTab]);

  useEffect(() => {
    if (showAccountMenu) {
      setAccountMenuMounted(true);
      return undefined;
    }
    const timer = setTimeout(() => setAccountMenuMounted(false), 180);
    return () => clearTimeout(timer);
  }, [showAccountMenu]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (roleMenuRef.current && !roleMenuRef.current.contains(event.target)) {
        setShowRoleMenu(false);
      }
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target)) {
        setShowAccountMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  // Prevent background scrolling when mobile drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  const handleNavClick = (tab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    document.documentElement.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  };

  const handleLogoClick = () => {
    setActiveTab('store');
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    document.documentElement.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  };

  const getRoleLabel = () => {
    if (role === 'OWNER') return { label: 'مالك المنصة التنفيذي', shortLabel: 'مالك المنصة', color: 'bg-amber-100 text-amber-800 border-amber-300' };
    if (role === 'ADMIN') return { label: 'أدمن النظام', shortLabel: 'أدمن النظام', color: 'bg-purple-100 text-purple-800 border-purple-300' };
    if (role === 'EMPLOYEE') return { label: 'موظف مبيعات', shortLabel: 'موظف', color: 'bg-indigo-100 text-indigo-800 border-indigo-300' };
    if (isTrader) {
      if (user?.approvalStatus === 'APPROVED') {
        return { label: 'تاجر جملة معتمد', shortLabel: 'تاجر جملة معتمد', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
      }
      return { label: 'تاجر (قيد المراجعة)', shortLabel: 'تاجر جملة', color: 'bg-orange-100 text-orange-800 border-orange-300' };
    }
    return { label: 'عميل تجزئة', shortLabel: 'عميل تجزئة', color: 'bg-blue-100 text-blue-800 border-blue-300' };
  };

  const roleInfo = getRoleLabel();

  const visibleNavItems = NAV_CONFIG.filter((item) => {
    if (item.requireAuth && !isAuthenticated) return false;
    if (!item.allowedRoles || item.allowedRoles.includes('*')) return true;
    return item.allowedRoles.includes(role);
  });

  return (
    <header className="sticky top-0 z-40 liquid-glass-bar--header select-none">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Right in RTL: Logo & Brand Name */}
          <div className="flex items-center gap-3 sm:gap-6">
            <button
              type="button"
              onClick={handleLogoClick}
              className="flex items-center gap-2.5 sm:gap-3 cursor-pointer group text-right focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-2xl p-1 -m-1 transition-smooth"
              title="الرئيسية - متجر بيت الجملة"
            >
              {/* Brand Logo Icon */}
              <img src="/logo.png" alt="بيت الجملة" className="w-11 h-11 group-hover:scale-105 active:scale-95 transition-smooth shrink-0 object-contain" />
              <div className="flex flex-col text-right">
                <div className="flex items-center gap-2">
                  <span className="text-lg sm:text-xl font-black text-slate-900 tracking-tight leading-tight flex items-baseline gap-1.5">
                    بيت الجملة
                    <span className="hidden min-[440px]:inline text-[10px] sm:text-[11px] font-normal text-slate-500 whitespace-nowrap">تبع مؤسسه صلى على النبى</span>
                  </span>
                  {/* Badge hidden on mobile (<640px) and tablet (<1024px), visible on lg+ */}
                  <span className="hidden lg:inline-flex items-center text-[11px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-200 whitespace-nowrap">
                    B2B & B2C
                  </span>
                </div>
                <span className="text-[11px] sm:text-xs text-slate-500 font-medium leading-tight mt-0.5">
                  لتجارة الجملة والتجزئة
                </span>
              </div>
            </button>

            {/* Desktop Navigation Links — Liquid Glass Pills */}
            <nav className="hidden xl:flex items-center gap-1.5 mr-2">
              {visibleNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`header-nav-pill ${isActive ? item.activeClassDesktop : ''}`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Left in RTL: Action Icons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Role Switcher for OWNER (Desktop) */}
            {isAuthenticated && role === 'OWNER' && (
              <div className="relative hidden xl:block" ref={roleMenuRef}>
                <button
                  onClick={() => setShowRoleMenu(!showRoleMenu)}
                  className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-smooth min-h-[44px]"
                  title="تبديل سريع للأدوار"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span className="hidden md:inline">تبديل الرتبة:</span>
                  <span className="font-extrabold">{role === 'OWNER' ? 'المالك' : role === 'ADMIN' ? 'الأدمن' : isTrader ? 'تاجر' : 'عميل'}</span>
                  <ChevronDown className="w-3.5 h-3.5 opacity-70" />
                </button>

                {showRoleMenu && (
                  <div className="absolute left-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-fade-in">
                    <div className="px-3 py-1 text-[11px] font-bold text-slate-400 border-b border-slate-100 uppercase mb-1">
                      تبديل فوري لتجربة الشاشات
                    </div>
                    <button
                      onClick={() => {
                        switchRole('OWNER');
                        setShowRoleMenu(false);
                        setActiveTab('owner');
                      }}
                      className="w-full text-right px-3 py-2 text-xs hover:bg-amber-50 flex items-center justify-between text-amber-900 font-medium"
                    >
                      <span className="flex items-center gap-2">
                        <Crown className="w-4 h-4 text-amber-600" />
                        المالك التنفيذي (OWNER)
                      </span>
                      {role === 'OWNER' && <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />}
                    </button>
                    <button
                      onClick={() => {
                        switchRole('ADMIN');
                        setShowRoleMenu(false);
                        setActiveTab('admin');
                      }}
                      className="w-full text-right px-3 py-2 text-xs hover:bg-purple-50 flex items-center justify-between text-purple-900 font-medium"
                    >
                      <span className="flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 text-purple-600" />
                        أدمن النظام (ADMIN)
                      </span>
                      {role === 'ADMIN' && <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />}
                    </button>
                    <button
                      onClick={() => {
                        switchRole('TRADER');
                        setShowRoleMenu(false);
                        setActiveTab('store');
                      }}
                      className="w-full text-right px-3 py-2 text-xs hover:bg-emerald-50 flex items-center justify-between text-emerald-900 font-medium"
                    >
                      <span className="flex items-center gap-2">
                        <LayoutGrid className="w-4 h-4 text-emerald-600" />
                        تاجر جملة (TRADER)
                      </span>
                      {isTrader && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                    </button>
                    <button
                      onClick={() => {
                        switchRole('CUSTOMER');
                        setShowRoleMenu(false);
                        setActiveTab('store');
                      }}
                      className="w-full text-right px-3 py-2 text-xs hover:bg-blue-50 flex items-center justify-between text-blue-900 font-medium"
                    >
                      <span className="flex items-center gap-2">
                        <User className="w-4 h-4 text-blue-600" />
                        عميل تجزئة (CUSTOMER)
                      </span>
                      {!isTrader && role === 'CUSTOMER' && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Account shortcut remains visible on every viewport */}
            <div className="relative order-3" ref={accountMenuRef}>
              {isAuthenticated ? (
                <>
                  <button type="button" onClick={() => setShowAccountMenu((open) => !open)} aria-label="حسابي" aria-expanded={showAccountMenu} className="flex h-11 w-11 min-w-[44px] items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-800 transition-smooth hover:bg-emerald-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-emerald-600 to-teal-500 text-sm font-black text-white">{user?.name?.trim()?.charAt(0) || 'م'}</span>
                  </button>
                  {accountMenuMounted && <div className={`absolute left-0 top-full z-[60] mt-2 w-52 origin-top-left rounded-2xl border border-slate-200 bg-white p-2 text-right shadow-xl transition-all duration-150 ${showAccountMenu ? 'translate-y-0 scale-100 opacity-100' : '-translate-y-1 scale-95 opacity-0 pointer-events-none'}`}>
                    <div className="rounded-xl bg-slate-50 px-3 py-2"><div className="text-[10px] font-bold text-slate-400">حسابي</div><div className="truncate text-sm font-extrabold text-slate-900">{user?.name || 'المستخدم'}</div></div>
                    <button type="button" onClick={() => { setShowAccountMenu(false); handleNavClick('orders'); }} className="mt-1 flex min-h-11 w-full items-center gap-2 rounded-xl px-3 text-sm font-bold text-slate-700 transition-colors hover:bg-emerald-50"><ClipboardList className="h-4 w-4 text-emerald-700" />طلباتي</button>
                    <button type="button" onClick={() => { setShowAccountMenu(false); logout(); }} className="flex min-h-11 w-full items-center gap-2 rounded-xl px-3 text-sm font-bold text-red-700 transition-colors hover:bg-red-50"><LogOut className="h-4 w-4" />تسجيل الخروج</button>
                  </div>}
                </>
              ) : (
                <button type="button" onClick={onOpenAuth} aria-label="تسجيل الدخول" title="تسجيل الدخول" className="flex h-11 w-11 min-w-[44px] items-center justify-center rounded-2xl bg-slate-100 text-slate-700 transition-smooth hover:bg-emerald-100 hover:text-emerald-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"><UserRound className="h-5 w-5" /></button>
              )}
            </div>

            {/* Search Button for Mobile */}
            {onOpenSearch && (
              <button
                type="button"
                onClick={onOpenSearch}
                className="relative order-1 xl:hidden w-11 h-11 min-w-[44px] min-h-[44px] rounded-2xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 flex items-center justify-center transition-smooth active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                title="البحث في المنتجات"
                aria-label="البحث في المنتجات"
              >
                <Search className="w-5 h-5 text-slate-700" />
              </button>
            )}

            {/* Notification Bell Button matching mockup: rounded-2xl, 44x44, slate-100, red circular badge */}
            <div className="relative order-2" ref={notificationsRef}>
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setMobileMenuOpen(false);
                }}
                className="relative w-11 h-11 min-w-[44px] min-h-[44px] rounded-2xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 flex items-center justify-center transition-smooth active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                title="الإشعارات"
                aria-label="الإشعارات"
              >
                <Bell className="w-5 h-5 text-slate-700" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center ring-2 ring-white shadow-xs animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Mobile Backdrop for Notifications */}
              {showNotifications && (
                <div
                  className="fixed inset-0 bg-slate-950/25 backdrop-blur-2xs z-40 sm:hidden animate-fade-in"
                  onClick={() => setShowNotifications(false)}
                />
              )}

              {/* Responsive Notifications Dropdown */}
              {showNotifications && (
                <div className="fixed left-3 right-3 top-[4.5rem] sm:absolute sm:top-full sm:mt-2 sm:left-0 sm:right-auto sm:w-96 sm:max-w-sm max-w-[calc(100vw-1.5rem)] bg-white rounded-3xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-fade-in select-none">
                  <div className="px-4 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                        <Bell className="w-4 h-4" />
                      </div>
                      <span className="font-extrabold text-sm text-slate-900">مركز الإشعارات</span>
                      {unreadCount > 0 && (
                        <span className="text-[11px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">
                          {unreadCount} جديد
                        </span>
                      )}
                    </div>
                    {isAuthenticated && unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-xs text-emerald-600 hover:text-emerald-800 font-bold hover:underline"
                      >
                        تحديد الكل كمقروء
                      </button>
                    )}
                  </div>

                  <div className="max-h-[55vh] sm:max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {!isAuthenticated ? (
                      <div className="py-8 px-4 text-center">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-3">
                          <Bell className="w-6 h-6" />
                        </div>
                        <h4 className="font-extrabold text-sm text-slate-800 mb-1">
                          سجّل دخولك لمتابعة إشعاراتك
                        </h4>
                        <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                          تصلك هنا تحديثات الطلبات وتأكيدات الدفع وحالة الحساب فوراً
                        </p>
                        <button
                          onClick={() => {
                            setShowNotifications(false);
                            onOpenAuth();
                          }}
                          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-smooth shadow-md shadow-emerald-600/20"
                        >
                          تسجيل الدخول الآن
                        </button>
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="py-10 text-center text-slate-400 text-xs">
                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-2 text-slate-300">
                          <Bell className="w-6 h-6 stroke-[1.5]" />
                        </div>
                        <p className="font-bold text-slate-600">لا توجد إشعارات حالياً</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">ستظهر هنا أي تحديثات تخص طلباتك وحسابك</p>
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => handleNotificationItemClick(n)}
                          className={`p-3.5 hover:bg-slate-50 cursor-pointer transition-smooth text-right group ${
                            !n.isRead ? 'bg-emerald-50/40' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 group-hover:bg-white group-hover:shadow-xs transition-smooth">
                                {getNotificationIcon(n.type)}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  {!n.isRead && (
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                                  )}
                                  <h4 className="text-xs font-black text-slate-900 truncate group-hover:text-emerald-700 transition-smooth">
                                    {n.title}
                                  </h4>
                                </div>
                                <span className="text-[10px] text-slate-400">
                                  {new Date(n.createdAt).toLocaleTimeString('ar-EG', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </div>
                            </div>
                            <span className="text-[10px] text-emerald-700 font-bold sm:opacity-0 sm:group-hover:opacity-100 transition-smooth flex items-center gap-0.5 shrink-0">
                              <span>التفاصيل</span>
                              <ChevronLeft className="w-3 h-3" />
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 mt-1.5 leading-relaxed break-words pr-9">
                            {n.message}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Cart Button matching mockup: solid emerald squircle button with badge counter */}
            <button
              onClick={onOpenCart}
              className="relative order-4 w-11 h-11 sm:w-auto sm:px-4 min-w-[44px] min-h-[44px] rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white flex items-center justify-center gap-2 transition-smooth active:scale-95 shadow-md shadow-emerald-600/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              title="سلة المشتريات"
              aria-label="سلة المشتريات"
            >
              <ShoppingBag className="w-5 h-5 text-white shrink-0" />
              <span className="hidden xl:inline font-bold text-sm">السلة</span>
              {totalCount > 0 && (
                <span className="absolute -top-1 -right-1 sm:static sm:mr-1 min-w-[20px] h-5 px-1 bg-emerald-900 text-white text-[10px] font-black rounded-full flex items-center justify-center ring-2 ring-white sm:ring-0 shadow-xs">
                  {totalCount}
                </span>
              )}
            </button>

            {/* Mobile Hamburger Menu Toggle Button matching mockup: rounded-2xl slate-100 */}
            <button
              onClick={() => {
                setMobileMenuOpen(!mobileMenuOpen);
                setShowNotifications(false);
              }}
              className="xl:hidden relative order-5 w-11 h-11 min-w-[44px] min-h-[44px] rounded-2xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 flex items-center justify-center transition-smooth active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              title={mobileMenuOpen ? 'إغلاق القائمة' : 'القائمة الرئيسية'}
              aria-label={mobileMenuOpen ? 'إغلاق القائمة' : 'القائمة الرئيسية'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5 text-slate-900" />
              ) : (
                <Menu className="w-5 h-5 text-slate-900" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Full-screen Mobile Sidebar rendered via createPortal outside header */}
      {mobileMenuOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <>
            {/* Backdrop with Blur covering full screen */}
            <div
              className="fixed inset-0 bg-slate-950/55 backdrop-blur-xs z-[998] xl:hidden animate-fade-in"
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* Complete Right-side Full Sidebar with scroll support */}
            <aside
              className="fixed inset-y-0 right-0 w-[82%] max-w-[320px] sm:max-w-[350px] h-screen h-dvh bg-white shadow-2xl z-[999] xl:hidden flex flex-col justify-between p-4 sm:p-5 border-l border-slate-200/90 animate-slide-in-right overflow-y-auto overscroll-contain select-none"
              aria-label="القائمة الجانبية"
            >
              {/* Top Section: Header & Nav Links */}
              <div className="flex flex-col space-y-3">
                {/* Drawer Header with Title & Close Icon */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <button
                    type="button"
                    onClick={handleLogoClick}
                    className="flex items-center gap-2.5 text-right focus:outline-none group cursor-pointer"
                    title="الرئيسية - متجر بيت الجملة"
                  >
                    <img src="/logo.png" alt="بيت الجملة" className="w-9 h-9 group-hover:scale-105 active:scale-95 transition-smooth object-contain" />
                    <div>
                      <h3 className="font-black text-slate-900 text-sm flex items-baseline gap-1">
                        بيت الجملة
                        <span className="text-[9px] font-normal text-slate-500 whitespace-nowrap">تبع مؤسسه صلى على النبى</span>
                      </h3>
                      <p className="text-[10px] text-slate-500 font-medium">تجارة الجملة والتجزئة</p>
                    </div>
                  </button>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-smooth active:scale-95"
                    aria-label="إغلاق القائمة"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Navigation Items List matching single nav config */}
                <div className="space-y-1.5 pt-1">
                  {visibleNavItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleNavClick(item.id)}
                        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold transition-smooth ${
                          isActive ? item.activeClassMobile : item.inactiveClassMobile
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                          <span>{item.mobileLabel || item.label}</span>
                        </div>
                        <ChevronLeft className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : (item.arrowColorMobile || 'text-slate-400')}`} />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Section: Complete Profile Card without overflow */}
              <div className="pt-2">
                {isAuthenticated ? (
                  <div className="bg-slate-50/90 rounded-2xl p-3 border border-slate-200/80 text-center flex flex-col items-center shadow-xs">
                    {/* Avatar with circle & checkmark */}
                    <div className="relative mb-1.5">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-black text-lg flex items-center justify-center ring-3 ring-white shadow-sm">
                        {user?.name ? user.name.slice(0, 2).toUpperCase() : 'عم'}
                      </div>
                      <div className="absolute bottom-0 left-0 bg-blue-500 text-white rounded-full p-0.5 ring-2 ring-white">
                        <BadgeCheck className="w-3.5 h-3.5" />
                      </div>
                    </div>

                    {/* User Name */}
                    <h4 className="font-black text-slate-900 text-sm leading-tight">
                      {user?.name || 'أحمد علي'}
                    </h4>

                    {/* Verified Role Tag */}
                    <div className="flex items-center justify-center gap-1 text-[11px] text-slate-600 font-bold mt-0.5">
                      <span>{roleInfo.label}</span>
                      <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                    </div>

                    {/* Membership ID */}
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                      رقم العضوية: A{user?.id ? String(user.id).padStart(4, '0') : '1234'}
                    </p>

                    {/* Action Buttons inside card */}
                    <div className="w-full space-y-1.5 mt-2.5">
                      {/* Quick Role Switcher for OWNER */}
                      {role === 'OWNER' && (
                        <div className="w-full">
                          <button
                            onClick={() => setShowMobileRoleOptions(!showMobileRoleOptions)}
                            className="w-full py-2 px-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-[11px] font-bold hover:bg-slate-100 transition-smooth flex items-center justify-between shadow-2xs"
                          >
                            <span className="flex items-center gap-1 text-slate-800">
                              <Sparkles className="w-3 h-3 text-amber-500" />
                              <span>تبديل الدور: {role === 'OWNER' ? 'المالك' : role === 'ADMIN' ? 'الأدمن' : isTrader ? 'تاجر' : 'عميل'}</span>
                            </span>
                            <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${showMobileRoleOptions ? 'rotate-180' : ''}`} />
                          </button>

                          {showMobileRoleOptions && (
                            <div className="mt-1 grid grid-cols-2 gap-1 p-1 bg-white rounded-xl border border-slate-200 text-[10px] animate-fade-in">
                              <button
                                onClick={() => {
                                  switchRole('OWNER');
                                  setShowMobileRoleOptions(false);
                                  handleNavClick('owner');
                                }}
                                className={`p-1 rounded-lg font-bold ${role === 'OWNER' ? 'bg-amber-100 text-amber-800' : 'hover:bg-slate-50 text-slate-700'}`}
                              >
                                المالك
                              </button>
                              <button
                                onClick={() => {
                                  switchRole('ADMIN');
                                  setShowMobileRoleOptions(false);
                                  handleNavClick('admin');
                                }}
                                className={`p-1 rounded-lg font-bold ${role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'hover:bg-slate-50 text-slate-700'}`}
                              >
                                الأدمن
                              </button>
                              <button
                                onClick={() => {
                                  switchRole('TRADER');
                                  setShowMobileRoleOptions(false);
                                  handleNavClick('store');
                                }}
                                className={`p-1 rounded-lg font-bold ${isTrader ? 'bg-emerald-100 text-emerald-800' : 'hover:bg-slate-50 text-slate-700'}`}
                              >
                                تاجر جملة
                              </button>
                              <button
                                onClick={() => {
                                  switchRole('CUSTOMER');
                                  setShowMobileRoleOptions(false);
                                  handleNavClick('store');
                                }}
                                className={`p-1 rounded-lg font-bold ${!isTrader && role === 'CUSTOMER' ? 'bg-blue-100 text-blue-800' : 'hover:bg-slate-50 text-slate-700'}`}
                              >
                                عميل تجزئة
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Logout Button */}
                      <button
                        onClick={() => {
                          logout();
                          setMobileMenuOpen(false);
                        }}
                        className="w-full py-2 px-2.5 rounded-xl bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 text-[11px] font-bold transition-smooth flex items-center justify-center gap-1.5 shadow-2xs"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>تسجيل الخروج</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50/90 rounded-2xl p-4 border border-slate-200/80 text-center flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mb-2">
                      <User className="w-5 h-5" />
                    </div>
                    <div className="font-extrabold text-slate-900 mb-1">
                      أهلاً بك في بيت الجملة <span className="font-normal text-[10px] text-slate-500 whitespace-nowrap">تبع مؤسسه صلى على النبى</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mb-3 leading-relaxed">
                      سجّل دخولك للوصول إلى أسعار تجار الجملة
                    </p>
                    <button
                      onClick={() => {
                        onOpenAuth();
                        setMobileMenuOpen(false);
                      }}
                      className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-smooth shadow-md shadow-emerald-600/20"
                    >
                      تسجيل الدخول
                    </button>
                  </div>
                )}
              </div>
            </aside>
          </>,
          document.body
        )}
    </header>
  );
};


