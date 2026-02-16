import { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../api/client';

export default function NotificationPanel() {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function loadNotifications() {
    try {
      const res = await getNotifications();
      setNotifications(res.data);
    } catch (err) {
      // silent
    }
  }

  async function handleRead(id) {
    await markNotificationRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }

  async function handleReadAll() {
    await markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  const typeColors = {
    submission: 'text-cyan-400',
    approval: 'text-emerald-400',
    rejection: 'text-red-400',
    deferral: 'text-orange-400',
    followup: 'text-purple-400',
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 text-slate-400 hover:text-cyan-400 focus:outline-none transition-colors"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full neon-pink" style={{ fontSize: '10px' }}>
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 w-80 mt-2 glass-strong rounded-xl overflow-hidden">
          <div className="flex items-center justify-between p-3 border-b border-white/10">
            <h3 className="font-semibold text-slate-200">Notifications</h3>
            {unreadCount > 0 && (
              <button onClick={handleReadAll} className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors">
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="p-4 text-sm text-slate-500 text-center">No notifications</p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => !n.read && handleRead(n.id)}
                  className={`p-3 border-b border-white/5 cursor-pointer hover:bg-white/5 transition-colors ${
                    !n.read ? 'bg-cyan-500/5' : ''
                  }`}
                >
                  <p className={`text-sm ${typeColors[n.type] || 'text-slate-300'}`}>
                    {n.message}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {new Date(n.createdAt).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
