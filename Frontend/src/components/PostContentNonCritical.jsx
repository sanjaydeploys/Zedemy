import React, { memo, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { slugify, parseLinks } from './utils';
import { markPostAsCompleted } from '../actions/postActions';
import styled from 'styled-components';

const RelatedPosts = React.lazy(() => import('./RelatedPosts'));
const AccessibleZoom = React.lazy(() => import('./AccessibleZoom'));
const ComparisonTable = React.lazy(() => import('./ComparisonTable'));
const CodeHighlighter = React.lazy(() => import('./CodeHighlighter'));

const SubtitleHeader = styled.h2`
  font-size: clamp(1.25rem, 3vw, 1.5rem);
  color: #011020;
  margin: 1.5rem 0 0.75rem;
  font-weight: 700;
  border-left: 4px solid #34db58;
  padding-left: 0.5rem;
  width: 100%;
  min-height: 32px;
  contain-intrinsic-size: 100% 32px;
  box-sizing: border-box;
  contain: layout;
`;

const CompleteButton = styled.button`
  position: fixed;
  bottom: 2rem;
  right: 1rem;
  padding: 0.5rem 1rem;
  background: ${({ isCompleted }) => (isCompleted ? '#27ae60' : '#2c3e50')};
  color: #ecf0f1;
  border: none;
  border-radius: 0.375rem;
  cursor: ${({ isCompleted }) => (isCompleted ? 'not-allowed' : 'pointer')};
  font-size: 0.875rem;
  font-weight: 500;
  min-width: 48px;
  min-height: 36px;
  contain-intrinsic-size: 48px 36px;
  z-index: 2000;
  &:disabled {
    background: #95a5a6;
    cursor: not-allowed;
  }
  @media (min-width: 769px) {
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    min-width: 64px;
    min-height: 44px;
    contain-intrinsic-size: 64px 44px;
  }
  @media (max-width: 480px) {
    padding: 0.5rem 0.75rem;
    font-size: 0.75rem;
    min-width: 44px;
    min-height: 32px;
    contain-intrinsic-size: 44px 32px;
    bottom: 1.5rem;
  }
`;

const ImageContainer = styled.figure`
  width: 100%;
  max-width: 280px;
  margin: 1.5rem 0 2rem;
  padding: 0.5rem;
  aspect-ratio: 16 / 9;
  min-height: 157.5px;
  contain-intrinsic-size: 280px 157.5px;
  box-sizing: border-box;
  contain: layout;
  position: relative;
  @media (min-width: 769px) {
    max-width: 480px;
    min-height: 270px;
    contain-intrinsic-size: 480px 270px;
    padding: 1rem;
  }
  @media (max-width: 480px) {
    max-width: 400px;
    min-height: 225px;
    contain-intrinsic-size: 400px 225px;
  }
  @media (max-width: 320px) {
    max-width: 280px;
    min-height: 157.5px;
    contain-intrinsic-size: 280px 157.5px;
  }
`;

const PostImage = styled.img`
  width: 100%;
  max-width: 280px;
  height: auto;
  aspect-ratio: 16 / 9;
  object-fit: contain;
  border-radius: 0.375rem;
  box-sizing: border-box;
  contain: layout;
  @media (min-width: 769px) {
    max-width: 480px;
  }
  @media (max-width: 480px) {
    max-width: 400px;
  }
  @media (max-width: 320px) {
    max-width: 280px;
  }
`;

const VideoContainer = styled.figure`
  width: 100%;
  max-width: 280px;
  margin: 1.5rem 0 2rem;
  padding: 0.5rem;
  aspect-ratio: 16 / 9;
  min-height: 157.5px;
  contain-intrinsic-size: 280px 157.5px;
  box-sizing: border-box;
  contain: layout;
  position: relative;
  @media (min-width: 769px) {
    max-width: 480px;
    min-height: 270px;
    contain-intrinsic-size: 480px 270px;
    padding: 1rem;
  }
  @media (max-width: 480px) {
    max-width: 400px;
    min-height: 225px;
    contain-intrinsic-size: 400px 225px;
  }
  @media (max-width: 320px) {
    max-width: 280px;
    min-height: 157.5px;
    contain-intrinsic-size: 280px 157.5px;
  }
`;

const PostVideo = styled.video`
  width: 100%;
  max-width: 280px;
  height: auto;
  aspect-ratio: 16 / 9;
  border-radius: 0.375rem;
  box-sizing: border-box;
  contain: layout;
  @media (min-width: 769px) {
    max-width: 480px;
  }
  @media (max-width: 480px) {
    max-width: 400px;
  }
  @media (max-width: 320px) {
    max-width: 280px;
  }
`;

const Placeholder = styled.div`
  width: 100%;
  max-width: 280px;
  aspect-ratio: 16 / 9;
  min-height: 157.5px;
  background: #e0e0e0;
  border-radius: 0.375rem;
  contain-intrinsic-size: 280px 157.5px;
  box-sizing: border-box;
  contain: layout;
  margin: 1.5rem 0 2rem;
  padding: 0.5rem;
  ${({ minHeight }) => minHeight && `min-height: ${minHeight}; contain-intrinsic-size: 100% ${minHeight};`}
  @media (min-width: 769px) {
    max-width: 480px;
    min-height: 270px;
    contain-intrinsic-size: 480px 270px;
    padding: 1rem;
  }
  @media (max-width: 480px) {
    max-width: 400px;
    min-height: 225px;
    contain-intrinsic-size: 400px 225px;
  }
  @media (max-width: 320px) {
    max-width: 280px;
    min-height: 157.5px;
    contain-intrinsic-size: 280px 157.5px;
  }
`;

const ReferencesSection = styled.section`
  margin-top: 2rem;
  padding: 1.5rem;
  background: #f9f9f9;
  border: 1px solid #e0e0e0;
  border-radius: 0.375rem;
  width: 100%;
  min-height: 150px;
  contain-intrinsic-size: 100% 150px;
  box-sizing: border-box;
  contain: layout;
`;

const ReferenceLink = styled.a`
  display: block;
  color: #0645ad;
  text-decoration: none;
  margin: 0.25rem 0;
  padding: 0.25rem 0;
  font-size: 0.875rem;
  line-height: 1.5;
  min-height: 24px;
  contain-intrinsic-size: 100% 24px;
  box-sizing: border-box;
  contain: layout;
  &:hover {
    text-decoration: underline;
  }
  @media (max-width: 480px) {
    font-size: 0.75rem;
    min-height: 20px;
    contain-intrinsic-size: 100% 20px;
  }
`;

const NavigationLinks = styled.nav`
  margin: 2rem 0;
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
  font-size: 0.875rem;
  width: 100%;
  min-height: 44px;
  contain-intrinsic-size: 100% 44px;
  box-sizing: border-box;
  contain: layout;
  padding: 0.5rem 0;
  & a {
    display: inline-flex;
    align-items: center;
    padding: 0.75rem;
    min-height: 28px;
    contain-intrinsic-size: 80px 28px;
    text-decoration: none;
    color: #0645ad;
    &:hover {
      text-decoration: underline;
    }
  }
  @media (max-width: 480px) {
    font-size: 0.75rem;
    gap: 1rem;
    & a {
      padding: 0.5rem;
      min-height: 24px;
      contain-intrinsic-size: 60px 24px;
    }
  }
`;

const RelatedPostsSection = styled.section`
  width: 100%;
  padding: 1.5rem 0;
  margin-top: 2rem;
  min-height: 300px;
  contain-intrinsic-size: 100% 300px;
  box-sizing: border-box;
  contain: layout;
`;

const SkeletonRelatedPost = styled.div`
  width: 100%;
  max-width: 280px;
  margin: 0.5rem 0;
  min-height: 200px;
  contain-intrinsic-size: 280px 200px;
  box-sizing: border-box;
  contain: layout;
  @media (min-width: 769px) {
    max-width: 480px;
    min-height: 300px;
    contain-intrinsic-size: 480px 300px;
  }
  @media (max-width: 480px) {
    max-width: 400px;
    min-height: 250px;
    contain-intrinsic-size: 400px 250px;
  }
  @media (max-width: 320px) {
    max-width: 280px;
    min-height: 200px;
    contain-intrinsic-size: 280px 200px;
  }
`;

const SkeletonImage = styled.div`
  width: 100%;
  max-width: 280px;
  aspect-ratio: 16 / 9;
  min-height: 157.5px;
  background: #e0e0e0;
  border-radius: 0.375rem;
  contain-intrinsic-size: 280px 157.5px;
  box-sizing: border-box;
  contain: layout;
  margin: 0.5rem 0;
  @media (min-width: 769px) {
    max-width: 480px;
    min-height: 270px;
    contain-intrinsic-size: 480px 270px;
  }
  @media (max-width: 480px) {
    max-width: 400px;
    min-height: 225px;
    contain-intrinsic-size: 400px 225px;
  }
  @media (max-width: 320px) {
    max-width: 280px;
    min-height: 157.5px;
    contain-intrinsic-size: 280px 157.5px;
  }
`;

const SkeletonTitle = styled.div`
  width: 80%;
  min-height: 24px;
  background: #e0e0e0;
  border-radius: 0.25rem;
  contain-intrinsic-size: 80% 24px;
  box-sizing: border-box;
  contain: layout;
  margin: 0.5rem 0;
  @media (min-width: 769px) {
    min-height: 32px;
    contain-intrinsic-size: 80% 32px;
  }
`;

const SkeletonExcerpt = styled.div`
  width: 100%;
  min-height: 60px;
  background: #e0e0e0;
  border-radius: 0.25rem;
  contain-intrinsic-size: 100% 60px;
  box-sizing: border-box;
  contain: layout;
  margin: 0.5rem 0;
  @media (min-width: 769px) {
    min-height: 80px;
    contain-intrinsic-size: 100% 80px;
  }
`;

const SkeletonRelatedPostsContainer = styled.div`
  width: 100%;
  padding: 1.5rem 0;
  min-height: 300px;
  contain-intrinsic-size: 100% 300px;
  box-sizing: border-box;
  contain: layout;
`;

const SkeletonBulletPoint = styled.div`
  width: 100%;
  min-height: 30px;
  background: #e0e0e0;
  border-radius: 0.25rem;
  contain-intrinsic-size: 100% 30px;
  box-sizing: border-box;
  contain: layout;
  margin-bottom: 0.5rem;
`;

const SkeletonSubtitleSection = styled.div`
  width: 100%;
  min-height: 200px;
  contain-intrinsic-size: 100% 200px;
  box-sizing: border-box;
  contain: layout;
  @media (min-width: 769px) {
    min-height: 350px;
    contain-intrinsic-size: 100% 350px;
  }
`;

const SkeletonSummary = styled.div`
  width: 100%;
  min-height: 150px;
  contain-intrinsic-size: 100% 150px;
  box-sizing: border-box;
  contain: layout;
  & > div:first-child {
    width: 100%;
    min-height: 32px;
    background: #e0e0e0;
    border-radius: 0.25rem;
    contain-intrinsic-size: 100% 32px;
    margin-bottom: 0.75rem;
  }
  & > div:last-child {
    width: 100%;
    min-height: 90px;
    background: #e0e0e0;
    border-radius: 0.25rem;
    contain-intrinsic-size: 100% 90px;
  }
`;

const SkeletonNavigationLinks = styled.div`
  width: 100%;
  min-height: 44px;
  contain-intrinsic-size: 100% 44px;
  box-sizing: border-box;
  contain: layout;
  & > div {
    width: 80px;
    min-height: 28px;
    background: #e0e0e0;
    border-radius: 0.25rem;
    contain-intrinsic-size: 80px 28px;
    margin: 0.5rem 0;
  }
`;

const SkeletonReferences = styled.div`
  width: 100%;
  min-height: 150px;
  contain-intrinsic-size: 100% 150px;
  padding: 1.5rem;
  background: #f9f9f9;
  border: 1px solid #e0e0e0;
  border-radius: 0.375rem;
  box-sizing: border-box;
  contain: layout;
  & > div:first-child {
    width: 100%;
    min-height: 32px;
    background: #e0e0e0;
    border-radius: 0.25rem;
    contain-intrinsic-size: 100% 32px;
    margin-bottom: 0.75rem;
  }
  & > div:not(:first-child) {
    width: 100%;
    min-height: 24px;
    background: #e0e0e0;
    border-radius: 0.25rem;
    contain-intrinsic-size: 100% 24px;
    margin: 0.25rem 0;
  }
`;

const BulletContainer = styled.div`
  display: block;
  margin-bottom: 1rem;
  padding: 0.25rem 0;
  min-height: 38px;
  contain-intrinsic-size: 100% 38px;
  box-sizing: border-box;
  contain: layout;
`;

const SkeletonRelatedPosts = () => (
  <SkeletonRelatedPostsContainer aria-hidden="true">
    <SkeletonRelatedPost>
      <SkeletonImage />
      <SkeletonTitle />
      <SkeletonExcerpt />
    </SkeletonRelatedPost>
  </SkeletonRelatedPostsContainer>
);

const SubtitleSection = memo(({ subtitle, index, category }) => {
  if (!subtitle || !subtitle.title) return null;

  const parsedTitle = parseLinks(subtitle.title, category || '', false);
  const parsedBulletPoints = (subtitle.bulletPoints || []).map((point) => ({
    ...point,
    text: parseLinks(point.text || '', category || '', false),
  }));

  const subtitleHeight = 32 + 12 + // header + margin
    (subtitle.image || subtitle.video ? (window.innerWidth <= 768 ? 225 : 270) + 56 : 0) + // media + margin
    parsedBulletPoints.reduce((acc, point) => {
      let height = 38; // Base bullet height
      if (point.image || point.video) height += (window.innerWidth <= 768 ? 225 : 270) + 56; // Media
      if (point.codeSnippet) height += 100; // Code snippet
      if (point.text?.includes('<ul>') || point.text?.includes('<ol>')) height += 20; // Nested lists
      return acc + height;
    }, 0);

  const imageSrc = subtitle.image || 'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==';
  const posterSrc = subtitle.videoPoster || subtitle.image || 'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==';

  return (
    <>
      {(index === 0 && (subtitle.image || subtitle.video)) && (
        <link
          rel="preload"
          href={`${imageSrc}?w=${window.innerWidth <= 768 ? 400 : 480}&format=avif&q=5`}
          as="image"
          fetchpriority="high"
        />
      )}
      <section
        id={`subtitle-${index}`}
        aria-labelledby={`subtitle-${index}-heading`}
        style={{
          boxSizing: 'border-box',
          contain: 'layout',
          minHeight: `${subtitleHeight}px`,
          containIntrinsicSize: `100% ${subtitleHeight}px`,
        }}
      >
        <SubtitleHeader id={`subtitle-${index}-heading`}>{parsedTitle}</SubtitleHeader>
        {subtitle.image && (
          <ImageContainer>
            <AccessibleZoom>
              <PostImage
                src={`${imageSrc}?w=${window.innerWidth <= 768 ? 400 : 480}&format=avif&q=5`}
                srcSet={`
                  ${imageSrc}?w=280&format=avif&q=5 280w,
                  ${imageSrc}?w=320&format=avif&q=5 320w,
                  ${imageSrc}?w=360&format=avif&q=5 360w,
                  ${imageSrc}?w=400&format=avif&q=5 400w,
                  ${imageSrc}?w=480&format=avif&q=5 480w
                `}
                sizes="(max-width: 320px) 280px, (max-width: 480px) 400px, (max-width: 768px) 400px, 480px"
                alt={`Illustration for ${subtitle.title || 'section'}`}
                width={window.innerWidth <= 768 ? 400 : 480}
                height={window.innerWidth <= 768 ? 225 : 270}
                loading={index === 0 ? 'eager' : 'lazy'}
                decoding={index === 0 ? 'sync' : 'async'}
                fetchpriority={index === 0 ? 'high' : 'low'}
                onError={(e) => {
                  console.error('Subtitle Image Failed:', subtitle.image);
                  e.target.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==';
                }}
              />
            </AccessibleZoom>
          </ImageContainer>
        )}
        {subtitle.video && (
          <VideoContainer>
            <PostVideo
              controls
              preload="none"
              poster={`${posterSrc}?w=280&format=webp&q=5`}
              width={window.innerWidth <= 768 ? 400 : 480}
              height={window.innerWidth <= 768 ? 225 : 270}
              loading="lazy"
              decoding="async"
              aria-label={`Video for ${subtitle.title || 'section'}`}
              fetchpriority="low"
            >
              <source src={`${subtitle.video}#t=0.1`} type="video/mp4" />
            </PostVideo>
          </VideoContainer>
        )}
        <ul
          style={{
            paddingLeft: '1.25rem',
            fontSize: '1.1rem',
            lineHeight: '1.7',
            boxSizing: 'border-box',
            contain: 'layout',
            minHeight: `${parsedBulletPoints.reduce((acc, point) => {
              let height = 38;
              if (point.image || point.video) height += (window.innerWidth <= 768 ? 225 : 270) + 56;
              if (point.codeSnippet) height += 100;
              if (point.text?.includes('<ul>') || point.text?.includes('<ol>')) height += 20;
              return acc + height;
            }, 0)}px`,
            containIntrinsicSize: `100% ${parsedBulletPoints.reduce((acc, point) => {
              let height = 38;
              if (point.image || point.video) height += (window.innerWidth <= 768 ? 225 : 270) + 56;
              if (point.codeSnippet) height += 100;
              if (point.text?.includes('<ul>') || point.text?.includes('<ol>')) height += 20;
              return acc + height;
            }, 0)}px`,
          }}
        >
          {parsedBulletPoints.map((point, j) => {
            const pointImageSrc = point.image || 'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==';
            const pointPosterSrc = point.videoPoster || point.image || 'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==';
            return (
              <li
                key={j}
                style={{
                  marginBottom: point.image || point.video ? '1rem' : '0.5rem',
                  boxSizing: 'border-box',
                  contain: 'layout',
                  minHeight: `${
                    38 +
                    (point.image || point.video ? (window.innerWidth <= 768 ? 225 : 270) + 56 : 0) +
                    (point.codeSnippet ? 100 : 0) +
                    (point.text?.includes('<ul>') || point.text?.includes('<ol>') ? 20 : 0)
                  }px`,
                  containIntrinsicSize: `100% ${
                    38 +
                    (point.image || point.video ? (window.innerWidth <= 768 ? 225 : 270) + 56 : 0) +
                    (point.codeSnippet ? 100 : 0) +
                    (point.text?.includes('<ul>') || point.text?.includes('<ol>') ? 20 : 0)
                  }px`,
                }}
              >
                <BulletContainer dangerouslySetInnerHTML={{ __html: point.text }} />
                {point.image && (
                  <ImageContainer>
                    <Suspense fallback={<Placeholder />}>
                      <AccessibleZoom>
                        <PostImage
                          src={`${pointImageSrc}?w=${window.innerWidth <= 768 ? 400 : 480}&format=avif&q=5`}
                          srcSet={`
                            ${pointImageSrc}?w=280&format=avif&q=5 280w,
                            ${pointImageSrc}?w=320&format=avif&q=5 320w,
                            ${pointImageSrc}?w=360&format=avif&q=5 360w,
                            ${pointImageSrc}?w=400&format=avif&q=5 400w,
                            ${pointImageSrc}?w=480&format=avif&q=5 480w
                          `}
                          sizes="(max-width: 320px) 280px, (max-width: 480px) 400px, (max-width: 768px) 400px, 480px"
                          alt={`Illustration for bullet point ${j + 1}`}
                          width={window.innerWidth <= 768 ? 400 : 480}
                          height={window.innerWidth <= 768 ? 225 : 270}
                          loading="lazy"
                          decoding="async"
                          fetchpriority="low"
                          onError={(e) => {
                            console.error('Point Image Failed:', point.image);
                            e.target.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==';
                          }}
                        />
                      </AccessibleZoom>
                    </Suspense>
                  </ImageContainer>
                )}
                {point.video && (
                  <VideoContainer>
                    <PostVideo
                      controls
                      preload="none"
                      poster={`${pointPosterSrc}?w=280&format=webp&q=5`}
                      width={window.innerWidth <= 768 ? 400 : 480}
                      height={window.innerWidth <= 768 ? 225 : 270}
                      loading="lazy"
                      decoding="async"
                      aria-label={`Video for bullet point ${j + 1}`}
                      fetchpriority="low"
                    >
                      <source src={`${point.video}#t=0.1`} type="video/mp4" />
                    </PostVideo>
                  </VideoContainer>
                )}
                {point.codeSnippet && (
                  <Suspense fallback={<Placeholder minHeight="100px" />}>
                    <CodeHighlighter
                      code={point.codeSnippet}
                      language={point.language || 'javascript'}
                      onCopy={async () => {
                        try {
                          await navigator.clipboard.writeText(point.codeSnippet);
                          alert('Code copied!');
                        } catch {
                          alert('Failed to copy code');
                        }
                      }}
                    />
                  </Suspense>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </>
  );
});

const FirstSubtitleSkeleton = () => {
  const skeletonHeight = 32 + 12 + // header + margin
    (window.innerWidth <= 768 ? 225 + 56 : 270 + 56) + // media + margin
    3 * 38; // 3 bullets
  return (
    <SkeletonSubtitleSection aria-hidden="true" style={{ minHeight: `${skeletonHeight}px`, containIntrinsicSize: `100% ${skeletonHeight}px` }}>
      <div
        style={{
          width: '100%',
          minHeight: '32px',
          background: '#e0e0e0',
          borderRadius: '0.25rem',
          containIntrinsicSize: '100% 32px',
          marginBottom: '0.75rem',
          contain: 'layout',
        }}
      />
      <Placeholder />
      <ul
        style={{
          paddingLeft: '1.25rem',
          boxSizing: 'border-box',
          minHeight: '114px',
          containIntrinsicSize: '100% 114px',
          contain: 'layout',
        }}
      >
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonBulletPoint key={i} />
        ))}
      </ul>
    </SkeletonSubtitleSection>
  );
};

const LazySubtitleSection = memo(({ subtitle, index, category }) => (
  <Suspense fallback={<SkeletonSubtitleSection />}>
    <SubtitleSection subtitle={subtitle} index={index} category={category} />
  </Suspense>
));

const LazyRelatedPostsSection = memo(({ relatedPosts }) => (
  <Suspense fallback={<SkeletonRelatedPosts />}>
    <RelatedPostsSection aria-labelledby="related-posts-heading">
      <SubtitleHeader id="related-posts-heading">Related Posts</SubtitleHeader>
      <RelatedPosts relatedPosts={relatedPosts} />
    </RelatedPostsSection>
  </Suspense>
));

const LazyReferencesSection = memo(({ post }) => (
  <Suspense fallback={<SkeletonReferences><div /><div /><div /></SkeletonReferences>}>
    <ReferencesSection aria-labelledby="references-heading">
      <SubtitleHeader id="references-heading">Further Reading</SubtitleHeader>
      {post.references?.length > 0 ? (
        post.references.map((ref, i) => (
          <ReferenceLink
            key={i}
            href={ref.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Visit ${ref.title}`}
          >
            {ref.title}
          </ReferenceLink>
        ))
      ) : (
        <>
          <ReferenceLink
            href={`https://www.geeksforgeeks.org/${post.category?.toLowerCase().replace(/\s+/g, '-') || 'tutorials'}-tutorials`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`GeeksforGeeks ${post.category || 'Tutorials'} Tutorials`}
          >
            GeeksforGeeks: {post.category || 'Tutorials'} Tutorials
          </ReferenceLink>
          <ReferenceLink
            href={`https://developer.mozilla.org/en-US/docs/Web/${post.category?.replace(/\s+/g, '') || 'Guide'}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`MDN ${post.category || 'Documentation'} Documentation`}
          >
            MDN: {post.category || 'Documentation'} Documentation
          </ReferenceLink>
        </>
      )}
    </ReferencesSection>
  </Suspense>
));

const PostContentNonCritical = memo(
  ({ post, relatedPosts, completedPosts, dispatch, isSidebarOpen, setSidebarOpen, activeSection, setActiveSection, subtitlesListRef }) => {
    const completedPostsSelector = useSelector((state) => state.postReducer.completedPosts || []);
    const isCompleted = completedPostsSelector.some((cp) => cp.postId === post.postId);
    const parsedSummary = parseLinks(post.summary || '', post.category || '', false);
    const subtitleSlugs = (post?.subtitles || []).reduce((acc, s, i) => {
      acc[`subtitle-${i}`] = slugify(s.title || '');
      return acc;
    }, post.summary ? { summary: 'summary' } : {});

    const handleMarkAsCompleted = () => {
      if (!isCompleted && post?.postId) {
        dispatch(markPostAsCompleted(post.postId));
      }
    };

    const scrollToSection = (id, updateUrl = true) => {
      const section = document.getElementById(id);
      if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
        setActiveSection(id);
        if (isSidebarOpen) setSidebarOpen(false);
        if (updateUrl && subtitleSlugs[id]) {
          window.history.pushState(null, '', `#${subtitleSlugs[id]}`);
        }
      }
    };

    React.useEffect(() => {
      const hash = window.location.hash.slice(1);
      if (hash) {
        const sectionId = Object.keys(subtitleSlugs).find((id) => subtitleSlugs[id] === hash);
        if (sectionId) {
          setTimeout(() => scrollToSection(sectionId, false), 0);
        }
      }
    }, [subtitleSlugs]);

    const wrapperHeight = (post.subtitles || []).reduce((acc, subtitle, i) => {
      if (i === 0) return acc; // First subtitle rendered directly
      const subtitleHeight = 32 + 12 + // header + margin
        (subtitle.image || subtitle.video ? (window.innerWidth <= 768 ? 225 : 270) + 56 : 0) + // media + margin
        (subtitle.bulletPoints || []).reduce((bulletAcc, point) => {
          let height = 38;
          if (point.image || point.video) height += (window.innerWidth <= 768 ? 225 : 270) + 56;
          if (point.codeSnippet) height += 100;
          if (point.text?.includes('<ul>') || point.text?.includes('<ol>')) height += 20;
          return bulletAcc + height;
        }, 0);
      return acc + (subtitle.estimatedHeight || subtitleHeight);
    }, 0) +
    (post.superTitles?.length > 0 ? 200 : 0) +
    (post.summary ? 150 : 0) +
    44 + // NavigationLinks
    300 + // RelatedPosts
    150; // References

    return (
      <div
        style={{
          width: '100%',
          boxSizing: 'border-box',
          contain: 'layout',
          minHeight: `${wrapperHeight}px`,
          containIntrinsicSize: `100% ${wrapperHeight}px`,
        }}
      >
        {(post.subtitles || []).slice(0, 1).map((subtitle, i) => (
          <SubtitleSection
            key={i}
            subtitle={subtitle}
            index={i}
            category={post.category || ''}
          />
        ))}
        <Suspense
          fallback={
            <div
              style={{
                width: '100%',
                minHeight: `${wrapperHeight - (window.innerWidth <= 768 ? 200 : 350)}px`,
                containIntrinsicSize: `100% ${wrapperHeight - (window.innerWidth <= 768 ? 200 : 350)}px`,
                boxSizing: 'border-box',
                contain: 'layout',
              }}
            >
              {(post.subtitles || []).slice(1).map((_, i) => (
                <SkeletonSubtitleSection key={i} />
              ))}
              {post.superTitles?.length > 0 && (
                <div
                  style={{
                    width: '100%',
                    minHeight: '200px',
                    background: '#e0e0e0',
                    borderRadius: '0.375rem',
                    containIntrinsicSize: '100% 200px',
                    boxSizing: 'border-box',
                    contain: 'layout',
                  }}
                />
              )}
              {post.summary && (
                <SkeletonSummary>
                  <div />
                  <div />
                </SkeletonSummary>
              )}
              <SkeletonNavigationLinks>
                <div />
                <div />
                <div />
              </SkeletonNavigationLinks>
              <SkeletonRelatedPosts />
              <SkeletonReferences>
                <div />
                <div />
                <div />
              </SkeletonReferences>
            </div>
          }
        >
          {(post.subtitles || []).slice(1).map((subtitle, i) => (
            <LazySubtitleSection
              key={i + 1}
              subtitle={subtitle}
              index={i + 1}
              category={post.category || ''}
            />
          ))}
          {post.superTitles?.length > 0 && (
            <div
              style={{
                width: '100%',
                minHeight: '200px',
                containIntrinsicSize: '100% 200px',
                boxSizing: 'border-box',
                contain: 'layout',
              }}
            >
              <Suspense fallback={<Placeholder minHeight="200px" />}>
                <ComparisonTable
                  superTitles={post.superTitles}
                  category={post.category || ''}
                />
              </Suspense>
            </div>
          )}
          {post.summary && (
            <section
              id="summary"
              aria-labelledby="summary-heading"
              style={{
                boxSizing: 'border-box',
                minHeight: '150px',
                containIntrinsicSize: '100% 150px',
                contain: 'layout',
              }}
            >
              <SubtitleHeader id="summary-heading">Summary</SubtitleHeader>
              <p
                style={{
                  fontSize: '1.1rem',
                  lineHeight: '1.7',
                  boxSizing: 'border-box',
                  minHeight: '90px',
                  containIntrinsicSize: '100% 90px',
                  contain: 'layout',
                }}
                dangerouslySetInnerHTML={{ __html: parsedSummary }}
              />
            </section>
          )}
          <NavigationLinks aria-label="Page navigation">
            <Link to="/explore" aria-label="Back to blog">
              Blog
            </Link>
            {post.category && (
              <Link
                to={`/category/${post.category.toLowerCase()}`}
                aria-label={`Explore ${post.category}`}
              >
                {post.category}
              </Link>
            )}
            <Link to="/" aria-label="Home">
              Home
            </Link>
          </NavigationLinks>
          <LazyRelatedPostsSection relatedPosts={relatedPosts} />
          <LazyReferencesSection post={post} />
        </Suspense>
        <CompleteButton
          isCompleted={isCompleted}
          onClick={handleMarkAsCompleted}
          disabled={isCompleted}
          aria-label={isCompleted ? 'Post already marked as completed' : 'Mark post as completed'}
        >
          {isCompleted ? 'Completed' : 'Mark as Completed'}
        </CompleteButton>
      </div>
    );
  }
);

export default PostContentNonCritical;
