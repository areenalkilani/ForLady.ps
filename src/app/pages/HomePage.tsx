import { Link } from 'react-router';
import { ArrowLeft, Star } from 'lucide-react';
import { useEffect, useState } from 'react';
import { fetchBanners, fetchCategories, fetchProducts } from '../lib/services';
import type { Category, HeroBanner, Product } from '../lib/types';

export function HomePage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [banners, setBanners] = useState<HeroBanner[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    Promise.all([fetchCategories(), fetchBanners(), fetchProducts()])
      .then(([categoryRows, bannerRows, productRows]) => {
        setCategories(categoryRows);
        setBanners(bannerRows);
        setProducts(productRows);
      })
      .catch(console.error);
  }, []);

  const featuredProducts = products.filter((p) => p.featured);
  const bestsellerProducts = products.filter((p) => p.bestseller);
  const visibleBanners = banners.length ? banners : [];

  return (
    <div className="min-h-screen">
      <section className="relative h-[500px] md:h-[600px] overflow-hidden bg-muted">
        {visibleBanners.map((banner, index) => (
          <div key={banner.id} className={`absolute inset-0 transition-opacity duration-500 ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}>
            <img src={banner.image} alt={banner.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/30" />
            <div className="absolute inset-0 flex items-center justify-center text-center text-white">
              <div className="max-w-2xl px-4">
                <h1 className="text-4xl md:text-6xl font-bold mb-4">{banner.title}</h1>
                <p className="text-lg md:text-xl mb-8">{banner.subtitle}</p>
                <Link to="/shop" className="inline-flex items-center gap-2 px-8 py-3 bg-white text-foreground rounded-lg hover:bg-white/90">
                  تسوق الآن
                  <ArrowLeft className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>
        ))}
        {visibleBanners.length === 0 && (
          <div className="h-full flex items-center justify-center text-center px-4">
            <div>
              <h1 className="text-4xl md:text-6xl font-bold mb-4">For Lady</h1>
              <Link to="/shop" className="inline-flex items-center gap-2 px-8 py-3 bg-primary text-primary-foreground rounded-lg">تسوق الآن</Link>
            </div>
          </div>
        )}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
          {visibleBanners.map((_, index) => (
            <button key={index} onClick={() => setCurrentSlide(index)} className={`w-2 h-2 rounded-full ${index === currentSlide ? 'bg-white w-8' : 'bg-white/50'}`} />
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">التصنيفات</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
          {categories.map((category) => (
            <Link key={category.id} to={`/shop/${category.id}`} className="group">
              <div className="relative aspect-square rounded-2xl overflow-hidden mb-3">
                <img src={category.image} alt={category.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-0 right-0 left-0 p-4 text-white">
                  <h3 className="font-semibold">{category.name}</h3>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <ProductSection title="منتجات مميزة" products={featuredProducts} muted />
      <ProductSection title="الأكثر مبيعاً" products={bestsellerProducts} />
    </div>
  );
}

function ProductSection({ title, products, muted = false }: { title: string; products: Product[]; muted?: boolean }) {
  return (
    <section className={muted ? 'bg-muted/30 py-16' : 'container mx-auto px-4 py-16'}>
      <div className={muted ? 'container mx-auto px-4' : ''}>
        <h2 className="text-3xl font-bold text-center mb-12">{title}</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {products.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      </div>
    </section>
  );
}

function ProductCard({ product }: { product: Product }) {
  const hasDiscount = Number(product.discount || 0) > 0 || Number(product.originalPrice || 0) > Number(product.price || 0);
  const coverImage = product.images[0];
  const coverVideo = product.videos?.[0];
  return (
    <Link to={`/product/${product.id}`} className="group">
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow">
        <div className="relative aspect-[3/4] overflow-hidden bg-muted">
          {coverImage ? (
            <img src={coverImage} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
          ) : coverVideo ? (
            <video src={coverVideo} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" muted playsInline />
          ) : null}
          {hasDiscount && <div className="absolute top-3 left-3 bg-destructive text-destructive-foreground px-3 py-1 rounded-full text-sm font-semibold">{product.discount ? `-${product.discount}%` : 'عرض'}</div>}
          {product.bestseller && <div className="absolute top-3 right-3 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1"><Star className="w-4 h-4 fill-current" />الأكثر مبيعاً</div>}
        </div>
        <div className="p-4">
          <h3 className="font-semibold mb-2 line-clamp-2">{product.name}</h3>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-primary">{product.price} ₪</span>
            {hasDiscount && <span className="text-sm text-muted-foreground line-through">{product.originalPrice} ₪</span>}
          </div>
        </div>
      </div>
    </Link>
  );
}
