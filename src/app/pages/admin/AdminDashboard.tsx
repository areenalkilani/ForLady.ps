import { useEffect, useState } from 'react';
import { ShoppingCart, TrendingUp, CheckCircle, Clock } from 'lucide-react';
import { fetchAdminStats } from '../../lib/services';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export function AdminDashboard() {
  const [stats, setStats] = useState<any>({
    total_orders: 0,
    delivered_orders: 0,
    processing_orders: 0,
    cancelled_orders: 0,
    total_revenue: 0,
    revenue_by_day: [],
    order_status_data: [],
    best_selling_products: [],
    recent_activity: [],
  });

  useEffect(() => {
    fetchAdminStats().then((data) => setStats(data || stats)).catch(console.error);
  }, []);

  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-bold">لوحة التحكم</h1><p className="text-muted-foreground">مرحباً بك في لوحة تحكم For Lady</p></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="إجمالي الإيرادات" value={`${stats.total_revenue || 0} ₪`} icon={TrendingUp} color="text-green-600" bgColor="bg-green-50" />
        <StatCard title="إجمالي الطلبات" value={stats.total_orders || 0} icon={ShoppingCart} color="text-blue-600" bgColor="bg-blue-50" />
        <StatCard title="قيد المعالجة" value={stats.processing_orders || 0} icon={Clock} color="text-yellow-600" bgColor="bg-yellow-50" />
        <StatCard title="تم التوصيل" value={stats.delivered_orders || 0} icon={CheckCircle} color="text-green-600" bgColor="bg-green-50" />
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6"><h2 className="text-xl font-semibold mb-6">الإيرادات الأسبوعية</h2><ResponsiveContainer width="100%" height={300}><BarChart data={stats.revenue_by_day || []}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="day" /><YAxis /><Tooltip /><Bar dataKey="revenue" fill="#D4A5A5" radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer></div>
        <div className="bg-white rounded-2xl p-6"><h2 className="text-xl font-semibold mb-6">توزيع الطلبات</h2><ResponsiveContainer width="100%" height={300}><PieChart><Pie data={stats.order_status_data || []} cx="50%" cy="50%" outerRadius={100} dataKey="value" label>{(stats.order_status_data || []).map((entry: any, index: number) => <Cell key={index} fill={entry.color} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></div>
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6"><h2 className="text-xl font-semibold mb-6">الأكثر مبيعاً</h2><div className="space-y-3">{(stats.best_selling_products || []).map((p: any) => <div key={p.product_id} className="flex justify-between"><span>{p.name}</span><b>{p.quantity_sold}</b></div>)}</div></div>
        <div className="bg-white rounded-2xl p-6"><h2 className="text-xl font-semibold mb-6">النشاط الأخير</h2><div className="space-y-3">{(stats.recent_activity || []).map((order: any) => <div key={order.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg"><div className="w-2 h-2 rounded-full bg-primary" /><div className="flex-1"><p className="text-sm font-medium">طلب جديد #{order.id}</p><p className="text-xs text-muted-foreground">{order.customer_name}</p></div><span className="text-sm font-semibold text-primary">{order.total} ₪</span></div>)}</div></div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, bgColor }: { title: string; value: string | number; icon: any; color: string; bgColor: string }) {
  return <div className="bg-white rounded-2xl p-6"><div className="flex items-start justify-between"><div><p className="text-muted-foreground text-sm mb-1">{title}</p><p className="text-2xl font-bold">{value}</p></div><div className={`p-3 rounded-xl ${bgColor}`}><Icon className={`w-6 h-6 ${color}`} /></div></div></div>;
}
