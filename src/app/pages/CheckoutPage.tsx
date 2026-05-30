import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { palestinianCities } from '../lib/constants';
import { createOrder, fetchDeliveryRegions } from '../lib/services';
import type { DeliveryRegion } from '../lib/types';

export function CheckoutPage() {
  const { cart, cartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [deliveryRegions, setDeliveryRegions] = useState<DeliveryRegion[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    region: user?.region || '',
    city: user?.city || '',
    village: user?.town || '',
    address: '',
  });

  useEffect(() => {
    fetchDeliveryRegions().then(setDeliveryRegions).catch(console.error);
  }, []);

  const regions = Object.keys(palestinianCities);
  const deliveryFee = deliveryRegions.find((r) => r.name === formData.region)?.price || 0;
  const total = cartTotal + deliveryFee;

  if (cart.length === 0) {
    return <div className="min-h-screen flex items-center justify-center"><div className="text-center"><p className="text-muted-foreground mb-4">سلة التسوق فارغة</p><button onClick={() => navigate('/shop')} className="px-6 py-3 bg-primary text-primary-foreground rounded-lg">العودة للمتجر</button></div></div>;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.region || !formData.city || !formData.phone) {
      toast.error('الرجاء إدخال الهاتف والمنطقة والمدينة');
      return;
    }
    setLoading(true);
    try {
      await createOrder({
        customerName: formData.fullName,
        customerEmail: formData.email || undefined,
        customerPhone: formData.phone,
        region: formData.region,
        city: formData.city,
        village: formData.village,
        address: formData.address,
        deliveryFee,
        items: cart.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          productImage: item.productImage,
          color: item.color,
          size: item.size,
          quantity: item.quantity,
          price: item.price,
        })),
      });
      toast.success('تم إرسال طلبك بنجاح! سنتواصل معك قريباً');
      clearCart();
      navigate('/');
    } catch (error: any) {
      toast.error(error.message || 'تعذر إنشاء الطلب');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/10 py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <h1 className="text-3xl font-bold mb-8">إتمام الطلب</h1>
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white rounded-2xl p-6">
            <h2 className="text-xl font-semibold mb-6">معلومات التوصيل</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Field label="الاسم الكامل" value={formData.fullName} onChange={(v) => setFormData({ ...formData, fullName: v })} required />
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="البريد الإلكتروني (اختياري)" type="email" value={formData.email} onChange={(v) => setFormData({ ...formData, email: v })} />
                <Field label="رقم الهاتف" type="tel" value={formData.phone} onChange={(v) => setFormData({ ...formData, phone: v })} required />
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <Select label="المنطقة" value={formData.region} onChange={(v) => setFormData({ ...formData, region: v, city: '' })} options={regions} required />
                <Select label="المدينة" value={formData.city} onChange={(v) => setFormData({ ...formData, city: v })} options={palestinianCities[formData.region] || []} required />
                <Field label="البلدة / القرية" value={formData.village} onChange={(v) => setFormData({ ...formData, village: v })} required />
              </div>
              <div>
                <label className="block mb-2">العنوان التفصيلي</label>
                <textarea value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} required rows={3} className="w-full px-4 py-3 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary bg-input-background resize-none" />
              </div>
              <button type="submit" disabled={loading} className="w-full py-4 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50">{loading ? 'جاري تأكيد الطلب...' : 'تأكيد الطلب'}</button>
            </form>
          </div>
          <div className="bg-white rounded-2xl p-6 h-fit sticky top-24">
            <h2 className="text-xl font-semibold mb-6">ملخص الطلب</h2>
            <div className="space-y-4 mb-6">
              {cart.map((item) => <div key={`${item.productId}-${item.size}-${item.color}`} className="flex gap-3"><img src={item.productImage} alt={item.productName} className="w-16 h-16 object-cover rounded-lg" /><div className="flex-1"><p className="font-medium text-sm line-clamp-1">{item.productName}</p><p className="text-xs text-muted-foreground">{item.color} - {item.size} x {item.quantity}</p><p className="text-sm font-semibold text-primary">{item.price * item.quantity} ₪</p></div></div>)}
            </div>
            <div className="space-y-2 py-4 border-t border-border">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">المجموع الفرعي:</span><span>{cartTotal} ₪</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">التوصيل:</span><span>{deliveryFee || 'اختر المنطقة'}</span></div>
            </div>
            <div className="flex justify-between items-center pt-4 border-t border-border"><span className="font-semibold">المجموع الكلي:</span><span className="text-2xl font-bold text-primary">{total} ₪</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', required = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean }) {
  return <div><label className="block mb-2">{label}</label><input type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required} className="w-full px-4 py-3 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary bg-input-background" /></div>;
}

function Select({ label, value, onChange, options, required = false }: { label: string; value: string; onChange: (value: string) => void; options: string[]; required?: boolean }) {
  return <div><label className="block mb-2">{label}</label><select value={value} onChange={(e) => onChange(e.target.value)} required={required} className="w-full px-4 py-3 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary bg-input-background"><option value="">اختر</option>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select></div>;
}
