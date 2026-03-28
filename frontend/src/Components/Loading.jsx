import React from 'react';

const Loading = React.memo(() => {
  return (
    <div className="flex justify-center items-center h-screen bg-gray-50 dark:bg-gray-900">
      <div
        role="status"
        aria-label="Loading"
        className="w-12 h-12 border-4 border-gray-200 dark:border-gray-700 border-t-blue-500 rounded-full animate-spin"
      >
        <span className="sr-only">Loading...</span>
      </div>
    </div>
  );
});

Loading.displayName = 'Loading';

export default Loading;
