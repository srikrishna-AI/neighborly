import { useState } from 'react';
import api from '../api/axios';

const ReviewForm = ({ requestId, onSubmitSuccess }) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!comment.trim()) {
      setError('Please add a comment for your review');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/reviews', {
        request_id: requestId,
        rating,
        comment,
      });
      if (onSubmitSuccess) onSubmitSuccess();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="review-form-card">
      <h4 className="review-form-title">Rate and Review</h4>
      <p className="review-form-subtitle mb-4">Share your lending or learning experience with the community</p>

      {error && (
        <div className="error-banner mb-4">
          <span>⚠️ {error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Rating</label>
          <div className="star-rating-row">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className={`star-btn ${star <= rating ? 'active' : ''}`}
                onClick={() => setRating(star)}
                disabled={submitting}
              >
                ★
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="comment">Comment</label>
          <textarea
            className="form-textarea min-h-[80px]"
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="How did the borrow/session go? Was the tool in good shape?"
            disabled={submitting}
          />
        </div>

        <button
          type="submit"
          className="btn-primary-small w-full"
          disabled={submitting}
        >
          {submitting ? 'Submitting Review...' : 'Submit Review'}
        </button>
      </form>
    </div>
  );
};

export default ReviewForm;
