import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationApi } from '../../services';
import './Messages.css';

interface Notification {
  id: number;
  type: string;
  title: string;
  content: string;
  related_task_id: number | null;
  is_read: boolean;
  created_at: string;
}

export default function Messages() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadNotifications(); }, []);

  const loadNotifications = async () => {
    try {
      const res: any = await notificationApi.getAll();
      setNotifications(res.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleClick = async (n: Notification) => {
    if (!n.is_read) {
      await notificationApi.markAsRead(n.id);
      setNotifications((prev) =>
        prev.map((item) => item.id === n.id ? { ...item, is_read: true } : item)
      );
      window.dispatchEvent(new Event('notifications-read'));
    }
    if (n.related_task_id) {
      navigate(`/task/${n.related_task_id}`);
    }
  };

  const handleMarkAll = async () => {
    await notificationApi.markAllAsRead();
    setNotifications((prev) => prev.map((item) => ({ ...item, is_read: true })));
    window.dispatchEvent(new Event('notifications-read'));
  };

  return (
    <div className="messages-page">
      <div className="messages-header">
        <h2>消息中心</h2>
        <button className="mark-all-btn" onClick={handleMarkAll}>全部已读</button>
      </div>

      {loading ? (
        <div className="messages-empty">加载中...</div>
      ) : notifications.length === 0 ? (
        <div className="messages-empty">暂无消息</div>
      ) : (
        <div className="messages-list">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`message-item ${!n.is_read ? 'unread' : ''}`}
              onClick={() => handleClick(n)}
            >
              <div className="message-dot">{!n.is_read && <span />}</div>
              <div className="message-body">
                <div className="message-title">{n.title}</div>
                <div className="message-content">{n.content}</div>
                <div className="message-time">{new Date(n.created_at).toLocaleString()}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}