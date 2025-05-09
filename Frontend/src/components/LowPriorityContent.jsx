import React, { Suspense, lazy, memo } from 'react';

const PostContentNonCritical = React.lazy(() => import('./PostContentNonCritical'));

const css = `
  .placeholder { 
    width: 100%; 
    max-width: 280px; 
    height: 157.5px; 
    background: #e0e0e0; 
    display: flex; 
    align-items: center; 
    justify-content: center; 
    color: #666; 
    border-radius: 0.375rem; 
    font-size: 0.875rem; 
  }
  @media (min-width: 769px) {
    .placeholder { 
      max-width: 480px; 
      height: 270px; 
    }
  }
  @media (max-width: 480px) {
    .placeholder { 
      max-width: 240px; 
      height: 135px; 
    }
  }
  @media (max-width: 320px) {
    .placeholder { 
      max-width: 200px; 
      height: 112.5px; 
    }
  }
`;

const LowPriorityContent = memo(
  ({
    post,
    relatedPosts,
    completedPosts,
    dispatch,
    isSidebarOpen,
    setSidebarOpen,
    activeSection,
    setActiveSection,
    subtitlesListRef,
  }) => {
    return (
      <>
        <style>{css}</style>
        <Suspense fallback={<div className="placeholder" style={{ height: '500px' }}>Loading additional content...</div>}>
          <PostContentNonCritical
            post={post}
            relatedPosts={relatedPosts}
            completedPosts={completedPosts}
            dispatch={dispatch}
            isSidebarOpen={isSidebarOpen}
            setSidebarOpen={setSidebarOpen}
            activeSection={activeSection}
            setActiveSection={setActiveSection}
            subtitlesListRef={subtitlesListRef}
          />
        </Suspense>
      </>
    );
  }
);

export default LowPriorityContent;
