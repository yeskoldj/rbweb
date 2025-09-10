'use client';

import { Notification } from '@/lib/hooks/useNotifications';

interface Props {
  notifications: Notification[];
  onDismiss: (id: string) => void;
}

export default function NotificationSystem({ notifications, onDismiss }: Props) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`p-4 rounded-lg shadow-lg border-l-4 bg-white max-w-sm animate-slide-in-right ${
            notification.type === 'success'
              ? 'border-green-500'
              : notification.type === 'error'
              ? 'border-red-500'
              : notification.type === 'warning'
              ? 'border-amber-500'
              : 'border-blue-500'
          }`}
        >
          <div className="flex items-start">
            <div
              className={`w-6 h-6 flex items-center justify-center rounded-full mr-3 flex-shrink-0 ${
                notification.type === 'success'
                  ? 'bg-green-100 text-green-600'
                  : notification.type === 'error'
                  ? 'bg-red-100 text-red-600'
                  : notification.type === 'warning'
                  ? 'bg-amber-100 text-amber-600'
                  : 'bg-blue-100 text-blue-600'
              }`}
            >
              <i
                className={`text-sm ${
                  notification.type === 'success'
                    ? 'ri-check-line'
                    : notification.type === 'error'
                    ? 'ri-close-line'
                    : notification.type === 'warning'
                    ? 'ri-alert-line'
                    : 'ri-information-line'
                }`}
              ></i>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-800 text-sm">
                {notification.title}
              </h4>
              <p className="text-gray-600 text-xs mt-1">
                {notification.message}
              </p>
            </div>
            <button
              onClick={() => onDismiss(notification.id)}
              className="ml-2 text-gray-400 hover:text-gray-600 flex-shrink-0"
            >
              <i className="ri-close-line text-sm"></i>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

