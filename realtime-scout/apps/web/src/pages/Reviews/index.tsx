import { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { reviewApi } from '../../services';
import StarRating from '../../components/StarRating';
import ReviewList from '../../components/ReviewList';
import type { Review, ReviewAggregate } from '@realtime-scout/shared';
import './Reviews.css';

const dimensionLabels = ['拍摄质量 / 描述相符', '服务态度 / 沟通态度', '完成时效 / 付款时效'];

export default function Reviews() {
  const user = useAuthStore((s) => s.user);
  const [tab, setTab] = useState<'received' | 'given'>('received');
  const [received, setReceived] = useState<Review[]>([]);
  const [given, setGiven] = useState<Review[]>([]);
  const [aggregate, setAggregate] = useState<ReviewAggregate | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const [recRes, givRes]: any[] = await Promise.all([
        user ? reviewApi.getUserReviews(user.id) : Promise.resolve({ data: { aggregate: null, reviews: [] } }),
        reviewApi.getGivenReviews(),
      ]);
      setAggregate(recRes.data.aggregate);
      setReceived(recRes.data.reviews || []);
      setGiven(givRes.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  return (
    <div className="reviews-page">
      <div className="reviews-summary">
        <div className="reviews-score">
          <div className="reviews-score-num">{aggregate ? aggregate.rating.toFixed(2) : '5.00'}</div>
          <StarRating value={aggregate?.rating ?? 5} size={18} />
          <div className="reviews-score-count">{aggregate?.count ?? 0} 条评价</div>
        </div>
        <div className="reviews-dims">
          {dimensionLabels.map((label, i) => {
            const val = aggregate ? [aggregate.avg_score_1, aggregate.avg_score_2, aggregate.avg_score_3][i] : 5;
            return (
              <div key={i} className="reviews-dim-row">
                <span className="reviews-dim-label">{label}</span>
                <StarRating value={val} size={14} />
                <span className="reviews-dim-num">{val.toFixed(1)}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="reviews-tabs">
        <button className={`reviews-tab ${tab === 'received' ? 'active' : ''}`} onClick={() => setTab('received')}>
          收到的评价 ({received.length})
        </button>
        <button className={`reviews-tab ${tab === 'given' ? 'active' : ''}`} onClick={() => setTab('given')}>
          我发出的 ({given.length})
        </button>
      </div>

      <div className="reviews-content">
        {loading ? (
          <p className="reviews-loading">加载中...</p>
        ) : tab === 'received' ? (
          <ReviewList reviews={received} perspective="reviewer" empty="还没有收到评价" />
        ) : (
          <ReviewList reviews={given} perspective="reviewee" empty="还没有发出评价" />
        )}
      </div>
    </div>
  );
}
