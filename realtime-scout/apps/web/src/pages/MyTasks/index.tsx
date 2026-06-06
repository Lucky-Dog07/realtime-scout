import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { taskApi } from '../../services';
import type { Task } from '@realtime-scout/shared';
import './MyTasks.css';

const statusMap: Record<string, { text: string; className: string }> = {
  pending: { text: '待接单', className: 'status-pending' },
  accepted: { text: '进行中', className: 'status-accepted' },
  submitted: { text: '待确认', className: 'status-submitted' },
  completed: { text: '已完成', className: 'status-completed' },
  expired: { text: '已过期', className: 'status-expired' },
  cancelled: { text: '已取消', className: 'status-expired' },
};

export default function MyTasks() {
  const navigate = useNavigate();
  const location = useLocation();
  const [tab, setTab] = useState<'published' | 'accepted'>(
    location.pathname.includes('accepted') ? 'accepted' : 'published'
  );
  const [published, setPublished] = useState<Task[]>([]);
  const [accepted, setAccepted] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadTasks(); }, []);

  useEffect(() => {
    setTab(location.pathname.includes('accepted') ? 'accepted' : 'published');
  }, [location.pathname]);

  const loadTasks = async () => {
    try {
      const [pubRes, accRes]: any[] = await Promise.all([
        taskApi.getMyPublished(),
        taskApi.getMyAccepted(),
      ]);
      setPublished(pubRes.data || []);
      setAccepted(accRes.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const tasks = tab === 'published' ? published : accepted;

  return (
    <div className="mytasks-page">
      <div className="mytasks-header">
        <h2>我的任务</h2>
        <div className="mytasks-tabs">
          <button className={`tab-btn ${tab === 'published' ? 'active' : ''}`} onClick={() => setTab('published')}>
            我发布的 ({published.length})
          </button>
          <button className={`tab-btn ${tab === 'accepted' ? 'active' : ''}`} onClick={() => setTab('accepted')}>
            我接单的 ({accepted.length})
          </button>
        </div>
      </div>

      <div className="mytasks-list">
        {loading ? (
          <div className="mytasks-empty">加载中...</div>
        ) : tasks.length === 0 ? (
          <div className="mytasks-empty">暂无任务</div>
        ) : (
          <table className="task-table">
            <thead>
              <tr>
                <th>任务标题</th>
                <th>地点</th>
                <th>悬赏</th>
                <th>状态</th>
                <th>发布时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => {
                const s = statusMap[task.status] || { text: task.status, className: '' };
                return (
                  <tr key={task.id}>
                    <td className="td-title">{task.title}</td>
                    <td className="td-location">{task.location_name}</td>
                    <td className="td-reward">¥{task.reward}</td>
                    <td><span className={`table-status ${s.className}`}>{s.text}</span></td>
                    <td className="td-time">{new Date(task.created_at).toLocaleDateString()}</td>
                    <td>
                      <button className="table-action" onClick={() => navigate(`/task/${task.id}`)}>查看</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
