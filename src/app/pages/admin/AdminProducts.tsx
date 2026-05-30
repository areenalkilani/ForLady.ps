import { useEffect, useMemo, useState } from 'react';
import { Edit, Plus, Search, Trash2, Upload, X } from 'lucide-react';
import { deleteProduct, fetchCategories, fetchProducts, saveProductWithInventory } from '../../lib/services';
import type { Category, EditableProductColor, Product, ProductInventory } from '../../lib/types';
import { toast } from 'sonner';

type OfferMode = 'manual' | 'percentage';

const defaultSizes = ['S', 'M', 'L', 'XL'];

export function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const load = () =>
    Promise.all([fetchProducts({ includeInactive: true }), fetchCategories(true)])
      .then(([productRows, categoryRows]) => {
        setProducts(productRows);
        setCategories(categoryRows);
      })
      .catch((error) => {
        console.error('[AdminProducts] Load failed:', error);
        toast.error(error.message || 'تعذر تحميل المنتجات');
      });

  useEffect(() => {
    load();
  }, []);

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('هل أنت متأكدة من حذف هذا المنتج؟')) return;
    try {
      await deleteProduct(id);
      toast.success('تم حذف المنتج بنجاح');
      load();
    } catch (error: any) {
      toast.error(error.message || 'تعذر حذف المنتج');
    }
  };

  const handleSaveProduct = async (productData: Partial<Product>) => {
    try {
      await saveProductWithInventory({ ...productData, id: editingProduct?.id });
      toast.success(editingProduct ? 'تم تحديث المنتج بنجاح' : 'تم إضافة المنتج بنجاح');
      setIsModalOpen(false);
      load();
    } catch (error: any) {
      console.error('[AdminProducts] Save failed:', error);
      toast.error(error.message || 'تعذر حفظ المنتج');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">المنتجات</h1>
          <p className="text-muted-foreground">{products.length} منتج</p>
        </div>
        <button
          onClick={() => {
            setEditingProduct(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
        >
          <Plus className="w-5 h-5" />
          إضافة منتج
        </button>
      </div>

      <div className="bg-white rounded-2xl p-4">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            placeholder="بحث عن منتج..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-10 pl-4 py-3 bg-muted rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-right px-6 py-4">المنتج</th>
                <th className="text-right px-6 py-4">التصنيف</th>
                <th className="text-right px-6 py-4">السعر</th>
                <th className="text-right px-6 py-4">المخزون</th>
                <th className="text-right px-6 py-4">الحالة</th>
                <th className="text-right px-6 py-4">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.id} className="border-t border-border">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-muted overflow-hidden">
                        {product.images[0] && <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />}
                      </div>
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground">{product.sku}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">{product.categoryName}</td>
                  <td className="px-6 py-4">
                    <span className="font-semibold">{product.price} ₪</span>
                    {!!product.discount && <span className="text-destructive text-sm mr-2">-{product.discount}%</span>}
                  </td>
                  <td className="px-6 py-4">{product.sizes.reduce((sum, size) => sum + size.quantity, 0)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(product.status)}`}>
                      {getStatusLabel(product.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingProduct(product);
                          setIsModalOpen(true);
                        }}
                        className="p-2 hover:bg-muted rounded-lg"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
                        className="p-2 hover:bg-destructive/10 hover:text-destructive rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <ProductModal
          product={editingProduct}
          categories={categories}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveProduct}
        />
      )}
    </div>
  );
}

function ProductModal({
  product,
  categories,
  onClose,
  onSave,
}: {
  product: Product | null;
  categories: Category[];
  onClose: () => void;
  onSave: (data: Partial<Product>) => void;
}) {
  const [offerMode, setOfferMode] = useState<OfferMode>(product?.discount ? 'percentage' : 'manual');
  const [formData, setFormData] = useState<Partial<Product>>({
    name: product?.name || '',
    nameEn: product?.nameEn || '',
    description: product?.description || '',
    category: product?.category || '',
    price: product?.price || 0,
    originalPrice: product?.originalPrice || product?.price || 0,
    discount: product?.discount || 0,
    sku: product?.sku || '',
    status: product?.status || 'active',
    tags: product?.tags || [],
    featured: product?.featured || false,
    bestseller: product?.bestseller || false,
    colors: product?.colors?.length
      ? product.colors.map((color) => ({ ...color, imageFiles: [], videoFiles: [] }))
      : [newColor()],
  });

  const colors = (formData.colors || []) as EditableProductColor[];

  const finalPrice = useMemo(() => {
    const original = Number(formData.originalPrice || 0);
    if (offerMode === 'percentage') {
      return Math.max(0, Math.round(original * (1 - Number(formData.discount || 0) / 100)));
    }
    return Number(formData.price || 0);
  }, [formData.discount, formData.originalPrice, formData.price, offerMode]);

  const updateColor = (index: number, next: Partial<EditableProductColor>) => {
    setFormData({
      ...formData,
      colors: colors.map((color, colorIndex) => (colorIndex === index ? { ...color, ...next } : color)),
    });
  };

  const updateSize = (colorIndex: number, sizeIndex: number, next: Partial<ProductInventory>) => {
    const color = colors[colorIndex];
    const sizes = color.sizes || [];
    updateColor(colorIndex, {
      sizes: sizes.map((size, currentIndex) => (currentIndex === sizeIndex ? { ...size, ...next } : size)),
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (colors.some((color) => !color.name.trim())) {
      toast.error('أدخلي اسم كل لون');
      return;
    }
    if (colors.some((color) => !color.sizes?.some((size) => size.size && Number(size.quantity) >= 0))) {
      toast.error('أدخلي المقاسات والكميات لكل لون');
      return;
    }

    onSave({
      ...formData,
      price: finalPrice,
      discount: offerMode === 'percentage' ? Number(formData.discount || 0) : 0,
      originalPrice: Number(formData.originalPrice || finalPrice),
      colors,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-border p-6 flex justify-between z-10">
          <h2 className="text-2xl font-bold">{product ? 'تعديل المنتج' : 'إضافة منتج جديد'}</h2>
          <button onClick={onClose} type="button">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <section className="grid md:grid-cols-2 gap-4">
            <input value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required placeholder="اسم المنتج" className="w-full px-4 py-3 rounded-lg border border-border" />
            <input value={formData.sku || ''} onChange={(e) => setFormData({ ...formData, sku: e.target.value })} placeholder="SKU" className="w-full px-4 py-3 rounded-lg border border-border" />
            <select value={formData.category || ''} onChange={(e) => setFormData({ ...formData, category: e.target.value })} required className="w-full px-4 py-3 rounded-lg border border-border">
              <option value="">اختاري التصنيف</option>
              {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
            </select>
            <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as any })} className="w-full px-4 py-3 rounded-lg border border-border">
              <option value="active">نشط</option>
              <option value="draft">مسودة</option>
              <option value="hidden">مخفي</option>
              <option value="sold_out">نفذت الكمية</option>
            </select>
          </section>

          <textarea value={formData.description || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} placeholder="الوصف" className="w-full px-4 py-3 rounded-lg border border-border resize-none" />

          <section className="bg-muted/30 rounded-lg p-4 space-y-4">
            <h3 className="font-semibold">السعر والعرض</h3>
            <div className="grid md:grid-cols-4 gap-4">
              <input type="number" value={formData.originalPrice || 0} onChange={(e) => setFormData({ ...formData, originalPrice: Number(e.target.value) })} min="0" placeholder="السعر الأصلي" className="px-4 py-3 rounded-lg border border-border" />
              <select value={offerMode} onChange={(e) => setOfferMode(e.target.value as OfferMode)} className="px-4 py-3 rounded-lg border border-border">
                <option value="manual">عرض يدوي</option>
                <option value="percentage">عرض بنسبة مئوية</option>
              </select>
              {offerMode === 'percentage' ? (
                <input type="number" value={formData.discount || 0} onChange={(e) => setFormData({ ...formData, discount: Number(e.target.value) })} min="0" max="100" placeholder="نسبة الخصم" className="px-4 py-3 rounded-lg border border-border" />
              ) : (
                <input type="number" value={formData.price || 0} onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })} min="0" placeholder="سعر العرض اليدوي" className="px-4 py-3 rounded-lg border border-border" />
              )}
              <div className="px-4 py-3 rounded-lg bg-white border border-border font-semibold">السعر النهائي: {finalPrice} ₪</div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">الألوان والمخزون</h3>
              <button type="button" onClick={() => setFormData({ ...formData, colors: [...colors, newColor()] })} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg">إضافة لون</button>
            </div>

            {colors.map((color, colorIndex) => (
              <div key={colorIndex} className="border border-border rounded-lg p-4 space-y-4">
                <div className="flex gap-3 items-center">
                  <input value={color.name} onChange={(e) => updateColor(colorIndex, { name: e.target.value })} required placeholder="اسم اللون مثل أسود" className="flex-1 px-4 py-3 rounded-lg border border-border" />
                  <input type="color" value={color.hex || '#000000'} onChange={(e) => updateColor(colorIndex, { hex: e.target.value })} className="w-14 h-12 rounded border border-border" />
                  <button type="button" onClick={() => setFormData({ ...formData, colors: colors.filter((_, index) => index !== colorIndex) })} className="p-3 hover:bg-destructive/10 hover:text-destructive rounded-lg"><Trash2 className="w-4 h-4" /></button>
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium">صور اللون وفيديوهاته</label>
                  <label className="flex items-center justify-center gap-2 p-5 border-2 border-dashed border-border rounded-lg hover:border-primary cursor-pointer">
                    <Upload className="w-5 h-5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">رفع صور أو فيديو لهذا اللون</span>
                    <input
                      type="file"
                      accept="image/*,video/*"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        updateColor(colorIndex, {
                          imageFiles: [...(color.imageFiles || []), ...files.filter((file) => file.type.startsWith('image'))],
                          videoFiles: [...(color.videoFiles || []), ...files.filter((file) => file.type.startsWith('video'))],
                        });
                      }}
                    />
                  </label>
                  <p className="mt-2 text-xs text-muted-foreground">
                    الصور الجديدة: {color.imageFiles?.length || 0}، الفيديوهات الجديدة: {color.videoFiles?.length || 0}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="grid grid-cols-[1fr_1fr_auto] gap-3 text-sm text-muted-foreground px-1">
                    <span>النمرة</span>
                    <span>الكمية</span>
                    <span />
                  </div>
                  {(color.sizes || []).map((size, sizeIndex) => (
                    <div key={sizeIndex} className="grid grid-cols-[1fr_1fr_auto] gap-3">
                      <input value={size.size} onChange={(e) => updateSize(colorIndex, sizeIndex, { size: e.target.value })} placeholder="S / M / L" className="px-4 py-2 rounded-lg border border-border" />
                      <input type="number" value={size.quantity} onChange={(e) => updateSize(colorIndex, sizeIndex, { quantity: Number(e.target.value), available: Number(e.target.value) > 0 })} min="0" className="px-4 py-2 rounded-lg border border-border" />
                      <button type="button" onClick={() => updateColor(colorIndex, { sizes: (color.sizes || []).filter((_, index) => index !== sizeIndex) })} className="p-2 hover:bg-destructive/10 hover:text-destructive rounded-lg"><X className="w-4 h-4" /></button>
                    </div>
                  ))}
                  <button type="button" onClick={() => updateColor(colorIndex, { sizes: [...(color.sizes || []), { size: '', quantity: 0, available: false }] })} className="px-4 py-2 border border-border rounded-lg hover:bg-muted">إضافة نمرة</button>
                </div>
              </div>
            ))}
          </section>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-3"><input type="checkbox" checked={!!formData.featured} onChange={(e) => setFormData({ ...formData, featured: e.target.checked })} />منتج مميز</label>
            <label className="flex items-center gap-3"><input type="checkbox" checked={!!formData.bestseller} onChange={(e) => setFormData({ ...formData, bestseller: e.target.checked })} />الأكثر مبيعاً</label>
          </div>

          <div className="flex gap-3 pt-6 border-t border-border">
            <button type="submit" className="flex-1 py-3 bg-primary text-primary-foreground rounded-lg">{product ? 'حفظ التعديلات' : 'إضافة المنتج'}</button>
            <button type="button" onClick={onClose} className="px-6 py-3 border border-border rounded-lg">إلغاء</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function newColor(): EditableProductColor {
  return {
    name: '',
    hex: '#000000',
    images: [],
    videos: [],
    imageFiles: [],
    videoFiles: [],
    sizes: defaultSizes.map((size) => ({ size, quantity: 0, available: false })),
  };
}

function getStatusLabel(status: string) {
  return ({ active: 'نشط', draft: 'مسودة', hidden: 'مخفي', sold_out: 'نفذت الكمية' } as Record<string, string>)[status] || status;
}

function getStatusColor(status: string) {
  return ({ active: 'bg-green-100 text-green-700', draft: 'bg-gray-100 text-gray-700', hidden: 'bg-yellow-100 text-yellow-700', sold_out: 'bg-red-100 text-red-700' } as Record<string, string>)[status] || 'bg-gray-100 text-gray-700';
}
