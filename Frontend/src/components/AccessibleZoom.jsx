import { useRef, useEffect, Suspense } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';

const ZoomWrapper = ({ children, caption, ...props }) => {
  const wrapperRef = useRef(null);

  // Add event listener for Escape key to reset zoom
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        wrapperRef.current?.instance?.resetTransform();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div
      ref={wrapperRef}
      role="figure"
      aria-label={caption || 'Zoomable image'}
      style={{
        width: '100%',
        display: 'block',
        margin: '0.5rem 0',
      }}
    >
      <Suspense fallback={<div style={{ height: '200px', background: '#f0f0f0' }}>Loading image...</div>}>
        <TransformWrapper
          initialScale={1}
          minScale={1}
          maxScale={3}
          wheel={{ disabled: true }} // Disable zoom on scroll
          pinch={{ step: 5 }}
          doubleClick={{ step: 0.5 }}
          {...props}
        >
          {({ zoomIn, zoomOut, resetTransform }) => (
            <>
              <TransformComponent>
                {children}
              </TransformComponent>
              <div
                style={{
                  display: 'flex',
                  gap: '0.5rem',
                  justifyContent: 'center',
                  marginTop: '0.25rem',
                }}
              >
                <button
                  onClick={() => zoomIn()}
                  aria-label="Zoom in"
                  style={{
                    padding: '0.25rem 0.5rem',
                    fontSize: '0.75rem',
                    background: '#007bff',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '0.25rem',
                    cursor: 'pointer',
                  }}
                >
                  +
                </button>
                <button
                  onClick={() => zoomOut()}
                  aria-label="Zoom out"
                  style={{
                    padding: '0.25rem 0.5rem',
                    fontSize: '0.75rem',
                    background: '#007bff',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '0.25rem',
                    cursor: 'pointer',
                  }}
                >
                  -
                </button>
                <button
                  onClick={() => resetTransform()}
                  aria-label="Reset zoom"
                  style={{
                    padding: '0.25rem 0.5rem',
                    fontSize: '0.75rem',
                    background: '#007bff',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '0.25rem',
                    cursor: 'pointer',
                  }}
                >
                  Reset
                </button>
              </div>
            </>
          )}
        </TransformWrapper>
        {caption && (
          <figcaption
            style={{
              fontSize: '0.75rem',
              color: '#666',
              textAlign: 'center',
              marginTop: '0.25rem',
            }}
          >
            {caption}
          </figcaption>
        )}
      </Suspense>
    </div>
  );
};

export default ZoomWrapper;
