import { useEffect, useState } from 'react';
import { Navigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { fetchOrders } from '../lib/services';
import type { Order } from '../lib/types';

export function AccountPage() {
  const { user, isAuthenticated, logout, loading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (isAuthenticated) fetchOrders(true).then(setOrders).catch(console.error);
  }, [isAuthenticated]);

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/10 flex items-center justify-center">
        <p className="text-muted-foreground">جاري تحميل الحساب...</p>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen bg-muted/10 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">حسابي</h1>
        <div className="grid gap-6">
          <div className="bg-white rounded-2xl p-6">
            <h2 className="text-xl font-semibold mb-4">المعلومات الشخصية</h2>
            <div className="grid gap-3 text-sm">
              <Info label="الاسم" value={user?.fullName} />
              <Info label="البريد الإلكتروني" value={user?.email} />
              <Info label="رقم الهاتف" value={user?.phone} />
              <Info label="المنطقة" value={user?.region} />
              <Info label="المدينة" value={user?.city} />
            </div>
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

          <button onClick={logout} className="w-full py-3 border-2 border-destructive text-destructive rounded-lg hover:bg-destructive hover:text-destructive-foreground">تسجيل الخروج</button>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value?: string }) {
  return <div><span className="text-muted-foreground">{label}:</span><span className="mr-2 font-medium">{value}</span></div>;
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
