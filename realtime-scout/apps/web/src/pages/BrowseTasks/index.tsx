import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocation } from '../../hooks/useLocation';
import { taskApi } from '../../services';
import type { Task } from '@realtime-scout/shared';
import './BrowseTasks.css';

export default function BrowseTasks() {
  const navigate = useNavigate();
  const { lng, lat, loading: locLoading } = useLocation();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (locLoading) return;
    loadTasks();
  }, [locLoading]);

  const loadTasks = async () => {
    try {
      const res: any = await taskApi.getNearby(lng, lat, 10000);
      setTasks(res.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const getTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes}分钟前`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}小时前`;
    return `${Math.floor(hours / 24)}天前`;
  };

  return (
    <div className="browse-page">
      <div className="browse-header">
        <h2>可接任务</h2>
        <div className="browse-filters">
          <select className="filter-select">
            <option>距离最近</option>
            <option>金额最高</option>
            <option>最新发布</option>
          </select>
          <button className="refresh-btn" onClick={loadTasks}>刷新</button>
        </div>
      </div>

      <div className="browse-list">
        {loading || locLoading ? (
          <div className="browse-empty">加载中...</div>
        ) : tasks.length === 0 ? (
          <div className="browse-empty">附近暂无可接任务</div>
        ) : (
          tasks.map((task) => (
            <div key={task.id} className="browse-card" onClick={() => navigate(`/task/${task.id}`)}>
              <div className="browse-card-left">
                <h3>{task.title}</h3>
                <p className="browse-card-desc">{task.description}</p>
                <div className="browse-card-meta">
                  <span>📍 {task.location_name}</span>
                  <span>🕐 {getTimeAgo(task.created_at)}</span>
                  {task.distance != null && <span>📏 {Math.round(task.distance)}米</span>}
                </div>
              </div>
              <div className="browse-card-right">
                <div className="browse-card-reward">¥{task.reward}</div>
                <button className="browse-card-btn">去接单</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
