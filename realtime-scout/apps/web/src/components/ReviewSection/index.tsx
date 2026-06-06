import { useEffect, useState } from 'react';
import { reviewApi } from '../../services';
import StarRating from '../StarRating';
import ReviewList from '../ReviewList';
import type { Review, ReviewAggregate } from '@realtime-scout/shared';
import './ReviewSection.css';

interface ReviewSectionProps {
  taskId: number;
  isPublisher: boolean;
  counterpartyId: number;
  counterpartyName: string;
  onReviewed?: () => void;
}

const dimensionLabels = {
  publisher: ['拍摄质量', '服务态度', '完成时效'],
  acceptor: ['描述相符', '沟通态度', '付款时效'],
};

export default function ReviewSection({
  taskId,
  isPublisher,
  counterpartyId,
  counterpartyName,
  onReviewed,
}: ReviewSectionProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [myReviewerId, setMyReviewerId] = useState<number | null>(null);
  const [scores, setScores] = useState([5, 5, 5]);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<Review[]>([]);
  const [aggregate, setAggregate] = useState<ReviewAggregate | null>(null);

  const myRole = isPublisher ? 'publisher' : 'acceptor';
  const labels = dimensionLabels[myRole];

  useEffect(() => { loadReviews(); loadCounterparty(); }, [taskId]);

  const loadReviews = async () => {
    try {
      const res: any = await reviewApi.getTaskReviews(taskId);
      setReviews(res.data || []);
    } catch (err) { console.error(err); }
  };

  const loadCounterparty = async () => {
    try {
      const res: any = await reviewApi.getUserReviews(counterpartyId);
      setAggregate(res.data.aggregate);
      setHistory(res.data.reviews || []);
    } catch (err) { console.error(err); }
  };

  const setScore = (index: number, value: number) => {
    setScores((prev) => prev.map((s, i) => (i === index ? value : s)));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await reviewApi.createReview(taskId, {
        score_1: scores[0],
        score_2: scores[1],
        score_3: scores[2],
        comment: comment.trim() || undefined,
      });
      setComment('');
      await loadReviews();
      await loadCounterparty();
      onReviewed?.();
    } catch (err: any) {
      alert(err.message || '评价失败');
    } finally {
      setSubmitting(false);
    }
  };

  const myReview = reviews.find((r) => r.reviewer_role === myRole);
  const receivedReview = reviews.find((r) => r.reviewer_role !== myRole);

  return (
    <div className="review-section">
      <div className="review-counterparty">
        <span>{counterpartyName} 的综合评分</span>
        {aggregate && (
          <span className="review-counterparty-score">
            <StarRating value={aggregate.rating} size={16} />
            <b>{aggregate.rating.toFixed(2)}</b>
            <span className="review-count">({aggregate.count} 条评价)</span>
            <button className="review-history-btn" onClick={() => setShowHistory(true)}>查看历史</button>
          </span>
        )}
      </div>

      {!myReview ? (
        <div className="review-form">
          <h4>评价{isPublisher ? '接单者' : '发布者'}</h4>
          {labels.map((label, i) => (
            <div key={i} className="review-form-row">
              <span className="review-form-label">{label}</span>
              <StarRating value={scores[i]} onChange={(v) => setScore(i, v)} size={24} />
            </div>
          ))}
          <textarea
            className="review-form-comment"
            placeholder="写下你的评价（选填）"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={300}
          />
          <button className="review-submit-btn" onClick={handleSubmit} disabled={submitting}>
            {submitting ? '提交中...' : '提交评价'}
          </button>
        </div>
      ) : (
        <div className="review-mine">
          <h4>我的评价</h4>
          <ReviewList reviews={[myReview]} perspective="reviewee" />
        </div>
      )}

      {receivedReview && (
        <div className="review-received">
          <h4>对方对我的评价</h4>
          <ReviewList reviews={[receivedReview]} perspective="reviewer" />
        </div>
      )}

      {showHistory && (
        <div className="review-modal-overlay" onClick={() => setShowHistory(false)}>
          <div className="review-modal" onClick={(e) => e.stopPropagation()}>
            <div className="review-modal-head">
              <h3>{counterpartyName} 的历史评价</h3>
              <button className="review-modal-close" onClick={() => setShowHistory(false)}>✕</button>
            </div>
            <ReviewList reviews={history} perspective="reviewer" empty="对方暂无历史评价" />
          </div>
        </div>
      )}
    </div>
  );
}
