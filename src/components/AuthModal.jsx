import React, { useState } from 'react';
import { X, User, Lock, Mail, Phone, Building, FileText, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Modal } from './Modal';

export const AuthModal = ({ isOpen, onClose, onSuccess }) => {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [userType, setUserType] = useState('CUSTOMER');

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [taxId, setTaxId] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setName('');
    setPhone('');
    setBusinessName('');
    setTaxId('');
    setErrorMsg('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      let loggedUser;
      if (isRegister) {
        loggedUser = await register({
          name,
          email,
          phone,
          password,
          userType,
          businessName: userType === 'TRADER' ? businessName : undefined,
          taxId: userType === 'TRADER' ? taxId : undefined,
        });
      } else {
        loggedUser = await login(email, password);
      }
      resetForm();
      if (onSuccess) {
        onSuccess(loggedUser);
      }
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'حدث خطأ أثناء المصادقة');
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="max-w-md">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-right">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">
              {isRegister ? 'إنشاء حساب جديد في بيت الجملة' : 'تسجيل الدخول'}
            </h3>
            <p className="text-xs text-slate-500">
              {isRegister ? 'سجل كعميل تجزئة أو تاجر جملة' : 'أدخل بيانات حسابك للمتابعة'}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-200 transition-smooth"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {errorMsg && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Tab Switcher */}
          <div className="flex border-b border-slate-200 mb-4">
            <button
              onClick={() => setIsRegister(false)}
              className={`flex-1 py-2 text-xs font-bold border-b-2 transition-smooth ${
                !isRegister
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              تسجيل الدخول
            </button>
            <button
              onClick={() => setIsRegister(true)}
              className={`flex-1 py-2 text-xs font-bold border-b-2 transition-smooth ${
                isRegister
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              حساب جديد
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            {isRegister && (
              <>
                {/* Account Type (Customer vs Trader) */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1.5">نوع الحساب:</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setUserType('CUSTOMER')}
                      className={`p-2 rounded-xl border text-center font-bold transition-smooth ${
                        userType === 'CUSTOMER'
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      عميل تجزئة (قطاعي)
                    </button>
                    <button
                      type="button"
                      onClick={() => setUserType('TRADER')}
                      className={`p-2 rounded-xl border text-center font-bold transition-smooth ${
                        userType === 'TRADER'
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      تاجر جملة (B2B)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">الاسم بالكامل:</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="محمد أحمد"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 pl-8 focus:outline-none focus:border-emerald-500 font-medium"
                    />
                    <User className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">رقم الهاتف:</label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="01012345678"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 pl-8 focus:outline-none focus:border-emerald-500 font-medium text-left"
                      dir="ltr"
                    />
                    <Phone className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                  </div>
                </div>

                {userType === 'TRADER' && (
                  <>
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">اسم المؤسسة / النشاط التجاري:</label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          value={businessName}
                          onChange={(e) => setBusinessName(e.target.value)}
                          placeholder="شركة النور لتجارة الأدوات"
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 pl-8 focus:outline-none focus:border-emerald-500 font-medium"
                        />
                        <Building className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1">السجل التجاري / البطاقة الضريبية:</label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          value={taxId}
                          onChange={(e) => setTaxId(e.target.value)}
                          placeholder="TX-12345678"
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 pl-8 focus:outline-none focus:border-emerald-500 font-medium"
                        />
                        <FileText className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                      </div>
                    </div>
                  </>
                )}
              </>
            )}

            <div>
              <label className="block text-slate-700 font-bold mb-1">
                {isRegister ? 'البريد الإلكتروني:' : 'البريد الإلكتروني أو رقم الهاتف:'}
              </label>
              <div className="relative">
                <input
                  type={isRegister ? "email" : "text"}
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={isRegister ? "name@example.com" : "name@example.com أو 01012345678"}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 pl-8 focus:outline-none focus:border-emerald-500 font-medium text-left"
                  dir="ltr"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">كلمة المرور:</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 pl-8 focus:outline-none focus:border-emerald-500 font-medium"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
            </div>

            <button
              disabled={isLoading}
              type="submit"
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition-smooth disabled:opacity-50 mt-2"
            >
              {isLoading ? 'جاري التحميل...' : isRegister ? 'تأكيد التسجيل' : 'تسجيل الدخول'}
            </button>
          </form>
        </div>
      </div>
    </Modal>
  );
};
