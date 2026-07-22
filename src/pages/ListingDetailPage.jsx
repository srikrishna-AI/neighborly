import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { DetailSkeleton } from '../components/SkeletonLoader';

const ListingDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [listing, setListing] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFavorited, setIsFavorited] = useState(false);

  // Booking Form State
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [requestedQuantity, setRequestedQuantity] = useState(1);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState(null);
  const [bookingSubmitting, setBookingSubmitting] = useState(false);

  useEffect(() => {
    const fetchListingAndReviews = async () => {
      try {
        const [listingRes, reviewsRes] = await Promise.all([
          api.get(`/listings/${id}`),
          api.get(`/listings/${id}/reviews`),
        ]);
        setListing(listingRes.data);
        setReviews(reviewsRes.data);
        setIsFavorited(listingRes.data.is_favorited || false);
      } catch (error) {
        console.error('Error fetching listing details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchListingAndReviews();
  }, [id]);

  const handleFavoriteToggle = async () => {
    if (!user) {
      showToast('Please log in to bookmark listings', 'info');
      return;
    }
    try {
      if (isFavorited) {
        await api.delete(`/favorites/${id}`);
        setIsFavorited(false);
        showToast('Removed from favorites', 'info');
      } else {
        await api.post(`/favorites/${id}`);
        setIsFavorited(true);
        showToast('Saved to favorites!', 'success');
      }
    } catch (err) {
      showToast('Failed to update favorite status', 'error');
    }
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setBookingError(null);
    setBookingSuccess(false);

    if (!user) {
      navigate('/login', { state: { from: { pathname: `/listings/${id}` } } });
      return;
    }

    if (!startDate || !endDate) {
      setBookingError('Please select both start and end dates');
      showToast('Please select both start and end dates', 'error');
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    if (startDate < today) {
      setBookingError('Start date cannot be in the past');
      showToast('Start date cannot be in the past', 'error');
      return;
    }

    if (startDate > endDate) {
      setBookingError('Start date must be before or equal to end date');
      showToast('Start date must be before or equal to end date', 'error');
      return;
    }

    setBookingSubmitting(true);
    try {
      await api.post('/requests', {
        listing_id: parseInt(id),
        start_date: startDate,
        end_date: endDate,
        quantity: requestedQuantity,
      });
      setBookingSuccess(true);
      showToast('Booking request submitted successfully!', 'success');
      setStartDate('');
      setEndDate('');
      setRequestedQuantity(1);
      
      // Refresh listing data to update quantity
      const listingRes = await api.get(`/listings/${id}`);
      setListing(listingRes.data);
    } catch (error) {
      const errMsg = error.response?.data?.detail || 'Booking request failed';
      setBookingError(errMsg);
      showToast(errMsg, 'error');
    } finally {
      setBookingSubmitting(false);
    }
  };

  if (loading) {
    return <DetailSkeleton />;
  }

  if (!listing) {
    return (
      <div className="no-listings-card">
        <p>Listing not found.</p>
        <Link to="/listings" className="btn-primary mt-4">Back to Catalog</Link>
      </div>
    );
  }

  const isOwner = user && user.id === listing.owner_id;
  const availQty = listing.available_quantity !== undefined ? listing.available_quantity : listing.quantity || 1;
  const isAvailable = listing.availability && availQty > 0;

  return (
    <div className="detail-container">
      <div className="detail-layout">
        {/* Main Information Column */}
        <div className="detail-info-column">
          {/* Cover Photo */}
          {listing.image_url && (
            <div className="detail-image-box mb-6">
              <img src={listing.image_url} alt={listing.title} className="detail-cover-img" />
            </div>
          )}

          <div className="detail-header">
            <div className="detail-badges flex justify-between items-center">
              <div className="flex gap-2">
                <span className="badge badge-category">{listing.category?.name}</span>
                <span className={`badge ${listing.type === 'item' ? 'badge-item' : 'badge-skill'}`}>
                  {listing.type === 'item' ? 'Item' : 'Skill'}
                </span>
                {listing.condition && <span className="badge">{listing.condition}</span>}
              </div>
              <button
                className={`favorite-heart-btn-large ${isFavorited ? 'active' : ''}`}
                onClick={handleFavoriteToggle}
              >
                {isFavorited ? '❤️ Saved' : '🤍 Bookmark'}
              </button>
            </div>

            <h1 className="detail-title">{listing.title}</h1>

            <div className="detail-meta-row flex flex-wrap gap-4 items-center text-sm text-secondary">
              {listing.location && <span>📍 Location: <strong>{listing.location}</strong></span>}
              <span>💰 Pricing: <strong>{listing.price_per_day > 0 ? `$${listing.price_per_day}/day` : 'Free Sharing'}</strong></span>
              {listing.type === 'item' && (
                <span>📦 Total Quantity: <strong>{listing.quantity || 1} units</strong></span>
              )}
            </div>

            <div className="detail-owner-row">
              <div className="owner-avatar-large">
                {listing.owner?.name ? listing.owner.name[0].toUpperCase() : 'U'}
              </div>
              <div>
                <span className="owner-label">Shared by</span>
                <Link to={`/users/${listing.owner?.id}`} className="owner-name-link block">
                  {listing.owner?.name}
                </Link>
              </div>
            </div>
          </div>

          <div className="detail-body">
            <h3>Description</h3>
            <p className="detail-description">{listing.description}</p>
          </div>

          {/* Community Reviews Section */}
          <div className="detail-reviews-section">
            <h3>Community Reviews ({reviews.length})</h3>
            {reviews.length > 0 ? (
              <div className="reviews-list">
                {reviews.map((rev) => (
                  <div key={rev.id} className="review-item">
                    <div className="review-header">
                      <span className="review-reviewer">{rev.reviewer?.name}</span>
                      <span className="review-rating">{'★'.repeat(rev.rating)}</span>
                    </div>
                    <p className="review-comment">{rev.comment}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted text-sm">No reviews yet for this listing.</p>
            )}
          </div>
        </div>

        {/* Sidebar Request Column */}
        <div className="detail-sidebar-column">
          <div className="sidebar-card">
            <h3>Borrowing Availability</h3>
            <div className="my-4">
              {listing.type === 'item' ? (
                isAvailable ? (
                  <span className="status-pill status-avail">
                    ✓ {availQty} of {listing.quantity || 1} Available Now
                  </span>
                ) : (
                  <span className="status-pill status-unavail">
                    ✕ Currently Fully Booked
                  </span>
                )
              ) : isAvailable ? (
                <span className="status-pill status-avail">✓ Available for Booking</span>
              ) : (
                <span className="status-pill status-unavail">✕ Currently Unavailable</span>
              )}
            </div>

            {isOwner ? (
              <div className="owner-actions-card">
                <p className="text-sm text-secondary mb-4">You own this listing.</p>
                <Link to={`/listings/${id}/edit`} className="btn-primary w-full text-center">
                  Edit Listing Details
                </Link>
              </div>
            ) : (
              <form onSubmit={handleBookingSubmit} className="booking-form">
                {bookingSuccess && (
                  <div className="success-banner mb-4">
                    ✅ Request submitted! Wait for owner approval in <strong>My Requests</strong>.
                  </div>
                )}

                {bookingError && (
                  <div className="error-banner mb-4">
                    <span>⚠️ {bookingError}</span>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label" htmlFor="startDate">Start Date</label>
                  <input
                    type="date"
                    className="form-input"
                    id="startDate"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    disabled={bookingSubmitting || !isAvailable}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="endDate">End Date</label>
                  <input
                    type="date"
                    className="form-input"
                    id="endDate"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    disabled={bookingSubmitting || !isAvailable}
                  />
                </div>

                {/* Quantity selector for item-level lending (only if listing has multiple units available) */}
                {listing.type === 'item' && availQty > 1 && (
                  <div className="form-group">
                    <label className="form-label" htmlFor="requestedQuantity">Quantity to Borrow</label>
                    <select
                      className="form-select"
                      id="requestedQuantity"
                      value={requestedQuantity}
                      onChange={(e) => setRequestedQuantity(parseInt(e.target.value))}
                      disabled={bookingSubmitting || !isAvailable}
                    >
                      {Array.from({ length: availQty }, (_, i) => i + 1).map((val) => (
                        <option key={val} value={val}>
                          {val} {val === 1 ? 'unit' : 'units'}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <button
                  type="submit"
                  className="btn-primary w-full"
                  disabled={bookingSubmitting || !isAvailable}
                >
                  {!isAvailable
                    ? 'Currently Unavailable'
                    : bookingSubmitting
                    ? 'Submitting...'
                    : 'Request to Borrow'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListingDetailPage;
