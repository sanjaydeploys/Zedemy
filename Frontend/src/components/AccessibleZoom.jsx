import { useRef, useEffect, Suspense, lazy } from 'react';
import styled from 'styled-components';
import LazyLoad from 'react-lazyload';

const Zoom = lazy(() => import('react-medium-image-zoom'));

const ZoomWrapper = styled.div`
  display: inline-block;
  margin: 5px 0;
  padding: 6px; 
  min-height: 20px;
  width: 100%;
  max-width: 600px;

  img {
    width: 100%;
    max-width: 600px;
    display: block;
    touch-action: pinch-zoom; 
  }

  @media (max-width: 768px) {
    padding: 6px;
    margin: 10px 0;
  }

  @media (max-width: 480px) {
    padding: 4px;
    margin: 8px 0;
  }
`;

const Caption = styled.figcaption`
  font-size: 0.875rem;
  color: #333;
  margin-top: 8px;
  text-align: center;
`;

const AccessibleZoom = ({ children, caption, ...props }) => {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;

    const removeAriaOwns = () => {
      const wrappers = ref.current.querySelectorAll('[data-rmiz]');
      wrappers.forEach((wrapper) => {
        if (wrapper.hasAttribute('aria-owns')) {
          wrapper.removeAttribute('aria-owns');
        }
      });
    };

    removeAriaOwns();

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'aria-owns') {
          removeAriaOwns();
        }
      });
    });

    const wrapper = ref.current.querySelector('[data-rmiz]');
    if (wrapper) {
      observer.observe(wrapper, { attributes: true, subtree: true });
    }

    return () => observer.disconnect();
  }, []);

  return (
    <LazyLoad
      height={200} 
      offset={100} 
      once 
      placeholder={<div style={{ height: '200px', background: '#f0f0f0' }}>Loading image...</div>}
    >
      <ZoomWrapper ref={ref} role="figure" aria-label={caption || 'Zoomable image'}>
        <Suspense fallback={<div>Loading zoom...</div>}>
          <Zoom {...props}>{children}</Zoom>
          {caption && <Caption>{caption}</Caption>}
        </Suspense>
      </ZoomWrapper>
    </LazyLoad>
  );
};

export default AccessibleZoom;
