import { createBrowserRouter } from 'react-router';
import { RootLayout } from './layouts/RootLayout';
import { AdminLayout } from './layouts/AdminLayout';

// Customer Pages
import { HomePage } from './pages/HomePage';
import { ShopPage } from './pages/ShopPage';
import { ProductPage } from './pages/ProductPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { AccountPage } from './pages/AccountPage';
import { CheckoutPage } from './pages/CheckoutPage';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminProducts } from './pages/admin/AdminProducts';
import { AdminOrders } from './pages/admin/AdminOrders';
import { AdminCategories } from './pages/admin/AdminCategories';
import { AdminBanners } from './pages/admin/AdminBanners';
import { AdminSettings } from './pages/admin/AdminSettings';
import { NotFoundPage } from './pages/NotFoundPage';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: RootLayout,
    children: [
      { index: true, Component: HomePage },
      { path: 'shop', Component: ShopPage },
      { path: 'shop/:categoryId', Component: ShopPage },
      { path: 'product/:productId', Component: ProductPage },
      { path: 'login', Component: LoginPage },
      { path: 'register', Component: RegisterPage },
      { path: 'forgot-password', Component: ForgotPasswordPage },
      { path: 'reset-password', Component: ResetPasswordPage },
      { path: 'account', Component: AccountPage },
      { path: 'checkout', Component: CheckoutPage },
    ],
  },
  {
    path: '/admin',
    Component: AdminLayout,
    children: [
      { index: true, Component: AdminDashboard },
      { path: 'products', Component: AdminProducts },
      { path: 'orders', Component: AdminOrders },
      { path: 'categories', Component: AdminCategories },
      { path: 'banners', Component: AdminBanners },
      { path: 'settings', Component: AdminSettings },
    ],
  },
  {
    path: '*',
    Component: NotFoundPage,
  },
]);
