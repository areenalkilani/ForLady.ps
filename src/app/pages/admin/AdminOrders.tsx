import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { Search, Eye, Printer, X } from 'lucide-react';
import { fetchOrders, updateOrderStatus } from '../../lib/services';
import type { Order, OrderStatus } from '../../lib/types';
import { orderStatuses } from '../../lib/constants';
import { toast } from 'sonner';

export function AdminOrders() {
  const [searchParams] = useSearchParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');

  const loadOrders = () => fetchOrders(false, true).then(setOrders).catch((error) => {
    console.error('[AdminOrders] Load failed:', error);
    toast.error(error.message || 'تعذر تحميل الطلبات');
  });
  useEffect(() => { loadOrders(); }, []);

  useEffect(() => {
    const orderId = searchParams.get('order');
    if (!orderId || orders.length === 0) return;
    const order = orders.find((item) => item.id === orderId);
    if (order) setSelectedOrder(order);
  }, [orders, searchParams]);

  const filteredOrders = orders.filter((order) => {
    const matchesSearch = order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) || order.id.toLowerCase().includes(searchQuery.toLowerCase()) || order.customerPhone.includes(searchQuery);
    return matchesSearch && (statusFilter === 'all' || order.status === statusFilter);
  });

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      await loadOrders();
      toast.success('تم تحديث حالة الطلب');
    } catch (error) {
      toast.error('تعذر تحديث حالة الطلب');
    }
  };

  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-bold">الطلبات</h1><p className="text-muted-foreground">{orders.length} طلب</p></div>
      <div className="bg-white rounded-2xl p-4 grid md:grid-cols-2 gap-4">
        <div className="relative"><Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" /><input placeholder="بحث عن طلب أو عميل..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pr-10 pl-4 py-3 bg-muted rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-primary" /></div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-3 bg-muted rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-primary"><option value="all">جميع الحالات</option>{orderStatuses.map((status) => <option key={status} value={status}>{getStatusLabel(status)}</option>)}</select>
      </div>
      <div className="bg-white rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50"><tr><th className="text-right px-6 py-4">رقم الطلب</th><th className="text-right px-6 py-4">العميل</th><th className="text-right px-6 py-4">المنطقة</th><th className="text-right px-6 py-4">المبلغ</th><th className="text-right px-6 py-4">الحالة</th><th className="text-right px-6 py-4">التاريخ</th><th className="text-right px-6 py-4">الإجراءات</th></tr></thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id} className="border-t border-border">
                  <td className="px-6 py-4 font-semibold">{order.id}</td>
                  <td className="px-6 py-4"><p className="font-medium">{order.customerName}</p><p className="text-sm text-muted-foreground">{order.customerPhone}</p></td>
                  <td className="px-6 py-4"><p>{order.region}</p><p className="text-sm text-muted-foreground">{order.city}</p></td>
                  <td className="px-6 py-4"><span className="font-semibold text-primary">{order.total} ₪</span></td>
                  <td className="px-6 py-4"><select value={order.status} onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)} className={`px-3 py-1 rounded-full text-sm border-0 ${getStatusColor(order.status)}`}>{orderStatuses.map((status) => <option key={status} value={status}>{getStatusLabel(status)}</option>)}</select></td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{new Date(order.createdAt).toLocaleDateString('ar')}</td>
                  <td className="px-6 py-4"><button onClick={() => setSelectedOrder(order)} className="p-2 hover:bg-muted rounded-lg"><Eye className="w-4 h-4" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {selectedOrder && <OrderDetailsModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />}
    </div>
  );
}

function OrderDetailsModal({ order, onClose }: { order: Order; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-border p-6 flex justify-between">
          <div>
            <h2 className="text-2xl font-bold">فاتورة الطلب</h2>
            <p className="text-muted-foreground">#{order.id}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => printOrderInvoice(order)}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted"
            >
              <Printer className="w-4 h-4" />
              طباعة
            </button>
            <button onClick={onClose} className="rounded-lg p-2 hover:bg-muted"><X className="w-5 h-5" /></button>
          </div>
        </div>
        <div className="p-6 space-y-6">
          <section className="grid gap-4 md:grid-cols-2">
            <div className="bg-muted/30 rounded-lg p-4 space-y-2 text-sm">
              <h3 className="font-semibold text-base">معلومات الزبون</h3>
              <p><b>الاسم:</b> {order.customerName}</p>
              <p><b>الهاتف:</b> {order.customerPhone}</p>
              <p><b>البريد:</b> {order.customerEmail || 'غير متوفر'}</p>
            </div>
            <div className="bg-muted/30 rounded-lg p-4 space-y-2 text-sm">
              <h3 className="font-semibold text-base">معلومات التوصيل</h3>
              <p><b>المنطقة:</b> {order.region}</p>
              <p><b>المدينة:</b> {order.city}</p>
              <p><b>البلدة/القرية:</b> {order.village || 'غير محدد'}</p>
              <p><b>العنوان:</b> {order.address}</p>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="font-semibold">المنتجات</h3>
            {order.products.length === 0 ? (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                لم تظهر تفاصيل المنتجات. شغلي ملف SQL الخاص بإصلاح صلاحيات الطلبات ثم جربي فتح الطلب مرة ثانية.
              </div>
            ) : order.products.map((product, index) => (
              <div key={index} className="flex gap-4 p-4 bg-muted/30 rounded-lg">
                <img src={product.productImage} alt={product.productName} className="w-20 h-20 object-cover rounded-lg" />
                <div className="flex-1">
                  <h4 className="font-medium">{product.productName}</h4>
                  <p className="text-sm text-muted-foreground">اللون: {product.color}</p>
                  <p className="text-sm text-muted-foreground">المقاس: {product.size}</p>
                  <p className="text-sm">الكمية: {product.quantity}</p>
                </div>
                <div className="text-left">
                  <p className="text-sm text-muted-foreground">{product.price} ₪ للقطعة</p>
                  <p className="font-semibold text-primary">{product.price * product.quantity} ₪</p>
                </div>
              </div>
            ))}
          </section>

          <section className="bg-muted/30 rounded-lg p-4 text-sm space-y-2">
            <div className="flex justify-between"><span>المجموع الفرعي:</span><span>{order.subtotal} ₪</span></div>
            <div className="flex justify-between"><span>التوصيل:</span><span>{order.deliveryFee} ₪</span></div>
            <div className="flex justify-between pt-2 border-t border-border text-lg"><b>المجموع النهائي:</b><b className="text-primary">{order.total} ₪</b></div>
          </section>
        </div>
      </div>
    </div>
  );
}

function printOrderInvoice(order: Order) {
  const rows = order.products.map((product) => `
    <tr>
      <td>${product.productName}</td>
      <td>${product.color}</td>
      <td>${product.size}</td>
      <td>${product.quantity}</td>
      <td>${product.price} ₪</td>
      <td>${product.price * product.quantity} ₪</td>
    </tr>
  `).join('');

  const printWindow = window.open('', '_blank', 'width=900,height=700');
  if (!printWindow) return;
  printWindow.document.write(`
    <!doctype html>
    <html lang="ar" dir="rtl">
      <head>
        <meta charset="utf-8" />
        <title>فاتورة طلب ${order.id}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 32px; color: #111; }
          h1, h2, h3 { margin: 0 0 12px; }
          .header { display: flex; justify-content: space-between; border-bottom: 1px solid #ddd; padding-bottom: 16px; margin-bottom: 24px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
          .box { border: 1px solid #ddd; border-radius: 8px; padding: 16px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
          th, td { border: 1px solid #ddd; padding: 10px; text-align: right; }
          th { background: #f5f5f5; }
          .totals { width: 320px; margin-right: auto; border: 1px solid #ddd; border-radius: 8px; padding: 16px; }
          .line { display: flex; justify-content: space-between; margin: 8px 0; }
          .total { border-top: 1px solid #ddd; padding-top: 10px; font-weight: bold; font-size: 18px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1>For Lady</h1>
            <p>فاتورة طلب</p>
          </div>
          <div>
            <p><b>رقم الطلب:</b> ${order.id}</p>
            <p><b>التاريخ:</b> ${new Date(order.createdAt).toLocaleString('ar')}</p>
            <p><b>الحالة:</b> ${getStatusLabel(order.status)}</p>
          </div>
        </div>
        <div class="grid">
          <div class="box">
            <h3>معلومات الزبون</h3>
            <p><b>الاسم:</b> ${order.customerName}</p>
            <p><b>الهاتف:</b> ${order.customerPhone}</p>
            <p><b>البريد:</b> ${order.customerEmail || 'غير متوفر'}</p>
          </div>
          <div class="box">
            <h3>معلومات التوصيل</h3>
            <p><b>المنطقة:</b> ${order.region}</p>
            <p><b>المدينة:</b> ${order.city}</p>
            <p><b>البلدة/القرية:</b> ${order.village || 'غير محدد'}</p>
            <p><b>العنوان:</b> ${order.address}</p>
          </div>
        </div>
        <table>
          <thead>
            <tr><th>المنتج</th><th>اللون</th><th>النمرة</th><th>العدد</th><th>سعر القطعة</th><th>المجموع</th></tr>
          </thead>
          <tbody>${rows || '<tr><td colspan="6">لا توجد منتجات</td></tr>'}</tbody>
        </table>
        <div class="totals">
          <div class="line"><span>المجموع الفرعي</span><span>${order.subtotal} ₪</span></div>
          <div class="line"><span>التوصيل</span><span>${order.deliveryFee} ₪</span></div>
          <div class="line total"><span>المجموع النهائي</span><span>${order.total} ₪</span></div>
        </div>
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}

function getStatusLabel(status: string) {
  return ({ pending: 'قيد الانتظار', processing: 'قيد المعالجة', ready: 'جاهز', out_for_delivery: 'خرج للتوصيل', delivered: 'تم التوصيل', cancelled: 'ملغي' } as Record<string, string>)[status] || status;
}

function getStatusColor(status: string) {
  return ({ pending: 'bg-yellow-100 text-yellow-700', processing: 'bg-blue-100 text-blue-700', ready: 'bg-purple-100 text-purple-700', out_for_delivery: 'bg-orange-100 text-orange-700', delivered: 'bg-green-100 text-green-700', cancelled: 'bg-red-100 text-red-700' } as Record<string, string>)[status] || 'bg-gray-100 text-gray-700';
}
