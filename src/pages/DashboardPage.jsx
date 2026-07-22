import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import ListingCard from '../components/ListingCard';

const DashboardPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('listings'); // 'listings' or 'favorites'
  const [myListings, setMyListings] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const [allListingsRes, favRes, sentRes, receivedRes] = await Promise.all([
        api.get('/listings'),
        api.get('/favorites'),
        api.get('/requests/mine?role=requester'),
        api.get('/requests/mine?role=owner'),
      ]);

      const ownListings = allListingsRes.data.filter((item) => item.owner_id === user.id);
      setMyListings(ownListings);
      setFavorites(favRes.data);
      setSentRequests(sentRes.data);
      setReceivedRequests(receivedRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user.id]);

  const handleDeleteListing = async (listingId) => {
    if (!window.confirm('Are you sure you want to delete this listing?')) return;
    try {
      await api.delete(`/listings/${listingId}`);
      await fetchDashboardData();
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to delete listing');
    }
  };

  if (loading) {
    return (
      <div className="flex-center min-h-[400px]">
        <div className="spinner"></div>
      </div>
    );
  }

  // Analytics Stats
  const completedBorrows = sentRequests.filter(r => r.status === 'returned').length;
  const completedLends = receivedRequests.filter(r => r.status === 'returned').length;
  const estimatedSavings = (completedBorrows + completedLends) * 25; // Estimated $25 saved per shared tool

  return (
    <div className="dashboard-container">
      {/* Dashboard Top Header */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Welcome back, {user.name}!</h1>
          <p className="dashboard-subtitle">Manage your shared items, saved bookmarks, and active borrow requests</p>
        </div>
        <Link to="/listings/new" className="btn-primary">
          + Add Listing
        </Link>
      </div>

      {/* Analytics Summary Row */}
      <div className="stats-grid">
        <div className="stat-card">
          <h4>Shared Listings</h4>
          <span className="stat-number">{myListings.length}</span>
          <span className="stat-sub">Active items or skills</span>
        </div>
        <div className="stat-card">
          <h4>Completed Sharing</h4>
          <span className="stat-number">{completedLends + completedBorrows}</span>
          <span className="stat-sub">{completedLends} lent · {completedBorrows} borrowed</span>
        </div>
        <div className="stat-card">
          <h4>Bookmarked Items</h4>
          <span className="stat-number">{favorites.length}</span>
          <span className="stat-sub">Saved to favorites</span>
        </div>
        <div className="stat-card">
          <h4>Est. Community Savings</h4>
          <span className="stat-number text-emerald-400">${estimatedSavings}</span>
          <span className="stat-sub">Saved vs buying new</span>
        </div>
      </div>

      {/* Section Tabs: My Listings vs Saved Favorites */}
      <div className="tabs-row mt-4">
        <button
          className={`tab-btn ${activeTab === 'listings' ? 'active' : ''}`}
          onClick={() => setActiveTab('listings')}
        >
          My Listings ({myListings.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'favorites' ? 'active' : ''}`}
          onClick={() => setActiveTab('favorites')}
        >
          ❤️ Saved Favorites ({favorites.length})
        </button>
      </div>

      {/* Content Grid */}
      <div className="dashboard-content-grid">
        <div className="listings-column">
          {activeTab === 'listings' ? (
            myListings.length > 0 ? (
              <div className="listings-list-vertical">
                {myListings.map((item) => (
                  <div key={item.id} className="dashboard-listing-item">
                    <div className="listing-brief flex items-center gap-4">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.title} className="w-14 h-14 object-cover rounded-md border border-glass" />
                      ) : (
                        <span className="text-2xl">{item.type === 'item' ? '🔧' : '💡'}</span>
                      )}
                      <div>
                        <h4>{item.title}</h4>
                        <div className="flex gap-2 items-center text-xs text-muted mt-1">
                          <span className="badge badge-category py-0.5">{item.category?.name}</span>
                          <span>{item.type === 'item' ? `${item.quantity || 1} units` : 'Skill'}</span>
                          <span>· {item.price_per_day > 0 ? `$${item.price_per_day}/day` : 'Free'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="listing-controls">
                      <Link to={`/listings/${item.id}`} className="link-action text-xs">
                        View
                      </Link>
                      <Link to={`/listings/${item.id}/edit`} className="link-action text-xs">
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDeleteListing(item.id)}
                        className="text-xs text-red-400 hover:text-red-300 font-semibold cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-items-card">
                <p>You haven't added any listings yet.</p>
                <Link to="/listings/new" className="btn-primary-small mt-4">
                  Share Your First Item
                </Link>
              </div>
            )
          ) : (
            favorites.length > 0 ? (
              <div className="listings-grid">
                {favorites.map((favListing) => (
                  <ListingCard
                    key={favListing.id}
                    listing={favListing}
                    onFavoriteToggle={() => fetchDashboardData()}
                  />
                ))}
              </div>
            ) : (
              <div className="no-items-card">
                <p>You haven't bookmarked any listings yet.</p>
                <Link to="/listings" className="btn-primary-small mt-4">
                  Browse Catalog
                </Link>
              </div>
            )
          )}
        </div>

        {/* Right Sidebar: Quick Actions */}
        <div className="activity-column">
          <h3 className="section-subtitle-heading mb-4">Quick Navigation</h3>
          <div className="quick-links-card">
            <Link to="/requests" className="quick-action-link">
              <span className="quick-action-icon">📋</span>
              <div>
                <h5>Borrow Requests Portal</h5>
                <p>{sentRequests.length} sent · {receivedRequests.length} received</p>
              </div>
            </Link>

            <Link to="/listings" className="quick-action-link">
              <span className="quick-action-icon">🔍</span>
              <div>
                <h5>Browse Community Catalog</h5>
                <p>Find tools and skills near you</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
