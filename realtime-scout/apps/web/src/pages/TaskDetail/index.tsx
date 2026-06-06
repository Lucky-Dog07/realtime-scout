import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { taskApi } from '../../services';
import { useAuthStore } from '../../store/authStore';
import { useLocation as useGeoLocation } from '../../hooks/useLocation';
import Chat from '../../components/Chat';
import ReviewSection from '../../components/ReviewSection';
import './TaskDetail.css';

declare const AMap: any;

export default function TaskDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const geoLocation = useGeoLocation();
  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadTask(); }, [id]);

  const loadTask = async () => {
    try {
      const res: any = await taskApi.getById(parseInt(id!));
      setTask(res.data);
    } catch { alert('加载失败'); }
    finally { setLoading(false); }
  };

  const handleAccept = async () => {
    if (geoLocation.loading) { alert('正在获取位置，请稍候'); return; }
    if (geoLocation.error) { alert('无法获取您的位置：' + geoLocation.error); return; }
    try {
      await taskApi.accept(parseInt(id!), geoLocation.lng, geoLocation.lat);
      alert('接单成功'); loadTask();
    }
    catch (err: any) { alert(err.message || '接单失败'); }
  };

  const handleConfirm = async () => {
    if (!confirm('确认任务完成？悬赏金将支付给接单者')) return;
    try { await taskApi.confirm(parseInt(id!)); alert('已确认完成'); loadTask(); }
    catch (err: any) { alert(err.message || '操作失败'); }
  };

  const handleReject = async () => {
    if (!confirm('拒绝此次提交？接单者需要重新提交')) return;
    try { await taskApi.reject(parseInt(id!)); alert('已拒绝'); loadTask(); }
    catch (err: any) { alert(err.message || '操作失败'); }
  };

  const handleCancel = async () => {
    if (!confirm('确认取消任务？悬赏金将退回')) return;
    try { await taskApi.cancel(parseInt(id!)); alert('已取消'); navigate('/'); }
    catch (err: any) { alert(err.message || '操作失败'); }
  };

  const handleGiveUp = async () => {
    if (!confirm('确认放弃该任务？任务将重新开放接单')) return;
    try { await taskApi.giveUp(parseInt(id!)); alert('已放弃任务'); loadTask(); }
    catch (err: any) { alert(err.message || '操作失败'); }
  };

  if (loading) return <div className="detail-loading">加载中...</div>;
  if (!task) return null;

  const statusMap: Record<string, { text: string; className: string }> = {
    pending: { text: '待接单', className: 'status-pending' },
    accepted: { text: '已接单', className: 'status-accepted' },
    submitted: { text: '已提交', className: 'status-submitted' },
    completed: { text: '已完成', className: 'status-completed' },
    expired: { text: '已过期', className: 'status-expired' },
    cancelled: { text: '已取消', className: 'status-expired' },
  };

  const status = statusMap[task.status] || { text: task.status, className: '' };
  const isPublisher = user?.id === task.publisher_id;
  const isAcceptor = user?.id === task.acceptor_id;
  const deadline = new Date(task.deadline);
  const remaining = Math.max(0, Math.floor((deadline.getTime() - Date.now()) / 60000));

  return (
    <div className="detail-page">
      <div className="detail-main">
        <div className="detail-header">
          <div>
            <h1>{task.title}</h1>
            <span className={`detail-status ${status.className}`}>{status.text}</span>
          </div>
          <div className="detail-reward">¥{task.reward}</div>
        </div>

        <div className="detail-section">
          <h3>任务描述</h3>
          <p>{task.description}</p>
        </div>

        <div className="detail-section">
          <h3>任务信息</h3>
          <div className="detail-info-grid">
            <div className="info-item">
              <span className="info-label">目标地点</span>
              <span className="info-value">📍 {task.location_name}</span>
            </div>
            <div className="info-item">
              <span className="info-label">需要照片</span>
              <span className="info-value">{task.photo_count} 张</span>
            </div>
            <div className="info-item">
              <span className="info-label">剩余时间</span>
              <span className="info-value">{remaining > 0 ? `${remaining} 分钟` : '已截止'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">发布时间</span>
              <span className="info-value">{new Date(task.created_at).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {task.submission && (
          <div className="detail-section">
            <h3>提交内容</h3>
            {task.submission.description && <p className="submission-desc">{task.submission.description}</p>}
            <div className="submission-photos">
              {task.submission.photos?.map((photo: any) => (
                <img key={photo.id} src={photo.photo_url} alt="" className="submission-photo" />
              ))}
            </div>
            {task.submission.distance_to_task != null && (
              <p className="submission-distance">提交距离任务地点：{Math.round(task.submission.distance_to_task)} 米</p>
            )}
          </div>
        )}

        {task.status === 'completed' && (isPublisher || isAcceptor) && (
          <div className="detail-section">
            <h3>互评</h3>
            <ReviewSection
              taskId={parseInt(id!)}
              isPublisher={isPublisher}
              counterpartyId={isPublisher ? task.acceptor_id : task.publisher_id}
              counterpartyName={
                isPublisher
                  ? task.acceptor?.nickname || task.acceptor?.username || '接单者'
                  : task.publisher?.nickname || task.publisher?.username || '发布者'
              }
              onReviewed={loadTask}
            />
          </div>
        )}

        <div className="detail-actions">
          {task.status === 'pending' && !isPublisher && (
            <button className="action-btn primary" onClick={handleAccept}>立即接单</button>
          )}
          {task.status === 'pending' && isPublisher && (
            <button className="action-btn danger" onClick={handleCancel}>取消任务</button>
          )}
          {task.status === 'accepted' && isAcceptor && (
            <>
              <button className="action-btn primary" onClick={() => navigate(`/task/${id}/submit`)}>提交结果</button>
              <button className="action-btn danger" onClick={handleGiveUp}>放弃任务</button>
            </>
          )}
          {task.status === 'submitted' && isPublisher && (
            <>
              <button className="action-btn success" onClick={handleConfirm}>确认完成</button>
              <button className="action-btn danger" onClick={handleReject}>拒绝</button>
            </>
          )}
        </div>

        {task.acceptor_id && (isPublisher || isAcceptor) && (
          <div className="detail-section">
            <h3>对话</h3>
            <Chat taskId={parseInt(id!)} visible={true} />
          </div>
        )}
      </div>

      <div className="detail-sidebar">
        <h3>任务位置</h3>
        <div className="detail-map" id="detail-map" ref={(el) => {
          if (el && task.lng && task.lat && !el.hasChildNodes()) {
            const map = new AMap.Map(el, { zoom: 15, center: [task.lng, task.lat] });
            new AMap.Marker({ position: [task.lng, task.lat], map });
          }
        }} />
      </div>
    </div>
  );
}
