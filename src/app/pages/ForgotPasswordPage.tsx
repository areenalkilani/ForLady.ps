import { useState } from 'react';
import { Link } from 'react-router';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const { forgotPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await forgotPassword(email);
      setSent(true);
      toast.success('تم إرسال رابط إعادة تعيين كلمة المرور');
    } catch (error: any) {
      console.error('[Forgot password] Failed:', error);
      toast.error(getForgotPasswordErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">For Lady</h1>
          <p className="text-muted-foreground">{sent ? 'تم إرسال الرابط' : 'نسيت كلمة المرور'}</p>
        </div>

        {!sent ? (
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
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? 'جاري الإرسال...' : 'إرسال رابط إعادة التعيين'}
            </button>
          </form>
        ) : (
          <div className="text-center">
            <p className="text-muted-foreground mb-6">
              تم إرسال رابط آمن لإعادة تعيين كلمة المرور إلى بريدك الإلكتروني.
            </p>
            <Link to="/login" className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90">
              العودة لتسجيل الدخول
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function getForgotPasswordErrorMessage(error: any) {
  const message = String(error?.message || '');
  const lower = message.toLowerCase();

  if (lower.includes('error sending recovery email') || lower.includes('unexpected_failure')) {
    return 'Supabase غير قادر على إرسال إيميل الاسترجاع. فعّلي SMTP/Resend من إعدادات Supabase Auth.';
  }

  if (lower.includes('rate limit')) {
    return 'تم إرسال عدة طلبات. انتظري قليلاً ثم جربي مرة أخرى.';
  }

  return message || 'تعذر إرسال رابط إعادة التعيين';
}
