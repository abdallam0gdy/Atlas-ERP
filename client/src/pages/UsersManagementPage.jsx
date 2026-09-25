import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../lib/api';
import useAuthStore from '../stores/authStore';
import {
  Users, ShieldCheck, UserPlus, KeyRound, ShieldAlert, CheckCircle2,
  XCircle, Edit, Trash2, Search, Lock, Phone, User, Check,
  AlertTriangle, RefreshCw, LayoutDashboard, GraduationCap, BookOpen,
  BookMarked, CreditCard, Package, Wallet, Library, QrCode, DoorOpen,
  ChevronLeft, Info
} from 'lucide-react';

// Icon resolver for system pages
const PAGE_ICON_MAP = {
  dashboard: LayoutDashboard,
  students: Users,
  teachers: GraduationCap,
  groups: BookOpen,
  subjects: BookMarked,
  subscriptions: CreditCard,
  packages: Package,
  finance: Wallet,
  booklets: Library,
  qrcode: QrCode,
  gate: DoorOpen,
  users: ShieldCheck,
};

export default function UsersManagementPage() {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'roles'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('ALL');

  // Modals state
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [passwordTargetUser, setPasswordTargetUser] = useState(null);

  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);

  // --- QUERIES ---
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await api.get('/users');
      return res.data.data;
    },
  });

  const { data: rolesData, isLoading: rolesLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const res = await api.get('/users/roles');
      return res.data;
    },
  });

  const users = usersData || [];
  const roles = rolesData?.data || [];
  const systemPages = rolesData?.systemPages || [];

  // --- MUTATIONS ---
  // Create / Update User
  const saveUserMutation = useMutation({
    mutationFn: async (userData) => {
      if (editingUser) {
        return await api.put(`/users/${editingUser.id}`, userData);
      } else {
        return await api.post('/users', userData);
      }
    },
    onSuccess: () => {
      toast.success(editingUser ? 'تم تحديث بيانات الحساب بنجاح' : 'تم إنشاء الحساب بنجاح');
      queryClient.invalidateQueries(['users']);
      queryClient.invalidateQueries(['roles']);
      setUserModalOpen(false);
      setEditingUser(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'حدث خطأ أثناء حفظ المستخدم');
    },
  });

  // Reset Password
  const resetPasswordMutation = useMutation({
    mutationFn: async ({ id, newPassword }) => {
      return await api.put(`/users/${id}/reset-password`, { newPassword });
    },
    onSuccess: (res) => {
      toast.success(res.data?.message || 'تم إعادة تعيين كلمة المرور بنجاح');
      setPasswordModalOpen(false);
      setPasswordTargetUser(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'فشل إعادة تعيين كلمة المرور');
    },
  });

  // Toggle Active
  const toggleActiveMutation = useMutation({
    mutationFn: async (id) => {
      return await api.put(`/users/${id}/toggle-active`);
    },
    onSuccess: (res) => {
      toast.success(res.data?.message || 'تم تحديث حالة الحساب');
      queryClient.invalidateQueries(['users']);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'فشل تحديث حالة الحساب');
    },
  });

  // Delete User
  const deleteUserMutation = useMutation({
    mutationFn: async (id) => {
      return await api.delete(`/users/${id}`);
    },
    onSuccess: () => {
      toast.success('تم حذف حساب المستخدم بنجاح');
      queryClient.invalidateQueries(['users']);
      queryClient.invalidateQueries(['roles']);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'فشل حذف الحساب');
    },
  });

  // Create / Update Role
  const saveRoleMutation = useMutation({
    mutationFn: async (roleData) => {
      if (editingRole) {
        return await api.put(`/users/roles/${editingRole.id}`, roleData);
      } else {
        return await api.post('/users/roles', roleData);
      }
    },
    onSuccess: () => {
      toast.success(editingRole ? 'تم تحديث نوع الحساب وصلاحياته بنجاح' : 'تم إنشاء نوع الحساب بنجاح');
      queryClient.invalidateQueries(['roles']);
      queryClient.invalidateQueries(['users']);
      setRoleModalOpen(false);
      setEditingRole(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'فشل حفظ نوع الحساب');
    },
  });

  // Delete Role
  const deleteRoleMutation = useMutation({
    mutationFn: async (id) => {
      return await api.delete(`/users/roles/${id}`);
    },
    onSuccess: () => {
      toast.success('تم حذف نوع الحساب بنجاح');
      queryClient.invalidateQueries(['roles']);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'فشل حذف نوع الحساب');
    },
  });

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.fullNameAr && u.fullNameAr.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (u.fullName && u.fullName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (u.phone && u.phone.includes(searchQuery));

      const matchRole = selectedRoleFilter === 'ALL' || u.role?.name === selectedRoleFilter;
      return matchSearch && matchRole;
    });
  }, [users, searchQuery, selectedRoleFilter]);

  const activeCount = users.filter((u) => u.isActive).length;
  const inactiveCount = users.length - activeCount;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in" dir="rtl">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0C3C82] flex items-center justify-center shadow-xs">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
                إدارة الحسابات وصلاحيات الوصول
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                إنشاء حسابات الموظفين وتخصيص الصفحات المسموحة لكل نوع حساب (RBAC)
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons based on active tab */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {activeTab === 'users' ? (
            <button
              onClick={() => {
                setEditingUser(null);
                setUserModalOpen(true);
              }}
              className="atlas-btn-primary flex items-center gap-2 text-xs sm:text-sm py-2 px-4 shadow-sm"
            >
              <UserPlus size={16} />
              <span>إضافة حساب مستخدم</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setEditingRole(null);
                setRoleModalOpen(true);
              }}
              className="atlas-btn-primary flex items-center gap-2 text-xs sm:text-sm py-2 px-4 shadow-sm"
            >
              <ShieldCheck size={16} />
              <span>إضافة نوع صلاحية جديد</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="atlas-card p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">إجمالي الحسابات</p>
            <p className="text-2xl font-black text-slate-800 mt-1">{users.length}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0C3C82] flex items-center justify-center">
            <Users size={20} />
          </div>
        </div>

        <div className="atlas-card p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">الحسابات النشطة</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">{activeCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 size={20} />
          </div>
        </div>

        <div className="atlas-card p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">أنواع الصلاحيات</p>
            <p className="text-2xl font-black text-indigo-600 mt-1">{roles.length}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <ShieldCheck size={20} />
          </div>
        </div>

        <div className="atlas-card p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">حسابات معطلة</p>
            <p className="text-2xl font-black text-rose-500 mt-1">{inactiveCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center">
            <XCircle size={20} />
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'users'
              ? 'border-[#0C3C82] text-[#0C3C82]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users size={18} />
          <span>حسابات المستخدمين</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-normal">
            {users.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('roles')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'roles'
              ? 'border-[#0C3C82] text-[#0C3C82]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldCheck size={18} />
          <span>أنواع الحسابات والصلاحيات (الأدوار)</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-normal">
            {roles.length}
          </span>
        </button>
      </div>

      {/* TAB 1: USERS MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="atlas-card p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث بالاسم، اسم المستخدم، الهاتف..."
                className="atlas-input pr-10 text-xs sm:text-sm py-2 w-full"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs text-slate-500 font-bold whitespace-nowrap">نوع الصلاحية:</span>
              <select
                value={selectedRoleFilter}
                onChange={(e) => setSelectedRoleFilter(e.target.value)}
                className="atlas-input text-xs sm:text-sm py-2"
              >
                <option value="ALL">جميع الأدوار ({users.length})</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.name}>
                    {r.labelAr} ({r.userCount})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Users Table */}
          <div className="atlas-card overflow-hidden">
            {usersLoading ? (
              <div className="p-12 text-center text-slate-400">
                <RefreshCw size={28} className="animate-spin mx-auto mb-2 text-[#0C3C82]" />
                <p>جاري تحميل قائمة المستخدمين...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <Users size={36} className="mx-auto mb-2 text-slate-300" />
                <p className="font-bold text-slate-600">لا يوجد مستخدمون مطابقون لبحثك</p>
                <p className="text-xs text-slate-400 mt-1">تأكد من كتابة الاسم بشكل صحيح أو أضف مستخدم جديد</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                      <th className="py-3 px-4">المستخدم</th>
                      <th className="py-3 px-4">نوع الصلاحية (الدور)</th>
                      <th className="py-3 px-4">رقم الهاتف</th>
                      <th className="py-3 px-4">الحالة</th>
                      <th className="py-3 px-4">آخر دخول</th>
                      <th className="py-3 px-4 text-center">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUsers.map((u) => {
                      const isSuperAdmin = u.role?.name === 'SUPER_ADMIN_OWNER';
                      const isCurrentUser = currentUser?.id === u.id;
                      const isProtectedAdmin = u.username === 'admin';

                      return (
                        <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm text-white shadow-2xs ${
                                  isSuperAdmin
                                    ? 'bg-gradient-to-br from-amber-500 to-amber-700'
                                    : 'bg-gradient-to-br from-[#0C3C82] to-blue-700'
                                }`}
                              >
                                {u.fullNameAr?.[0] || u.fullName?.[0] || 'U'}
                              </div>
                              <div>
                                <p className="font-bold text-slate-800 leading-tight">
                                  {u.fullNameAr || u.fullName}
                                  {isCurrentUser && (
                                    <span className="mr-2 text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-md font-bold">
                                      أنت
                                    </span>
                                  )}
                                </p>
                                <p className="text-slate-400 font-mono text-[11px]">@{u.username}</p>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${
                                isSuperAdmin
                                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                                  : u.role?.name === 'FINANCE_MANAGER'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : u.role?.name === 'CENTER_MANAGER'
                                  ? 'bg-blue-50 text-blue-800 border-blue-200'
                                  : 'bg-purple-50 text-purple-800 border-purple-200'
                              }`}
                            >
                              <ShieldCheck size={13} />
                              <span>{u.role?.label || u.role?.name}</span>
                            </span>
                            <p className="text-[10px] text-slate-400 mt-1">
                              مسموح بـ {u.role?.allowedPages?.length || 0} صفحات
                            </p>
                          </td>

                          <td className="py-3 px-4 text-slate-600 font-mono text-xs">
                            {u.phone || '—'}
                          </td>

                          <td className="py-3 px-4">
                            <button
                              disabled={isProtectedAdmin || isCurrentUser}
                              onClick={() => toggleActiveMutation.mutate(u.id)}
                              title={
                                isProtectedAdmin
                                  ? 'لا يمكن تعطيل حساب الأدمن الأساسي'
                                  : isCurrentUser
                                  ? 'لا يمكنك تعطيل حسابك الحالي'
                                  : 'اضغط لتغيير الحالة'
                              }
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all ${
                                u.isActive
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                              } ${isProtectedAdmin || isCurrentUser ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  u.isActive ? 'bg-emerald-500' : 'bg-rose-500'
                                }`}
                              />
                              <span>{u.isActive ? 'نشط' : 'معطل'}</span>
                            </button>
                          </td>

                          <td className="py-3 px-4 text-xs text-slate-500">
                            {u.lastLoginAt
                              ? new Date(u.lastLoginAt).toLocaleDateString('ar-EG', {
                                  day: 'numeric',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : 'لم يسجل دخول بعد'}
                          </td>

                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Edit Button */}
                              <button
                                onClick={() => {
                                  setEditingUser(u);
                                  setUserModalOpen(true);
                                }}
                                className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="تعديل بيانات الحساب"
                              >
                                <Edit size={16} />
                              </button>

                              {/* Reset Password Button */}
                              <button
                                onClick={() => {
                                  setPasswordTargetUser(u);
                                  setPasswordModalOpen(true);
                                }}
                                className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                title="إعادة تعيين كلمة المرور"
                              >
                                <KeyRound size={16} />
                              </button>

                              {/* Delete Button */}
                              {!isProtectedAdmin && !isCurrentUser && (
                                <button
                                  onClick={() => {
                                    if (
                                      window.confirm(
                                        `هل أنت متأكد من حذف حساب (${u.fullNameAr || u.fullName})؟ لا يمكن التراجع عن هذا الإجراء.`
                                      )
                                    ) {
                                      deleteUserMutation.mutate(u.id);
                                    }
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                  title="حذف الحساب"
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: ROLES & ALLOWED PAGES MANAGEMENT */}
      {activeTab === 'roles' && (
        <div className="space-y-4">
          <div className="atlas-card p-4 bg-blue-50/50 border-blue-200/80 flex items-start gap-3">
            <Info size={20} className="text-[#0C3C82] flex-shrink-0 mt-0.5" />
            <div className="text-xs text-slate-700 leading-relaxed">
              <span className="font-bold text-[#0C3C82]">كيف يعمل نظام الصلاحيات؟ </span>
              يمكنك هنا إنشاء أدوار جديدة (مثل: موظف استقبال، مدير فرع، مشرف قاعات) وتحديد
              <strong> الصفحات المسموحة (Allowed Pages)</strong> بدقة لكل دور عبر الـ Checkbox.
              عندما تُنشئ أي حساب مستخدم وتختار له هذا الدور، سيتمكن فقط من رؤية الصفحات التي حددتها له هنا!
            </div>
          </div>

          {rolesLoading ? (
            <div className="p-12 text-center text-slate-400">
              <RefreshCw size={28} className="animate-spin mx-auto mb-2 text-[#0C3C82]" />
              <p>جاري تحميل أنواع الصلاحيات...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {roles.map((r) => {
                const isSuperAdmin = r.name === 'SUPER_ADMIN_OWNER';
                const rolePages = Array.isArray(r.allowedPages) ? r.allowedPages : [];

                return (
                  <div
                    key={r.id}
                    className="atlas-card p-5 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden"
                  >
                    <div>
                      {/* Role Card Header */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shadow-2xs ${
                              isSuperAdmin
                                ? 'bg-gradient-to-br from-amber-500 to-amber-700'
                                : 'bg-gradient-to-br from-[#0C3C82] to-blue-700'
                            }`}
                          >
                            <ShieldCheck size={20} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-slate-800 text-base">{r.labelAr}</h3>
                              {r.isSystem ? (
                                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">
                                  نظام أساسي
                                </span>
                              ) : (
                                <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-bold">
                                  مخصص
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400 font-mono">{r.name}</p>
                          </div>
                        </div>

                        <span className="text-xs bg-blue-50 text-[#0C3C82] font-bold px-2.5 py-1 rounded-lg border border-blue-100">
                          {r.userCount} مستخدمين
                        </span>
                      </div>

                      {/* Role Description */}
                      <p className="text-xs text-slate-500 mb-4 min-h-[32px]">
                        {r.description || 'لا يوجد وصف مضاف لهذا الدور.'}
                      </p>

                      {/* Allowed Pages Badges */}
                      <div className="mb-4">
                        <p className="text-xs font-bold text-slate-700 mb-2 flex items-center justify-between">
                          <span>الصفحات المسموحة لهذا الدور:</span>
                          <span className="text-slate-400 font-normal">
                            ({isSuperAdmin ? 'كل الصفحات' : `${rolePages.length} صفحات`})
                          </span>
                        </p>

                        <div className="flex flex-wrap gap-1.5">
                          {systemPages.map((page) => {
                            const isAllowed = isSuperAdmin || rolePages.includes(page.id);
                            const IconComponent = PAGE_ICON_MAP[page.id] || LayoutDashboard;

                            if (!isAllowed) return null;

                            return (
                              <span
                                key={page.id}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200/80"
                              >
                                <IconComponent size={12} className="text-[#0C3C82]" />
                                <span>{page.label_ar}</span>
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Role Card Footer Controls */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <button
                        onClick={() => {
                          setEditingRole(r);
                          setRoleModalOpen(true);
                        }}
                        className="atlas-btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
                      >
                        <Edit size={14} />
                        <span>تعديل الصلاحيات والصفحات</span>
                      </button>

                      {!r.isSystem && r.userCount === 0 && (
                        <button
                          onClick={() => {
                            if (window.confirm(`هل أنت متأكد من حذف نوع الصلاحية (${r.labelAr})؟`)) {
                              deleteRoleMutation.mutate(r.id);
                            }
                          }}
                          className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                          title="حذف هذا الدور"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 1: ADD / EDIT USER */}
      {/* ============================================================ */}
      {userModalOpen && (
        <UserFormModal
          user={editingUser}
          roles={roles}
          systemPages={systemPages}
          onClose={() => {
            setUserModalOpen(false);
            setEditingUser(null);
          }}
          onSave={(data) => saveUserMutation.mutate(data)}
          isLoading={saveUserMutation.isPending}
        />
      )}

      {/* ============================================================ */}
      {/* MODAL 2: RESET PASSWORD */}
      {/* ============================================================ */}
      {passwordModalOpen && passwordTargetUser && (
        <ResetPasswordModal
          user={passwordTargetUser}
          onClose={() => {
            setPasswordModalOpen(false);
            setPasswordTargetUser(null);
          }}
          onSave={(newPassword) =>
            resetPasswordMutation.mutate({
              id: passwordTargetUser.id,
              newPassword,
            })
          }
          isLoading={resetPasswordMutation.isPending}
        />
      )}

      {/* ============================================================ */}
      {/* MODAL 3: ADD / EDIT ROLE & ALLOWED PAGES */}
      {/* ============================================================ */}
      {roleModalOpen && (
        <RoleFormModal
          role={editingRole}
          systemPages={systemPages}
          onClose={() => {
            setRoleModalOpen(false);
            setEditingRole(null);
          }}
          onSave={(data) => saveRoleMutation.mutate(data)}
          isLoading={saveRoleMutation.isPending}
        />
      )}
    </div>
  );
}

// ------------------------------------------------------------
// COMPONENT: User Form Modal (Create / Edit)
// ------------------------------------------------------------
function UserFormModal({ user, roles, systemPages, onClose, onSave, isLoading }) {
  const isEditing = !!user;
  const [formData, setFormData] = useState({
    username: user?.username || '',
    password: '',
    fullName: user?.fullName || '',
    fullNameAr: user?.fullNameAr || '',
    phone: user?.phone || '',
    email: user?.email || '',
    roleId: user?.role?.id || roles[0]?.id || '',
  });

  const selectedRole = roles.find((r) => r.id === formData.roleId);
  const selectedRolePages = selectedRole
    ? selectedRole.name === 'SUPER_ADMIN_OWNER'
      ? systemPages.map((p) => p.id)
      : selectedRole.allowedPages || []
    : [];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.username.trim() || !formData.fullName.trim() || !formData.roleId) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }
    if (!isEditing && (!formData.password || formData.password.length < 4)) {
      toast.error('كلمة المرور يجب ألا تقل عن 4 خانات');
      return;
    }

    onSave({
      ...formData,
      username: formData.username.trim().toLowerCase(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-[#0C3C82] flex items-center justify-center">
              <UserPlus size={18} />
            </div>
            <h3 className="font-bold text-slate-800 text-base">
              {isEditing ? `تعديل حساب (@${user.username})` : 'إضافة حساب مستخدم جديد'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-right">
          {/* Username & Password (Password only required when creating) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                اسم المستخدم (English) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                disabled={isEditing}
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="e.g. reception_1"
                className="atlas-input w-full text-xs font-mono"
                required
              />
            </div>

            {!isEditing && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  كلمة المرور <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  className="atlas-input w-full text-xs"
                  required
                />
              </div>
            )}
          </div>

          {/* Full Name & Full Name Arabic */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                الاسم الكامل بالعربية <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.fullNameAr}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    fullNameAr: e.target.value,
                    fullName: formData.fullName || e.target.value,
                  })
                }
                placeholder="مثال: أحمد مصطفى عبد الله"
                className="atlas-input w-full text-xs"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">رقم الهاتف</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="01012345678"
                className="atlas-input w-full text-xs font-mono"
              />
            </div>
          </div>

          {/* SELECT BOX: Ready Role (نوع الصلاحية الجاهز) */}
          <div className="pt-2 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              نوع الصلاحية / الدور (Role) <span className="text-rose-500">*</span>
            </label>
            <select
              value={formData.roleId}
              onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
              className="atlas-input w-full text-xs font-bold py-2.5"
              required
            >
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.labelAr} — ({r.allowedPages?.length || 0} صفحات مسموحة)
                </option>
              ))}
            </select>
          </div>

          {/* Role Preview Card (عرض الصفحات المسموحة لهذا الدور الجاهز) */}
          {selectedRole && (
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#0C3C82] flex items-center gap-1.5">
                  <ShieldCheck size={14} />
                  <span>معاينة الصفحات المسموحة لهذا الحساب:</span>
                </span>
                <span className="text-[10px] text-slate-500 font-bold">
                  {selectedRolePages.length} صفحات
                </span>
              </div>

              <div className="flex flex-wrap gap-1">
                {systemPages.map((page) => {
                  const allowed = selectedRolePages.includes(page.id);
                  if (!allowed) return null;
                  const Icon = PAGE_ICON_MAP[page.id] || LayoutDashboard;
                  return (
                    <span
                      key={page.id}
                      className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200"
                    >
                      <Icon size={11} />
                      <span>{page.label_ar}</span>
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Modal Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button type="button" onClick={onClose} className="atlas-btn-secondary text-xs py-2 px-4">
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="atlas-btn-primary text-xs py-2 px-5 flex items-center gap-2"
            >
              {isLoading && <RefreshCw size={14} className="animate-spin" />}
              <span>{isEditing ? 'حفظ التعديلات' : 'إنشاء الحساب'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ------------------------------------------------------------
// COMPONENT: Reset Password Modal
// ------------------------------------------------------------
function ResetPasswordModal({ user, onClose, onSave, isLoading }) {
  const [newPassword, setNewPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 4) {
      toast.error('كلمة المرور يجب ألا تقل عن 4 خانات');
      return;
    }
    onSave(newPassword);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-200">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-amber-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <KeyRound size={18} />
            </div>
            <h3 className="font-bold text-slate-800 text-sm">إعادة تعيين كلمة المرور</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-right">
          <p className="text-xs text-slate-600">
            تعيين كلمة مرور جديدة للمستخدم{' '}
            <strong className="text-slate-800 font-mono">@{user.username}</strong> ({user.fullNameAr || user.fullName})
          </p>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">كلمة المرور الجديدة</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="اكتب كلمة المرور الجديدة..."
              className="atlas-input w-full text-xs"
              autoFocus
              required
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button type="button" onClick={onClose} className="atlas-btn-secondary text-xs py-2 px-3">
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="atlas-btn-primary bg-amber-600 hover:bg-amber-700 text-xs py-2 px-4 flex items-center gap-2"
            >
              {isLoading && <RefreshCw size={14} className="animate-spin" />}
              <span>تأكيد التغيير</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ------------------------------------------------------------
// COMPONENT: Role Form Modal (Create / Edit Role + Allowed Pages Checkboxes)
// ------------------------------------------------------------
function RoleFormModal({ role, systemPages, onClose, onSave, isLoading }) {
  const isEditing = !!role;
  const isSuperAdmin = role?.name === 'SUPER_ADMIN_OWNER';

  const [formData, setFormData] = useState({
    name: role?.name || '',
    labelAr: role?.labelAr || '',
    description: role?.description || '',
    allowedPages: role ? (Array.isArray(role.allowedPages) ? role.allowedPages : []) : [],
  });

  const togglePage = (pageId) => {
    if (isSuperAdmin) return; // Super admin keeps all
    setFormData((prev) => {
      const exists = prev.allowedPages.includes(pageId);
      const newPages = exists
        ? prev.allowedPages.filter((p) => p !== pageId)
        : [...prev.allowedPages, pageId];
      return { ...prev, allowedPages: newPages };
    });
  };

  const selectAllPages = () => {
    setFormData((prev) => ({
      ...prev,
      allowedPages: systemPages.map((p) => p.id),
    }));
  };

  const deselectAllPages = () => {
    setFormData((prev) => ({
      ...prev,
      allowedPages: [],
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.labelAr.trim()) {
      toast.error('يرجى إدخال اسم الدور بالعربية');
      return;
    }
    if (!isEditing && !formData.name.trim()) {
      toast.error('يرجى إدخال كود الدور بالإنجليزية');
      return;
    }

    onSave({
      name: formData.name.trim(),
      labelAr: formData.labelAr.trim(),
      description: formData.description.trim(),
      allowedPages: isSuperAdmin ? systemPages.map((p) => p.id) : formData.allowedPages,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <ShieldCheck size={18} />
            </div>
            <h3 className="font-bold text-slate-800 text-base">
              {isEditing ? `تعديل صلاحيات (${role.labelAr})` : 'إنشاء نوع صلاحية جديد'}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-right">
          {/* Role Names */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                اسم نوع الحساب بالعربية <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.labelAr}
                onChange={(e) => setFormData({ ...formData, labelAr: e.target.value })}
                placeholder="مثال: موظف استقبال، مشرف مسائي..."
                className="atlas-input w-full text-xs font-bold"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                الكود بالإنجليزية (Role Code) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                disabled={isEditing}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. RECEPTION_OFFICER"
                className="atlas-input w-full text-xs font-mono"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">وصف مختصر لهذا الدور</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="وصف المهام والمسؤوليات المسموحة لهذا الحساب..."
              className="atlas-input w-full text-xs"
            />
          </div>

          {/* CHECKBOXES GRID: ALLOWED PAGES (الصفحات المسموحة) */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2.5">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <CheckCircle2 size={15} className="text-[#0C3C82]" />
                <span>اختر الصفحات المسموحة لهذا الدور:</span>
                <span className="text-[11px] text-slate-400 font-normal">
                  ({formData.allowedPages.length} من أصل {systemPages.length} صفحات)
                </span>
              </label>

              {!isSuperAdmin && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={selectAllPages}
                    className="text-[11px] text-[#0C3C82] hover:underline font-bold"
                  >
                    تحديد الكل
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={deselectAllPages}
                    className="text-[11px] text-rose-600 hover:underline font-bold"
                  >
                    إلغاء التحديد
                  </button>
                </div>
              )}
            </div>

            {isSuperAdmin && (
              <div className="p-2.5 bg-amber-50 text-amber-800 rounded-xl text-xs mb-3 font-medium">
                ⚠️ دور (مالك النظام) يمتلك دائماً جميع الصفحات بدون قيود.
              </div>
            )}

            {/* Checkboxes Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto p-1 border border-slate-100 rounded-xl">
              {systemPages.map((page) => {
                const isSelected = isSuperAdmin || formData.allowedPages.includes(page.id);
                const IconComponent = PAGE_ICON_MAP[page.id] || LayoutDashboard;

                return (
                  <label
                    key={page.id}
                    onClick={() => togglePage(page.id)}
                    className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all cursor-pointer select-none ${
                      isSelected
                        ? 'bg-blue-50/70 border-blue-300 shadow-2xs'
                        : 'bg-white border-slate-200/80 hover:bg-slate-50'
                    } ${isSuperAdmin ? 'cursor-not-allowed opacity-90' : ''}`}
                  >
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                        isSelected ? 'bg-[#0C3C82] text-white' : 'border border-slate-300 bg-white'
                      }`}
                    >
                      {isSelected && <Check size={14} />}
                    </div>

                    <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
                      <IconComponent size={15} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800 leading-tight truncate">
                        {page.label_ar}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono">/{page.id}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button type="button" onClick={onClose} className="atlas-btn-secondary text-xs py-2 px-4">
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="atlas-btn-primary text-xs py-2 px-5 flex items-center gap-2"
            >
              {isLoading && <RefreshCw size={14} className="animate-spin" />}
              <span>{isEditing ? 'حفظ الصلاحيات' : 'إنشاء الدور'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
