import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  ShoppingBag,
  Bell,
  User,
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
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useNotifications } from '../context/NotificationContext';

export const Header = ({ activeTab, setActiveTab, onOpenCart, onOpenAuth, onNotificationNavigate }) => {
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

  const notificationsRef = useRef(null);
  const roleMenuRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (roleMenuRef.current && !roleMenuRef.current.contains(event.target)) {
        setShowRoleMenu(false);
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
    if (isTrader) {
      if (user?.approvalStatus === 'APPROVED') {
        return { label: 'تاجر جملة معتمد', shortLabel: 'تاجر جملة معتمد', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
      }
      return { label: 'تاجر (قيد المراجعة)', shortLabel: 'تاجر جملة', color: 'bg-orange-100 text-orange-800 border-orange-300' };
    }
    return { label: 'عميل تجزئة', shortLabel: 'عميل تجزئة', color: 'bg-blue-100 text-blue-800 border-blue-300' };
  };

  const roleInfo = getRoleLabel();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs select-none">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Right in RTL: Logo & Brand Name */}
          <div className="flex items-center gap-3 sm:gap-6">
            <button
              type="button"
              onClick={handleLogoClick}
              className="flex items-center gap-2.5 sm:gap-3 cursor-pointer group text-right focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-2xl p-1 -m-1 transition-smooth"
              title="الرئيسية - متجر منصة العمدة"
            >
              {/* Brand Squircle Icon matching mockup */}
              <div className="w-11 h-11 rounded-2xl bg-emerald-600 flex items-center justify-center text-white font-black text-2xl shadow-md shadow-emerald-600/25 group-hover:scale-105 active:scale-95 transition-smooth shrink-0">
                ع
              </div>
              <div className="flex flex-col text-right">
                <div className="flex items-center gap-2">
                  <span className="text-lg sm:text-xl font-black text-slate-900 tracking-tight leading-tight">
                    منصة العمدة
                  </span>
                  {/* Badge hidden on mobile (< 640px), visible on sm+ */}
                  <span className="hidden sm:inline-flex items-center text-[11px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-200 whitespace-nowrap">
                    B2B & B2C
                  </span>
                </div>
                <span className="text-[11px] sm:text-xs text-slate-500 font-medium leading-tight mt-0.5">
                  لتجارة الجملة والتجزئة
                </span>
              </div>
            </button>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1.5 mr-2">
              <button
                onClick={() => handleNavClick('store')}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-smooth flex items-center gap-2 ${
                  activeTab === 'store'
                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
                المتجر والمنتجات
              </button>

              {isAuthenticated && (
                <button
                  onClick={() => handleNavClick('orders')}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-smooth flex items-center gap-2 ${
                    activeTab === 'orders'
                      ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <ClipboardList className="w-4 h-4" />
                  سجل طلباتي
                </button>
              )}

              {(role === 'ADMIN' || role === 'OWNER') && (
                <button
                  onClick={() => handleNavClick('admin')}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-smooth flex items-center gap-2 ${
                    activeTab === 'admin'
                      ? 'bg-purple-700 text-white shadow-sm shadow-purple-700/30'
                      : 'text-purple-700 hover:bg-purple-50'
                  }`}
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  لوحة الأدمن
                </button>
              )}

              {role === 'OWNER' && (
                <button
                  onClick={() => handleNavClick('owner')}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-smooth flex items-center gap-2 ${
                    activeTab === 'owner'
                      ? 'bg-amber-600 text-white shadow-sm shadow-amber-600/30'
                      : 'text-amber-700 hover:bg-amber-50'
                  }`}
                >
                  <Crown className="w-4 h-4" />
                  لوحة المالك
                </button>
              )}
            </nav>
          </div>

          {/* Left in RTL: Action Icons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Role Switcher for OWNER (Desktop) */}
            {isAuthenticated && role === 'OWNER' && (
              <div className="relative hidden sm:block" ref={roleMenuRef}>
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

            {/* Notification Bell Button matching mockup: rounded-2xl, 44x44, slate-100, red circular badge */}
            <div className="relative" ref={notificationsRef}>
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

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
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
                            <span className="text-[10px] text-emerald-700 font-bold opacity-0 group-hover:opacity-100 transition-smooth flex items-center gap-0.5 shrink-0">
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
              className="relative w-11 h-11 sm:w-auto sm:px-4 min-w-[44px] min-h-[44px] rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white flex items-center justify-center gap-2 transition-smooth active:scale-95 shadow-md shadow-emerald-600/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              title="سلة المشتريات"
              aria-label="سلة المشتريات"
            >
              <ShoppingBag className="w-5 h-5 text-white shrink-0" />
              <span className="hidden sm:inline font-bold text-sm">السلة</span>
              {totalCount > 0 && (
                <span className="absolute -top-1 -right-1 sm:static sm:mr-1 min-w-[20px] h-5 px-1 bg-emerald-900 text-white text-[10px] font-black rounded-full flex items-center justify-center ring-2 ring-white sm:ring-0 shadow-xs">
                  {totalCount}
                </span>
              )}
            </button>

            {/* Desktop Auth Action */}
            {isAuthenticated ? (
              <div className="hidden md:flex items-center gap-2 pr-2 border-r border-slate-200">
                <div className="text-left">
                  <p className="text-xs font-extrabold text-slate-900 leading-tight">{user?.name || 'المستخدم'}</p>
                  <span
                    className={`inline-block text-[10px] font-bold px-2 py-0.2 rounded-full border ${roleInfo.color}`}
                  >
                    {roleInfo.shortLabel}
                  </span>
                </div>
                <button
                  onClick={logout}
                  className="min-w-[36px] min-h-[36px] p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-smooth flex items-center justify-center"
                  title="تسجيل الخروج"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="hidden md:flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-smooth shadow-sm min-h-[44px]"
              >
                <User className="w-4 h-4" />
                تسجيل الدخول
              </button>
            )}

            {/* Mobile Hamburger Menu Toggle Button matching mockup: rounded-2xl slate-100 */}
            <button
              onClick={() => {
                setMobileMenuOpen(!mobileMenuOpen);
                setShowNotifications(false);
              }}
              className="md:hidden relative w-11 h-11 min-w-[44px] min-h-[44px] rounded-2xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 flex items-center justify-center transition-smooth active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
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
              className="fixed inset-0 bg-slate-950/55 backdrop-blur-xs z-[998] md:hidden animate-fade-in"
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* Complete Right-side Full Sidebar without scroll */}
            <aside
              className="fixed inset-y-0 right-0 w-[82%] max-w-[320px] sm:max-w-[350px] h-screen h-dvh bg-white shadow-2xl z-[999] md:hidden flex flex-col justify-between p-4 sm:p-5 border-l border-slate-200/90 animate-slide-in-right overflow-hidden select-none"
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
                    title="الرئيسية - متجر منصة العمدة"
                  >
                    <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-black text-lg shadow-sm group-hover:scale-105 active:scale-95 transition-smooth">
                      ع
                    </div>
                    <div>
                      <h3 className="font-black text-slate-900 text-sm">منصة العمدة</h3>
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

                {/* Navigation Items List matching mockup */}
                <div className="space-y-1.5 pt-1">
                  {/* 1. المتجر والمنتجات */}
                  <button
                    onClick={() => handleNavClick('store')}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold transition-smooth ${
                      activeTab === 'store'
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <LayoutGrid className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                      <span>المتجر والمنتجات</span>
                    </div>
                    <ChevronLeft className={`w-4 h-4 shrink-0 ${activeTab === 'store' ? 'text-white' : 'text-slate-400'}`} />
                  </button>

                  {/* 2. سجل طلباتي */}
                  {isAuthenticated && (
                    <button
                      onClick={() => handleNavClick('orders')}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold transition-smooth ${
                        activeTab === 'orders'
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
                          : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <ClipboardList className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                        <span>سجل طلباتي</span>
                      </div>
                      <ChevronLeft className={`w-4 h-4 shrink-0 ${activeTab === 'orders' ? 'text-white' : 'text-slate-400'}`} />
                    </button>
                  )}

                  {/* 3. لوحة تحكم الأدمن */}
                  {(role === 'ADMIN' || role === 'OWNER') && (
                    <button
                      onClick={() => handleNavClick('admin')}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold transition-smooth ${
                        activeTab === 'admin'
                          ? 'bg-purple-700 text-white shadow-md shadow-purple-700/25'
                          : 'bg-purple-50/60 text-purple-800 hover:bg-purple-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <SlidersHorizontal className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                        <span>لوحة تحكم الأدمن</span>
                      </div>
                      <ChevronLeft className={`w-4 h-4 shrink-0 ${activeTab === 'admin' ? 'text-white' : 'text-purple-400'}`} />
                    </button>
                  )}

                  {/* 4. لوحة تحكم المالك */}
                  {role === 'OWNER' && (
                    <button
                      onClick={() => handleNavClick('owner')}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold transition-smooth ${
                        activeTab === 'owner'
                          ? 'bg-amber-600 text-white shadow-md shadow-amber-600/25'
                          : 'bg-amber-50/60 text-amber-800 hover:bg-amber-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Crown className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                        <span>لوحة تحكم المالك</span>
                      </div>
                      <ChevronLeft className={`w-4 h-4 shrink-0 ${activeTab === 'owner' ? 'text-white' : 'text-amber-400'}`} />
                    </button>
                  )}
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
                    <h4 className="font-extrabold text-slate-900 text-xs mb-1">
                      أهلاً بك في منصة العمدة
                    </h4>
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


