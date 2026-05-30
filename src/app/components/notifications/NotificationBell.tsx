import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { Bell } from 'lucide-react';
import { fetchNotifications, markNotificationRead } from '../../lib/services';
import { supabase } from '../../../lib/supabaseClient';
import type { NotificationItem } from '../../lib/types';

export function NotificationBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const load = () => fetchNotifications().then(setItems).catch(console.error);

  const playNotificationSound = () => {
    audioRef.current?.play().catch(() => {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const context = new AudioContextClass();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, context.currentTime);
      gain.gain.setValueAtTime(0.001, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.2, context.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.35);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.35);
    });
  };

  useEffect(() => {
    load();
    audioRef.current = new Audio('/notification.mp3');
    const channel = supabase
      .channel('notification-center')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (payload) => {
        load();
        const title = String(payload.new?.title || 'For Lady');
        const body = String(payload.new?.body || 'لديك إشعار جديد');
        if (Notification.permission === 'granted') new Notification(title, { body });
        playNotificationSound();
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

  const handleNotificationClick = async (item: NotificationItem) => {
    await markNotificationRead(item.id).catch(console.error);
    setOpen(false);
    const orderId = item.data?.order_id;
    if (orderId) {
      navigate(`/admin/orders?order=${orderId}`);
      return;
    }
    if (item.type === 'low_stock' || item.type === 'stock_out') {
      navigate('/admin/products');
      return;
    }
    navigate('/admin/orders');
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
            <button
              key={item.id}
              onClick={() => handleNotificationClick(item)}
              className="block w-full p-4 text-right border-b border-border last:border-0 hover:bg-muted/50"
            >
              <p className="font-medium text-sm">{item.title}</p>
              <p className="text-sm text-muted-foreground mt-1">{item.body}</p>
              <p className="text-xs text-muted-foreground mt-2">{new Date(item.createdAt).toLocaleString('ar')}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
