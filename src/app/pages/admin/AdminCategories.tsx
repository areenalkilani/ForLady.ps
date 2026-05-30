import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, X, Upload } from 'lucide-react';
import { deleteCategory, fetchCategories, saveCategory } from '../../lib/services';
import type { Category } from '../../lib/types';
import { toast } from 'sonner';

export function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const load = () => fetchCategories(true).then(setCategories).catch(console.error);
  useEffect(() => { load(); }, []);

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا التصنيف؟')) return;
    await deleteCategory(id);
    toast.success('تم حذف التصنيف بنجاح');
    load();
  };

  const handleSaveCategory = async (categoryData: Partial<Category>, file?: File) => {
    await saveCategory({ ...categoryData, id: editingCategory?.id, order: editingCategory?.order || categories.length + 1 }, file);
    toast.success(editingCategory ? 'تم تحديث التصنيف بنجاح' : 'تم إضافة التصنيف بنجاح');
    setIsModalOpen(false);
    load();
  };

  const toggleVisibility = async (category: Category) => {
    await saveCategory({ ...category, visible: !category.visible });
    toast.success('تم تحديث حالة الظهور');
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div><h1 className="text-3xl font-bold">التصنيفات</h1><p className="text-muted-foreground">{categories.length} تصنيف</p></div>
        <button onClick={() => { setEditingCategory(null); setIsModalOpen(true); }} className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90"><Plus className="w-5 h-5" />إضافة تصنيف</button>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.sort((a, b) => a.order - b.order).map((category) => (
          <div key={category.id} className="bg-white rounded-2xl overflow-hidden shadow-sm">
            <div className="relative aspect-[16/9] bg-muted">{category.image && <img src={category.image} alt={category.name} className="w-full h-full object-cover" />}{!category.visible && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><span className="px-4 py-2 bg-white rounded-lg font-semibold">مخفي</span></div>}</div>
            <div className="p-4">
              <h3 className="font-semibold text-lg mb-2">{category.name}</h3>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{category.description}</p>
              <div className="flex gap-2">
                <button onClick={() => toggleVisibility(category)} className={`flex-1 px-3 py-2 rounded-lg text-sm ${category.visible ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{category.visible ? 'ظاهر' : 'مخفي'}</button>
                <button onClick={() => { setEditingCategory(category); setIsModalOpen(true); }} className="p-2 hover:bg-muted rounded-lg"><Edit className="w-4 h-4" /></button>
                <button onClick={() => handleDeleteCategory(category.id)} className="p-2 hover:bg-destructive/10 hover:text-destructive rounded-lg"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {isModalOpen && <CategoryModal category={editingCategory} onClose={() => setIsModalOpen(false)} onSave={handleSaveCategory} />}
    </div>
  );
}

function CategoryModal({ category, onClose, onSave }: { category: Category | null; onClose: () => void; onSave: (data: Partial<Category>, file?: File) => void }) {
  const [formData, setFormData] = useState({ name: category?.name || '', nameEn: category?.nameEn || '', description: category?.description || '', visible: category?.visible ?? true });
  const [file, setFile] = useState<File | undefined>();
  const [imagePreview, setImagePreview] = useState(category?.image || '');
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl">
        <div className="border-b border-border p-6 flex justify-between"><h2 className="text-2xl font-bold">{category ? 'تعديل التصنيف' : 'إضافة تصنيف جديد'}</h2><button onClick={onClose}><X className="w-5 h-5" /></button></div>
        <form onSubmit={(e) => { e.preventDefault(); onSave({ ...formData, image: category?.image || '' }, file); }} className="p-6 space-y-6">
          {imagePreview && <img src={imagePreview} alt="preview" className="w-full aspect-[16/9] object-cover rounded-lg" />}
          <label className="block w-full p-8 border-2 border-dashed border-border rounded-lg hover:border-primary cursor-pointer"><input type="file" accept="image/*" onChange={(e) => { const next = e.target.files?.[0]; setFile(next); if (next) setImagePreview(URL.createObjectURL(next)); }} className="hidden" /><div className="text-center"><Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" /><p className="text-sm text-muted-foreground">رفع صورة التصنيف</p></div></label>
          <input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required placeholder="اسم التصنيف" className="w-full px-4 py-3 rounded-lg border border-border" />
          <input value={formData.nameEn} onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })} placeholder="English name" className="w-full px-4 py-3 rounded-lg border border-border" />
          <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} placeholder="الوصف" className="w-full px-4 py-3 rounded-lg border border-border resize-none" />
          <label className="flex items-center gap-3"><input type="checkbox" checked={formData.visible} onChange={(e) => setFormData({ ...formData, visible: e.target.checked })} />إظهار التصنيف في الموقع</label>
          <div className="flex gap-3 pt-6 border-t border-border"><button type="submit" className="flex-1 py-3 bg-primary text-primary-foreground rounded-lg">{category ? 'حفظ التعديلات' : 'إضافة التصنيف'}</button><button type="button" onClick={onClose} className="px-6 py-3 border border-border rounded-lg">إلغاء</button></div>
        </form>
      </div>
    </div>
  );
}
