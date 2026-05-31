import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router';
import { ShoppingCart, Heart, Star } from 'lucide-react';
import { fetchProduct } from '../lib/services';
import type { Product } from '../lib/types';
import { useCart } from '../context/CartContext';
import { toast } from 'sonner';

type ProductMediaItem = {
  type: 'image' | 'video';
  src: string;
};

export function ProductPage() {
  const { productId } = useParams();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (!productId) return;
    fetchProduct(productId).then(setProduct).catch(console.error).finally(() => setLoading(false));
  }, [productId]);

  const currentColor = product?.colors[selectedColor];
  const currentInventory = useMemo(() => currentColor?.sizes || [], [currentColor]);
  const selectedInventory = currentInventory.find((item) => item.size === selectedSize);
  const media: ProductMediaItem[] = useMemo(() => {
    const colorMedia = [
      ...(currentColor?.images || []).map((src) => ({ type: 'image' as const, src })),
      ...(currentColor?.videos || []).map((src) => ({ type: 'video' as const, src })),
    ];
    if (colorMedia.length) return colorMedia;

    return [
      ...(product?.images || []).map((src) => ({ type: 'image' as const, src })),
      ...(product?.videos || []).map((src) => ({ type: 'video' as const, src })),
    ];
  }, [currentColor, product]);
  const hasOffer = product ? Number(product.discount || 0) > 0 || Number(product.originalPrice || 0) > Number(product.price || 0) : false;

  if (loading) return <div className="container mx-auto px-4 py-16 text-center">جاري التحميل...</div>;
  if (!product) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">المنتج غير موجود</h1>
        <Link to="/shop" className="text-primary hover:underline">العودة للمتجر</Link>
      </div>
    );
  }

  const handleAddToCart = () => {
    if (!currentColor) return;
    if (!selectedSize) {
      toast.error('الرجاء اختيار المقاس');
      return;
    }
    if (!selectedInventory || selectedInventory.quantity < quantity) {
      toast.error('الكمية المطلوبة غير متوفرة');
      return;
    }
    addToCart({
      productId: product.id,
      productName: product.name,
      productImage: media[0]?.src || '',
      price: product.price,
      size: selectedSize,
      color: currentColor.name,
      colorId: currentColor.id,
      quantity,
    });
    toast.success('تمت الإضافة إلى السلة');
  };

  return (
    <div className="min-h-screen bg-muted/10">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
          <Link to="/" className="hover:text-primary">الرئيسية</Link><span>/</span>
          <Link to="/shop" className="hover:text-primary">المتجر</Link><span>/</span>
          <span className="text-foreground">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          <div>
            <div className="bg-white rounded-2xl overflow-hidden mb-4">
              {media[selectedImage]?.type === 'video' ? (
                <video src={media[selectedImage].src} className="w-full aspect-[3/4] object-cover" controls playsInline />
              ) : media[selectedImage] ? (
                <img src={media[selectedImage].src} alt={product.name} className="w-full aspect-[3/4] object-cover" />
              ) : null}
            </div>
            <div className="grid grid-cols-4 gap-3">
              {media.map((item, index) => (
                <button key={`${item.type}-${item.src}`} onClick={() => setSelectedImage(index)} className={`rounded-lg overflow-hidden border-2 ${selectedImage === index ? 'border-primary' : 'border-transparent'}`}>
                  {item.type === 'video' ? (
                    <video src={item.src} className="w-full aspect-square object-cover" muted playsInline />
                  ) : (
                    <img src={item.src} alt={`${product.name} ${index + 1}`} className="w-full aspect-square object-cover" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 lg:p-8">
            {product.bestseller && <div className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-semibold mb-4"><Star className="w-4 h-4 fill-current" />الأكثر مبيعاً</div>}
            <h1 className="text-3xl font-bold mb-4">{product.name}</h1>
            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl font-bold text-primary">{product.price} ₪</span>
              {hasOffer && <><span className="text-xl text-muted-foreground line-through">{product.originalPrice} ₪</span><span className="px-2 py-1 bg-destructive text-destructive-foreground rounded text-sm font-semibold">{product.discount ? `-${product.discount}%` : 'عرض'}</span></>}
            </div>
            <p className="text-muted-foreground mb-6 leading-relaxed">{product.description}</p>

            <div className="mb-6">
              <h3 className="font-semibold mb-3">اللون: {currentColor?.name}</h3>
              <div className="flex gap-3">
                {product.colors.map((color, index) => (
                  <button key={color.id || color.name} disabled={color.soldOut} onClick={() => { setSelectedColor(index); setSelectedImage(0); setSelectedSize(''); }} className={`w-12 h-12 rounded-full border-2 ${selectedColor === index ? 'border-primary scale-110' : 'border-border'} ${color.soldOut ? 'opacity-40 cursor-not-allowed' : ''}`} style={{ backgroundColor: color.hex }} title={color.name} />
                ))}
              </div>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold mb-3">المقاس</h3>
              <div className="grid grid-cols-4 gap-3">
                {currentInventory.map((size) => (
                  <button key={size.size} onClick={() => setSelectedSize(size.size)} disabled={!size.available || size.quantity === 0} className={`py-3 rounded-lg border-2 ${selectedSize === size.size ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'} ${!size.available || size.quantity === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    {size.size}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold mb-3">الكمية</h3>
              <div className="flex items-center gap-3">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 border border-border rounded-lg">-</button>
                <span className="w-12 text-center font-semibold">{quantity}</span>
                <button onClick={() => setQuantity(Math.min(selectedInventory?.quantity || 1, quantity + 1))} className="w-10 h-10 border border-border rounded-lg">+</button>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={handleAddToCart} disabled={product.status === 'sold_out'} className="flex-1 flex items-center justify-center gap-2 py-4 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50">
                <ShoppingCart className="w-5 h-5" />أضف للسلة
              </button>
              <button className="w-14 h-14 flex items-center justify-center border-2 border-border rounded-lg hover:border-primary hover:text-primary"><Heart className="w-5 h-5" /></button>
            </div>
            <div className="mt-6 pt-6 border-t border-border text-sm text-muted-foreground"><p>رمز المنتج: {product.sku}</p></div>
          </div>
        </div>
      </div>
    </div>
  );
}
