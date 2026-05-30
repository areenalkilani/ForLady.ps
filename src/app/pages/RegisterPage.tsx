import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { palestinianCities } from '../lib/constants';

export function RegisterPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    region: '',
    city: '',
    town: '',
  });
  const [loading, setLoading] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const { register, resendVerification } = useAuth();
  const navigate = useNavigate();

  const regions = Object.keys(palestinianCities);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await register(formData);
      if (result.needsEmailConfirmation) {
        setPendingEmail(formData.email);
        toast.success('تم إنشاء الحساب. يجب تأكيد البريد الإلكتروني قبل تسجيل الدخول.');
      } else {
        toast.success('تم إنشاء الحساب بنجاح');
        navigate('/account');
      }
    } catch (error: any) {
      console.error('[Register] Failed:', error);
      toast.error(getRegisterErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await resendVerification(pendingEmail || formData.email);
      toast.success('تم إرسال رابط التأكيد مرة أخرى');
    } catch (error: any) {
      console.error('[Register] Resend verification failed:', error);
      toast.error(error?.message || 'تعذر إعادة إرسال رابط التأكيد');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-primary mb-2">For Lady</h1>
            <p className="text-muted-foreground">إنشاء حساب جديد</p>
          </div>

          {pendingEmail && (
            <div className="mb-6 rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm">
              <p className="font-medium text-primary mb-2">تم إنشاء الحساب، بانتظار تأكيد البريد الإلكتروني.</p>
              <p className="text-muted-foreground mb-3">افحصي بريدك واضغطي رابط التأكيد، ثم سجلي الدخول.</p>
              <button
                type="button"
                onClick={handleResend}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
              >
                إعادة إرسال رابط التأكيد
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block mb-2">الاسم الكامل</label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) =>
                  setFormData({ ...formData, fullName: e.target.value })
                }
                required
                className="w-full px-4 py-3 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary bg-input-background"
                placeholder="الاسم الكامل"
              />
            </div>

            <div>
              <label className="block mb-2">البريد الإلكتروني</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
                className="w-full px-4 py-3 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary bg-input-background"
                placeholder="example@email.com"
              />
            </div>

            <div>
              <label className="block mb-2">كلمة المرور</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                required
                minLength={6}
                className="w-full px-4 py-3 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary bg-input-background"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block mb-2">رقم الهاتف</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                required
                className="w-full px-4 py-3 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary bg-input-background"
                placeholder="0599123456"
              />
            </div>

            <div>
              <label className="block mb-2">المنطقة</label>
              <select
                value={formData.region}
                onChange={(e) =>
                  setFormData({ ...formData, region: e.target.value, city: '' })
                }
                required
                className="w-full px-4 py-3 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary bg-input-background"
              >
                <option value="">اختر المنطقة</option>
                {regions.map((region) => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
              </select>
            </div>

            {formData.region && (
              <div>
                <label className="block mb-2">المدينة</label>
                <select
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                  required
                  className="w-full px-4 py-3 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary bg-input-background"
                >
                  <option value="">اختر المدينة</option>
                  {palestinianCities[formData.region as keyof typeof palestinianCities]?.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block mb-2">القرية أو البلدة</label>
              <input
                type="text"
                value={formData.town}
                onChange={(e) =>
                  setFormData({ ...formData, town: e.target.value })
                }
                required
                className="w-full px-4 py-3 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary bg-input-background"
                placeholder="اكتبي القرية أو البلدة"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? 'جاري الإنشاء...' : 'إنشاء الحساب'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">لديك حساب بالفعل؟ </span>
            <Link to="/login" className="text-primary hover:underline">
              تسجيل الدخول
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function getRegisterErrorMessage(error: any) {
  const message = String(error?.message || '');
  const lower = message.toLowerCase();
  if (lower.includes('already registered') || lower.includes('already been registered')) {
    return 'هذا البريد مسجل مسبقاً. جرّبي تسجيل الدخول أو إعادة إرسال رابط التأكيد.';
  }
  if (lower.includes('password')) {
    return 'كلمة المرور غير مقبولة. استخدمي 6 أحرف على الأقل.';
  }
  if (lower.includes('email')) {
    return 'تحققي من البريد الإلكتروني.';
  }
  return message || 'تعذر إنشاء الحساب';
}
