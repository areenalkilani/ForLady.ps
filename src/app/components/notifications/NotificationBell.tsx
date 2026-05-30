import { useEffect, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import { fetchNotifications, markNotificationRead } from '../../lib/services';
import { supabase } from '../../../lib/supabaseClient';
import type { NotificationItem } from '../../lib/types';

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const load = () => fetchNotifications().then(setItems).catch(console.error);

  useEffect(() => {
    load();
    audioRef.current = new Audio('/notification.mp3');
    const channel = supabase
      .channel('notification-center')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, () => {
        load();
        if (Notification.permission === 'granted') new Notification('For Lady', { body: 'لديك إشعار جديد' });
        audioRef.current?.play().catch(() => undefined);
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const unread = items.filter((item) => !item.read).length;

  const handleOpen = async () => {
    setOpen(!open);
    if (!open) {
      await Promise.all(items.filter((item) => !item.read).map((item) => markNotificationRead(item.id)));
      load();
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  };

  return (
    <div className="relative">
      <button onClick={handleOpen} className="relative p-2 hover:bg-muted rounded-lg transition-colors" aria-label="notifications">
        <Bell className="w-5 h-5" />
        {unread > 0 && <span className="absolute -top-1 -left-1 min-w-5 h-5 px-1 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">{unread}</span>}
      </button>
      {open && (
        <div className="absolute left-0 mt-2 w-80 max-h-96 overflow-y-auto bg-white border border-border rounded-lg shadow-lg z-50">
          <div className="p-4 border-b border-border font-semibold">الإشعارات</div>
          {items.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground text-center">لا توجد إشعارات</p>
          ) : items.map((item) => (
            <div key={item.id} className="p-4 border-b border-border last:border-0">
              <p className="font-medium text-sm">{item.title}</p>
              <p className="text-sm text-muted-foreground mt-1">{item.body}</p>
              <p className="text-xs text-muted-foreground mt-2">{new Date(item.createdAt).toLocaleString('ar')}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
