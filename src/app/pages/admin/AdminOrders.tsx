import { useEffect, useState } from 'react';
import { Search, Eye, X } from 'lucide-react';
import { fetchOrders, updateOrderStatus } from '../../lib/services';
import type { Order, OrderStatus } from '../../lib/types';
import { orderStatuses } from '../../lib/constants';
import { toast } from 'sonner';

export function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');

  const loadOrders = () => fetchOrders().then(setOrders).catch(console.error);
  useEffect(() => { loadOrders(); }, []);

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
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-border p-6 flex justify-between"><div><h2 className="text-2xl font-bold">تفاصيل الطلب</h2><p className="text-muted-foreground">#{order.id}</p></div><button onClick={onClose}><X className="w-5 h-5" /></button></div>
        <div className="p-6 space-y-6">
          <section className="bg-muted/30 rounded-lg p-4 space-y-2 text-sm"><p><b>الاسم:</b> {order.customerName}</p><p><b>الهاتف:</b> {order.customerPhone}</p><p><b>البريد:</b> {order.customerEmail || 'غير متوفر'}</p><p><b>العنوان:</b> {order.region} / {order.city} / {order.village} - {order.address}</p></section>
          <section className="space-y-3">{order.products.map((product, index) => <div key={index} className="flex gap-4 p-4 bg-muted/30 rounded-lg"><img src={product.productImage} alt={product.productName} className="w-20 h-20 object-cover rounded-lg" /><div className="flex-1"><h4 className="font-medium">{product.productName}</h4><p className="text-sm text-muted-foreground">{product.color} - {product.size}</p><p className="text-sm">الكمية: {product.quantity}</p></div><p className="font-semibold text-primary">{product.price * product.quantity} ₪</p></div>)}</section>
          <section className="bg-muted/30 rounded-lg p-4 text-sm space-y-2"><div className="flex justify-between"><span>المجموع الفرعي:</span><span>{order.subtotal} ₪</span></div><div className="flex justify-between"><span>التوصيل:</span><span>{order.deliveryFee} ₪</span></div><div className="flex justify-between pt-2 border-t border-border"><b>المجموع:</b><b className="text-primary">{order.total} ₪</b></div></section>
        </div>
      </div>
    </div>
  );
}

function getStatusLabel(status: string) {
  return ({ pending: 'قيد الانتظار', processing: 'قيد المعالجة', ready: 'جاهز', out_for_delivery: 'خرج للتوصيل', delivered: 'تم التوصيل', cancelled: 'ملغي' } as Record<string, string>)[status] || status;
}

function getStatusColor(status: string) {
  return ({ pending: 'bg-yellow-100 text-yellow-700', processing: 'bg-blue-100 text-blue-700', ready: 'bg-purple-100 text-purple-700', out_for_delivery: 'bg-orange-100 text-orange-700', delivered: 'bg-green-100 text-green-700', cancelled: 'bg-red-100 text-red-700' } as Record<string, string>)[status] || 'bg-gray-100 text-gray-700';
}
