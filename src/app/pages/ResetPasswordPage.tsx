import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabaseClient';

export function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const prepareRecoverySession = async () => {
      try {
        const code = new URLSearchParams(window.location.search).get('code');
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        }

        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        setReady(Boolean(data.session));
      } catch (error: any) {
        console.error('[Reset password] Recovery session failed:', error);
        toast.error(error?.message || 'رابط إعادة التعيين غير صالح أو منتهي');
        setReady(false);
      }
    };

    prepareRecoverySession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error('كلمتا المرور غير متطابقتين');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      await supabase.auth.signOut();
      toast.success('تم تحديث كلمة المرور بنجاح. سجلي الدخول بكلمة المرور الجديدة.');
      navigate('/login', { replace: true });
    } catch (error: any) {
      console.error('[Reset password] Failed:', error);
      toast.error(error?.message || 'تعذر تحديث كلمة المرور');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-12">
      <form onSubmit={handleSubmit} className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 space-y-4">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-primary mb-2">For Lady</h1>
          <p className="text-muted-foreground">كلمة مرور جديدة</p>
        </div>

        {!ready && (
          <div className="rounded-lg bg-yellow-50 text-yellow-800 p-3 text-sm">
            افتحي الصفحة من رابط إعادة التعيين المرسل إلى بريدك الإلكتروني.
          </div>
        )}

        <div>
          <label className="block mb-2">كلمة المرور الجديدة</label>
          <input
            type="password"
            minLength={6}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary bg-input-background"
          />
        </div>

        <div>
          <label className="block mb-2">تأكيد كلمة المرور</label>
          <input
            type="password"
            minLength={6}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary bg-input-background"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !ready}
          className="w-full py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {loading ? 'جاري الحفظ...' : 'تحديث كلمة المرور'}
        </button>
      </form>
    </div>
  );
}
