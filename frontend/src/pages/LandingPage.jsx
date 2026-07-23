import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import ListingCard from '../components/ListingCard';

const LandingPage = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecentListings = async () => {
      try {
        const response = await api.get('/listings');
        // Get the latest 3 listings
        setListings(response.data.slice(-3).reverse());
      } catch (error) {
        console.error('Error fetching recent listings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentListings();
  }, []);

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <header className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            Share items, teach skills, <br />
            <span className="text-gradient">build a better neighborhood.</span>
          </h1>
          <p className="hero-subtitle">
            Neighborly is a community platform where you can lend tools, share equipment, and teach skills to your neighbors.
          </p>
          <div className="hero-cta-group">
            <Link to="/listings" className="btn-primary">Explore Listings</Link>
            <Link to="/login" className="btn-secondary">List your item or skill</Link>
          </div>
        </div>
      </header>

      {/* How it Works Section */}
      <section className="how-it-works">
        <h2 className="section-title">How Neighborly Works</h2>
        <div className="steps-container">
          <div className="step-card">
            <div className="step-number">1</div>
            <h3>List items or skills</h3>
            <p>Post tools you don't use daily or skills you'd love to share with others in your area.</p>
          </div>
          <div className="step-card">
            <div className="step-number">2</div>
            <h3>Book and borrow</h3>
            <p>Browse local listings, request a date range, and coordinate with the owner.</p>
          </div>
          <div className="step-card">
            <div className="step-number">3</div>
            <h3>Review and repeat</h3>
            <p>Return the item, complete the exchange, leave a review, and strengthen community bonds.</p>
          </div>
        </div>
      </section>

      {/* Featured Listings Section */}
      <section className="featured-listings">
        <div className="section-header-row">
          <h2 className="section-title-left">Featured Listings</h2>
          <Link to="/listings" className="link-view-all">View All Listings &rarr;</Link>
        </div>

        {loading ? (
          <div className="flex-center min-h-[200px]">
            <div className="spinner"></div>
          </div>
        ) : listings.length > 0 ? (
          <div className="listings-grid">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <div className="no-listings-card">
            <p>No listings available yet. Be the first to share something with your neighbors!</p>
            <Link to="/dashboard" className="btn-primary-small mt-4">Add a Listing</Link>
          </div>
        )}
      </section>
    </div>
  );
};

export default LandingPage;
