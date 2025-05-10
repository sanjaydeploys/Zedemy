import React, { memo, useCallback, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { slugify } from './utils';
import { markPostAsCompleted } from '../actions/postActions';
import styled, { keyframes } from 'styled-components';

const RelatedPosts = React.lazy(() => import('./RelatedPosts'));
const AccessibleZoom = React.lazy(() => import('./AccessibleZoom'));
const ComparisonTable = React.lazy(() => import('./ComparisonTable'));
const CodeHighlighter = React.lazy(() => import('./CodeHighlighter'));

const pulse = keyframes`
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
`;

const SubtitleHeader = styled.h2`
  font-size: clamp(1.25rem, 3vw, 1.5rem);
  color: #011020;
  margin: 1.5rem 0 0.75rem;
  font-weight: 700;
  border-left: 4px solid #34db58;
  padding-left: 0.5rem;
  width: 100%;
  line-height: 32px;
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
  background: #e0e0e0;
  box-sizing: border-box;
  contain: layout;
  &.image-loaded {
    background: none;
  }
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
  height: auto;
  aspect-ratio: 16 / 9;
  object-fit: contain;
  border-radius: 0.375rem;
  box-sizing: border-box;
  @media (min-width: 769px) {
    max-width: 480px;
  }
  @media (max-width: 480px) {
    max-width: 240px;
  }
  @media (max-width: 320px) {
    max-width: 200px;
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
  height: auto;
  aspect-ratio: 16 / 9;
  border-radius: 0.375rem;
  box-sizing: border-box;
  @media (min-width: 769px) {
    max-width: 480px;
  }
  @media (max-width: 480px) {
    max-width: 240px;
  }
  @media (max-width: 320px) {
    max-width: 200px;
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
  animation: ${pulse} 1.5s ease-in-out infinite;
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
  animation: ${pulse} 1.5s ease-in-out infinite;
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
  min-height: 120px;
  contain-intrinsic-size: 100% 120px;
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
  min-height: 40px;
  contain-intrinsic-size: 100% 40px;
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
  min-height: 380px;
  contain-intrinsic-size: 100% 380px;
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
  animation: ${pulse} 1.5s ease-in-out infinite;
  contain-intrinsic-size: 280px 157.5px;
  box-sizing: border-box;
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
  height: 24px;
  background: #e0e0e0;
  border-radius: 0.25rem;
  animation: ${pulse} 1.5s ease-in-out infinite;
  contain-intrinsic-size: 80% 24px;
  box-sizing: border-box;
  @media (min-width: 769px) {
    height: 32px;
    contain-intrinsic-size: 80% 32px;
  }
`;

const SkeletonExcerpt = styled.div`
  width: 100%;
  height: 60px;
  background: #e0e0e0;
  border-radius: 0.25rem;
  animation: ${pulse} 1.5s ease-in-out infinite;
  contain-intrinsic-size: 100% 60px;
  box-sizing: border-box;
  @media (min-width: 769px) {
    height: 80px;
    contain-intrinsic-size: 100% 80px;
  }
`;

const SkeletonRelatedPostsContainer = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem 0;
  min-height: 380px;
  contain-intrinsic-size: 100% 380px;
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
  height: 30px;
  background: #e0e0e0;
  border-radius: 0.25rem;
  animation: ${pulse} 1.5s ease-in-out infinite;
  contain-intrinsic-size: 100% 30px;
  box-sizing: border-box;
  margin-bottom: 0.5rem;
`;

const SkeletonSubtitleSection = styled.div`
  width: 100%;
  min-height: 200px;
  contain-intrinsic-size: 100% 200px;
  box-sizing: border-box;
  contain: layout;
`;

const SkeletonSummary = styled.div`
  width: 100%;
  min-height: 150px;
  contain-intrinsic-size: 100% 150px;
  box-sizing: border-box;
  contain: layout;
  & > div:first-child {
    width: 100%;
    height: 32px;
    background: #e0e0e0;
    border-radius: 0.25rem;
    animation: ${pulse} 1.5s ease-in-out infinite;
    contain-intrinsic-size: 100% 32px;
    margin-bottom: 0.75rem;
  }
  & > div:last-child {
    width: 100%;
    height: 90px;
    background: #e0e0e0;
    border-radius: 0.25rem;
    animation: ${pulse} 1.5s ease-in-out infinite;
    contain-intrinsic-size: 100% 90px;
  }
`;

const SkeletonNavigationLinks = styled.div`
  width: 100%;
  min-height: 40px;
  contain-intrinsic-size: 100% 40px;
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  box-sizing: border-box;
  contain: layout;
  & > div {
    width: 60px;
    height: 24px;
    background: #e0e0e0;
    border-radius: 0.25rem;
    animation: ${pulse} 1.5s ease-in-out infinite;
    contain-intrinsic-size: 60px 24px;
  }
`;

const SkeletonReferences = styled.div`
  width: 100%;
  min-height: 120px;
  contain-intrinsic-size: 100% 120px;
  padding: 1rem;
  background: #f9f9f9;
  border-radius: 0.375rem;
  box-sizing: border-box;
  contain: layout;
  & > div:first-child {
    width: 100%;
    height: 32px;
    background: #e0e0e0;
    border-radius: 0.25rem;
    animation: ${pulse} 1.5s ease-in-out infinite;
    contain-intrinsic-size: 100% 32px;
    margin-bottom: 0.75rem;
  }
  & > div:not(:first-child) {
    width: 100%;
    height: 24px;
    background: #e0e0e0;
    border-radius: 0.25rem;
    animation: ${pulse} 1.5s ease-in-out infinite;
    contain-intrinsic-size: 100% 24px;
    margin: 0.25rem 0;
  }
  @media (max-width: 480px) {
    & > div:not(:first-child) {
      height: 20px;
      contain-intrinsic-size: 100% 20px;
    }
  }
`;

const SkeletonRelatedPosts = () => (
  <SkeletonRelatedPostsContainer aria-hidden="true">
    {Array.from({ length: 3 }).map((_, i) => (
      <SkeletonRelatedPost key={i}>
        <SkeletonImage />
        <SkeletonTitle />
        <SkeletonExcerpt />
      </SkeletonRelatedPost>
    ))}
  </SkeletonRelatedPostsContainer>
);

const parseLinks = (text, category) => {
  if (!text) return [text];
  const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+|vscode:\/\/[^\s)]+|\/[^\s)]+)\)/g;
  const elements = [];
  let lastIndex = 0;
  let match;
  while ((match = linkRegex.exec(text)) !== null) {
    const [fullMatch, linkText, url] = match;
    if (match.index > lastIndex) {
      elements.push(text.slice(lastIndex, match.index));
    }
    elements.push({ linkText, url, isInternal: url.startsWith('/') });
    lastIndex = match.index + fullMatch.length;
  }
  if (lastIndex < text.length) {
    elements.push(text.slice(lastIndex));
  }
  return elements.length ? elements : [text || ''];
};

const SubtitleSection = memo(({ subtitle, index, category }) => {
  const parsedTitle = React.useMemo(() => parseLinks(subtitle.title || '', category), [subtitle.title, category]);
  const parsedBulletPoints = React.useMemo(() =>
    (subtitle.bulletPoints || []).map(point => ({
      ...point,
      text: parseLinks(point.text || '', category),
    })), [subtitle.bulletPoints, category]);
  const [isImageLoaded, setIsImageLoaded] = React.useState(false);
  const [isPointImageLoaded, setIsPointImageLoaded] = React.useState({});

  if (!subtitle) return null;

  return (
    <section
      id={`subtitle-${index}`}
      aria-labelledby={`subtitle-${index}-heading`}
      style={{ boxSizing: 'border-box', minHeight: '200px', containIntrinsicSize: '100% 200px', contain: 'layout' }}
    >
      <SubtitleHeader id={`subtitle-${index}-heading`}>
        {Array.isArray(parsedTitle) ? parsedTitle.map((elem, i) => (
          <React.Fragment key={i}>
            {typeof elem === 'string' ? elem : (
              elem.isInternal ? (
                <a href={elem.url} className="text-blue-600 hover:text-blue-800" aria-label={`Navigate to ${elem.linkText}`}>
                  {elem.linkText}
                </a>
              ) : (
                <a
                  href={elem.url}
                  target={elem.url.startsWith('vscode://') ? '_self' : '_blank'}
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800"
                  aria-label={`Visit ${elem.linkText}`}
                >
                  {elem.linkText}
                </a>
              )
            )}
          </React.Fragment>
        )) : parsedTitle}
      </SubtitleHeader>
      {subtitle.image && (
        <ImageContainer className={isImageLoaded ? 'image-loaded' : ''}>
          <Suspense fallback={<Placeholder>Loading image...</Placeholder>}>
            <AccessibleZoom caption={subtitle.title || ''}>
              <PostImage
                src={`${subtitle.image}?w=100&format=avif&q=1`}
                srcSet={`
                  ${subtitle.image}?w=100&format=avif&q=1 100w,
                  ${subtitle.image}?w=150&format=avif&q=1 150w,
                  ${subtitle.image}?w=200&format=avif&q=1 200w,
                  ${subtitle.image}?w=240&format=avif&q=1 240w,
                  ${subtitle.image}?w=280&format=avif&q=1 280w,
                  ${subtitle.image}?w=480&format=avif&q=1 480w
                `}
                sizes="(max-width: 320px) 200px, (max-width: 480px) 240px, (max-width: 768px) 280px, 480px"
                alt={`Illustration for ${subtitle.title || 'section'}`}
                loading={index === 0 ? 'eager' : 'lazy'}
                decoding="async"
                fetchpriority={index === 0 ? 'high' : 'low'}
                onLoad={() => setIsImageLoaded(true)}
                onError={() => {
                  console.error('Subtitle Image Failed:', subtitle.image);
                  setIsImageLoaded(true);
                }}
              />
            </AccessibleZoom>
          </Suspense>
        </ImageContainer>
      )}
      {subtitle.video && (
        <VideoContainer>
          <PostVideo
            controls
            preload="none"
            poster={`${subtitle.videoPoster || subtitle.image}?w=80&format=webp&q=5`}
            loading="lazy"
            decoding="async"
            aria-label={`Video for ${subtitle.title || 'section'}`}
            fetchpriority="low"
          >
            <source src={`${subtitle.video}#t=0.1`} type="video/mp4" />
          </PostVideo>
        </VideoContainer>
      )}
      <ul style={{ paddingLeft: '1.25rem', fontSize: '1.1rem', lineHeight: '1.7', boxSizing: 'border-box', minHeight: '90px', containIntrinsicSize: '100% 90px', contain: 'layout' }}>
        {parsedBulletPoints.map((point, j) => (
          <li key={j} style={{ marginBottom: '0.5rem', minHeight: '30px', containIntrinsicSize: '100% 30px', boxSizing: 'border-box' }}>
            <span>
              {Array.isArray(point.text) ? point.text.map((elem, k) => (
                <React.Fragment key={k}>
                  {typeof elem === 'string' ? elem : (
                    elem.isInternal ? (
                      <a href={elem.url} className="text-blue-600 hover:text-blue-800" aria-label={`Navigate to ${elem.linkText}`}>
                        {elem.linkText}
                      </a>
                    ) : (
                      <a
                        href={elem.url}
                        target={elem.url.startsWith('vscode://') ? '_self' : '_blank'}
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                        aria-label={`Visit ${elem.linkText}`}
                      >
                        {elem.linkText}
                      </a>
                    )
                  )}
                </React.Fragment>
              )) : point.text}
            </span>
            {point.image && (
              <ImageContainer className={isPointImageLoaded[j] ? 'image-loaded' : ''}>
                <Suspense fallback={<Placeholder>Loading image...</Placeholder>}>
                  <AccessibleZoom caption={`Example for ${point.text || ''}`}>
                    <PostImage
                      src={`${point.image}?w=100&format=avif&q=1`}
                      srcSet={`
                        ${point.image}?w=100&format=avif&q=1 100w,
                        ${point.image}?w=150&format=avif&q=1 150w,
                        ${point.image}?w=200&format=avif&q=1 200w,
                        ${point.image}?w=240&format=avif&q=1 240w,
                        ${point.image}?w=280&format=avif&q=1 280w,
                        ${point.image}?w=480&format=avif&q=1 480w
                      `}
                      sizes="(max-width: 320px) 200px, (max-width: 480px) 240px, (max-width: 768px) 280px, 480px"
                      alt={`Illustration for ${point.text || 'example point'}`}
                      loading="lazy"
                      decoding="async"
                      fetchpriority="low"
                      onLoad={() => setIsPointImageLoaded(prev => ({ ...prev, [j]: true }))}
                      onError={() => {
                        console.error('Point Image Failed:', point.image);
                        setIsPointImageLoaded(prev => ({ ...prev, [j]: true }));
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
                  poster={`${point.videoPoster || point.image}?w=80&format=webp&q=5`}
                  loading="lazy"
                  decoding="async"
                  aria-label={`Video example for ${point.text || 'point'}`}
                  fetchpriority="low"
                >
                  <source src={`${point.video}#t=0.1`} type="video/mp4" />
                </PostVideo>
              </VideoContainer>
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
  );
});

const FirstSubtitleSkeleton = ({ bulletCount = 3 }) => (
  <SkeletonSubtitleSection aria-hidden="true">
    <SubtitleHeader />
    <ul style={{ paddingLeft: '1.25rem', boxSizing: 'border-box', minHeight: '90px', containIntrinsicSize: '100% 90px', contain: 'layout' }}>
      {Array.from({ length: bulletCount }).map((_, i) => (
        <SkeletonBulletPoint key={i} />
      ))}
    </ul>
  </SkeletonSubtitleSection>
);

const LazySubtitleSection = memo(({ subtitle, index, category }) => (
  <Suspense fallback={<SectionPlaceholder>Loading section...</SectionPlaceholder>}>
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
          <ReferenceLink key={i} href={ref.url} target="_blank" rel="noopener noreferrer" aria-label={`Visit ${ref.title}`}>
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
    const completedPostsSelector = useSelector(state => state.postReducer.completedPosts || []);
    const isCompleted = completedPostsSelector.some(cp => cp.postId === post.postId);
    const parsedSummary = React.useMemo(() => parseLinks(post.summary || '', post.category || ''), [post.summary, post.category]);
    const subtitleSlugs = React.useMemo(() => {
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

    React.useEffect(() => {
      const hash = window.location.hash.slice(1);
      if (hash) {
        const sectionId = Object.keys(subtitleSlugs).find(id => subtitleSlugs[id] === hash);
        if (sectionId) {
          setTimeout(() => scrollToSection(sectionId, false), 0);
        }
      }
    }, [subtitleSlugs, scrollToSection]);

    return (
      <div style={{ width: '100%', minHeight: '1000px', containIntrinsicSize: '100% 1000px', boxSizing: 'border-box', contain: 'layout' }}>
        {(post.subtitles || []).map((subtitle, i) => (
          <LazySubtitleSection key={i} subtitle={subtitle} index={i} category={post.category || ''} />
        ))}

        {post.superTitles?.length > 0 && (
          <Suspense fallback={<Placeholder maxWidth="100%" minHeight="200px">Loading comparison...</Placeholder>}>
            <div style={{ width: '100%', minHeight: '200px', containIntrinsicSize: '100% 200px', boxSizing: 'border-box', contain: 'layout' }}>
              <ComparisonTable superTitles={post.superTitles} category={post.category || ''} />
            </div>
          </Suspense>
        )}

        {post.summary && (
          <Suspense fallback={<SkeletonSummary />}>
            <section id="summary" aria-labelledby="summary-heading" style={{ boxSizing: 'border-box', minHeight: '150px', containIntrinsicSize: '100% 150px', contain: 'layout' }}>
              <SubtitleHeader id="summary-heading">Summary</SubtitleHeader>
              <p style={{ fontSize: '1.1rem', lineHeight: '1.7', boxSizing: 'border-box', minHeight: '90px', containIntrinsicSize: '100% 90px', contain: 'layout' }}>
                {Array.isArray(parsedSummary) ? parsedSummary.map((elem, i) => (
                  <React.Fragment key={i}>
                    {typeof elem === 'string' ? elem : (
                      elem.isInternal ? (
                        <a href={elem.url} className="text-blue-600 hover:text-blue-800" aria-label={`Navigate to ${elem.linkText}`}>
                          {elem.linkText}
                        </a>
                      ) : (
                        <a
                          href={elem.url}
                          target={elem.url.startsWith('vscode://') ? '_self' : '_blank'}
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                          aria-label={`Visit ${elem.linkText}`}
                        >
                          {elem.linkText}
                        </a>
                      )
                    )}
                  </React.Fragment>
                )) : parsedSummary}
              </p>
            </section>
          </Suspense>
        )}

        <Suspense fallback={<SkeletonNavigationLinks><div /><div /><div /></SkeletonNavigationLinks>}>
          <NavigationLinks aria-label="Page navigation">
            <Link to="/explore" aria-label="Back to blog">Blog</Link>
            {post.category && (
              <Link to={`/category/${post.category.toLowerCase()}`} aria-label={`Explore ${post.category}`}>
                {post.category}
              </Link>
            )}
            <Link to="/" aria-label="Home">Home</Link>
          </NavigationLinks>
        </Suspense>

        <CompleteButton
          isCompleted={isCompleted}
          onClick={handleMarkAsCompleted}
          disabled={isCompleted}
          aria-label={isCompleted ? 'Post already marked as completed' : 'Mark post as completed'}
        >
          {isCompleted ? 'Completed' : 'Mark as Completed'}
        </CompleteButton>

        <LazyRelatedPostsSection relatedPosts={relatedPosts} />

        <LazyReferencesSection post={post} />
      </div>
    );
  }
);

export default PostContentNonCritical;
