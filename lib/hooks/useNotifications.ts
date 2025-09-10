import { useState } from 'react';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const showNotification = (
    type: Notification['type'],
    title: string,
    message: string
  ) => {
    const id = Date.now().toString();
    const notification: Notification = { id, type, title, message };
    setNotifications(prev => [...prev, notification]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return { notifications, showNotification, dismissNotification };
}

