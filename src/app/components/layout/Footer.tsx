import { Link } from 'react-router';
import { Facebook, Instagram, MessageCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { fetchStoreSettings } from '../../lib/services';
import type { StoreSettings } from '../../lib/types';

export function Footer() {
  const [socialLinks, setSocialLinks] = useState<StoreSettings>({
    whatsappUrl: import.meta.env.VITE_WHATSAPP_URL || '',
    instagramUrl: import.meta.env.VITE_INSTAGRAM_URL || '',
    facebookUrl: import.meta.env.VITE_FACEBOOK_URL || '',
  });

  useEffect(() => {
    fetchStoreSettings().then(setSocialLinks).catch(console.error);
  }, []);

  return (
    <footer className="bg-muted/30 border-t border-border mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <h3 className="text-2xl font-bold text-primary mb-4">For Lady</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              متجر أزياء نسائية فلسطيني متخصص في تقديم أرقى وأجمل الفساتين والعبايات
              للمرأة العصرية
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">روابط سريعة</h4>
            <div className="flex flex-col gap-2 text-sm">
              <Link to="/" className="text-muted-foreground hover:text-primary transition-colors">
                الرئيسية
              </Link>
              <Link to="/shop" className="text-muted-foreground hover:text-primary transition-colors">
                المتجر
              </Link>
              <Link to="/shop" className="text-muted-foreground hover:text-primary transition-colors">
                العروض
              </Link>
              <Link to="/account" className="text-muted-foreground hover:text-primary transition-colors">
                حسابي
              </Link>
            </div>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="font-semibold mb-4">خدمة العملاء</h4>
            <div className="flex flex-col gap-2 text-sm">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                سياسة الاسترجاع
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                سياسة الشحن
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                الأسئلة الشائعة
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                اتصل بنا
              </a>
            </div>
          </div>

          {/* Social Media */}
          <div>
            <h4 className="font-semibold mb-4">تواصل معنا</h4>
            <div className="flex gap-4">
              <a
                href={socialLinks.whatsappUrl || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 transition-opacity"
              >
                <MessageCircle className="w-5 h-5" />
              </a>
              <a
                href={socialLinks.instagramUrl || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 transition-opacity"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href={socialLinks.facebookUrl || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 transition-opacity"
              >
                <Facebook className="w-5 h-5" />
              </a>
            </div>
            <div className="mt-4 text-sm text-muted-foreground">
              <p>هاتف: 0599-123-456</p>
              <p className="mt-1">البريد: info@forlady.ps</p>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} For Lady. جميع الحقوق محفوظة</p>
        </div>
      </div>
    </footer>
  );
}
