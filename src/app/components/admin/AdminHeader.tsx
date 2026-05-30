import { Link } from 'react-router';
import { Search, Store } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { NotificationBell } from '../notifications/NotificationBell';

export function AdminHeader() {
  const { user } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-border flex items-center justify-between px-6">
      {/* Search */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="بحث..."
            className="w-full pr-10 pl-4 py-2 bg-muted rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* User Info */}
      <div className="flex items-center gap-4">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted transition-colors"
        >
          <Store className="w-4 h-4" />
          <span>عرض المتجر</span>
        </Link>
        <NotificationBell />
        <div className="flex items-center gap-3 pr-4 border-r border-border">
          <div className="text-right">
            <p className="font-medium">{user?.fullName}</p>
            <p className="text-xs text-muted-foreground">مسؤول</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
            {user?.fullName?.charAt(0) || 'A'}
          </div>
        </div>
      </div>
    </header>
  );
}
