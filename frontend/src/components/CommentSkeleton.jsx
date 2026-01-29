import React from 'react';

const CommentSkeleton = () => {
  return (
    <div className="flex space-x-3 mb-6 animate-pulse">
      {/* Avatar Skeleton */}
      <div className="w-10 h-10 bg-gray-300 rounded-full flex-shrink-0"></div>
      
      <div className="flex-1 space-y-2 py-1">
        {/* Username & Date Skeleton */}
        <div className="flex items-center space-x-2">
          <div className="h-4 bg-gray-300 rounded w-1/4"></div>
          <div className="h-3 bg-gray-200 rounded w-1/6"></div>
        </div>
        
        {/* Comment Text Skeleton (2 lines) */}
        <div className="h-3 bg-gray-200 rounded w-full"></div>
        <div className="h-3 bg-gray-200 rounded w-5/6"></div>
      </div>
    </div>
  );
};

export default CommentSkeleton;