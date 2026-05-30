import { Link, useNavigate } from 'react-router';
import { LayoutDashboard, ShoppingBag, Search, User, Heart, Menu } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useState, type FormEvent } from 'react';
import { useEffect } from 'react';
import { fetchCategories } from '../../lib/services';
import type { Category } from '../../lib/types';

export function Header() {
  const navigate = useNavigate();
  const { cartCount, setIsCartOpen } = useCart();
  const { isAuthenticated, isAdmin } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    fetchCategories().then(setCategories).catch(console.error);
  }, []);

  const handleSearch = (event: FormEvent) => {
    event.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;
    setIsMobileMenuOpen(false);
    setIsSearchOpen(false);
    navigate(`/shop?q=${encodeURIComponent(query)}`);
  };

  return (
    <header className="sticky top-0 z-50 bg-background border-b border-border shadow-sm">
      {/* Top Bar */}
      <div className="bg-primary py-2 px-4" aria-hidden="true" />

      {/* Main Header */}
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="text-2xl md:text-3xl font-bold text-primary">
              For Lady
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link
              to="/"
              className="text-foreground hover:text-primary transition-colors"
            >
              الرئيسية
            </Link>
            <Link
              to="/shop"
              className="text-foreground hover:text-primary transition-colors"
            >
              المتجر
            </Link>
            <div className="relative group">
              <button className="text-foreground hover:text-primary transition-colors">
                التصنيفات
              </button>
              <div className="absolute top-full right-0 mt-2 w-56 bg-white shadow-lg rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                <div className="py-2">
                  {categories.slice(0, 5).map((cat) => (
                    <Link
                      key={cat.id}
                      to={`/shop/${cat.id}`}
                      className="block px-4 py-2 hover:bg-accent transition-colors"
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
            <Link
              to="/shop?offers=1"
              className="text-foreground hover:text-primary transition-colors"
            >
              العروض
            </Link>
          </nav>

          {/* Icons */}
          <div className="flex items-center gap-4">
            {isAdmin && (
              <Link
                to="/admin"
                className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted transition-colors"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span className="hidden sm:inline">لوحة التحكم</span>
              </Link>
            )}

            <form onSubmit={handleSearch} className="hidden md:flex items-center gap-2">
              {isSearchOpen && (
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  autoFocus
                  placeholder="بحث..."
                  className="w-44 rounded-lg border border-border bg-input-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              )}
              <button
                type={isSearchOpen ? 'submit' : 'button'}
                onClick={() => !isSearchOpen && setIsSearchOpen(true)}
                className="p-2 hover:text-primary transition-colors"
                aria-label="بحث"
              >
                <Search className="w-5 h-5" />
              </button>
            </form>

            {isAuthenticated ? (
              <Link
                to={isAdmin ? '/admin' : '/account'}
                className="hidden md:block p-2 hover:text-primary transition-colors"
              >
                <User className="w-5 h-5" />
              </Link>
            ) : (
              <Link
                to="/login"
                className="hidden md:block p-2 hover:text-primary transition-colors"
              >
                <User className="w-5 h-5" />
              </Link>
            )}

            <button className="hidden md:block p-2 hover:text-primary transition-colors">
              <Heart className="w-5 h-5" />
            </button>

            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 hover:text-primary transition-colors"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -left-1 bg-primary text-primary-foreground text-xs w-5 h-5 flex items-center justify-center rounded-full">
                  {cartCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-white">
          <nav className="container mx-auto px-4 py-4 flex flex-col gap-4">
            <Link
              to="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-foreground hover:text-primary transition-colors"
            >
              الرئيسية
            </Link>
            <Link
              to="/shop"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-foreground hover:text-primary transition-colors"
            >
              المتجر
            </Link>
            {categories.slice(0, 5).map((cat) => (
              <Link
                key={cat.id}
                to={`/shop/${cat.id}`}
                onClick={() => setIsMobileMenuOpen(false)}
                className="pr-4 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                {cat.name}
              </Link>
            ))}
            <Link
              to="/shop?offers=1"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-foreground hover:text-primary transition-colors"
            >
              العروض
            </Link>
            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="بحث..."
                className="min-w-0 flex-1 rounded-lg border border-border bg-input-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button className="rounded-lg bg-primary px-4 py-2 text-primary-foreground">
                بحث
              </button>
            </form>
            {isAuthenticated ? (
              <Link
                to={isAdmin ? '/admin' : '/account'}
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-foreground hover:text-primary transition-colors"
              >
                {isAdmin ? 'لوحة التحكم' : 'حسابي'}
              </Link>
            ) : (
              <Link
                to="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-foreground hover:text-primary transition-colors"
              >
                تسجيل الدخول
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

