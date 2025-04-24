import React, { useEffect, useRef, useState, memo, Suspense, lazy } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styled, { keyframes, css } from 'styled-components';
import { Helmet } from 'react-helmet';
import Typed from 'typed.js';
import LazyLoad from 'react-lazyload';
// Lazy-loaded components
const ShareButton = lazy(() => import('../components/ShareButton'));
const FAQ = lazy(() => import('../components/FAQ'));

// Assets
import CreaTeaImage from '../assets/tea.gif';

// Animations
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
`;

const float = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-20px); }
  100% { transform: translateY(0px); }
`;

const parchmentWave = keyframes`
  0% { transform: scale(1) rotate(0deg); }
  50% { transform: scale(1.02) rotate(1deg); }
  100% { transform: scale(1) rotate(0deg); }
`;

// Shared styles
const sharedSectionStyles = css`
  margin-top: 20px;
  padding: 20px;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 15px;
  backdrop-filter: blur(10px);
`;

// Styled Components
const HomeContainer = styled.main`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #fff;
  text-align: center;
  padding: 2rem;
  min-height: 100vh;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background:rgb(2, 14, 25);
    filter: blur(8px) brightness(0.7);
    z-index: -1;
    animation: ${fadeIn} 2s ease-out;
  }
`;

const ContentWrapper = styled.section`
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-areas:
    'text gif'
    'typed typed'
    'cert cert';
  gap: 1rem;
  max-width: 1400px;
  width: 100%;
  padding: 1rem;
  animation: ${fadeIn} 1.5s ease-out;

  @media (max-width: 768px) {
    grid-template-areas:
      'gif'
      'text'
      'typed'
      'cert';
  }
`;

const TextContainer = styled.div`
  grid-area: text;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  border-radius: 20px;
  backdrop-filter: blur(10px);
`;

const TypedContainer = styled.div`
  grid-area: typed;
  min-height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  border-radius: 15px;
`;

const TypedText = styled.span`
  font-size: 2.5rem;
  font-weight: 700;
  text-transform: uppercase;
  background: linear-gradient(45deg, #ff6f00, #ffcc80);
  -webkit-background-clip: text;
  color: transparent;

  @media (max-width: 768px) {
    font-size: 1.5rem;
  }
`;

const Subtitle = styled.h2`
  font-size: 1.8rem;
  color: #ffcc80;
  text-shadow: 2px 2px 6px rgba(0, 0, 0, 0.7);
  line-height: 1.4;
  margin: 1rem 0;

  @media (max-width: 768px) {
    font-size: 1.3rem;
  }
`;

const GifContainer = styled.figure`
  grid-area: gif;
  max-width: 600px;
  width: 100%;
  height: 400px;
  animation: ${float} 6s ease-in-out infinite;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 20px;
    transition: transform 0.3s ease;

    &:hover {
      transform: scale(1.05);
    }
  }

  @media (max-width: 768px) {
    height: 300px;
  }
`;

const H3 = styled.h1`
  color: #2e35d2;
  font-size: 3rem;
  margin: 0 0 1rem;
  font-weight: 900;
  font-family: 'Playfair Display', serif;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
  transform: skew(-5deg);

  @media (max-width: 768px) {
    font-size: 1.8rem;
  }
`;

const StyledText = styled.span`
  .eduxcel-text {
    font-size: 40px;
    font-weight: bold;
    position: relative;
    color: #fff;

    &:hover {
      color: #fbbf24;
    }

    .x-letter {
      color: #fbbf24;
      margin-left: 10px;
      font-size: 48px;
      font-family: 'Bangers', cursive;
      transform: skew(-20deg, -5deg) scaleX(1.2);
      display: inline-block;
      position: relative;
      top: -5px;
      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
    }
  }

  @media (max-width: 768px) {
    .eduxcel-text {
      font-size: 24px;
    }
    .x-letter {
      font-size: 28px;
    }
  }
`;

const CallToAction = styled.button`
  background: linear-gradient(45deg, #ff6f00, #ffcc80);
  color: #fff;
  padding: 0.8rem 1.5rem;
  border: none;
  border-radius: 50px;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 5px 15px rgba(255, 108, 0, 0.4);
  position: relative;
  overflow: hidden;

  &:before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    transform: translate(-50%, -50%);
    transition: width 0.6s ease, height 0.6s ease;
  }

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 25px rgba(255, 108, 0, 0.6);
    background: linear-gradient(45deg, #ff8c00, #ffd700);

    &:before {
      width: 300px;
      height: 300px;
    }
  }
`;

const CertificatePreview = styled.div`
  grid-area: cert;
  max-width: 400px;
  width: 100%;
  padding: 1rem;
  background: url('https://www.transparenttextures.com/patterns/parchment.png');
  border-radius: 15px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
  animation: ${parchmentWave} 4s infinite ease-in-out;
  text-align: center;
  color: #2f2f4f;

  h3 {
    font-size: 1.2rem;
    margin-bottom: 0.5rem;
    color: #d3a625;
  }

  p {
    font-size: 0.9rem;
    line-height: 1.4;
  }

  @media (max-width: 768px) {
    max-width: 100%;
  }
`;

const SubtitleBlog = styled.p`
  font-size: 1.4rem;
  color: #ccc;
  margin: 2rem 0 1rem;
  padding: 0.5rem 1rem;
  border: 2px solid #ccc;
  border-radius: 20px;

  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

const SubtitleLink = styled(Link)`
  color: #ffcc80;
  text-decoration: none;
  position: relative;
  transition: color 0.3s;

  &:hover {
    color: #ff6f00;

    &:before {
      content: '';
      position: absolute;
      width: 100%;
      height: 2px;
      background: linear-gradient(45deg, #ff6f00, #ffcc80);
      bottom: 0;
      left: 0;
      transform: scaleX(1);
      transform-origin: bottom center;
      transition: transform 0.3s;
    }
  }
`;

const TeaContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  margin-top: 1rem;
  gap: 0.5rem;

  @media (max-width: 768px) {
    gap: 0.25rem;
  }
`;

const H1 = styled.h2`
  font-size: 1.5rem;
  font-weight: 900;
  color: #2ecc71;
  font-family: 'Playfair Display', serif;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
  letter-spacing: 2px;
  transform: skew(-5deg);
  margin: 0 0.5rem;

  @media (max-width: 768px) {
    font-size: 1.2rem;
  }
`;

const StyledSpan = styled.span`
  color: #ffffff;
  font-size: 1.5rem;
  font-weight: bold;
  font-family: 'Playfair Display', serif;
  letter-spacing: 3px;
  text-transform: uppercase;
  text-decoration: underline;

  @media (max-width: 768px) {
    font-size: 1.2rem;
  }
`;

const StyledCreaTeaImage = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  box-shadow: 0px 0px 10px rgba(46, 204, 113, 0.5);

  @media (max-width: 768px) {
    width: 30px;
    height: 30px;
  }
`;

const BreadcrumbNav = styled.nav`
  ${sharedSectionStyles}
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: center;
  margin-bottom: 20px;

  a {
    color: #ffcc80;
    text-decoration: none;
    &:hover {
      text-decoration: underline;
    }
  }
`;

const Footer = styled.footer`
  ${sharedSectionStyles}
  width: 100%;
  text-align: center;
  padding: 1rem;
  margin-top: 2rem;
`;

const ViewAllFAQs = styled(Link)`
  display: inline-block;
  margin-top: 1rem;
  color: #ffcc80;
  text-decoration: none;
  font-weight: 600;
  transition: color 0.3s;

  &:hover {
    color: #ff6f00;
  }
`;

const Home = memo(() => {
  const navigate = useNavigate();
  const typedRef = useRef(null);
  const typedInstance = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);

    if (typedRef.current) {
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
        onStringTyped: () => {
          if (typedRef.current) {
            typedRef.current.style.fontFamily = "'Amatic SC', cursive";
          }
        },
      });
    }

    return () => {
      typedInstance.current?.destroy();
    };
  }, []);

  const handleCertificatePreview = () => {
    window.open(
      'https://zedemy-media-2025.s3.ap-south-1.amazonaws.com/certificates/Zedemy_by_HogwartsEdx_VS%20Code_2025-04-20_5c0f2f41-57cb-46ce-89ef-0a89298b002a.pdf?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIA5BQ4NJCXBUCDIMHH%2F20250423%2Fap-south-1%2Fs3%2Faws4_request&X-Amz-Date=20250423T095231Z&X-Amz-Expires=60&X-Amz-Signature=870f6be370cb38e4bc51daef097ad46803530cc7f90851f1f128aff0279fdef3&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject',
      '_blank'
    );
  };

  // SEO Structured Data
  const faqData = [
    {
      '@type': 'Question',
      name: 'What is Zedemy?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Zedemy is a serverless learning platform for tech education, offering course uploads, certificate verification, and in-browser coding for learners worldwide.',
      },
    },
    {
      '@type': 'Question',
      name: 'Who founded Zedemy?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Zedemy was founded by Sanjay Patidar, a Software Development Engineer specializing in full-stack development and AI-driven solutions.',
      },
    },
    {
      '@type': 'Question',
      name: 'What can I learn on Zedemy?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'On Zedemy, you can learn web development, AI, cloud computing, JavaScript, Python, and more through expert-led courses and hands-on coding.',
      },
    },
    {
      '@type': 'Question',
      name: 'How does Zedemy verify certificates?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Zedemy uses a secure, blockchain-inspired system to verify course completion certificates, ensuring authenticity for learners and employers.',
      },
    },
    {
      '@type': 'Question',
      name: 'What is Zedemy’s in-browser code editor?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Zedemy’s in-browser code editor allows users to write, test, and share code in languages like JavaScript, Python, and HTML without any setup.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I create and upload courses on Zedemy?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, educators and creators can upload courses on Zedemy, sharing expertise in tech fields like programming, AI, and cloud computing.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is Zedemy suitable for beginners in tech?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Absolutely, Zedemy offers beginner-friendly courses with step-by-step guidance, making it ideal for those new to tech and coding.',
      },
    },
    {
      '@type': 'Question',
      name: 'How does Zedemy personalize learning?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Zedemy provides customizable themes, adaptive content, and personalized settings to tailor the learning experience to individual needs.',
      },
    },
    {
      '@type': 'Question',
      name: 'What technologies power Zedemy?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Zedemy is built with React.js, Node.js, AWS Lambda, and MongoDB, delivering a scalable and seamless user experience.',
      },
    },
    {
      '@type': 'Question',
      name: 'How can I join Zedemy’s tech community?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Visit zedemy.vercel.app to sign up, learn, create courses, and connect with a global community of tech enthusiasts and educators.',
      },
    },
    {
      '@type': 'Question',
      name: 'Why choose Zedemy for online tech education?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Zedemy offers a unique combination of course creation, in-browser coding, and certificate verification, making it a top choice for tech learners.',
      },
    },
    {
      '@type': 'Question',
      name: 'Does Zedemy offer free courses?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, Zedemy provides a range of free courses alongside premium options, catering to learners at all levels.',
      },
    },
    {
      '@type': 'Question',
      name: 'How can I verify a Zedemy certificate?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Use Zedemy’s certificate verification page at /certificate-verification to authenticate certificates securely and instantly.',
      },
    },
  ];

  // FAQs to display on homepage (subset of faqData)
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
      name: 'Zedemy | Online Tech Education Platform by Sanjay Patidar',
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
          url: 'https://sanjaybasket.s3.ap-south-1.amazonaws.com/zedemy-logo.png',
        },
      },
      image: {
        '@type': 'ImageObject',
        url: 'https://sanjaybasket.s3.ap-south-1.amazonaws.com/zedemy-logo.png',
      },
      inLanguage: 'en',
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Zedemy',
      url: 'https://zedemy.vercel.app/',
      logo: {
        '@type': 'ImageObject',
        url: 'https://sanjaybasket.s3.ap-south-1.amazonaws.com/zedemy-logo.png',
      },
      founder: {
        '@type': 'Person',
        name: 'Sanjay Patidar',
        url: 'https://sanjay-patidar.vercel.app/',
      },
      sameAs: [
        'https://www.linkedin.com/in/sanjay-patidar/',
        'https://twitter.com/sanjaypatidar',
        'https://www.instagram.com/sanjaypatidar_/',
        'https://www.facebook.com/zedemy',
      ],
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
      mainEntity: faqData,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Zedemy',
      url: 'https://zedemy.vercel.app/',
      potentialAction: {
        '@type': 'SearchAction',
        target: 'https://zedemy.vercel.app/explore?search={search_term_string}',
        'query-input': 'required name=search_term_string',
      },
    },
  ];

  return (
    <>
      <Helmet>
        <html lang="en" />
        <title>Zedemy | Learn & Build Tech Skills | Sanjay Patidar</title>
        <meta
          name="description"
          content="Zedemy, founded by Sanjay Patidar, offers online tech courses, certificate verification, and in-browser coding. Learn web development, AI, and more."
        />
        <meta
          name="keywords"
          content="Zedemy, Sanjay Patidar, online tech courses, learn coding, certificate verification, in-browser code editor, serverless LMS, React.js, AWS Lambda, web development, AI, Python, tech education"
        />
        <meta name="author" content="Sanjay Patidar" />
        <meta name="robots" content="index, follow, max-image-preview:large" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" type="image/svg+xml" href="https://sanjaybasket.s3.ap-south-1.amazonaws.com/zedemy-logo.png" />
        <link rel="canonical" href="https://zedemy.vercel.app/" />
        <link rel="preload" as="image" href="https://sanjaybasket.s3.ap-south-1.amazonaws.com/zedemy-logo.png" />
        <link
          rel="preload"
          as="image"
          href="https://sanjaybasket.s3.ap-south-1.amazonaws.com/Student-home-header-1.gif"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Amatic+SC&family=Bangers&display=swap"
          rel="stylesheet"
          media="print"
          onload="this.media='all'"
        />
        <meta property="og:title" content="Zedemy | Learn & Build Tech Skills | Sanjay Patidar" />
        <meta
          property="og:description"
          content="Zedemy, founded by Sanjay Patidar, offers online tech courses, certificate verification, and in-browser coding. Learn web development, AI, and more."
        />
        <meta
          property="og:image"
          content="https://sanjaybasket.s3.ap-south-1.amazonaws.com/zedemy-logo.png"
        />
        <meta property="og:image:alt" content="Zedemy Tech Education Platform Logo" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:url" content="https://zedemy.vercel.app/" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Zedemy" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Zedemy | Learn & Build Tech Skills | Sanjay Patidar" />
        <meta
          name="twitter:description"
          content="Zedemy, founded by Sanjay Patidar, offers online tech courses, certificate verification, and in-browser coding. Learn web development, AI, and more."
        />
        <meta
          name="twitter:image"
          content="https://sanjaybasket.s3.ap-south-1.amazonaws.com/zedemy-logo.png"
        />
        <meta name="twitter:image:alt" content="Zedemy Tech Education Platform Logo" />
        <meta name="twitter:site" content="@sanjaypatidar" />
        <meta name="twitter:creator" content="@sanjaypatidar" />
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      </Helmet>

      <HomeContainer role="main" aria-label="Zedemy Homepage">
        <header>
          <BreadcrumbNav aria-label="Breadcrumb navigation">
            <Link to="/">Home</Link> 
            <Link to="/explore">Explore Courses</Link> 
            <Link to="/faq">About Zedemy</Link>
          </BreadcrumbNav>
        </header>

        <ContentWrapper style={{ opacity: isVisible ? 1 : 0 }}>
          <TextContainer>
            <StyledText>
              <H3>
                Welcome to <span className="eduxcel-text">Hog<span className="x-letter">W</span>arts<span className="x-letter">E</span>dx</span>{' '}
              
              </H3>
            </StyledText>
            <Subtitle>Experience the future of tech education with intelligent features</Subtitle>
            <CallToAction onClick={() => navigate('/explore')} aria-label="Explore latest tech courses">
              Explore Courses
            </CallToAction>
            <SubtitleBlog>
              Discover coding topics by category and dive deeper with hands-on tips in our{' '}
              <SubtitleLink to="/explore" aria-label="Visit blog posts">
                Blogs
              </SubtitleLink>
              .
            </SubtitleBlog>
            <CertificatePreview onClick={handleCertificatePreview} role="button" tabIndex={0} aria-label="View certificate preview">
              <h3>Certificate Preview</h3>
              <p>Earn your HogWartsEdx certificate in courses like Wizarding VS Code Mastery!</p>
            </CertificatePreview>
            <Suspense fallback={<div>Loading share buttons...</div>}>
              <ShareButton url="https://zedemy.vercel.app/" title="Zedemy | Online Tech Education Platform" />
            </Suspense>
          </TextContainer>
          <GifContainer>
            <LazyLoad height={400} offset={100}>
              <img
                src="https://zedemy-media-2025.s3.ap-south-1.amazonaws.com/home_header_Zedemy.webp"
                alt="Interactive tech learning experience on Zedemy"
                width="600"
                height="400"
                loading="lazy"
              />
            </LazyLoad>
          </GifContainer>
          <TypedContainer>
            <TypedText>
              <span ref={typedRef} />
            </TypedText>
          </TypedContainer>
        </ContentWrapper>

        <Suspense fallback={<div>Loading FAQs...</div>}>
          <FAQ faqs={displayedFAQs} />
          <ViewAllFAQs to="/faq" aria-label="View all frequently asked questions">
            View All FAQs
          </ViewAllFAQs>
        </Suspense>

        <TeaContainer>
          <H1>Made With</H1>
          <H1>
            <StyledSpan>Crea</StyledSpan>
            <StyledCreaTeaImage src={CreaTeaImage} alt="Creativity icon" width="40" height="40" loading="lazy" />
            <StyledSpan>vity</StyledSpan>
          </H1>
        </TeaContainer>

        <Footer>
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
            </Link>{' '}
            |{' '}
            <Link to="/editor" aria-label="Try in-browser code editor">
              Code Editor
            </Link>{' '}
            |{' '}
            <Link to="/category/web-development" aria-label="Explore web development courses">
              Web Development
            </Link>
          </nav>
        </Footer>
      </HomeContainer>
    </>
  );
});

export default Home;
