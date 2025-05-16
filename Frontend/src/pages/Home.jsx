import React, { useRef, useEffect, useCallback, memo, Suspense, lazy } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styled from 'styled-components';
import { Helmet } from 'react-helmet';
// import Typed from 'typed.js'; // Temporarily disabled
import LazyLoad from 'react-lazyload';

// Lazy-loaded components
const ShareButton = lazy(() => import('../components/ShareButton'));
const FAQ = lazy(() => import('../components/FAQ'));

// Assets
import CreaTeaImage from '../assets/tea.gif';

// Styled Components
const MainContainer = styled.main`
  display: flex;
  flex-direction: column;
  align-items: center;
  background: rgb(1, 1, 19);
  color: #e0e0e0;
  min-height: 100vh;
  padding: 2rem 5%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
  box-sizing: border-box;
`;

const NavBar = styled.header`
  display: flex;
  justify-content: center;
  gap: 1rem;
  padding: 0.5rem 1rem;
  border-radius: 5px;
  margin-bottom: 2rem;
  width: 100%;
  max-width: 1200px;

  a {
    color: #f4a261;
    text-decoration: none;
    font-size: 0.9rem;
    font-weight: 500;
    padding: 0.25rem 0.5rem;
    transition: color 0.2s ease;

    &:hover,
    &:focus {
      color: #e76f51;
      outline: none;
    }
  }
`;

const MainContent = styled.section`
  display: grid;
  grid-template-columns: 1fr 1fr;
  width: 100%;
  max-width: 1200px;
  gap: 2rem;
  align-items: start;
  min-height: 400px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1.5rem;
    min-height: 300px;
  }
`;

const ImageSection = styled.figure`
  width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: 10px;
  overflow: hidden;
  margin: 0;
`;

const StyledImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 10px;
  display: block;
`;

const TextSection = styled.section`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 1rem;
`;

const Title = styled.h1`
  font-size: 2rem;
  color: #f4a261;
  margin: 0 0 1rem;
  font-weight: 700;

  @media (max-width: 768px) {
    font-size: 1.5rem;
  }
`;

const Highlight = styled.span`
  color: #e76f51;
`;

const Description = styled.p`
  font-size: 1rem;
  color: #b0b0b0;
  margin: 0 0 1.5rem;
  line-height: 1.6;

  @media (max-width: 768px) {
    font-size: 0.9rem;
  }
`;

const ActionButton = styled.button`
  background: #e76f51;
  color: #fff;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s ease, transform 0.1s ease;

  &:hover,
  &:focus {
    background: #f4a261;
    transform: translateY(-2px);
    outline: none;
  }
`;

const BlogLink = styled.p`
  font-size: 0.9rem;
  color: #b0b0b0;
  margin: 0 0 1rem;

  a {
    color: #f4a261;
    text-decoration: underline;
    transition: color 0.2s ease;

    &:hover,
    &:focus {
      color: #e76f51;
      outline: none;
    }
  }

  @media (max-width: 768px) {
    font-size: 0.8rem;
  }
`;

const CertPreview = styled.article`
  background: #2a2a3e;
  padding: 1rem;
  border-radius: 8px;
  cursor: pointer;
  margin-bottom: 1rem;
  transition: background 0.2s ease;

  &:hover,
  &:focus {
    background: #3a3a4e;
    outline: none;
  }

  h2 {
    font-size: 1rem;
    color: #f4a261;
    margin: 0 0 0.5rem;
  }

  p {
    font-size: 0.8rem;
    color: #b0b0b0;
    margin: 0;
  }
`;

const TypedSection = styled.section`
  width: 100%;
  max-width: 1200px;
  text-align: center;
  padding: 1rem 0;
  margin-top: 1rem;
  min-height: 2rem;
`;

const TypedContent = styled.span`
  font-size: 1.2rem;
  font-weight: 600;
  color: #e76f51;
  display: inline-block;
  min-width: 200px;
  text-align: center;

  @media (max-width: 768px) {
    font-size: 1rem;
    min-width: 150px;
  }
`;

const FaqSection = styled.section`
  width: 100%;
  max-width: 1200px;
  margin-top: 2rem;
`;

const FaqLink = styled(Link)`
  display: block;
  text-align: center;
  color: #f4a261;
  text-decoration: underline;
  font-size: 0.9rem;
  margin-top: 1rem;
  transition: color 0.2s ease;

  &:hover,
  &:focus {
    color: #e76f51;
    outline: none;
  }
`;

const FooterSection = styled.footer`
  width: 100%;
  max-width: 1200px;
  text-align: center;
  padding: 1rem 0;
  margin-top: 2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);

  p {
    font-size: 0.9rem;
    color: #b0b0b0;
    margin: 0 0 0.5rem;
  }

  a {
    color: #f4a261;
    text-decoration: underline;
    transition: color 0.2s ease;

    &:hover,
    &:focus {
      color: #e76f51;
      outline: none;
    }
  }

  nav {
    display: flex;
    justify-content: center;
    gap: 1rem;

    a {
      font-size: 0.9rem;
    }
  }
`;

const MadeWith = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1rem;

  h2 {
    font-size: 0.9rem;
    color: #b0b0b0;
    margin: 0;
    font-weight: 500;
  }

  img {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    display: block;
  }

  span {
    font-size: 0.9rem;
    color: #e0e0e0;
    font-weight: 600;
  }
`;

const PlaceholderBox = styled.div`
  width: 100%;
  height: 100%;
  min-height: 100px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #b0b0b0;
  font-size: 0.9rem;
`;

const Home = memo(() => {
  const navigate = useNavigate();
  const typedRef = useRef(null);

  console.log('[Home.jsx] Rendering Home component');

  // Temporarily disabled Typed.js to isolate issue
  /*
  useEffect(() => {
    if (typeof window !== 'undefined' && typedRef.current) {
      console.log('[Home.jsx] Initializing Typed.js');
      const typed = new Typed(typedRef.current, {
        strings: [
          'AI-Powered Learning',
          'Real-Time Customization',
          'Smart Certificates',
          'Adaptive UI/UX',
          'Intelligent Design Systems',
          'Future-Ready Platform',
        ],
        typeSpeed: 50,
        backSpeed: 25,
        backDelay: 1500,
        loop: true,
      });

      return () => {
        console.log('[Home.jsx] Destroying Typed.js');
        typed.destroy();
      };
    } else {
      console.warn('[Home.jsx] Typed.js not initialized: window or typedRef unavailable');
    }
  }, []);
  */

  const handleCertificatePreview = useCallback(() => {
    console.log('[Home.jsx] Opening certificate preview');
    window.open(
      'https://Zedemy-media-2025.s3.ap-south-1.amazonaws.com/certificates/Zedemy_by_HogwartsEdx_VS%20Code_2025-04-20_5c0f2f41-57cb-46ce-89ef-0a89298b002a.pdf',
      '_blank',
      'noopener,noreferrer'
    );
  }, []);

  const displayedFAQs = [
    {
      name: 'What is Zedemy?',
      text: 'Zedemy is a serverless learning platform for tech education, offering course uploads, certificate verification, and in-browser coding for learners worldwide.',
    },
    {
      name: 'Does Zedemy offer free courses?',
      text: 'Yes, Zedemy provides a range of free courses alongside premium options, catering to learners at all levels.',
    },
    {
      name: 'How can I verify a Zedemy certificate?',
      text: 'Use Zedemy’s <a href="/certificate-verification" aria-label="Verify certificates">certificate verification page</a> to authenticate certificates securely and instantly.',
    },
  ];

  const structuredData = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Zedemy: Courses, Code & Certificates by Sanjay Patidar',
      description:
        'Zedemy, founded by Sanjay Patidar, is a serverless platform offering tech courses, certificate verification, and in-browser coding. Learn coding and tech skills today.',
      url: 'https://zedemy.vercel.app/',
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': 'https://zedemy.vercel.app/',
      },
      author: {
        '@type': 'Person',
        name: 'Sanjay Patidar',
        url: 'https://sanjay-patidar.vercel.app/',
      },
      publisher: {
        '@type': 'Organization',
        name: 'Zedemy',
        logo: {
          '@type': 'ImageObject',
          url: 'https://zedemy-media-2025.s3.ap-south-1.amazonaws.com/zedemy-logo.png',
        },
      },
      image: {
        '@type': 'ImageObject',
        url: 'https://zedemy-media-2025.s3.ap-south-1.amazonaws.com/zedemy_header_image.webp',
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Zedemy',
      url: 'https://zedemy.vercel.app/',
      logo: {
        '@type': 'ImageObject',
        url: 'https://zedemy-media-2025.s3.ap-south-1.amazonaws.com/zedemy-logo.png',
      },
      founder: {
        '@type': 'Person',
        name: 'Sanjay Patidar',
        url: 'https://sanjay-patidar.vercel.app/',
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: 'https://zedemy.vercel.app/',
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Explore',
          item: 'https://zedemy.vercel.app/explore',
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: 'About',
          item: 'https://zedemy.vercel.app/faq',
        },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: displayedFAQs.map(faq => ({
        '@type': 'Question',
        name: faq.name,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.text,
        },
      })),
    },
  ];

  return (
    <>
      <Helmet>
        <html lang="en" />
        <title>Zedemy: Courses, Code & Certificates by Sanjay Patidar</title>
        <meta
          name="description"
          content="Zedemy by Sanjay Patidar: Category-based courses, certificates, and in-browser coding. Master tech skills with an Indian-rooted online learning platform."
        />
        <meta
          name="keywords"
          content="Zedemy, Sanjay Patidar, online tech courses, learn coding, certificate verification, in-browser code editor, serverless LMS, React.js, AWS Lambda, web development, AI, Python, tech education"
        />
        <meta name="author" content="Sanjay Patidar" />
        <meta name="robots" content="index, follow" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="icon" href="https://zedemy-media-2025.s3.ap-south-1.amazonaws.com/zedemy-logo.png" type="image/png" />
        <link rel="canonical" href="https://zedemy.vercel.app/" />
        <link rel="preload" fetchpriority="high" as="image" href="https://zedemy-media-2025.s3.ap-south-1.amazonaws.com/zedemy_header_image.webp" type="image/webp" />
        <link rel="preload" as="image" href="https://zedemy-media-2025.s3.ap-south-1.amazonaws.com/zedemy-logo.png" type="image/png" />
        <link rel="preconnect" href="https://zedemy-media-2025.s3.ap-south-1.amazonaws.com" crossorigin="anonymous" />
        <link rel="dns-prefetch" href="https://zedemy-media-2025.s3.ap-south-1.amazonaws.com" />
        <meta http-equiv="Cache-Control" content="public, max-age=31536000, immutable" />
        <meta property="og:title" content="Zedemy: Courses, Code & Certificates by Sanjay Patidar" />
        <meta
          property="og:description"
          content="Zedemy by Sanjay Patidar: Category-based courses, certificates, and in-browser coding. Master tech skills with an Indian-rooted online learning platform."
        />
        <meta property="og:image" content="https://zedemy-media-2025.s3.ap-south-1.amazonaws.com/zedemy_header_image.webp" />
        <meta property="og:image:alt" content="Zedemy tech learning platform logo" />
        <meta property="og:url" content="https://zedemy.vercel.app/" />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="en_US" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Zedemy: Courses, Code & Certificates by Sanjay Patidar" />
        <meta
          name="twitter:description"
          content="Zedemy by Sanjay Patidar: Category-based courses, certificates, and in-browser coding. Master tech skills with an Indian-rooted online learning platform."
        />
        <meta name="twitter:image" content="https://zedemy-media-2025.s3.ap-south-1.amazonaws.com/zedemy_header_image.webp" />
        <meta name="twitter:image:alt" content="Zedemy tech learning platform logo" />
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      </Helmet>
      <MainContainer role="main" aria-label="Zedemy Homepage">
        <NavBar aria-label="Main navigation">
          <Link to="/" aria-current="page">Home</Link>
          <Link to="/explore">Explore Blogs</Link>
          <Link to="/faq">About Zedemy</Link>
        </NavBar>
        <MainContent>
          <ImageSection>
            <LazyLoad height={400} offset={100} once>
              <StyledImage
                src="https://zedemy-media-2025.s3.ap-south-1.amazonaws.com/zedemy_header_image.webp"
                srcSet="
                  https://zedemy-media-2025.s3.ap-south-1.amazonaws.com/zedemy_header_image_320.webp 320w,
                  https://zedemy-media-2025.s3.ap-south-1.amazonaws.com/zedemy_header_image_500.webp 500w,
                  https://zedemy-media-2025.s3.ap-south-1.amazonaws.com/zedemy_header_image.webp 800w
                "
                sizes="(max-width: 600px) 320px, (max-width: 768px) 500px, 800px"
                alt="Interactive tech learning experience on Zedemy"
                width="400"
                height="400"
                loading="eager"
                fetchpriority="high"
                decoding="async"
              />
            </LazyLoad>
          </ImageSection>
          <TextSection>
            <Title>
              <Highlight>Z</Highlight>edemy by Hog<Highlight>W</Highlight>arts<Highlight>E</Highlight>dx
            </Title>
            <Description>Master tech skills with intelligent, category-based learning</Description>
            <ActionButton onClick={() => navigate('/explore')} aria-label="Explore latest tech courses">
              Explore Blogs
            </ActionButton>
            <BlogLink>
              Discover coding topics and hands-on tips in our{' '}
              <Link to="/explore" aria-label="Visit blog posts">Blogs</Link>
            </BlogLink>
            <CertPreview
              onClick={handleCertificatePreview}
              onKeyDown={(e) => e.key === 'Enter' && handleCertificatePreview()}
              role="button"
              tabIndex={0}
              aria-label="View certificate preview"
            >
              <h2>Certificate Preview</h2>
              <p>Earn your HogWartsEdx certificate in courses like Wizarding VS Code Mastery!</p>
            </CertPreview>
            <Suspense fallback={<PlaceholderBox aria-hidden="true">Loading...</PlaceholderBox>}>
              <ShareButton url="https://zedemy.vercel.app/" title="Zedemy | Online Tech Education Platform" />
            </Suspense>
          </TextSection>
        </MainContent>
        <TypedSection>
          <TypedContent>
            <span ref={typedRef} aria-live="polite">AI-Powered Learning</span> {/* Static fallback */}
          </TypedContent>
        </TypedSection>
        <FaqSection>
          <Suspense fallback={<PlaceholderBox aria-hidden="true">Loading FAQs...</PlaceholderBox>}>
            <FAQ faqs={displayedFAQs} />
            <FaqLink to="/faq" aria-label="View all frequently asked questions">
              View All FAQs
            </FaqLink>
          </Suspense>
        </FaqSection>
        <MadeWith>
          <h2>Made With</h2>
          <h2>
            <span>Crea</span>
            <img src={CreaTeaImage} alt="Creativity icon" loading="lazy" decoding="async" width="20" height="20" />
            <span>vity</span>
          </h2>
        </MadeWith>
        <FooterSection>
          <p>
            Founded by{' '}
            <a
              href="https://sanjay-patidar.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Visit Sanjay Patidar's personal website"
            >
              Sanjay Patidar
            </a>
            . Join the{' '}
            <Link to="/faq" aria-label="Learn more about Zedemy">
              Zedemy community
            </Link>{' '}
            for tech education.
          </p>
          <nav aria-label="Footer navigation">
            <Link to="/certificate-verification" aria-label="Verify certificates">
              Verify Certificates
            </Link>
            <span aria-hidden="true"> | </span>
            <Link to="/editor" aria-label="Try in-browser code editor">
              Code Editor
            </Link>
            <span aria-hidden="true"> | </span>
            <Link to="/category/web-development" aria-label="Explore web development courses">
              Web Development
            </Link>
          </nav>
        </FooterSection>
      </MainContainer>
    </>
  );
});

export default Home;
