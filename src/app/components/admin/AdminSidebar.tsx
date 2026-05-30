import { Link, useLocation, useNavigate } from 'react-router';
import { FolderTree, Images, LayoutDashboard, LogOut, Menu, Package, Settings, ShoppingCart, Store, X } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export function AdminSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const menuItems = [
    { path: '/admin', icon: LayoutDashboard, label: 'لوحة التحكم', exact: true },
    { path: '/admin/products', icon: Package, label: 'المنتجات' },
    { path: '/admin/orders', icon: ShoppingCart, label: 'الطلبات' },
    { path: '/admin/categories', icon: FolderTree, label: 'التصنيفات' },
    { path: '/admin/banners', icon: Images, label: 'البنرات' },
    { path: '/admin/settings', icon: Settings, label: 'الإعدادات' },
  ];

  const isActive = (path: string, exact?: boolean) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <aside className="sticky top-0 z-40 bg-white border-b border-border lg:fixed lg:right-0 lg:top-0 lg:h-screen lg:w-64 lg:border-b-0 lg:border-l lg:flex lg:flex-col">
      {/* Logo */}
      <div className="flex items-center justify-between p-4 lg:block lg:p-6 lg:border-b lg:border-border">
        <Link to="/admin" className="flex items-center gap-2">
          <div className="text-2xl font-bold text-primary">For Lady</div>
        </Link>
        <p className="hidden text-sm text-muted-foreground mt-1 lg:block">لوحة التحكم</p>
        <button
          onClick={() => setIsMenuOpen((open) => !open)}
          className="rounded-lg p-2 hover:bg-muted lg:hidden"
          aria-label="فتح قائمة لوحة التحكم"
        >
          {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className={`${isMenuOpen ? 'block' : 'hidden'} border-t border-border p-3 lg:block lg:flex-1 lg:border-t-0 lg:p-4`}>
        <div className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path, item.exact);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  active
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground hover:bg-muted'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Logout */}
      <div className={`${isMenuOpen ? 'block' : 'hidden'} border-t border-border p-3 lg:block lg:p-4 lg:space-y-2`}>
        <Link
          to="/"
          onClick={() => setIsMenuOpen(false)}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-foreground hover:bg-muted transition-colors"
        >
          <Store className="w-5 h-5" />
          <span>عرض المتجر</span>
        </Link>
        <button
          onClick={async () => {
            await logout();
            navigate('/', { replace: true });
          }}
          className="flex w-full items-center gap-3 px-4 py-3 rounded-lg text-foreground hover:bg-muted transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span>تسجيل الخروج</span>
        </button>
      </div>
    </aside>
  );
}
