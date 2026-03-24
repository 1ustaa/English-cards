import { useEffect } from 'react';

/**
 * Компонент всплывающего уведомления (Toast)
 */
const Toast = ({ message, type = 'info', onClose, duration = 3000 }) => {
  useEffect(() => {
    if (duration) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const bgColors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-yellow-500',
    info: 'bg-primary-600',
  };

  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
  };

  return (
    <div className={`${bgColors[type]} text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-3 animate-slide-in`}>
      <span className="text-xl">{icons[type]}</span>
      <span className="font-medium">{message}</span>
      <button
        onClick={onClose}
        className="ml-4 hover:opacity-75 transition-opacity"
      >
        ✕
      </button>
    </div>
  );
};

export default Toast;
