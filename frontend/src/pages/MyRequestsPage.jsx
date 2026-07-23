import { useState, useEffect } from 'react';
import api from '../api/axios';
import ReviewForm from '../components/ReviewForm';
import { useToast } from '../context/ToastContext';
import { ListSkeleton } from '../components/SkeletonLoader';

const MyRequestsPage = () => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('sent'); // 'sent' or 'received'
  const [requestsSent, setRequestsSent] = useState([]);
  const [requestsReceived, setRequestsReceived] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState(null);
  
  // Track which request is currently being reviewed
  const [reviewRequestId, setReviewRequestId] = useState(null);

  const fetchRequests = async () => {
    try {
      const [sentRes, receivedRes] = await Promise.all([
        api.get('/requests/mine?role=requester'),
        api.get('/requests/mine?role=owner'),
      ]);
      setRequestsSent(sentRes.data);
      setRequestsReceived(receivedRes.data);
    } catch (error) {
      console.error('Error fetching requests:', error);
    }
  };

  useEffect(() => {
    const initLoad = async () => {
      setLoading(true);
      await fetchRequests();
      setLoading(false);
    };
    initLoad();
  }, []);

  const handleStatusChange = async (id, status) => {
    setActionError(null);
    try {
      await api.patch(`/requests/${id}/status`, { status });
      showToast(`Request updated to ${status}!`, 'success');
      await fetchRequests();
    } catch (err) {
      const errMsg = err.response?.data?.detail || 'Failed to update request status';
      setActionError(errMsg);
      showToast(errMsg, 'error');
    }
  };

  const handleReviewSuccess = async () => {
    setReviewRequestId(null);
    showToast('Review submitted successfully!', 'success');
    await fetchRequests();
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending': return 'badge-status-pending';
      case 'approved': return 'badge-status-approved';
      case 'active': return 'badge-status-active';
      case 'returned': return 'badge-status-returned';
      case 'cancelled': return 'badge-status-cancelled';
      default: return '';
    }
  };

  if (loading) {
    return <ListSkeleton />;
  }

  return (
    <div className="requests-container">
      <div className="requests-header">
        <h1 className="requests-title">Borrow Requests</h1>
        <p className="requests-subtitle">Approve bookings on your items or track requests you have made</p>
      </div>

      {actionError && (
        <div className="error-banner mb-6">
          <span>⚠️ {actionError}</span>
        </div>
      )}

      {/* Tabs Toggle */}
      <div className="tabs-row">
        <button
          className={`tab-btn ${activeTab === 'sent' ? 'active' : ''}`}
          onClick={() => { setActiveTab('sent'); setReviewRequestId(null); }}
        >
          Sent Requests ({requestsSent.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'received' ? 'active' : ''}`}
          onClick={() => { setActiveTab('received'); setReviewRequestId(null); }}
        >
          Received Requests ({requestsReceived.length})
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === 'sent' ? (
        <div className="tab-panel">
          {requestsSent.length > 0 ? (
            <div className="requests-list">
              {requestsSent.map((req) => (
                <div key={req.id} className="request-card">
                  <div className="request-card-info">
                    <div className="request-card-title-row">
                      <h4>{req.listing?.title}</h4>
                      <span className={`badge-status ${getStatusBadgeClass(req.status)}`}>
                        {req.status}
                      </span>
                    </div>
                    <p className="request-card-dates">
                      📅 {req.start_date} to {req.end_date}
                    </p>
                    {req.listing?.type === 'item' && req.quantity > 0 && (
                      <p className="request-card-qty text-sm text-indigo-400 font-semibold mt-1">
                        Requested Quantity: {req.quantity} {req.quantity === 1 ? 'unit' : 'units'}
                      </p>
                    )}
                    <p className="request-card-meta">
                      Shared by {req.listing?.owner?.name}
                    </p>
                  </div>
                  
                  <div className="request-card-actions">
                    {/* Cancellation Action */}
                    {(req.status === 'pending' || req.status === 'approved') && (
                      <button
                        className="btn-action-cancel"
                        onClick={() => handleStatusChange(req.id, 'cancelled')}
                      >
                        Cancel Request
                      </button>
                    )}

                    {/* Review Action */}
                    {req.status === 'returned' && (
                      <button
                        className="btn-action-review"
                        onClick={() => setReviewRequestId(reviewRequestId === req.id ? null : req.id)}
                      >
                        {reviewRequestId === req.id ? 'Close Review Form' : 'Write Review'}
                      </button>
                    )}
                  </div>

                  {/* Inline Review Form */}
                  {reviewRequestId === req.id && (
                    <div className="inline-review-container">
                      <ReviewForm requestId={req.id} onSubmitSuccess={handleReviewSuccess} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="no-items-card">
              <p>You haven't made any borrow requests yet.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="tab-panel">
          {requestsReceived.length > 0 ? (
            <div className="requests-list">
              {requestsReceived.map((req) => (
                <div key={req.id} className="request-card">
                  <div className="request-card-info">
                    <div className="request-card-title-row">
                      <h4>{req.listing?.title}</h4>
                      <span className={`badge-status ${getStatusBadgeClass(req.status)}`}>
                        {req.status}
                      </span>
                    </div>
                    <p className="request-card-dates">
                      📅 {req.start_date} to {req.end_date}
                    </p>
                    {req.listing?.type === 'item' && req.quantity > 0 && (
                      <p className="request-card-qty text-sm text-indigo-400 font-semibold mt-1">
                        Lending Quantity: {req.quantity} {req.quantity === 1 ? 'unit' : 'units'}
                      </p>
                    )}
                    <p className="request-card-meta">
                      Requested by {req.requester?.name} ({req.requester?.email})
                    </p>
                  </div>

                  <div className="request-card-actions">
                    {req.status === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          className="btn-action-approve"
                          onClick={() => handleStatusChange(req.id, 'approved')}
                        >
                          Approve
                        </button>
                        <button
                          className="btn-action-reject"
                          onClick={() => handleStatusChange(req.id, 'cancelled')}
                        >
                          Reject
                        </button>
                      </div>
                    )}

                    {req.status === 'approved' && (
                      <div className="flex gap-2">
                        <button
                          className="btn-action-active"
                          onClick={() => handleStatusChange(req.id, 'active')}
                        >
                          Mark Active (Lent)
                        </button>
                        <button
                          className="btn-action-reject"
                          onClick={() => handleStatusChange(req.id, 'cancelled')}
                        >
                          Cancel Booking
                        </button>
                      </div>
                    )}

                    {req.status === 'active' && (
                      <button
                        className="btn-action-return"
                        onClick={() => handleStatusChange(req.id, 'returned')}
                      >
                        Mark Returned
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-items-card">
              <p>You haven't received any borrow requests yet.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MyRequestsPage;
