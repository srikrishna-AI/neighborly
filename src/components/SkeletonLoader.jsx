export const CardSkeleton = () => {
  return (
    <div className="listing-card skeleton">
      <div className="skeleton-line skeleton-badge-row">
        <div className="skeleton-bar w-16 h-5 rounded-full"></div>
        <div className="skeleton-bar w-20 h-5 rounded-full"></div>
      </div>
      <div className="skeleton-bar w-3/4 h-6 mt-4"></div>
      <div className="skeleton-bar w-full h-4 mt-3"></div>
      <div className="skeleton-bar w-5/6 h-4 mt-2"></div>
      <div className="card-footer mt-auto pt-4 border-t border-glass">
        <div className="owner-info">
          <div className="skeleton-circle w-7 h-7"></div>
          <div className="skeleton-bar w-16 h-4"></div>
        </div>
        <div className="skeleton-bar w-20 h-8 rounded-sm"></div>
      </div>
    </div>
  );
};

export const DetailSkeleton = () => {
  return (
    <div className="detail-layout skeleton">
      <div className="detail-info-column">
        <div className="skeleton-line gap-2">
          <div className="skeleton-bar w-16 h-5 rounded-full"></div>
          <div className="skeleton-bar w-20 h-5 rounded-full"></div>
        </div>
        <div className="skeleton-bar w-2/3 h-10 mt-4"></div>
        <div className="detail-owner-row mt-4">
          <div className="skeleton-circle w-9 h-9"></div>
          <div className="flex flex-col gap-1 w-24">
            <div className="skeleton-bar w-12 h-3"></div>
            <div className="skeleton-bar w-20 h-4"></div>
          </div>
        </div>
        <div className="border-t border-glass mt-6 pt-6">
          <div className="skeleton-bar w-28 h-6 mb-4"></div>
          <div className="skeleton-bar w-full h-4"></div>
          <div className="skeleton-bar w-full h-4 mt-2"></div>
          <div className="skeleton-bar w-4/5 h-4 mt-2"></div>
        </div>
      </div>
      <div className="detail-sidebar-column">
        <div className="sidebar-card">
          <div className="skeleton-bar w-28 h-6 mb-4"></div>
          <div className="skeleton-bar w-16 h-5 rounded-full mb-6"></div>
          <div className="flex flex-col gap-4">
            <div>
              <div className="skeleton-bar w-16 h-3 mb-2"></div>
              <div className="skeleton-bar w-full h-10"></div>
            </div>
            <div>
              <div className="skeleton-bar w-16 h-3 mb-2"></div>
              <div className="skeleton-bar w-full h-10"></div>
            </div>
          </div>
          <div className="skeleton-bar w-full h-10 mt-6"></div>
        </div>
      </div>
    </div>
  );
};

export const ListSkeleton = () => {
  return (
    <div className="flex flex-col gap-4 w-full skeleton">
      {[1, 2, 3].map((i) => (
        <div key={i} className="request-card flex justify-between items-center p-6 bg-surface border border-glass rounded-md">
          <div className="flex flex-col gap-3 w-2/3">
            <div className="flex justify-between items-center w-full">
              <div className="skeleton-bar w-1/3 h-6"></div>
              <div className="skeleton-bar w-16 h-5 rounded-full"></div>
            </div>
            <div className="skeleton-bar w-1/2 h-4"></div>
            <div className="skeleton-bar w-1/4 h-3"></div>
          </div>
          <div className="skeleton-bar w-28 h-9 rounded-sm"></div>
        </div>
      ))}
    </div>
  );
};
