import { useState, useEffect } from 'react';
import api from '../api/axios';
import ListingCard from '../components/ListingCard';
import { CardSkeleton } from '../components/SkeletonLoader';

const BrowseListingsPage = () => {
  const [listings, setListings] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [conditionFilter, setConditionFilter] = useState('');
  const [maxPriceFilter, setMaxPriceFilter] = useState('');
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [loading, setLoading] = useState(true);

  const activeFilterCount =
    (locationQuery ? 1 : 0) + (conditionFilter ? 1 : 0) + (maxPriceFilter !== '' ? 1 : 0);

  const fetchListings = async (
    catId = selectedCategory,
    search = searchQuery,
    loc = locationQuery,
    cond = conditionFilter,
    maxP = maxPriceFilter
  ) => {
    setLoading(true);
    try {
      const params = {};
      if (catId) params.category_id = catId;
      if (search.trim()) params.search = search.trim();
      if (loc.trim()) params.location = loc.trim();
      if (cond) params.condition = cond;
      if (maxP !== '') params.max_price = parseFloat(maxP);

      const response = await api.get('/listings', { params });
      setListings(response.data);
    } catch (error) {
      console.error('Error fetching listings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initFetch = async () => {
      try {
        const catRes = await api.get('/categories');
        setCategories(catRes.data);
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
      await fetchListings(null, '', '', '', '');
    };
    initFetch();
  }, []);

  const handleCategorySelect = (catId) => {
    const newCat = selectedCategory === catId ? null : catId;
    setSelectedCategory(newCat);
    fetchListings(newCat, searchQuery, locationQuery, conditionFilter, maxPriceFilter);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchListings(selectedCategory, searchQuery, locationQuery, conditionFilter, maxPriceFilter);
  };

  const handleClearFilters = () => {
    setSelectedCategory(null);
    setSearchQuery('');
    setLocationQuery('');
    setConditionFilter('');
    setMaxPriceFilter('');
    fetchListings(null, '', '', '', '');
  };

  return (
    <div className="browse-container">
      <div className="browse-header">
        <h1 className="browse-title">Community Catalog</h1>
        <p className="browse-subtitle">Browse items to borrow and skills to learn from your neighbors</p>
      </div>

      {/* Main Search & Filter Card */}
      <div className="filter-section">
        <form onSubmit={handleSearchSubmit} className="search-form-container flex flex-col gap-4">
          {/* Top Search Bar Row: Search Input + Filters Toggle + Search Button */}
          <div className="search-bar-row">
            <div className="relative flex-grow">
              <input
                type="text"
                className="form-input search-input-field"
                placeholder="Search title, description, drill, mower..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <button
              type="button"
              className={`filter-toggle-btn ${showFilterDrawer || activeFilterCount > 0 ? 'active' : ''}`}
              onClick={() => setShowFilterDrawer(!showFilterDrawer)}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
              </svg>
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="filter-count-badge">{activeFilterCount}</span>
              )}
            </button>

            <button type="submit" className="btn-primary-small search-submit-btn">
              Search
            </button>
          </div>

          {/* Category Navigation Pills */}
          <div className="categories-pill-row pt-1">
            <button
              type="button"
              onClick={() => handleCategorySelect(null)}
              className={`pill-btn ${selectedCategory === null ? 'active' : ''}`}
            >
              All Categories
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => handleCategorySelect(category.id)}
                className={`pill-btn ${selectedCategory === category.id ? 'active' : ''}`}
              >
                {category.name}
              </button>
            ))}
          </div>

          {/* Expandable Advanced Filter Drawer */}
          {showFilterDrawer && (
            <div className="filter-drawer-panel border-t border-glass pt-4 mt-2">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="form-group mb-0">
                  <label className="form-label text-xs">📍 Location</label>
                  <input
                    type="text"
                    className="form-input text-sm"
                    placeholder="e.g. Downtown, Sector 4..."
                    value={locationQuery}
                    onChange={(e) => setLocationQuery(e.target.value)}
                  />
                </div>

                <div className="form-group mb-0">
                  <label className="form-label text-xs">✨ Item Condition</label>
                  <select
                    className="form-select text-sm"
                    value={conditionFilter}
                    onChange={(e) => setConditionFilter(e.target.value)}
                  >
                    <option value="">Any Condition</option>
                    <option value="Like New">Like New</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                  </select>
                </div>

                <div className="form-group mb-0">
                  <label className="form-label text-xs">💰 Max Daily Price ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    className="form-input text-sm"
                    placeholder="Max $ per day"
                    value={maxPriceFilter}
                    onChange={(e) => setMaxPriceFilter(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-4 pt-3 border-t border-glass">
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="btn-secondary-small text-xs"
                >
                  Reset Filters
                </button>
                <button
                  type="submit"
                  className="btn-primary-small text-xs"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Grid Content */}
      {loading ? (
        <div className="listings-grid">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : listings.length > 0 ? (
        <div className="listings-grid">
          {listings.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              onFavoriteToggle={() => fetchListings()}
            />
          ))}
        </div>
      ) : (
        <div className="no-listings-card">
          <p>No listings match your search or filters.</p>
          <button onClick={handleClearFilters} className="btn-secondary mt-4">
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
};

export default BrowseListingsPage;
