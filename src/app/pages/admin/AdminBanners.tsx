import { useEffect, useState } from 'react';
import { Edit, ImagePlus, Plus, Trash2, Upload, X } from 'lucide-react';
import { deleteBanner, fetchAdminBanners, saveBanner } from '../../lib/services';
import type { HeroBanner } from '../../lib/types';
import { toast } from 'sonner';

const emptyBanner = {
  title: '',
  subtitle: '',
  image: '',
  order: 999,
  visible: true,
};

export function AdminBanners() {
  const [banners, setBanners] = useState<HeroBanner[]>([]);
  const [editingBanner, setEditingBanner] = useState<HeroBanner | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const load = () =>
    fetchAdminBanners()
      .then(setBanners)
      .catch((error) => {
        console.error('[AdminBanners] Load failed:', error);
        toast.error(error.message || 'تعذر تحميل البنرات');
      });

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكدة من حذف هذا البنر؟')) return;
    try {
      await deleteBanner(id);
      toast.success('تم حذف البنر');
      load();
    } catch (error: any) {
      toast.error(error.message || 'تعذر حذف البنر');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">البنرات</h1>
          <p className="text-muted-foreground">إدارة صور الصفحة الرئيسية</p>
        </div>
        <button
          onClick={() => {
            setEditingBanner(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-primary-foreground hover:opacity-90"
        >
          <Plus className="w-5 h-5" />
          إضافة بنر
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {banners.map((banner) => (
          <div key={banner.id} className="overflow-hidden rounded-lg border border-border bg-white">
            <div className="relative aspect-[16/7] bg-muted">
              {banner.image ? (
                <img src={banner.image} alt={banner.title} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  <ImagePlus className="w-8 h-8" />
                </div>
              )}
              {!banner.visible && (
                <span className="absolute right-3 top-3 rounded-full bg-black/70 px-3 py-1 text-xs text-white">
                  مخفي
                </span>
              )}
            </div>
            <div className="space-y-3 p-4">
              <div>
                <h3 className="font-semibold">{banner.title}</h3>
                <p className="text-sm text-muted-foreground">{banner.subtitle}</p>
              </div>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>الترتيب: {banner.order}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditingBanner(banner);
                      setIsModalOpen(true);
                    }}
                    className="rounded-lg p-2 hover:bg-muted"
                    title="تعديل"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(banner.id)}
                    className="rounded-lg p-2 text-destructive hover:bg-destructive/10"
                    title="حذف"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {banners.length === 0 && (
          <div className="rounded-lg border border-dashed border-border bg-white p-8 text-center text-muted-foreground md:col-span-2">
            لا يوجد بنرات بعد
          </div>
        )}
      </div>

      {isModalOpen && (
        <BannerModal
          banner={editingBanner}
          onClose={() => setIsModalOpen(false)}
          onSave={async (payload, file) => {
            await saveBanner(payload, file);
            toast.success(editingBanner ? 'تم تحديث البنر' : 'تم إضافة البنر');
            setIsModalOpen(false);
            load();
          }}
        />
      )}
    </div>
  );
}

function BannerModal({
  banner,
  onClose,
  onSave,
}: {
  banner: HeroBanner | null;
  onClose: () => void;
  onSave: (payload: Partial<HeroBanner>, file?: File) => Promise<void>;
}) {
  const [form, setForm] = useState<Partial<HeroBanner>>(banner || emptyBanner);
  const [file, setFile] = useState<File | undefined>();
  const [preview, setPreview] = useState(banner?.image || '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.title?.trim()) {
      toast.error('اكتبي عنوان البنر');
      return;
    }
    if (!file && !form.image) {
      toast.error('ارفعي صورة البنر');
      return;
    }

    setSaving(true);
    try {
      await onSave({ ...form, id: banner?.id }, file);
    } catch (error: any) {
      toast.error(error.message || 'تعذر حفظ البنر');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="text-xl font-bold">{banner ? 'تعديل بنر' : 'إضافة بنر'}</h2>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-muted">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-4">
          <div>
            <label className="mb-2 block">عنوان البنر</label>
            <input
              value={form.title || ''}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
              className="w-full rounded-lg border border-border bg-input-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="mb-2 block">النص الفرعي</label>
            <input
              value={form.subtitle || ''}
              onChange={(event) => setForm({ ...form, subtitle: event.target.value })}
              className="w-full rounded-lg border border-border bg-input-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block">الترتيب</label>
              <input
                type="number"
                value={form.order ?? 999}
                onChange={(event) => setForm({ ...form, order: Number(event.target.value) })}
                className="w-full rounded-lg border border-border bg-input-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <label className="flex items-center gap-3 rounded-lg border border-border px-4 py-3">
              <input
                type="checkbox"
                checked={form.visible ?? true}
                onChange={(event) => setForm({ ...form, visible: event.target.checked })}
              />
              ظاهر في الصفحة الرئيسية
            </label>
          </div>

          <div>
            <label className="mb-2 block">صورة البنر</label>
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border px-4 py-8 text-muted-foreground hover:bg-muted">
              <Upload className="w-5 h-5" />
              <span>اختاري صورة من الجهاز</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(event) => {
                  const selected = event.target.files?.[0];
                  if (!selected) return;
                  setFile(selected);
                  setPreview(URL.createObjectURL(selected));
                }}
              />
            </label>
          </div>

          {preview && (
            <div className="overflow-hidden rounded-lg border border-border">
              <img src={preview} alt="معاينة البنر" className="aspect-[16/7] w-full object-cover" />
            </div>
          )}

          <div className="flex flex-col-reverse gap-3 border-t border-border pt-4 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} className="rounded-lg border border-border px-5 py-3 hover:bg-muted">
              إلغاء
            </button>
            <button disabled={saving} className="rounded-lg bg-primary px-5 py-3 text-primary-foreground disabled:opacity-50">
              {saving ? 'جاري الحفظ...' : 'حفظ البنر'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
