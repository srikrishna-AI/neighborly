import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const ListingCard = ({ listing, onFavoriteToggle }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [isFavorited, setIsFavorited] = useState(listing.is_favorited || false);
  const [togglingFav, setTogglingFav] = useState(false);

  const handleFavoriteClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      showToast('Please log in to bookmark listings', 'info');
      return;
    }

    setTogglingFav(true);
    try {
      if (isFavorited) {
        await api.delete(`/favorites/${listing.id}`);
        setIsFavorited(false);
        showToast('Removed from favorites', 'info');
      } else {
        await api.post(`/favorites/${listing.id}`);
        setIsFavorited(true);
        showToast('Saved to favorites!', 'success');
      }
      if (onFavoriteToggle) onFavoriteToggle(listing.id, !isFavorited);
    } catch (err) {
      showToast('Failed to update favorite status', 'error');
    } finally {
      setTogglingFav(false);
    }
  };

  const availQty = listing.available_quantity !== undefined ? listing.available_quantity : listing.quantity || 1;
  const isAvailable = listing.availability && availQty > 0;

  return (
    <div className="listing-card group">
      {/* Card Image Banner */}
      <div className="card-image-wrapper relative">
        {listing.image_url ? (
          <img
            src={listing.image_url}
            alt={listing.title}
            className="card-image"
          />
        ) : (
          <div className="card-image-placeholder">
            <span>{listing.type === 'item' ? '🔧' : '💡'}</span>
          </div>
        )}

        {/* Favorite Heart Button */}
        <button
          className={`favorite-heart-btn ${isFavorited ? 'active' : ''}`}
          onClick={handleFavoriteClick}
          disabled={togglingFav}
          title={isFavorited ? 'Remove from Favorites' : 'Save to Favorites'}
        >
          {isFavorited ? '❤️' : '🤍'}
        </button>

        {/* Type & Category Badges */}
        <div className="card-image-badges">
          {listing.category?.name && (
            <span className="badge badge-category">{listing.category.name}</span>
          )}
          <span className={`badge ${listing.type === 'item' ? 'badge-item' : 'badge-skill'}`}>
            {listing.type === 'item' ? 'Item' : 'Skill'}
          </span>
        </div>
      </div>

      <div className="card-content-body">
        {/* Title */}
        <h3 className="card-title">{listing.title}</h3>

        {/* Description Snippet */}
        <p className="card-description line-clamp-2">{listing.description}</p>

        {/* Info Tags Row (Location, Condition, Price, Quantity) */}
        <div className="card-meta-tags">
          {listing.location && (
            <span className="tag-pill">📍 {listing.location}</span>
          )}
          {listing.type === 'item' && listing.condition && (
            <span className="tag-pill">✨ {listing.condition}</span>
          )}
          <span className="tag-pill tag-price">
            {listing.price_per_day > 0 ? `$${listing.price_per_day}/day` : '🎁 Free'}
          </span>
        </div>

        {/* Availability & Quantity Indicator */}
        <div className="card-availability-row mt-3">
          {listing.type === 'item' ? (
            isAvailable ? (
              <span className="status-badge status-available">
                ✓ {availQty} of {listing.quantity || 1} Available
              </span>
            ) : (
              <span className="status-badge status-unavailable">
                ✕ Currently Booked
              </span>
            )
          ) : isAvailable ? (
            <span className="status-badge status-available">✓ Open for Sessions</span>
          ) : (
            <span className="status-badge status-unavailable">✕ Unavailable</span>
          )}
        </div>
      </div>

      {/* Footer / CTA */}
      <div className="card-footer">
        <Link to={`/users/${listing.owner?.id}`} className="owner-info">
          <div className="owner-avatar">
            {listing.owner?.name ? listing.owner.name[0].toUpperCase() : 'U'}
          </div>
          <span className="owner-name">{listing.owner?.name}</span>
        </Link>

        <Link to={`/listings/${listing.id}`} className="btn-primary-small">
          View Details
        </Link>
      </div>
    </div>
  );
};

export default ListingCard;
