import { RouterProvider } from 'react-router';
import { router } from './routes';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { Toaster } from 'sonner';
import { useEffect } from 'react';
import { registerPushNotifications } from './lib/push';
import { isSupabaseConfigured, verifySupabaseConnection } from '../lib/supabaseClient';

export default function App() {
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    verifySupabaseConnection().catch((error) => {
      console.error('[Supabase] Connection verification failed:', error);
    });
    registerPushNotifications().catch(() => undefined);
  }, []);

  return (
    <div dir="rtl" className="min-h-screen bg-background">
      <AuthProvider>
        <CartProvider>
          <RouterProvider router={router} />
          <Toaster position="top-center" richColors closeButton />
        </CartProvider>
      </AuthProvider>
    </div>
  );
}
