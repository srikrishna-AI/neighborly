import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import ListingCard from '../components/ListingCard';

const ProfilePage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get(`/users/${id}`);
        setProfile(response.data);
      } catch (err) {
        console.error('Error fetching user profile:', err);
        setError('User profile not found.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [id]);

  if (loading) {
    return (
      <div className="flex-center min-h-[400px]">
        <div className="spinner"></div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="no-listings-card">
        <h3>User Not Found</h3>
        <p className="text-muted text-sm mt-2">{error}</p>
        <Link to="/listings" className="btn-primary mt-4">Back to Catalog</Link>
      </div>
    );
  }

  const isOwnProfile = user && user.id === parseInt(id);

  return (
    <div className="profile-container">
      {/* Profile Header Card */}
      <div className="profile-header-card">
        <div className="profile-avatar-large">
          {profile.name[0].toUpperCase()}
        </div>
        
        <div className="profile-header-details">
          <div className="profile-identity">
            <h1 className="profile-name">{profile.name}</h1>
            <span className="badge badge-category">
              {isOwnProfile ? 'Neighbor (You)' : 'Neighbor'}
            </span>
          </div>

          <div className="profile-meta-rows">
            {isOwnProfile && (
              <p className="profile-meta-text">
                📧 <strong>Email:</strong> {user.email} (Private to you)
              </p>
            )}
            <p className="profile-meta-text">
              ⭐ <strong>Average Rating:</strong>{' '}
              {profile.average_rating !== null
                ? `${profile.average_rating.toFixed(1)} / 5.0`
                : 'No reviews yet'}
            </p>
            <p className="profile-meta-text">
              🔧 <strong>Shared Listings:</strong> {profile.active_listings?.length || 0} items or skills
            </p>
          </div>
        </div>
      </div>

      {/* User's Listings Grid */}
      <div className="profile-listings-section">
        <h2 className="section-subtitle-heading mb-6">
          {isOwnProfile ? 'My Shareable Items & Skills' : `${profile.name}'s Listings`}
        </h2>

        {profile.active_listings && profile.active_listings.length > 0 ? (
          <div className="listings-grid">
            {profile.active_listings.map((listing) => (
              /* Map ProfileListingSchema back into the format ListingCard expects by adding owner info */
              <ListingCard
                key={listing.id}
                listing={{
                  ...listing,
                  owner: { id: profile.id, name: profile.name, email: '' }
                }}
              />
            ))}
          </div>
        ) : (
          <div className="no-listings-card">
            <p>No active listings shared by this neighbor yet.</p>
            {isOwnProfile && (
              <Link to="/listings/new" className="btn-primary-small mt-4">
                Add a Listing
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
