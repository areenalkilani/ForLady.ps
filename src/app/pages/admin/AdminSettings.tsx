import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { fetchDeliveryRegions, fetchStoreSettings, saveDeliveryFee, saveStoreSettings } from '../../lib/services';
import type { DeliveryRegion, StoreSettings } from '../../lib/types';
import { toast } from 'sonner';

export function AdminSettings() {
  const [deliveryPrices, setDeliveryPrices] = useState<DeliveryRegion[]>([]);
  const [socialLinks, setSocialLinks] = useState<StoreSettings>({
    whatsappUrl: '',
    instagramUrl: '',
    facebookUrl: '',
  });

  useEffect(() => {
    fetchDeliveryRegions().then(setDeliveryPrices).catch(console.error);
    fetchStoreSettings().then(setSocialLinks).catch(console.error);
  }, []);

  const handleSaveDelivery = async () => {
    try {
      await Promise.all(deliveryPrices.map((region) => saveDeliveryFee(region.id, region.price)));
      toast.success('تم حفظ أسعار التوصيل');
    } catch (error: any) {
      toast.error(error.message || 'تعذر حفظ أسعار التوصيل');
    }
  };

  const handleSaveSocial = async () => {
    try {
      await saveStoreSettings(socialLinks);
      toast.success('تم حفظ روابط التواصل');
    } catch (error: any) {
      toast.error(error.message || 'تعذر حفظ روابط التواصل');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">الإعدادات</h1>
        <p className="text-muted-foreground">إدارة إعدادات المتجر</p>
      </div>

      <div className="bg-white rounded-2xl p-6">
        <h2 className="text-xl font-semibold mb-6">أسعار التوصيل</h2>
        <div className="space-y-4">
          {deliveryPrices.map((region) => (
            <div key={region.id} className="flex items-center gap-4">
              <label className="flex-1 font-medium">{region.name}</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={region.price}
                  onChange={(e) =>
                    setDeliveryPrices(deliveryPrices.map((r) => (r.id === region.id ? { ...r, price: Number(e.target.value) } : r)))
                  }
                  min="0"
                  className="w-32 px-4 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <span className="text-muted-foreground">₪</span>
              </div>
            </div>
          ))}
        </div>
        <button onClick={handleSaveDelivery} className="mt-6 flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90">
          <Save className="w-5 h-5" />
          حفظ أسعار التوصيل
        </button>
      </div>

      <div className="bg-white rounded-2xl p-6">
        <h2 className="text-xl font-semibold mb-6">روابط التواصل الاجتماعي</h2>
        <div className="space-y-4">
          <SocialInput
            label="رابط واتساب"
            value={socialLinks.whatsappUrl}
            placeholder="https://wa.me/970599123456"
            onChange={(value) => setSocialLinks({ ...socialLinks, whatsappUrl: value })}
          />
          <SocialInput
            label="رابط إنستغرام"
            value={socialLinks.instagramUrl}
            placeholder="https://instagram.com/forlady"
            onChange={(value) => setSocialLinks({ ...socialLinks, instagramUrl: value })}
          />
          <SocialInput
            label="رابط فيسبوك"
            value={socialLinks.facebookUrl}
            placeholder="https://facebook.com/forlady"
            onChange={(value) => setSocialLinks({ ...socialLinks, facebookUrl: value })}
          />
        </div>
        <button onClick={handleSaveSocial} className="mt-6 flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90">
          <Save className="w-5 h-5" />
          حفظ الروابط
        </button>
      </div>
    </div>
  );
}

function SocialInput({ label, value, placeholder, onChange }: { label: string; value: string; placeholder: string; onChange: (value: string) => void }) {
  return (
    <div>
      <label className="block mb-2 font-medium">{label}</label>
      <input
        type="url"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
      />
    </div>
  );
}
