import { useRef, useEffect, Suspense } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import styled from 'styled-components';

const ZoomContainer = styled.div`
  width: 100%;
  max-width: 280px;
  margin: 0.5rem 0;
  min-height: 209.5px;
  contain-intrinsic-size: 280px 209.5px;
  box-sizing: border-box;
  contain: layout;
  @media (min-width: 769px) {
    max-width: 480px;
    min-height: 322px;
    contain-intrinsic-size: 480px 322px;
  }
  @media (max-width: 480px) {
    max-width: 240px;
    min-height: 187px;
    contain-intrinsic-size: 240px 187px;
  }
  @media (max-width: 320px) {
    max-width: 200px;
    min-height: 164.5px;
    contain-intrinsic-size: 200px 164.5px;
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  margin-top: 0.25rem;
  min-height: 36px;
  contain-intrinsic-size: 100% 36px;
  box-sizing: border-box;
  contain: layout;
`;

const ZoomButton = styled.button`
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  background: #0069d9;
  color: #ffffff;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
  min-height: 24px;
  contain-intrinsic-size: 60px 24px;
  box-sizing: border-box;
  contain: layout;
`;

const Caption = styled.figcaption`
  font-size: 0.75rem;
  color: #666;
  text-align: center;
  margin-top: 0.25rem;
  min-height: 16px;
  contain-intrinsic-size: 100% 16px;
  box-sizing: border-box;
  contain: layout;
`;

const Placeholder = styled.div`
  width: 100%;
  max-width: 280px;
  min-height: 157.5px;
  aspect-ratio: 16 / 9;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  contain-intrinsic-size: 280px 157.5px;
  box-sizing: border-box;
  contain: layout;
  @media (min-width: 769px) {
    max-width: 480px;
    min-height: 270px;
    contain-intrinsic-size: 480px 270px;
  }
  @media (max-width: 480px) {
    max-width: 240px;
    min-height: 135px;
    contain-intrinsic-size: 240px 135px;
  }
  @media (max-width: 320px) {
    max-width: 200px;
    min-height: 112.5px;
    contain-intrinsic-size: 200px 112.5px;
  }
`;

const TransformContent = styled.div`
  width: 100%;
  max-width: 280px;
  min-height: 157.5px;
  contain-intrinsic-size: 280px 157.5px;
  box-sizing: border-box;
  contain: layout;
  @media (min-width: 769px) {
    max-width: 480px;
    min-height: 270px;
    contain-intrinsic-size: 480px 270px;
  }
  @media (max-width: 480px) {
    max-width: 240px;
    min-height: 135px;
    contain-intrinsic-size: 240px 135px;
  }
  @media (max-width: 320px) {
    max-width: 200px;
    min-height: 112.5px;
    contain-intrinsic-size: 200px 112.5px;
  }
`;

const AccessibleZoom = ({ children, caption, ...props }) => {
  const wrapperRef = useRef(null);

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
    <ZoomContainer role="figure" aria-label={caption || 'Zoomable image'}>
      <Suspense fallback={<Placeholder>Loading image...</Placeholder>}>
        <TransformWrapper
          initialScale={1}
          minScale={1}
          maxScale={3}
          wheel={{ disabled: true }}
          pinch={{ step: 5 }}
          doubleClick={{ step: 0.5 }}
          ref={wrapperRef}
          {...props}
        >
          {({ zoomIn, zoomOut, resetTransform }) => (
            <>
              <TransformContent>
                <TransformComponent>{children}</TransformComponent>
              </TransformContent>
              <ButtonContainer>
                <ZoomButton onClick={() => zoomIn()} aria-label="Zoom in">
                  +
                </ZoomButton>
                <ZoomButton onClick={() => zoomOut()} aria-label="Zoom out">
                  -
                </ZoomButton>
                <ZoomButton
                  onClick={() => resetTransform()}
                  aria-label="Reset zoom"
                >
                  Reset
                </ZoomButton>
              </ButtonContainer>
            </>
          )}
        </TransformWrapper>
        {caption && <Caption>{caption}</Caption>}
      </Suspense>
    </ZoomContainer>
  );
};

export default AccessibleZoom;
