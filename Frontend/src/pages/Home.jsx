import React, { useEffect, useRef, useCallback, useState, memo, Suspense, lazy } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styled from 'styled-components';
import { Helmet } from 'react-helmet';
import Typed from 'typed.js';
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
  background:rgb(1, 1, 19);
  color: #e0e0e0;
  min-height: 100vh;
  padding: 2rem 5%;
  font-family: 'Arial', sans-serif;
  box-sizing: border-box;
`;

const NavBar = styled.nav`
  display: flex;
  gap: 1rem;
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 5px;
  margin-bottom: 2rem;

  a {
    color: #f4a261;
    text-decoration: none;
    font-size: 0.9rem;
    transition: color 0.2s;

    &:hover {
      color: #e76f51;
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
  min-height: 400px; /* Reserve space to prevent CLS */

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1.5rem;
    min-height: 300px; /* Adjusted for mobile */
  }
`;

const ImageSection = styled.div`
  width: 100%;
  aspect-ratio: 3 / 3;
  border-radius: 10px;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 10px;
  }
`;

const TextSection = styled.div`
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
  font-weight: bold;

  @media (max-width: 768px) {
    font-size: 1.5rem;
  }
`;

const Highlight = styled.span`
  color: #e76f51;
  font-weight: bold;
`;

const Description = styled.p`
  font-size: 1rem;
  color: #b0b0b0;
  margin: 0 0 1.5rem;
  line-height: 1.5;

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
  cursor: pointer;
  transition: background 0.2s, transform 0.1s;
  margin-bottom: 1rem;

  &:hover {
    background: #f4a261;
    transform: translateY(-2px);
  }
`;

const BlogLink = styled.p`
  font-size: 0.9rem;
  color: #b0b0b0;
  margin: 0 0 1rem;

  a {
    color: #f4a261;
    text-decoration: none;
    transition: color 0.2s;

    &:hover {
      color: #e76f51;
    }
  }

  @media (max-width: 768px) {
    font-size: 0.8rem;
  }
`;

const CertPreview = styled.div`
  background: #2a2a3e;
  padding: 1rem;
  border-radius: 8px;
  cursor: pointer;
  margin-bottom: 1rem;
  transition: background 0.2s;

  &:hover {
    background: #3a3a4e;
  }

  h3 {
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

const TypedSection = styled.div`
  width: 100%;
  max-width: 1200px;
  text-align: center;
  padding: 1rem 0;
  margin-top: 1rem;
`;

const TypedContent = styled.span`
  font-size: 1.2rem;
  font-weight: bold;
  color: #e76f51;

  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

const FaqSection = styled.div`
  width: 100%;
  max-width: 1200px;
  margin-top: 2rem;
`;

const FaqLink = styled(Link)`
  display: block;
  text-align: center;
  color: #f4a261;
  text-decoration: none;
  font-size: 0.9rem;
  margin-top: 1rem;
  transition: color 0.2s;

  &:hover {
    color: #e76f51;
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
    text-decoration: none;
    transition: color 0.2s;

    &:hover {
      color: #e76f51;
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
  }

  img {
    width: 20px;
    height: 20px;
    border-radius: 50%;
  }

  span {
    font-size: 0.9rem;
    color: #e0e0e0;
    font-weight: bold;
  }
`;

const PlaceholderBox = styled.div`
  width: 100%;
  height: 100%;
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
  const typedInstance = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  const initializeTyped = useCallback(() => {
    if (typedRef.current && !typedInstance.current) {
      typedInstance.current = new Typed(typedRef.current, {
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
    }
  }, []);

  useEffect(() => {
    setIsVisible(true);
    requestAnimationFrame(() => {
      initializeTyped();
    });
  }, [initializeTyped]);

  const handleCertificatePreview = useCallback(() => {
    window.open(
      'https://Zedemy-media-2025.s3.ap-south-1.amazonaws.com/certificates/Zedemy_by_HogwartsEdx_VS%20Code_2025-04-20_5c0f2f41-57cb-46ce-89ef-0a89298b002a.pdf?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIA5BQ4NJCXBUCDIMHH%2F20250423%2Fap-south-1%2Fs3%2Faws4_request&X-Amz-Date=20250423T095231Z&X-Amz-Expires=60&X-Amz-Signature=870f6be370cb38e4bc51daef097ad46803530cc7f90851f1f128aff0279fdef3&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject',
      '_blank'
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
        url: 'https://zedemy-media-2025.s3.ap-south-1.amazonaws.com/zedemy-logo.png',
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
          content="Zedemy by Sanjay Patidar: Category-based courses, certificates and code formatting. Master skills with Indian-rooted online learning platform for career growth!"
        />
        <meta
          name="keywords"
          content="Zedemy, Sanjay Patidar, online tech courses, learn coding, certificate verification, in-browser code editor, serverless LMS, React.js, AWS Lambda, web development, AI, Python, tech education"
        />
        <meta name="author" content="Sanjay Patidar" />
        <meta name="robots" content="index, follow" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" href="https://zedemy-media-2025.s3.ap-south-1.amazonaws.com/zedemy-logo.png" />
        <link rel="canonical" href="https://zedemy.vercel.app/" />
        <link rel="preload" as="image" href="https://zedemy-media-2025.s3.ap-south-1.amazonaws.com/zedemy_header_image.webp" />
        <link rel="preload" as="image" href="https://zedemy-media-2025.s3.ap-south-1.amazonaws.com/zedemy-logo.png" />
        <link rel="preconnect" href="https://zedemy-media-2025.s3.ap-south-1.amazonaws.com" crossorigin />
        <link rel="dns-prefetch" href="https://zedemy-media-2025.s3.ap-south-1.amazonaws.com" />
        <meta http-equiv="Cache-Control" content="public, max-age=31536000" />
        <meta property="og:title" content="Zedemy: Courses, Code & Certificates by Sanjay Patidar" />
        <meta
          property="og:description"
          content="Zedemy by Sanjay Patidar: Category-based courses, certificates and code formatting. Master skills with Indian-rooted online learning platform for career growth!"
        />
        <meta
          property="og:image"
          content="https://zedemy-media-2025.s3.ap-south-1.amazonaws.com/zedemy-logo.png"
        />
        <meta property="og:url" content="https://zedemy.vercel.app/" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Zedemy: Courses, Code & Certificates by Sanjay Patidar" />
        <meta
          name="twitter:image"
          content="https://zedemy-media-2025.s3.ap-south-1.amazonaws.com/zedemy-logo.png"
        />
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      </Helmet>
      <MainContainer role="main" aria-label="Zedemy Homepage">
        <NavBar aria-label="Breadcrumb navigation">
          <Link to="/">Home</Link>
          <Link to="/explore">Explore New Blogs</Link>
          <Link to="/faq">About Zedemy</Link>
        </NavBar>
        <MainContent style={{ opacity: isVisible ? 1 : 0, transition: 'opacity 0.2s ease-in' }}>
          <ImageSection>
            <LazyLoad height="100%" offset={100} placeholder={<PlaceholderBox aria-hidden="true">Loading image...</PlaceholderBox>}>
              <img
                src="https://zedemy-media-2025.s3.ap-south-1.amazonaws.com/zedemy_header_image.webp"
                srcSet="
                  https://zedemy-media-2025.s3.ap-south-1.amazonaws.com/zedemy_header_image_320.webp 320w,
                  https://zedemy-media-2025.s3.ap-south-1.amazonaws.com/zedemy_header_image_500.webp 500w,
                  https://zedemy-media-2025.s3.ap-south-1.amazonaws.com/zedemy_header_image.webp 800w
                "
                sizes="(max-width: 600px) 320px, (max-width: 768px) 500px, 800px"
                alt="Interactive tech learning experience on Zedemy"
                width="400" /* Explicit dimensions to reserve space */
                height="400" /* Matches aspect-ratio 3/3 */
                loading="lazy"
                decoding="async"
              />
            </LazyLoad>
          </ImageSection>
          <TextSection>
            <Title>
              <Highlight>Z</Highlight>edemy by Hog<Highlight>W</Highlight>arts<Highlight>E</Highlight>dx
            </Title>
            <Description>Experience the future of tech education with intelligent features</Description>
            <ActionButton onClick={() => navigate('/explore')} aria-label="Explore latest tech courses">
              Explore New Blogs
            </ActionButton>
            <BlogLink>
              Discover coding topics by category and dive deeper with hands-on tips in our{' '}
              <Link to="/explore" aria-label="Visit blog posts">Blogs</Link>
            </BlogLink>
            <CertPreview onClick={handleCertificatePreview} role="button" tabIndex={0} aria-label="View certificate preview">
              <h3>Certificate Preview</h3>
              <p>Earn your HogWartsEdx certificate in courses like Wizarding VS Code Mastery!</p>
            </CertPreview>
            <Suspense fallback={<PlaceholderBox aria-hidden="true">Loading share buttons...</PlaceholderBox>}>
              <ShareButton url="https://zedemy.vercel.app/" title="Zedemy | Online Tech Education Platform" />
            </Suspense>
          </TextSection>
        </MainContent>
        <TypedSection>
          <TypedContent>
            <span ref={typedRef} />
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
            <img src={CreaTeaImage} alt="Creativity icon" loading="lazy" decoding="async" />
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
            <span> | </span>
            <Link to="/editor" aria-label="Try in-browser code editor">
              Code Editor
            </Link>
            <span> | </span>
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
