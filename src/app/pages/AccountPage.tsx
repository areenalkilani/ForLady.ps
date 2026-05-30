import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Navigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { fetchOrders, updateProfile } from '../lib/services';
import type { Order } from '../lib/types';
import { palestinianCities } from '../lib/constants';
import { toast } from 'sonner';

export function AccountPage() {
  const { user, isAuthenticated, logout, loading, refreshProfile } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    region: '',
    city: '',
    town: '',
  });

  useEffect(() => {
    if (isAuthenticated) fetchOrders(true).then(setOrders).catch(console.error);
  }, [isAuthenticated]);

  useEffect(() => {
    if (!user) return;
    setFormData({
      fullName: user.fullName || '',
      phone: user.phone || '',
      region: user.region || '',
      city: user.city || '',
      town: user.town || '',
    });
  }, [user]);

  const handleSaveProfile = async (event: FormEvent) => {
    event.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      await updateProfile({ id: user.id, ...formData });
      await refreshProfile();
      toast.success('تم تحديث الملف الشخصي');
    } catch (error: any) {
      console.error('[Account] Profile update failed:', error);
      toast.error(error.message || 'تعذر تحديث الملف الشخصي');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/10 flex items-center justify-center">
        <p className="text-muted-foreground">جاري تحميل الحساب...</p>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  const regions = Object.keys(palestinianCities);
  const cities = formData.region ? palestinianCities[formData.region] || [] : [];

  return (
    <div className="min-h-screen bg-muted/10 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">حسابي</h1>
            <p className="text-muted-foreground">إدارة معلوماتك وطلباتك</p>
          </div>
          <button
            onClick={async () => {
              await logout();
            }}
            className="rounded-lg border-2 border-destructive px-5 py-3 text-destructive hover:bg-destructive hover:text-destructive-foreground"
          >
            تسجيل الخروج
          </button>
        </div>

        <div className="grid gap-6">
          <div className="rounded-2xl bg-white p-6">
            <h2 className="mb-4 text-xl font-semibold">الملف الشخصي</h2>
            <div className="mb-6 grid gap-3 rounded-lg bg-muted/30 p-4 text-sm sm:grid-cols-2">
              <Info label="البريد الإلكتروني" value={user?.email} />
              <Info label="نوع الحساب" value={user?.role === 'admin' ? 'مسؤول' : 'زبون'} />
            </div>

            <form onSubmit={handleSaveProfile} className="grid gap-4 sm:grid-cols-2">
              <Field label="الاسم الكامل">
                <input
                  value={formData.fullName}
                  onChange={(event) => setFormData({ ...formData, fullName: event.target.value })}
                  required
                  className="w-full rounded-lg border border-border bg-input-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </Field>

              <Field label="رقم الهاتف">
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(event) => setFormData({ ...formData, phone: event.target.value })}
                  required
                  className="w-full rounded-lg border border-border bg-input-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </Field>

              <Field label="المنطقة">
                <select
                  value={formData.region}
                  onChange={(event) => setFormData({ ...formData, region: event.target.value, city: '' })}
                  required
                  className="w-full rounded-lg border border-border bg-input-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">اختاري المنطقة</option>
                  {regions.map((region) => (
                    <option key={region} value={region}>{region}</option>
                  ))}
                </select>
              </Field>

              <Field label="المدينة">
                <select
                  value={formData.city}
                  onChange={(event) => setFormData({ ...formData, city: event.target.value })}
                  required
                  disabled={!formData.region}
                  className="w-full rounded-lg border border-border bg-input-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60"
                >
                  <option value="">اختاري المدينة</option>
                  {cities.map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </Field>

              <Field label="القرية أو البلدة">
                <input
                  value={formData.town}
                  onChange={(event) => setFormData({ ...formData, town: event.target.value })}
                  required
                  placeholder="اكتبي القرية أو البلدة"
                  className="w-full rounded-lg border border-border bg-input-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </Field>

              <div className="flex items-end sm:col-span-2">
                <button
                  disabled={saving}
                  className="w-full rounded-lg bg-primary px-5 py-3 text-primary-foreground hover:opacity-90 disabled:opacity-50 sm:w-auto"
                >
                  {saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white rounded-2xl p-6">
            <h2 className="text-xl font-semibold mb-4">طلباتي</h2>
            {orders.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">لا توجد طلبات سابقة</p>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="border border-border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-semibold">طلب #{order.id}</p>
                        <p className="text-sm text-muted-foreground">{new Date(order.createdAt).toLocaleDateString('ar')}</p>
                      </div>
                      <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">{getStatusLabel(order.status)}</span>
                    </div>
                    <div className="space-y-2">
                      {order.products.map((product, index) => (
                        <div key={index} className="flex gap-3 text-sm">
                          <img src={product.productImage} alt={product.productName} className="w-12 h-12 object-cover rounded" />
                          <div className="flex-1">
                            <p className="font-medium">{product.productName}</p>
                            <p className="text-muted-foreground">{product.color} - {product.size} x {product.quantity}</p>
                          </div>
                          <p className="font-semibold">{product.price * product.quantity} ₪</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 pt-3 border-t border-border flex justify-between">
                      <span className="font-semibold">المجموع:</span>
                      <span className="font-bold text-primary">{order.total} ₪</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value?: string }) {
  return <div><span className="text-muted-foreground">{label}:</span><span className="mr-2 font-medium">{value}</span></div>;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block">{label}</span>
      {children}
    </label>
  );
}

function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    pending: 'قيد الانتظار',
    processing: 'قيد المعالجة',
    ready: 'جاهز',
    out_for_delivery: 'خرج للتوصيل',
    delivered: 'تم التوصيل',
    cancelled: 'ملغي',
  };
  return labels[status] || status;
}
