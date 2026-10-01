import { useState, useEffect } from 'react';
import useAuthStore from '../stores/authStore';
import api from '../lib/api';
import toast from 'react-hot-toast';
import {
  User, Mail, Phone, Lock, Shield, CheckCircle2,
  Calendar, KeyRound, Building, Sparkles, Loader2,
  Save, AlertCircle
} from 'lucide-react';

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'security'

  // Profile Form
  const [profileForm, setProfileForm] = useState({
    fullName: user?.fullName || '',
    fullNameAr: user?.fullNameAr || '',
    username: user?.username || '',
    phone: user?.phone || '',
    email: user?.email || '',
  });
  const [profileLoading, setProfileLoading] = useState(false);

  // Security Form
  const [securityForm, setSecurityForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [securityLoading, setSecurityLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileForm({
        fullName: user.fullName || '',
        fullNameAr: user.fullNameAr || '',
        username: user.username || '',
        phone: user.phone || '',
        email: user.email || '',
      });
    }
  }, [user]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!profileForm.fullNameAr.trim() && !profileForm.fullName.trim()) {
      toast.error('يرجى إدخال اسمك الكامل');
      return;
    }
    if (!profileForm.username.trim()) {
      toast.error('يرجى إدخال اسم المستخدم');
      return;
    }

    setProfileLoading(true);
    try {
      const res = await api.put('/auth/profile', profileForm);
      toast.success(res.data?.message || 'تم تحديث بيانات الملف الشخصي بنجاح');
      if (res.data?.data) {
        updateUser(res.data.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'حدث خطأ أثناء تحديث الملف الشخصي');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleSecuritySubmit = async (e) => {
    e.preventDefault();
    if (!securityForm.currentPassword) {
      toast.error('يرجى إدخال كلمة المرور الحالية');
      return;
    }
    if (securityForm.newPassword.length < 6) {
      toast.error('يجب ألا تقل كلمة المرور الجديدة عن 6 أحرف أو أرقام');
      return;
    }
    if (securityForm.newPassword !== securityForm.confirmPassword) {
      toast.error('كلمة المرور الجديدة غير متطابقة مع التأكيد');
      return;
    }

    setSecurityLoading(true);
    try {
      const res = await api.put('/auth/change-password', {
        currentPassword: securityForm.currentPassword,
        newPassword: securityForm.newPassword,
      });
      toast.success(res.data?.message || 'تم تغيير كلمة المرور بنجاح');
      setSecurityForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'حدث خطأ أثناء تغيير كلمة المرور');
    } finally {
      setSecurityLoading(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2 animate-fade-in-up">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold" style={{ color: '#0C3C82' }}>
              الملف الشخصي والحساب
            </h1>
            <span className="atlas-badge atlas-badge-info">
              {user?.role?.label || 'مستخدم النظام'}
            </span>
          </div>
          <p className="text-sm mt-1" style={{ color: '#64748B' }}>
            إدارة بيانات الحساب الشخصي، رقم الهاتف، البريد، وتعيين كلمة المرور بأمان
          </p>
        </div>
      </div>

      {/* User Hero Identity Card */}
      <div className="atlas-card p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-right z-10">
          <div className="relative">
            <div 
              className="w-24 h-24 rounded-3xl flex items-center justify-center text-white text-3xl font-black shadow-xl"
              style={{ background: 'linear-gradient(135deg, #0C3C82 0%, #1a56ad 100%)' }}
            >
              {user?.fullNameAr?.[0] || user?.fullName?.[0] || 'A'}
            </div>
            <div className="absolute -bottom-1 -left-1 w-7 h-7 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-white" title="متصل الآن">
              <CheckCircle2 size={16} />
            </div>
          </div>

          <div>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h2 className="text-xl font-bold text-slate-900">
                {user?.fullNameAr || user?.fullName || 'مدير النظام'}
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-[#0C3C82] font-mono font-bold">
                @{user?.username}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center justify-center sm:justify-start gap-1.5 font-medium">
              <Building size={14} className="text-slate-400" />
              <span>أكاديمية أطلس التعليمية — المقر الرئيسي</span>
            </p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-3 text-xs text-slate-600">
              <span className="flex items-center gap-1">
                <Phone size={13} className="text-slate-400" />
                <span className="font-mono">{user?.phone || 'لم يُسجل هاتف'}</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Mail size={13} className="text-slate-400" />
                <span>{user?.email || 'لم يُسجل بريد'}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Center Logo Display */}
        <div className="flex items-center gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-100 z-10">
          <img
            src="/atlas-logo.png"
            alt="أكاديمية أطلس التعليمية"
            className="w-16 h-16 object-contain drop-shadow-sm"
          />
          <div>
            <p className="text-xs font-bold text-[#0C3C82]">أكاديمية أطلس التعليمية</p>
            <p className="text-[11px] text-slate-500">Atlas Educational ERP</p>
            <span className="inline-block mt-1 text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded border border-emerald-200">
              نظام معتمد وفعال
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-8">
        <button
          onClick={() => setActiveTab('profile')}
          className={`pb-3 text-sm font-bold transition-all relative flex items-center gap-2 ${
            activeTab === 'profile'
              ? 'text-[#0C3C82] border-b-2 border-[#0C3C82]'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <User size={16} />
          <span>البيانات الشخصية والاتصال</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`pb-3 text-sm font-bold transition-all relative flex items-center gap-2 ${
            activeTab === 'security'
              ? 'text-[#0C3C82] border-b-2 border-[#0C3C82]'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <KeyRound size={16} />
          <span>تغيير كلمة المرور والأمان</span>
        </button>
      </div>

      {/* TAB 1: Profile Information */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 atlas-card p-6 space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-800">
                تعديل البيانات الشخصية
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                تحديث اسمك الكامل المعروض في النظام ورقم الموبايل والبريد الإلكتروني
              </p>
            </div>

            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    الاسم باللغة العربية <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={profileForm.fullNameAr}
                    onChange={(e) => setProfileForm({ ...profileForm, fullNameAr: e.target.value })}
                    placeholder="مثال: عبد الله أحمد"
                    className="atlas-input text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    الاسم بالإنجليزية (اختياري)
                  </label>
                  <input
                    type="text"
                    value={profileForm.fullName}
                    onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                    placeholder="e.g. Abdalla Ahmed"
                    className="atlas-input text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    اسم المستخدم (تسجيل الدخول) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={profileForm.username}
                    onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })}
                    placeholder="admin"
                    className="atlas-input text-sm font-mono text-left"
                    dir="ltr"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    رقم الهاتف / الموبايل
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      placeholder="01012345678"
                      className="atlas-input pl-10 text-sm font-mono text-left"
                      dir="ltr"
                    />
                    <Phone size={16} className="absolute left-3 top-2.5 text-slate-400" />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    البريد الإلكتروني
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                      placeholder="user@atlas-educational.com"
                      className="atlas-input pl-10 text-sm font-mono text-left"
                      dir="ltr"
                    />
                    <Mail size={16} className="absolute left-3 top-2.5 text-slate-400" />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  disabled={profileLoading}
                  className="atlas-btn atlas-btn-primary text-sm px-6 py-2.5 shadow-sm"
                >
                  {profileLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>جاري الحفظ...</span>
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      <span>حفظ التعديلات</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Account Overview Sidebar */}
          <div className="space-y-4">
            <div className="atlas-card p-5 space-y-4">
              <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Shield size={16} className="text-[#0C3C82]" />
                <span>صلاحيات ورتبة الحساب</span>
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">نوع الصلاحية:</span>
                  <span className="font-bold text-[#0C3C82]">{user?.role?.label || 'مالك النظام'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">رمز الرتبة:</span>
                  <span className="font-mono text-slate-700">{user?.role?.name || 'SUPER_ADMIN_OWNER'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">حالة الحساب:</span>
                  <span className="text-emerald-700 font-bold">نشط ومفعل</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-500">نطاق الوصول:</span>
                  <span className="font-bold text-slate-800">كافة أقسام السنتر والتقارير</span>
                </div>
              </div>
            </div>

            <div className="atlas-card p-5 space-y-3 bg-blue-50/50 border-blue-100">
              <h4 className="text-xs font-bold text-[#0C3C82] flex items-center gap-1.5">
                <Sparkles size={14} />
                <span>إرشادات أمان الحساب</span>
              </h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                يرجى التأكد من كتابة رقم موبايل صحيح لتلقي إشعارات الحساب، وتحديث كلمة المرور دورياً للحفاظ على سرية بيانات الطلاب والخزينة.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Change Password */}
      {activeTab === 'security' && (
        <div className="max-w-xl atlas-card p-6 space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-800">
              تغيير كلمة المرور
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              قم بإدخال كلمة المرور الحالية ثم كلمة المرور الجديدة لحماية حسابك
            </p>
          </div>

          <form onSubmit={handleSecuritySubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                كلمة المرور الحالية <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={securityForm.currentPassword}
                  onChange={(e) => setSecurityForm({ ...securityForm, currentPassword: e.target.value })}
                  placeholder="••••••••"
                  className="atlas-input pl-10 text-sm font-mono text-left"
                  dir="ltr"
                  required
                />
                <Lock size={16} className="absolute left-3 top-2.5 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                كلمة المرور الجديدة <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={securityForm.newPassword}
                  onChange={(e) => setSecurityForm({ ...securityForm, newPassword: e.target.value })}
                  placeholder="6 أحرف أو أرقام على الأقل"
                  className="atlas-input pl-10 text-sm font-mono text-left"
                  dir="ltr"
                  required
                />
                <KeyRound size={16} className="absolute left-3 top-2.5 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                تأكيد كلمة المرور الجديدة <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={securityForm.confirmPassword}
                  onChange={(e) => setSecurityForm({ ...securityForm, confirmPassword: e.target.value })}
                  placeholder="أعد كتابة كلمة المرور الجديدة"
                  className="atlas-input pl-10 text-sm font-mono text-left"
                  dir="ltr"
                  required
                />
                <KeyRound size={16} className="absolute left-3 top-2.5 text-slate-400" />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={securityLoading}
                className="atlas-btn atlas-btn-primary text-sm px-6 py-2.5 shadow-sm"
              >
                {securityLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>جاري التغيير...</span>
                  </>
                ) : (
                  <>
                    <Lock size={16} />
                    <span>تأكيد تغيير كلمة المرور</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
