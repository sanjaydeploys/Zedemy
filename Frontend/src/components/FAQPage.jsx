import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import styled, { css } from 'styled-components';
import FAQ from './FAQ';
import faqData from './faqData';

// Shared styles from Home.jsx for consistency
const sharedSectionStyles = css`
  margin-top: 20px;
  padding: 20px;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 15px;
  backdrop-filter: blur(10px);
`;

// Styled Components
const Container = styled.main`
  min-height: 100vh;
  padding: 4rem 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: radial-gradient(circle at top left, #1e1e2f, #0d0d1a);
  color: #fff;

  @media (max-width: 768px) {
    padding: 2rem 1rem;
  }
`;

const Header = styled.header`
  text-align: center;
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  font-size: clamp(2rem, 4vw, 3rem);
  margin-bottom: 1rem;
  color: #ffd580;
  text-shadow: 0 0 8px rgba(255, 204, 128, 0.4);
`;

const BreadcrumbNav = styled.nav`
  ${sharedSectionStyles}
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: center;

  a {
    color: #ffcc80;
    text-decoration: none;
    &:hover {
      text-decoration: underline;
    }
  }
`;

const FAQSection = styled.section`
  max-width: 800px;
  width: 100%;
`;

const Footer = styled.footer`
  ${sharedSectionStyles}
  width: 100%;
  text-align: center;
  padding: 1rem;
  margin-top: 2rem;
`;

const FooterLink = styled(Link)`
  color: #ffcc80;
  text-decoration: none;
  margin: 0 0.5rem;
  &:hover {
    color: #ff6f00;
  }
`;

const ExternalLink = styled.a`
  color: #ffcc80;
  text-decoration: none;
  &:hover {
    color: #ff6f00;
  }
`;

const FAQPage = () => {
  // Structured Data for SEO
  const structuredData = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Zedemy | Frequently Asked Questions',
      description:
        'Find answers to common questions about Zedemy’s online tech courses, certificate verification, in-browser coding platform, and more.',
      url: 'https://zedemy.vercel.app/faq',
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': 'https://zedemy.vercel.app/faq',
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
          name: 'FAQs',
          item: 'https://zedemy.vercel.app/faq',
        },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqData,
    },
  ];

  return (
    <>
      <Helmet>
        <html lang="en" />
        <title>Zedemy | Frequently Asked Questions</title>
        <meta
          name="description"
          content="Find answers to common questions about Zedemy’s online tech courses, certificate verification, in-browser coding platform, and more."
        />
        <meta
          name="keywords"
          content="Zedemy FAQs, online tech courses, certificate verification, in-browser coding, learn coding, web development, AI, Python, tech education, Sanjay Patidar"
        />
        <meta name="author" content="Sanjay Patidar" />
        <meta name="robots" content="index, follow, max-image-preview:large" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" type="image/svg+xml" href="/zedemy-logo.png" />
        <link rel="canonical" href="https://zedemy.vercel.app/faq" />
         <meta property="og:title" content="Zedemy | Frequently Asked Questions" />
        <meta
          property="og:description"
          content="Find answers to common questions about Zedemy’s online tech courses, certificate verification, in-browser coding platform, and more."
        />
        <meta
          property="og:image"
          content="https://sanjaybasket.s3.ap-south-1.amazonaws.com/zedemy-logo.png"
        />
        <meta property="og:image:alt" content="Zedemy Tech Education Platform Logo" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:url" content="https://zedemy.vercel.app/faq" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Zedemy" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Zedemy | Frequently Asked Questions" />
        <meta
          name="twitter:description"
          content="Find answers to common questions about Zedemy’s online tech courses, certificate verification, in-browser coding platform, and more."
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

      <Container role="main" aria-label="Zedemy FAQ Page">
        <Header>
          <BreadcrumbNav aria-label="Breadcrumb navigation">
            <Link to="/">Home</Link> &gt; <span>FAQs</span>
          </BreadcrumbNav>
          <Title>Frequently Asked Questions</Title>
        </Header>

        <FAQSection>
          <FAQ
            faqs={faqData.map(faq => ({
              name: faq.name,
              text: faq.acceptedAnswer.text,
            }))}
          />
        </FAQSection>

        <Footer>
          <p>
            Learn more about{' '}
            <FooterLink to="/about" aria-label="Learn more about Zedemy">
              Zedemy
            </FooterLink>{' '}
            or explore our{' '}
            <FooterLink to="/explore" aria-label="Explore tech courses">
              courses
            </FooterLink>
            . Verify your achievements at{' '}
            <FooterLink to="/certificate-verification" aria-label="Verify certificates">
              Certificate Verification
            </FooterLink>
            . Built by{' '}
            <ExternalLink
              href="https://sanjay-patidar.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Visit Sanjay Patidar's personal website"
            >
              Sanjay Patidar
            </ExternalLink>
            .
          </p>
          <nav aria-label="Footer navigation">
            <FooterLink to="/editor" aria-label="Try in-browser code editor">
              Code Editor
            </FooterLink>{' '}
            |{' '}
            <FooterLink to="/category/web-development" aria-label="Explore web development courses">
              Web Development
            </FooterLink>
          </nav>
        </Footer>
      </Container>
    </>
  );
};

export default FAQPage;
