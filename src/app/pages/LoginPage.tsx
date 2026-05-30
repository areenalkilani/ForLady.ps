import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { ADMIN_EMAIL } from '../lib/constants';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const success = await login(email, password);
      if (success) {
        toast.success('تم تسجيل الدخول بنجاح');
        const targetPath = email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase() ? '/admin' : '/';
        navigate(targetPath, { replace: true });
      } else {
        toast.error('خطأ في البريد الإلكتروني أو كلمة المرور');
      }
    } catch (error: any) {
      console.error('[Login] Failed:', error);
      toast.error(getAuthErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-primary mb-2">For Lady</h1>
            <p className="text-muted-foreground">تسجيل الدخول لحسابك</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block mb-2">البريد الإلكتروني</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary bg-input-background"
                placeholder="example@email.com"
              />
            </div>

            <div>
              <label className="block mb-2">كلمة المرور</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary bg-input-background"
                placeholder="••••••••"
              />
            </div>

            <div className="flex justify-between items-center text-sm">
              <Link
                to="/forgot-password"
                className="text-primary hover:underline"
              >
                نسيت كلمة المرور؟
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">ليس لديك حساب؟ </span>
            <Link to="/register" className="text-primary hover:underline">
              إنشاء حساب جديد
            </Link>
          </div>

          <div className="mt-6 pt-6 border-t border-border text-center">
            <Link to="/" className="text-sm text-muted-foreground hover:text-primary">
              العودة للمتجر
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function getAuthErrorMessage(error: any) {
  const message = String(error?.message || '');
  const lower = message.toLowerCase();
  if (lower.includes('email not confirmed')) {
    return 'يجب تأكيد البريد الإلكتروني قبل تسجيل الدخول. افحصي بريدك واضغطي رابط التأكيد.';
  }
  if (lower.includes('invalid login credentials')) {
    return 'البريد الإلكتروني أو كلمة المرور غير صحيحة.';
  }
  return message || 'تعذر تسجيل الدخول';
}
