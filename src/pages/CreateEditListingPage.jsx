import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const CreateEditListingPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const isEditMode = !!id;

  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'item', // 'item' or 'skill'
    category_id: '',
    availability: true,
    quantity: 1,
    image_url: '',
    location: '',
    price_per_day: 0,
    condition: 'Good',
  });

  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [unauthorized, setUnauthorized] = useState(false);

  useEffect(() => {
    const loadCategoriesAndListing = async () => {
      try {
        const catRes = await api.get('/categories');
        setCategories(catRes.data);
        
        if (catRes.data.length > 0 && !formData.category_id) {
          setFormData(prev => ({ ...prev, category_id: catRes.data[0].id }));
        }

        if (isEditMode) {
          const listingRes = await api.get(`/listings/${id}`);
          const listing = listingRes.data;
          
          if (listing.owner_id !== user.id) {
            setUnauthorized(true);
          } else {
            setFormData({
              title: listing.title,
              description: listing.description,
              type: listing.type,
              category_id: listing.category_id,
              availability: listing.availability,
              quantity: listing.quantity || 1,
              image_url: listing.image_url || '',
              location: listing.location || '',
              price_per_day: listing.price_per_day || 0,
              condition: listing.condition || 'Good',
            });
          }
        }
      } catch (error) {
        console.error('Error loading form data:', error);
        setServerError('Failed to retrieve listing or categories');
      } finally {
        setLoading(false);
      }
    };

    loadCategoriesAndListing();
  }, [id, isEditMode, user.id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const data = new FormData();
    data.append('file', file);

    setUploadingImage(true);
    try {
      const res = await api.post('/upload', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setFormData(prev => ({ ...prev, image_url: res.data.image_url }));
      showToast('Image uploaded successfully!', 'success');
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to upload image', 'error');
    } finally {
      setUploadingImage(false);
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    if (!formData.category_id) {
      newErrors.category_id = 'Category is required';
    }
    if (formData.type === 'item' && formData.quantity < 1) {
      newErrors.quantity = 'Quantity must be at least 1';
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError(null);

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        category_id: parseInt(formData.category_id),
        availability: formData.availability,
        quantity: formData.type === 'item' ? parseInt(formData.quantity) : 1,
        image_url: formData.image_url || null,
        location: formData.location || null,
        price_per_day: parseFloat(formData.price_per_day) || 0.0,
        condition: formData.condition || 'Good',
      };

      if (isEditMode) {
        await api.put(`/listings/${id}`, payload);
        showToast('Listing updated successfully!', 'success');
        navigate(`/listings/${id}`);
      } else {
        const createRes = await api.post('/listings', payload);
        showToast('Listing created successfully!', 'success');
        navigate(`/listings/${createRes.data.id}`);
      }
    } catch (error) {
      const errMsg = error.response?.data?.detail || 'Failed to submit listing';
      setServerError(errMsg);
      showToast(errMsg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-center min-h-[400px]">
        <div className="spinner"></div>
      </div>
    );
  }

  if (unauthorized) {
    return (
      <div className="no-listings-card">
        <h3>Unauthorized Access</h3>
        <p className="text-muted text-sm mt-2">You do not own this listing and cannot edit it.</p>
        <button onClick={() => navigate('/dashboard')} className="btn-primary mt-4">
          Go to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="auth-container max-w-[650px] my-10">
      <div className="auth-header">
        <h2 className="auth-title">{isEditMode ? 'Edit Listing' : 'Share Item or Skill'}</h2>
        <p className="auth-subtitle">
          {isEditMode ? 'Update your item or skill details' : 'Lend tools, equipment, or teach skills to your neighbors'}
        </p>
      </div>

      {serverError && (
        <div className="error-banner">
          <span>⚠️ {serverError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="title">Title / Name</label>
          <input
            type="text"
            className="form-input"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="e.g. Lawnmower, DeWalt Cordless Drill, Guitar Lessons"
            disabled={submitting}
          />
          {errors.title && <p className="error-message">{errors.title}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="form-group">
            <label className="form-label" htmlFor="type">Type</label>
            <select
              className="form-select"
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              disabled={submitting}
            >
              <option value="item">🔧 Item (lending)</option>
              <option value="skill">💡 Skill (teaching)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="category_id">Category</label>
            <select
              className="form-select"
              id="category_id"
              name="category_id"
              value={formData.category_id}
              onChange={handleChange}
              disabled={submitting}
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quantity (Items only) */}
        {formData.type === 'item' && (
          <div className="grid grid-cols-3 gap-4">
            <div className="form-group">
              <label className="form-label" htmlFor="quantity">Total Units Available</label>
              <input
                type="number"
                min="1"
                className="form-input"
                id="quantity"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                disabled={submitting}
              />
              {errors.quantity && <p className="error-message">{errors.quantity}</p>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="price_per_day">Price / Day ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="form-input"
                id="price_per_day"
                name="price_per_day"
                value={formData.price_per_day}
                onChange={handleChange}
                placeholder="0 for free sharing"
                disabled={submitting}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="condition">Condition</label>
              <select
                className="form-select"
                id="condition"
                name="condition"
                value={formData.condition}
                onChange={handleChange}
                disabled={submitting}
              >
                <option value="Like New">✨ Like New</option>
                <option value="Good">👍 Good</option>
                <option value="Fair">⚙️ Fair</option>
              </select>
            </div>
          </div>
        )}

        <div className="form-group">
          <label className="form-label" htmlFor="location">Neighborhood / Location</label>
          <input
            type="text"
            className="form-input"
            id="location"
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder="e.g. Downtown, Westside, Sector 4"
            disabled={submitting}
          />
        </div>

        {/* Photo Upload or URL */}
        <div className="form-group">
          <label className="form-label">Photo Image</label>
          <div className="flex gap-3 items-center mb-2">
            <input
              type="text"
              className="form-input flex-grow"
              id="image_url"
              name="image_url"
              value={formData.image_url}
              onChange={handleChange}
              placeholder="Paste Image URL (e.g. https://...)"
              disabled={submitting || uploadingImage}
            />
            <label className="btn-secondary text-sm cursor-pointer whitespace-nowrap py-2.5 px-4">
              {uploadingImage ? 'Uploading...' : '📷 Upload Photo'}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
                disabled={submitting || uploadingImage}
              />
            </label>
          </div>
          {formData.image_url && (
            <div className="image-preview-box mt-2">
              <img src={formData.image_url} alt="Preview" className="w-full h-32 object-cover rounded-md border border-glass" />
            </div>
          )}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="description">Description</label>
          <textarea
            className="form-textarea"
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Describe what you are lending/teaching, rules of use, pickup instructions, etc."
            disabled={submitting}
          />
          {errors.description && <p className="error-message">{errors.description}</p>}
        </div>

        <div className="form-group flex items-center gap-3">
          <input
            type="checkbox"
            id="availability"
            name="availability"
            checked={formData.availability}
            onChange={handleChange}
            className="w-4 h-4 accent-indigo-500 cursor-pointer"
            disabled={submitting}
          />
          <label className="form-label mb-0 cursor-pointer select-none" htmlFor="availability">
            Mark as Available for Requests
          </label>
        </div>

        <div className="flex gap-4 mt-6">
          <button
            type="button"
            className="btn-secondary flex-1"
            onClick={() => navigate(-1)}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary flex-1"
            disabled={submitting || uploadingImage}
          >
            {submitting ? 'Saving...' : isEditMode ? 'Update Listing' : 'Publish Listing'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateEditListingPage;
