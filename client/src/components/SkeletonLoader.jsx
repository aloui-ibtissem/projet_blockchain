import React from 'react';
import './styles.css';

function SkeletonLoader() {
  return (
    <div className="skeleton-loader">
      {Array(3).fill().map((_, index) => (
        <div key={index} className="skeleton-card"></div>
      ))}
    </div>
  );
}

export default SkeletonLoader