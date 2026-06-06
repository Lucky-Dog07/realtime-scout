import StarRating from '../StarRating';
import type { Review } from '@realtime-scout/shared';
import './ReviewList.css';

const dimensionLabels: Record<string, [string, string, string]> = {
  publisher: ['拍摄质量', '服务态度', '完成时效'],
  acceptor: ['描述相符', '沟通态度', '付款时效'],
};

interface ReviewListProps {
  reviews: Review[];
  perspective?: 'reviewer' | 'reviewee';
  empty?: string;
}

export default function ReviewList({ reviews, perspective = 'reviewer', empty = '暂无评价' }: ReviewListProps) {
  if (!reviews.length) {
    return <p className="review-empty">{empty}</p>;
  }

  return (
    <div className="review-list">
      {reviews.map((r) => {
        const labels = dimensionLabels[r.reviewer_role] || ['维度一', '维度二', '维度三'];
        const name =
          perspective === 'reviewee'
            ? r.reviewee_nickname || r.reviewee_username || '用户'
            : r.reviewer_nickname || r.reviewer_username || '用户';
        const avatar = perspective === 'reviewee' ? r.reviewee_avatar_url : r.reviewer_avatar_url;
        const initial = name?.[0] || '?';
        return (
          <div key={r.id} className="review-item">
            <div className="review-item-head">
              <div className="review-user">
                {avatar ? (
                  <img src={avatar} alt="" className="review-avatar-img" />
                ) : (
                  <div className="review-avatar">{initial}</div>
                )}
                <div>
                  <div className="review-name">{name}</div>
                  {r.task_title && <div className="review-task">{r.task_title}</div>}
                </div>
              </div>
              <div className="review-overall">
                <StarRating value={Number(r.overall)} size={16} />
                <span className="review-overall-num">{Number(r.overall).toFixed(1)}</span>
              </div>
            </div>
            <div className="review-dimensions">
              {labels.map((label, i) => (
                <span key={i} className="review-dim">
                  {label}
                  <StarRating value={[r.score_1, r.score_2, r.score_3][i]} size={12} />
                </span>
              ))}
            </div>
            {r.comment && <p className="review-comment">{r.comment}</p>}
            <div className="review-time">{new Date(r.created_at).toLocaleString()}</div>
          </div>
        );
      })}
    </div>
  );
}
