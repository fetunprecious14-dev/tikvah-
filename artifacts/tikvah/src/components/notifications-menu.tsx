import { useState } from 'react';
import { useLocation } from 'wouter';
import { Bell } from 'lucide-react';
import { useListNotifications, useMarkNotificationRead, getListNotificationsQueryKey } from '@workspace/api-client-react';
import { queryClient } from '@/lib/queryClient';

function timeAgo(date: Date): string {
  const seconds = Math.max(0, Math.round((Date.now() - date.getTime()) / 1000));
  if (seconds < 60) return 'just now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export function NotificationsMenu() {
  const [open, setOpen] = useState(false);
  const [, navigate] = useLocation();
  const { data: notifications = [] } = useListNotifications();
  const markRead = useMarkNotificationRead();

  const unreadCount = notifications.filter(notification => !notification.read).length;

  const handleSelect = (notification: (typeof notifications)[number]) => {
    setOpen(false);
    if (!notification.read) {
      markRead.mutate(
        { id: notification.id },
        { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() }) },
      );
    }
    if (notification.conversationId) navigate(`/conversations/${notification.conversationId}`);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        data-testid="button-notifications"
        className="relative grid size-9 place-items-center rounded-full text-muted-foreground transition hover:bg-secondary hover:text-foreground"
      >
        <Bell size={17} />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 grid size-4 place-items-center rounded-full bg-accent text-[9px] font-semibold text-accent-foreground">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      {open && (
        <>
          <button
            aria-label="Close notifications"
            className="fixed inset-0 z-30 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 z-40 mt-3 w-80 max-w-[calc(100vw-2.5rem)] rounded-2xl border border-border bg-card p-2 shadow-[var(--shadow-soft)]">
            <p className="px-3 py-2 text-[11px] font-semibold uppercase tracking-[.14em] text-muted-foreground">Notifications</p>
            {notifications.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">Nothing new yet.</p>
            ) : (
              <div className="max-h-80 overflow-y-auto">
                {notifications.slice(0, 12).map(notification => (
                  <button
                    key={notification.id}
                    onClick={() => handleSelect(notification)}
                    data-testid={`notification-${notification.id}`}
                    className={`block w-full rounded-xl px-3 py-2.5 text-left text-sm transition hover:bg-secondary ${!notification.read ? 'bg-secondary/60' : ''}`}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="font-medium">{notification.title}</span>
                      <span className="shrink-0 text-[11px] text-muted-foreground">{timeAgo(new Date(notification.createdAt))}</span>
                    </span>
                    <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">{notification.body}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
