import React, { memo, useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchPostSSR } from '../actions/postActions';
import Sidebar from './Sidebar';
import styled from 'styled-components';

const Layout = styled.div`
  display: flex;
  min-height: 100vh;
`;

const MainContent = styled.div`
  margin-left: 48px;
  padding: 1rem;
  flex: 1;
  background: #f9fafb;
  min-height: 100vh;
  @media (max-width: 768px) {
    margin-left: 0;
  }
`;

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 0.75rem;
  display: grid;
  grid-template-columns: 1fr 250px;
  gap: 1.5rem;
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const PostPage = memo(() => {
  const { slug } = useParams();
  const dispatch = useDispatch();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const postData = window.__POST_DATA__ || {};
  const reduxPost = useSelector((state) => state.postReducer.post);
  const error = useSelector((state) => state.postReducer.error);

  const post = reduxPost || postData;

  useEffect(() => {
    if (!postData.title && !reduxPost) {
      console.log('[PostPage.jsx] No post data, fetching post SSR');
      dispatch(fetchPostSSR(slug));
    }
  }, [slug, dispatch, postData, reduxPost]);

  useEffect(() => {
    const handleScroll = () => {
      const sections = post.subtitles?.map((_, i) => `subtitle-${i}`) || [];
      if (post.summary) sections.push('summary');
      for (const section of sections) {
        const element = document.getElementById(section);
        if (element && element.getBoundingClientRect().top <= 100) {
          setActiveSection(section);
        }
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [post.subtitles, post.summary]);

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setSidebarOpen(false);
    }
  };

  if (error || (!post.title && !reduxPost)) {
    console.log('[PostPage.jsx] Rendering error state');
    return (
      <div className="container">
        <main>
          <div style={{ color: '#d32f2f', fontSize: '0.875rem', textAlign: 'center', padding: '0.5rem', background: '#ffebee', borderRadius: '0.25rem', margin: 0, minHeight: '50px' }}>
            Failed to load the post: {error || 'Not found'}. Please try again later.
          </div>
        </main>
      </div>
    );
  }

  const formattedDate = post.date
    ? new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'Unknown';

  return (
    <Layout>
      <nav className="sidebar-nav" aria-label="Main navigation">
        <div className="nav-container">
          <Link to="/" className="nav-item" aria-label="Home"><span className="nav-icon">🏠</span></Link>
          <Link to="/category" className="nav-item" aria-label="Courses"><span className="nav-icon">📚</span></Link>
          <Link to="/add-post" className="nav-item" aria-label="Add Post"><span className="nav-icon">📤</span></Link>
          <Link to="/login" className="nav-item" aria-label="User Login"><span className="nav-icon">👤</span></Link>
          <Link to="/certificate-verification" className="nav-item" aria-label="Certificate Verification"><span className="nav-icon">🎓</span></Link>
          <Link to="/editor" className="nav-item" aria-label="Code Editor"><span className="nav-icon">💻</span></Link>
        </div>
      </nav>
      <MainContent>
        <Container>
          <main role="main" aria-label="Main content">
            <nav className="breadcrumbs" aria-label="Breadcrumb">
              <Link to="/" aria-label="Home">Home</Link> &gt;
              <Link to={`/category/${post.category?.toLowerCase() || 'blog'}`} aria-label={`Explore ${post.category || 'Blog'}`}>
                {post.category || 'Blog'}
              </Link> &gt;
              <span>{post.title || 'Untitled'}</span>
            </nav>
            <h1>{post.title || 'Untitled'}</h1>
            <div className="meta-info">
              <span><span className="icon">👤</span> {post.author || 'Zedemy Team'}</span>
              <span><span className="icon">📅</span> {formattedDate}</span>
              <span><span className="icon">⏱️</span> {post.readTime || 1} min read</span>
            </div>
            <div className="social-share" aria-label="Share this post">
              <a href={`https://x.com/intent/tweet?url=${encodeURIComponent(`https://zedemy.vercel.app/post/${slug}`)}&text=${encodeURIComponent(`${post.title || 'Untitled'} - Learn more on Zedemy!`)}`} target="_blank" rel="noopener noreferrer" aria-label="Share on X">
                <svg viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
              {/* Add other social share links similarly */}
            </div>
            {post.titleImage && (
              <figure className="media-figure">
                <img
                  src={`${post.titleImage}?w=800&format=avif&q=50`}
                  srcSet={`${post.titleImage}?w=100&format=avif&q=50 100w, ${post.titleImage}?w=150&format=avif&q=50 150w, ${post.titleImage}?w=300&format=avif&q=50 300w, ${post.titleImage}?w=600&format=avif&q=50 600w, ${post.titleImage}?w=800&format=avif&q=50 800w`}
                  sizes="(max-width: 320px) 100px, (max-width: 360px) 150px, (max-width: 768px) 300px, (max-width: 1024px) 600px, 800px"
                  alt={`Featured image for ${post.title || 'post'} - ${post.category || 'Zedemy'}`}
                  className="title-image"
                  loading="eager"
                  decoding="sync"
                  fetchPriority="high"
                />
              </figure>
            )}
            {post.content && (
              <div className="content-text" dangerouslySetInnerHTML={{ __html: parseLinks(post.content, post.category || '', true) }} />
            )}
            <div dangerouslySetInnerHTML={{ __html: renderSubtitles(post.subtitles || [], post.category || '') }} />
            {post.superTitles?.length > 0 && (
              <div dangerouslySetInnerHTML={{ __html: renderComparisonTable(post.superTitles, post.category) }} />
            )}
            {post.summary && (
              <section id="summary" aria-labelledby="summary-heading" className="summary-section">
                <h2 id="summary-heading" className="section-heading">Summary</ Limit: 2</h2>
                <div className="content-text" dangerouslySetInnerHTML={{ __html: parseLinks(post.summary, post.category || '', true) }} />
              </section>
            )}
            <nav className="navigation-links" aria-label="Page navigation">
              <Link to="/explore" aria-label="Back to blog">Blog</Link>
              {post.category && (
                <Link to={`/category/${post.category.toLowerCase()}`} aria-label={`Explore ${post.category}`}>
                  {post.category}
                </Link>
              )}
              <Link to="/" aria-label="Home">Home</Link>
              {post.relatedPosts?.map(rp => (
                <Link key={rp.slug} to={`/post/${rp.slug}`} aria-label={`Read ${rp.title}`}>
                  {rp.title}
                </Link>
              ))}
            </nav>
            <section className="related-posts" aria-labelledby="related-posts-heading">
              <h2 id="related-posts-heading" className="related-posts-header">Related Posts</h2>
              {post.relatedPosts?.length > 0 ? post.relatedPosts.map(rp => (
                <div className="related-post" key={rp.slug}>
                  {rp.titleImage && (
                    <figure className="media-figure">
                      <img
                        src={`${rp.titleImage}?w=200&format=avif&q=40`}
                        srcSet={`${rp.titleImage}?w=100&format=avif&q=40 100w, ${rp.titleImage}?w=150&format=avif&q=40 150w, ${rp.titleImage}?w=200&format=avif&q=40 200w`}
                        sizes="(max-width: 360px) 100px, (max-width: 768px) 150px, 200px"
                        alt={`${rp.title} - ${rp.category || 'Zedemy'}`}
                        className="related-post-image"
                        loading="lazy"
                        decoding="async"
                        fetchPriority="low"
                      />
                    </figure>
                  )}
                  <h3 className="related-post-title">
                    <Link to={`/post/${rp.slug}`} className="related-post-link" aria-label={`Read ${rp.title}`}>
                      {rp.title}
                    </Link>
                  </h3>
                </div>
              )) : <p>No related posts available.</p>}
            </section>
            <section className="references" aria-labelledby="references-heading">
              <h2 id="references-heading" className="section-heading">Further Reading</h2>
              {post.references?.length > 0 ? post.references.map(ref => (
                <a
                  key={ref.url}
                  href={ref.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="reference-link"
                  aria-label={`Visit ${ref.title}`}
                  dangerouslySetInnerHTML={{ __html: parseLinks(ref.title, post.category || '', true) }}
                />
              )) : (
                <>
                  <a href={`https://www.geeksforgeeks.org/${(post.category?.toLowerCase().replace(/\s+/g, '-') || 'tutorials')}-tutorials`} target="_blank" rel="noopener noreferrer" className="reference-link" aria-label={`GeeksforGeeks ${post.category || 'Tutorials'} Tutorials`}>
                    GeeksforGeeks: {post.category || 'Tutorials'} Tutorials
                  </a>
                  <a href={`https://developer.mozilla.org/en-US/docs/Web/${(post.category?.replace(/\s+/g, '') || 'Guide')}`} target="_blank" rel="noopener noreferrer" className="reference-link" aria-label={`MDN ${post.category || 'Documentation'} Documentation`}>
                    MDN: {post.category || 'Documentation'} Documentation
                  </a>
                </>
              )}
            </section>
          </main>
          <Sidebar
            post={post}
            isSidebarOpen={isSidebarOpen}
            setSidebarOpen={setSidebarOpen}
            activeSection={activeSection}
            scrollToSection={scrollToSection}
          />
        </Container>
      </MainContent>
    </Layout>
  );
});

export default PostPage;
