export function showCartNotification(message: string, type: 'add' | 'remove' = 'add') {
  if (typeof document === 'undefined') return;
  const container = document.createElement('div');
  const bg = type === 'add' ? '#10B981' : '#EF4444';
  const icon = type === 'add' ? '✅' : '🗑️';
  container.innerHTML = `
    <div style="position: fixed; top: 80px; right: 20px; background: ${bg}; color: white; padding: 12px 20px; border-radius: 8px; z-index: 1000; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
      ${icon} ${message}
    </div>
  `;
  document.body.appendChild(container);
  setTimeout(() => {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }, 3000);
}

