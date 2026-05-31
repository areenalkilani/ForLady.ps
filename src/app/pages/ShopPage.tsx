import { useEffect, useState } from 'react';
import { useParams, Link, useSearchParams } from 'react-router';
import { Filter, Star } from 'lucide-react';
import { fetchCategories, fetchProducts } from '../lib/services';
import type { Category, Product } from '../lib/types';

export function ShopPage() {
  const { categoryId } = useParams();
  const [searchParams] = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState(categoryId || '');
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [showFilters, setShowFilters] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    setSelectedCategory(categoryId || '');
  }, [categoryId]);

  useEffect(() => {
    Promise.all([fetchCategories(), fetchProducts()]).then(([cats, rows]) => {
      setCategories(cats);
      setProducts(rows);
    }).catch(console.error);
  }, []);

  const filteredProducts = products.filter((product) => {
    const query = (searchParams.get('q') || '').trim().toLowerCase();
    const offersOnly = searchParams.get('offers') === '1';
    const hasOffer = Number(product.discount || 0) > 0 || Number(product.originalPrice || 0) > Number(product.price || 0);
    if (selectedCategory && product.category !== selectedCategory) return false;
    if (offersOnly && !hasOffer) return false;
    if (query && !`${product.name} ${product.nameEn || ''} ${product.description}`.toLowerCase().includes(query)) return false;
    return product.price >= priceRange[0] && product.price <= priceRange[1];
  });

  const Filters = () => (
    <div className="bg-white rounded-2xl p-6 sticky top-24">
      <h3 className="font-semibold mb-4">الفلاتر</h3>
      <div className="mb-6">
        <h4 className="text-sm font-medium mb-3">التصنيفات</h4>
        <div className="space-y-2">
          <button onClick={() => setSelectedCategory('')} className={`block w-full text-right px-3 py-2 rounded-lg ${!selectedCategory ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}>الكل</button>
          {categories.map((cat) => (
            <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} className={`block w-full text-right px-3 py-2 rounded-lg ${selectedCategory === cat.id ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}>{cat.name}</button>
          ))}
        </div>
      </div>
      <h4 className="text-sm font-medium mb-3">السعر</h4>
      <input type="range" min="0" max="1000" step="50" value={priceRange[1]} onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])} className="w-full" />
      <div className="flex justify-between text-sm text-muted-foreground"><span>{priceRange[0]} ₪</span><span>{priceRange[1]} ₪</span></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-muted/10">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">{searchParams.get('offers') === '1' ? 'العروض' : 'المتجر'}</h1>
          <p className="text-muted-foreground">{filteredProducts.length} منتج</p>
        </div>
        <div className="flex gap-8">
          <aside className="hidden lg:block w-64 shrink-0"><Filters /></aside>
          {showFilters && <div className="lg:hidden fixed inset-x-4 bottom-20 z-20"><Filters /></div>}
          <button onClick={() => setShowFilters(!showFilters)} className="lg:hidden fixed bottom-4 left-4 z-30 flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-full shadow-lg"><Filter className="w-5 h-5" />الفلاتر</button>
          <div className="flex-1">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              {filteredProducts.map((product) => <ProductCard key={product.id} product={product} />)}
            </div>
            {filteredProducts.length === 0 && <div className="text-center py-16"><p className="text-muted-foreground">لا توجد منتجات</p></div>}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductCard({ product }: { product: Product }) {
  const hasOffer = Number(product.discount || 0) > 0 || Number(product.originalPrice || 0) > Number(product.price || 0);
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
          {hasOffer && <div className="absolute top-3 left-3 bg-destructive text-destructive-foreground px-3 py-1 rounded-full text-sm font-semibold">عرض</div>}
          {product.bestseller && <div className="absolute top-3 right-3 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm"><Star className="w-4 h-4" /></div>}
        </div>
        <div className="p-4">
          <h3 className="font-semibold mb-2 line-clamp-2">{product.name}</h3>
          <div className="flex items-center gap-2"><span className="text-lg font-bold text-primary">{product.price} ₪</span>{hasOffer && <span className="text-sm text-muted-foreground line-through">{product.originalPrice} ₪</span>}</div>
        </div>
      </div>
    </Link>
  );
}
