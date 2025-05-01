import { useRef, useEffect, Suspense } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import styled from 'styled-components';

// Styled Components
const ZoomContainer = styled.div`
  width: 100%;
  display: block;
  margin: 0.5rem 0;
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  margin-top: 0.25rem;
`;

const ZoomButton = styled.button`
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  background: #0069d9;
  color: #ffffff;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
`;


const Caption = styled.figcaption`
  font-size: 0.75rem;
  color: #666;
  text-align: center;
  margin-top: 0.25rem;
`;

const Placeholder = styled.div`
  width: 100%;
  min-height: 270px;
  aspect-ratio: 16 / 9;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  border-radius: 0.375rem;
  font-size: 0.875rem;
`;

const ZoomWrapper = ({ children, caption, ...props }) => {
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
          {...props}
        >
          {({ zoomIn, zoomOut, resetTransform }) => (
            <>
              <TransformComponent>
                {children}
              </TransformComponent>
              <ButtonContainer>
                <ZoomButton onClick={() => zoomIn()} aria-label="Zoom in">+</ZoomButton>
                <ZoomButton onClick={() => zoomOut()} aria-label="Zoom out">-</ZoomButton>
                <ZoomButton onClick={() => resetTransform()} aria-label="Reset zoom">Reset</ZoomButton>
              </ButtonContainer>
            </>
          )}
        </TransformWrapper>
        {caption && <Caption>{caption}</Caption>}
      </Suspense>
    </ZoomContainer>
  );
};

export default ZoomWrapper;
