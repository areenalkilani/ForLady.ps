import { Link, useLocation, useNavigate } from 'react-router';
import { FolderTree, Images, LayoutDashboard, LogOut, Package, Settings, ShoppingCart, Store } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function AdminSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

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
    <aside className="lg:fixed lg:right-0 lg:top-0 lg:h-screen lg:w-64 bg-white border-l border-border flex flex-col">
      {/* Logo */}
      <div className="p-4 lg:p-6 border-b border-border">
        <Link to="/admin" className="flex items-center gap-2">
          <div className="text-2xl font-bold text-primary">For Lady</div>
        </Link>
        <p className="text-sm text-muted-foreground mt-1">لوحة التحكم</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 lg:p-4 overflow-x-auto">
        <div className="flex gap-2 lg:block lg:space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path, item.exact);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex shrink-0 items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
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
      <div className="p-3 lg:p-4 border-t border-border flex gap-2 lg:block lg:space-y-2">
        <Link
          to="/"
          className="flex shrink-0 items-center gap-3 px-4 py-3 lg:w-full rounded-lg text-foreground hover:bg-muted transition-colors"
        >
          <Store className="w-5 h-5" />
          <span>عرض المتجر</span>
        </Link>
        <button
          onClick={async () => {
            await logout();
            navigate('/', { replace: true });
          }}
          className="flex shrink-0 items-center gap-3 px-4 py-3 lg:w-full rounded-lg text-foreground hover:bg-muted transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span>تسجيل الخروج</span>
        </button>
      </div>
    </aside>
  );
}
