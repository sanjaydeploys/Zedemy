import React, { memo, Suspense, useCallback, useMemo } from 'react';
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
  bottom: 1rem;
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
  z-index: 1000;
  &:disabled {
    background: #95a5a6;
    cursor: not-allowed;
  }
  @media (min-width: 768px) {
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
  }
`;

const ImageContainer = styled.figure`
  width: 100%;
  max-width: 280px;
  margin: 1rem 0;
  aspect-ratio: 16 / 9;
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

const PostImage = styled.img`
  width: 100%;
  max-width: 280px;
  height: 157.5px;
  aspect-ratio: 16 / 9;
  object-fit: contain;
  border-radius: 0.375rem;
  box-sizing: border-box;
  contain: layout;
  @media (min-width: 769px) {
    max-width: 480px;
    height: 270px;
  }
  @media (max-width: 480px) {
    max-width: 240px;
    height: 135px;
  }
  @media (max-width: 320px) {
    max-width: 200px;
    height: 112.5px;
  }
`;

const VideoContainer = styled.figure`
  width: 100%;
  max-width: 280px;
  margin: 1rem 0;
  aspect-ratio: 16 / 9;
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

const PostVideo = styled.video`
  width: 100%;
  max-width: 280px;
  height: 157.5px;
  aspect-ratio: 16 / 9;
  border-radius: 0.375rem;
  box-sizing: border-box;
  contain: layout;
  @media (min-width: 769px) {
    max-width: 480px;
    height: 270px;
  }
  @media (max-width: 480px) {
    max-width: 240px;
    height: 135px;
  }
  @media (max-width: 320px) {
    max-width: 200px;
    height: 112.5px;
  }
`;

const Placeholder = styled.div`
  width: 100%;
  max-width: 280px;
  aspect-ratio: 16 / 9;
  min-height: 157.5px;
  background: #e0e0e0;
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

const SectionPlaceholder = styled.div`
  width: 100%;
  min-height: 200px;
  background: #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  contain-intrinsic-size: 100% 200px;
  box-sizing: border-box;
  contain: layout;
`;

const ReferencesSection = styled.section`
  margin-top: 1.5rem;
  padding: 1rem;
  background: #f9f9f9;
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
  margin: 1.5rem 0;
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  font-size: 0.75rem;
  width: 100%;
  min-height: 44px;
  contain-intrinsic-size: 100% 44px;
  box-sizing: border-box;
  contain: layout;
  & a {
    display: inline-flex;
    align-items: center;
    padding: 0.5rem;
    min-height: 24px;
    contain-intrinsic-size: 60px 24px;
  }
`;

const RelatedPostsSection = styled.section`
  width: 100%;
  padding: 1rem 0;
  min-height: 450px;
  contain-intrinsic-size: 100% 450px;
  box-sizing: border-box;
  contain: layout;
`;

const SkeletonRelatedPost = styled.div`
  width: 100%;
  max-width: 280px;
  margin: 0.5rem 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-height: 260px;
  contain-intrinsic-size: 280px 260px;
  box-sizing: border-box;
  contain: layout;
  @media (min-width: 769px) {
    max-width: 480px;
    min-height: 380px;
    contain-intrinsic-size: 480px 380px;
  }
  @media (max-width: 480px) {
    max-width: 240px;
    min-height: 230px;
    contain-intrinsic-size: 240px 230px;
  }
  @media (max-width: 320px) {
    max-width: 200px;
    min-height: 200px;
    contain-intrinsic-size: 200px 200px;
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

const SkeletonTitle = styled.div`
  width: 80%;
  min-height: 24px;
  background: #e0e0e0;
  border-radius: 0.25rem;
  contain-intrinsic-size: 80% 24px;
  box-sizing: border-box;
  contain: layout;
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
  @media (min-width: 769px) {
    min-height: 80px;
    contain-intrinsic-size: 100% 80px;
  }
`;

const SkeletonRelatedPostsContainer = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem 0;
  min-height: 450px;
  contain-intrinsic-size: 100% 450px;
  box-sizing: border-box;
  contain: layout;
  @media (min-width: 769px) {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(480px, 1fr));
    gap: 1.5rem;
  }
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
  min-height: 347.5px;
  contain-intrinsic-size: 100% 347.5px;
  box-sizing: border-box;
  contain: layout;
  @media (min-width: 769px) {
    min-height: 460px;
    contain-intrinsic-size: 100% 460px;
  }
  @media (max-width: 480px) {
    min-height: 305px;
    contain-intrinsic-size: 100% 305px;
  }
  @media (max-width: 320px) {
    min-height: 282.5px;
    contain-intrinsic-size: 100% 282.5px;
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
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  box-sizing: border-box;
  contain: layout;
  & > div {
    width: 60px;
    min-height: 24px;
    background: #e0e0e0;
    border-radius: 0.25rem;
    contain-intrinsic-size: 60px 24px;
  }
`;

const SkeletonReferences = styled.div`
  width: 100%;
  min-height: 150px;
  contain-intrinsic-size: 100% 150px;
  padding: 1rem;
  background: #f9f9f9;
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
  @media (max-width: 480px) {
    & > div:not(:first-child) {
      min-height: 20px;
      contain-intrinsic-size: 100% 20px;
    }
  }
`;

const SkeletonRelatedPosts = ({ count = 3 }) => (
  <SkeletonRelatedPostsContainer aria-hidden="true">
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonRelatedPost key={i}>
        <SkeletonImage />
        <SkeletonTitle />
        <SkeletonExcerpt />
      </SkeletonRelatedPost>
    ))}
  </SkeletonRelatedPostsContainer>
);

const SubtitleSection = memo(({ subtitle, index, category }) => {
  const parsedTitle = useMemo(() => parseLinks(subtitle.title || '', category, false), [subtitle.title, category]);
  const parsedBulletPoints = useMemo(
    () =>
      (subtitle.bulletPoints || []).map((point) => ({
        ...point,
        text: parseLinks(point.text || '', category, false),
      })),
    [subtitle.bulletPoints, category]
  );

  if (!subtitle) return null;

  const calculateSubtitleHeight = useMemo(() => {
    const headerHeight = 32;
    const margin = 16;
    const listPadding = 20;
    const bulletHeight = parsedBulletPoints.length * (30 + 8);
    const mediaHeight =
      subtitle.image || subtitle.video
        ? window.innerWidth <= 320
          ? 112.5
          : window.innerWidth <= 480
          ? 135
          : window.innerWidth <= 768
          ? 157.5
          : 270
        : 0;
    const mediaMargin = subtitle.image || subtitle.video ? 16 : 0;
    const pointMediaHeight = parsedBulletPoints.reduce((sum, point) => {
      if (point.image || point.video) {
        return (
          sum +
          (window.innerWidth <= 320 ? 112.5 : window.innerWidth <= 480 ? 135 : window.innerWidth <= 768 ? 157.5 : 270) +
          16
        );
      }
      return sum + (point.codeSnippet ? 100 : 0);
    }, 0);
    return headerHeight + margin + listPadding + bulletHeight + mediaHeight + mediaMargin + pointMediaHeight;
  }, [subtitle, parsedBulletPoints]);

  return (
    <>
      {(subtitle.image || (subtitle.video && index === 0)) && (
        <link
          rel="preload"
          href={
            subtitle.image
              ? `${subtitle.image}?w=${window.innerWidth <= 768 ? 280 : 480}&format=avif&q=30`
              : `${subtitle.videoPoster || subtitle.image}?w=80&format=webp&q=30`
          }
          as="image"
          fetchpriority="high"
        />
      )}
      <section
        id={`subtitle-${index}`}
        aria-labelledby={`subtitle-${index}-heading`}
        style={{
          boxSizing: 'border-box',
          minHeight: `${calculateSubtitleHeight}px`,
          containIntrinsicSize: `100% ${calculateSubtitleHeight}px`,
          contain: 'layout',
        }}
      >
        <SubtitleHeader id={`subtitle-${index}-heading`}>{parsedTitle}</SubtitleHeader>
        {subtitle.image && (
          <ImageContainer>
            <AccessibleZoom caption={subtitle.title || ''}>
              <PostImage
                src={`${subtitle.image}?w=${window.innerWidth <= 768 ? 280 : 480}&format=avif&q=30`}
                srcSet={`
                  ${subtitle.image}?w=100&format=avif&q=30 100w,
                  ${subtitle.image}?w=150&format=avif&q=30 150w,
                  ${subtitle.image}?w=200&format=avif&q=30 200w,
                  ${subtitle.image}?w=240&format=avif&q=30 240w,
                  ${subtitle.image}?w=280&format=avif&q=30 280w,
                  ${subtitle.image}?w=480&format=avif&q=30 480w
                `}
                sizes="(max-width: 320px) 200px, (max-width: 480px) 240px, (max-width: 768px) 280px, 480px"
                alt={`Illustration for ${subtitle.title || 'section'}`}
                loading={index === 0 ? 'eager' : 'lazy'}
                decoding="async"
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
              preload={index === 0 ? 'metadata' : 'none'}
              poster={`${subtitle.videoPoster || subtitle.image}?w=80&format=webp&q=30`}
              loading={index === 0 ? 'eager' : 'lazy'}
              decoding="async"
              aria-label={`Video for ${subtitle.title || 'section'}`}
              fetchpriority={index === 0 ? 'high' : 'low'}
              onError={() => console.error('Subtitle Video Failed:', subtitle.video)}
            >
              <source src={`${subtitle.video}#t=0.1`} type="video/mp4" />
            </PostVideo>
          </ImageContainer>
        )}
        <ul
          style={{
            paddingLeft: '1.25rem',
            fontSize: '1.1rem',
            lineHeight: '1.7',
            boxSizing: 'border-box',
            minHeight: `${parsedBulletPoints.length * 38 + parsedBulletPoints.reduce((sum, point) => sum + (point.image || point.video ? (window.innerWidth <= 320 ? 112.5 : window.innerWidth <= 480 ? 135 : window.innerWidth <= 768 ? 157.5 : 270) + 16 : point.codeSnippet ? 100 : 0), 0)}px`,
            containIntrinsicSize: `100% ${parsedBulletPoints.length * 38 + parsedBulletPoints.reduce((sum, point) => sum + (point.image || point.video ? (window.innerWidth <= 320 ? 112.5 : window.innerWidth <= 480 ? 135 : window.innerWidth <= 768 ? 157.5 : 270) + 16 : point.codeSnippet ? 100 : 0), 0)}px`,
            contain: 'layout',
          }}
        >
          {parsedBulletPoints.map((point, j) => (
            <li
              key={j}
              style={{
                marginBottom: '0.5rem',
                minHeight: `${30 + (point.image || point.video ? (window.innerWidth <= 320 ? 112.5 : window.innerWidth <= 480 ? 135 : window.innerWidth <= 768 ? 157.5 : 270) + 16 : point.codeSnippet ? 100 : 0)}px`,
                containIntrinsicSize: `100% ${30 + (point.image || point.video ? (window.innerWidth <= 320 ? 112.5 : window.innerWidth <= 480 ? 135 : window.innerWidth <= 768 ? 157.5 : 270) + 16 : point.codeSnippet ? 100 : 0)}px`,
                boxSizing: 'border-box',
              }}
            >
              <span>{point.text}</span>
              {point.image && (
                <ImageContainer>
                  <Suspense fallback={<Placeholder>Loading image...</Placeholder>}>
                    <AccessibleZoom caption={`Example for ${point.text || ''}`}>
                      <PostImage
                        src={`${point.image}?w=${window.innerWidth <= 768 ? 280 : 480}&format=avif&q=30`}
                        srcSet={`
                          ${point.image}?w=100&format=avif&q=30 100w,
                          ${point.image}?w=150&format=avif&q=30 150w,
                          ${point.image}?w=200&format=avif&q=30 200w,
                          ${point.image}?w=240&format=avif&q=30 240w,
                          ${point.image}?w=280&format=avif&q=30 280w,
                          ${point.image}?w=480&format=avif&q=30 480w
                        `}
                        sizes="(max-width: 320px) 200px, (max-width: 480px) 240px, (max-width: 768px) 280px, 480px"
                        alt={`Illustration for ${point.text || 'example point'}`}
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
                    poster={`${point.videoPoster || point.image}?w=80&format=webp&q=30`}
                    loading="lazy"
                    decoding="async"
                    aria-label={`Video example for ${point.text || 'point'}`}
                    fetchpriority="low"
                    onError={() => console.error('Point Video Failed:', point.video)}
                  >
                    <source src={`${point.video}#t=0.1`} type="video/mp4" />
                  </PostVideo>
                </ImageContainer>
              )}
              {point.codeSnippet && (
                <Suspense fallback={<Placeholder minHeight="100px">Loading code...</Placeholder>}>
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
          ))}
        </ul>
      </section>
    </>
  );
});

const FirstSubtitleSkeleton = ({ bulletCount = 3, hasMedia = true }) => (
  <SkeletonSubtitleSection aria-hidden="true">
    <div
      style={{
        width: '100%',
        minHeight: '32px',
        background: '#e0e0e0',
        borderRadius: '0.25rem',
        containIntrinsicSize: '100% 32px',
        marginBottom: '0.75rem',
      }}
    />
    {hasMedia && <Placeholder />}
    <ul
      style={{
        paddingLeft: '1.25rem',
        boxSizing: 'border-box',
        minHeight: `${bulletCount * 38}px`,
        containIntrinsicSize: `100% ${bulletCount * 38}px`,
        contain: 'layout',
      }}
    >
      {Array.from({ length: bulletCount }).map((_, i) => (
        <SkeletonBulletPoint key={i} />
      ))}
    </ul>
  </SkeletonSubtitleSection>
);

const LazySubtitleSection = memo(({ subtitle, index, category }) => (
  <Suspense fallback={<FirstSubtitleSkeleton bulletCount={subtitle.bulletPoints?.length || 3} hasMedia={!!(subtitle.image || subtitle.video)} />}>
    <SubtitleSection subtitle={subtitle} index={index} category={category} />
  </Suspense>
));

const LazyRelatedPostsSection = memo(({ relatedPosts }) => (
  <Suspense fallback={<SkeletonRelatedPosts count={relatedPosts?.length || 3} />}>
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
            style={{
              minHeight: `${ref.title.length > 100 ? 48 : 24}px`,
              containIntrinsicSize: `100% ${ref.title.length > 100 ? 48 : 24}px`,
            }}
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
            style={{ minHeight: '24px', containIntrinsicSize: '100% 24px' }}
          >
            GeeksforGeeks: {post.category || 'Tutorials'} Tutorials
          </ReferenceLink>
          <ReferenceLink
            href={`https://developer.mozilla.org/en-US/docs/Web/${post.category?.replace(/\s+/g, '') || 'Guide'}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`MDN ${post.category || 'Documentation'} Documentation`}
            style={{ minHeight: '24px', containIntrinsicSize: '100% 24px' }}
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
    const parsedSummary = useMemo(
      () => parseLinks(post.summary || '', post.category || '', false),
      [post.summary, post.category]
    );
    const subtitleSlugs = useMemo(() => {
      if (!post?.subtitles) return {};
      const slugs = {};
      post.subtitles.forEach((s, i) => {
        slugs[`subtitle-${i}`] = slugify(s.title);
      });
      if (post.summary) slugs.summary = 'summary';
      return slugs;
    }, [post]);

    const handleMarkAsCompleted = useCallback(() => {
      if (!isCompleted && post) {
        dispatch(markPostAsCompleted(post.postId));
      }
    }, [dispatch, post, isCompleted]);

    const scrollToSection = useCallback(
      (id, updateUrl = true) => {
        const section = document.getElementById(id);
        if (section) {
          section.scrollIntoView({ behavior: 'smooth' });
          setActiveSection(id);
          if (isSidebarOpen) setSidebarOpen(false);
          if (updateUrl && subtitleSlugs[id]) {
            window.history.pushState(null, '', `#${subtitleSlugs[id]}`);
          }
        }
      },
      [isSidebarOpen, setSidebarOpen, setActiveSection, subtitleSlugs]
    );

    const calculateWrapperHeight = useMemo(() => {
      const subtitleCount = (post.subtitles || []).length;
      const subtitleHeight = post.subtitles?.reduce((sum, subtitle) => {
        const headerHeight = 32;
        const margin = 16;
        const listPadding = 20;
        const bulletHeight = (subtitle.bulletPoints?.length || 0) * (30 + 8);
        const mediaHeight =
          subtitle.image || subtitle.video
            ? window.innerWidth <= 320
              ? 112.5
              : window.innerWidth <= 480
              ? 135
              : window.innerWidth <= 768
              ? 157.5
              : 270
            : 0;
        const mediaMargin = subtitle.image || subtitle.video ? 16 : 0;
        const pointMediaHeight = (subtitle.bulletPoints || []).reduce((sum, point) => {
          if (point.image || point.video) {
            return (
              sum +
              (window.innerWidth <= 320 ? 112.5 : window.innerWidth <= 480 ? 135 : window.innerWidth <= 768 ? 157.5 : 270) +
              16
            );
          }
          return sum + (point.codeSnippet ? 100 : 0);
        }, 0);
        return sum + headerHeight + margin + listPadding + bulletHeight + mediaHeight + mediaMargin + pointMediaHeight;
      }, 0) || 0;
      const hasSummary = post.summary
        ? Math.max(150, Math.min(300, (post.summary.length / 200) * 50) + 32 + 16)
        : 0;
      const hasSuperTitles = post.superTitles?.length > 0
        ? 200 + (post.superTitles.length * 50)
        : 0;
      const navigationHeight = post.category ? 68 : 44;
      const relatedPostsHeight = (relatedPosts?.length || 3) * (window.innerWidth <= 320 ? 200 : window.innerWidth <= 480 ? 230 : window.innerWidth <= 768 ? 260 : 380) + 32 + 16;
      const referencesHeight = post.references?.length
        ? 32 + 16 + (post.references.length * (post.references.some(ref => ref.title.length > 100) ? 48 : 24))
        : 32 + 16 + 48;
      return subtitleHeight + hasSummary + hasSuperTitles + navigationHeight + relatedPostsHeight + referencesHeight;
    }, [post, relatedPosts]);

    const calculateSuspenseHeight = useMemo(() => {
      const firstSubtitleHeight = post.subtitles?.[0]
        ? (32 + 16 + 20 + (post.subtitles[0].bulletPoints?.length || 0) * 38 +
          (post.subtitles[0].image || post.subtitles[0].video
            ? (window.innerWidth <= 320 ? 112.5 : window.innerWidth <= 480 ? 135 : window.innerWidth <= 768 ? 157.5 : 270) + 16
            : 0) +
          (post.subtitles[0].bulletPoints || []).reduce((sum, point) => sum + (point.image || point.video ? (window.innerWidth <= 320 ? 112.5 : window.innerWidth <= 480 ? 135 : window.innerWidth <= 768 ? 157.5 : 270) + 16 : point.codeSnippet ? 100 : 0), 0))
        : 0;
      return calculateWrapperHeight - firstSubtitleHeight;
    }, [post, calculateWrapperHeight]);

    return (
      <>
        {relatedPosts?.[0]?.image && (
          <link
            rel="preload"
            href={`${relatedPosts[0].image}?w=${window.innerWidth <= 768 ? 280 : 480}&format=avif&q=30`}
            as="image"
            fetchpriority="low"
          />
        )}
        <div
          style={{
            width: '100%',
            minHeight: `${calculateWrapperHeight}px`,
            containIntrinsicSize: `100% ${calculateWrapperHeight}px`,
            boxSizing: 'border-box',
            contain: 'layout',
          }}
        >
          {(post.subtitles || []).length > 0 && (
            <SubtitleSection
              subtitle={post.subtitles[0]}
              index={0}
              category={post.category || ''}
            />
          )}
          <Suspense
            fallback={
              <div
                style={{
                  width: '100%',
                  minHeight: `${calculateSuspenseHeight}px`,
                  containIntrinsicSize: `100% ${calculateSuspenseHeight}px`,
                  boxSizing: 'border-box',
                  contain: 'layout',
                }}
              >
                {(post.subtitles || []).slice(1).map((subtitle, i) => (
                  <FirstSubtitleSkeleton
                    key={i}
                    bulletCount={subtitle.bulletPoints?.length || 3}
                    hasMedia={!!(subtitle.image || subtitle.video)}
                  />
                ))}
                {post.superTitles?.length > 0 && (
                  <SectionPlaceholder minHeight="200px">
                    Loading comparison...
                  </SectionPlaceholder>
                )}
                {post.summary && <SkeletonSummary />}
                <SkeletonNavigationLinks>
                  {Array.from({ length: post.category ? 3 : 2 }).map((_, i) => (
                    <div key={i} />
                  ))}
                </SkeletonNavigationLinks>
                <SkeletonRelatedPosts count={relatedPosts?.length || 3} />
                <SkeletonReferences>
                  <div />
                  {Array.from({ length: post.references?.length || 2 }).map((_, i) => (
                    <div key={i} />
                  ))}
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
                  minHeight: `${200 + (post.superTitles.length * 50)}px`,
                  containIntrinsicSize: `100% ${200 + (post.superTitles.length * 50)}px`,
                  boxSizing: 'border-box',
                  contain: 'layout',
                }}
              >
                <ComparisonTable
                  superTitles={post.superTitles}
                  category={post.category || ''}
                />
              </div>
            )}
            {post.summary && (
              <section
                id="summary"
                aria-labelledby="summary-heading"
                style={{
                  boxSizing: 'border-box',
                  minHeight: `${Math.max(150, Math.min(300, (post.summary.length / 200) * 50) + 32 + 16)}px`,
                  containIntrinsicSize: `100% ${Math.max(150, Math.min(300, (post.summary.length / 200) * 50) + 32 + 16)}px`,
                  contain: 'layout',
                }}
              >
                <SubtitleHeader id="summary-heading">Summary</SubtitleHeader>
                <p
                  style={{
                    fontSize: '1.1rem',
                    lineHeight: '1.7',
                    boxSizing: 'border-box',
                    minHeight: `${Math.max(90, Math.min(240, (post.summary.length / 200) * 50))}px`,
                    containIntrinsicSize: `100% ${Math.max(90, Math.min(240, (post.summary.length / 200) * 50))}px`,
                    contain: 'layout',
                  }}
                >
                  {parsedSummary}
                </p>
              </section>
            )}
            <NavigationLinks aria-label="Page navigation">
              <Link to="/explore" aria-label="Back to blog" style={{ minHeight: '24px', containIntrinsicSize: '60px 24px' }}>
                Blog
              </Link>
              {post.category && (
                <Link
                  to={`/category/${post.category.toLowerCase()}`}
                  aria-label={`Explore ${post.category}`}
                  style={{ minHeight: '24px', containIntrinsicSize: '60px 24px' }}
                >
                  {post.category}
                </Link>
              )}
              <Link to="/" aria-label="Home" style={{ minHeight: '24px', containIntrinsicSize: '60px 24px' }}>
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
      </>
    );
  }
);

export default PostContentNonCritical;
