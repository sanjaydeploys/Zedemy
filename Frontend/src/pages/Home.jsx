import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import Typed from 'typed.js';
import { Helmet } from "react-helmet"; 

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const float = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-20px); }
  100% { transform: translateY(0px); }
`;

const HomeContainer = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #fff;
  text-align: center;
  padding: 2rem;
  overflow: hidden;
  
  &::before {
    content: "";
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: url('https://sanjaybasket.s3.ap-south-1.amazonaws.com/wallpaper.jpg') center/cover;
    filter: blur(8px) brightness(0.7);
    z-index: -1;
    animation: ${fadeIn} 2s ease-out;
  }
`;

const ContentWrapper = styled.div`
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-areas: 
    "text gif"
    "typed typed";
  gap: 1rem;
  max-width: 1400px;
  width: 100%;
  padding: 1rem;
  animation: ${fadeIn} 1.5s ease-out;

  @media (max-width: 768px) {
    grid-template-areas: 
      "gif"
      "text"
      "typed";
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
  margin-top: 0rem;
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

const Title = styled.h1`
  font-size: 3rem;
  margin-bottom: 1rem;
  text-align: center;
  text-transform: uppercase;
  
  /* Base text styling */
  color: #fff;
  text-shadow: 2px 2px 6px rgba(0, 0, 0, 0.8);
  
  /* Emphasize 'Z' with gradient similar to EduXcel's yellow 'X' */
  & span.emphasized {
    color: #ffd700; /* Yellow color matching EduXcel's 'X' */
    font-size: 1.2em; /* Slightly larger for emphasis */
    font-weight: 900; /* Extra bold */
    text-shadow: 0 0 10px #ffd700, 0 0 20px #ffd700, 0 0 30px #ffaa00; /* Glow effect */
    display: inline-block;
    padding: 0 0.2rem;
    background: linear-gradient(45deg, #ffd700, #ffaa00);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  
  @media (max-width: 768px) {
    font-size: 2.5rem;
    & span.emphasized {
      font-size: 1.1em;
    }
  }
`;

const Subtitle = styled.h2`
  font-size: 1.8rem;
  color: #ffcc80;
  text-shadow: 2px 2px 6px rgba(0, 0, 0, 0.7);
  line-height: 1;
  
  @media (max-width: 768px) {
    font-size: 1.3rem;
  }
`;

const GifContainer = styled.div`
  grid-area: gif;
  max-width: 600px;
  width: 100%;
  animation: ${float} 6s ease-in-out infinite;
  
  img {
    width: 100%;
    border-radius: 20px;
    transition: transform 0.3s ease;
    
    &:hover {
      transform: scale(1.05);
    }
  }
`;
const H3 = styled.h1`
color: #2E35D2;
  font-size: 3rem;
 margin-bottom: 0rem;
 font-weight: 900;
 font-family: 'Playfair Display', serif;
 margin-top: 0rem;
text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
 transform: skew(-5deg); /* Apply a slight skew for a dynamic effect */
 
 @media (max-width: 768px) {
   margin-top: 0rem;
   font-size: 1.5rem;

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

    /* Styling the "X" */
    &:before {
      content: '';
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
`;
const parchmentWave = keyframes`
  0% { transform: scale(1) rotate(0deg); }
  50% { transform: scale(1.02) rotate(1deg); }
  100% { transform: scale(1) rotate(0deg); }
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
  background: url('https://www.transparenttextures.com/patterns/parchment.png'); /* Parchment texture */
  border-radius: 15px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
  animation: ${parchmentWave} 4s infinite ease-in-out;
  text-align: center;
  color: #2F2F4F;

  h4 {
    font-size: 1.2rem;
    margin-bottom: 0.5rem;
    color: #D3A625;
  }

  p {
    font-size: 0.9rem;
    line-height: 1.4;
  }

  @media (max-width: 768px) {
    max-width: 100%;
  }
`;
const Home = () => {
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
          'Future-Ready Platform'
        ],
        typeSpeed: 80,
        backSpeed: 40,
        backDelay: 1500,
        loop: true,
        smartBackspace: true,
      });
    }

    return () => {
      if (typedInstance.current) {
        typedInstance.current.destroy();
      }
    };
  }, []);
  const handleCertificatePreview = () => {
    window.open('https://sanjaybasket.s3.ap-south-1.amazonaws.com/certificates/Sanjay_Patidar_VS%20Code_2025-04-06_3f4fb268-3f6a-46d3-9b4f-109a2574ecbb.pdf', '_blank');
    // Note: Update URL with a stable link or implement a dynamic fetch
  };

 const faqData = [
    {
      '@type': 'Question',
      name: 'What is Zedemy?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Zedemy is a serverless learning platform for tech education, offering course uploads, certificate verification, and in-browser coding.',
      },
    },
    {
      '@type': 'Question',
      name: 'Who founded Zedemy?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Zedemy was founded by Sanjay Patidar, a Software Development Engineer specializing in full-stack and AI-driven solutions.',
      },
    },
    {
      '@type': 'Question',
      name: 'What can I do on Zedemy?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'On Zedemy, you can upload courses, verify certificates, code in-browser, customize themes, and engage with a tech learning community.',
      },
    },
    {
      '@type': 'Question',
      name: 'How does Zedemy verify certificates?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Zedemy uses a secure system to verify course completion certificates, ensuring authenticity for learners and employers.',
      },
    },
    {
      '@type': 'Question',
      name: 'What is Zedemy’s in-browser code editor?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Zedemy’s in-browser code editor lets users write, test, and share code in languages like JavaScript and Python, no setup required.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I upload courses on Zedemy?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, creators can upload courses on Zedemy, sharing knowledge in tech fields like web development, AI, and cloud computing.',
      },
    },
    {
      '@type': 'Question',
      name: 'How does Zedemy support personalized learning?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Zedemy offers customizable themes, settings, and dynamic content to tailor the learning experience to individual preferences.',
      },
    },
    {
      '@type': 'Question',
      name: 'What technologies power Zedemy?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Zedemy is built with React.js, Node.js, AWS Lambda, and MongoDB, ensuring scalability and a seamless user experience.',
      },
    },
    {
      '@type': 'Question',
      name: 'How can I join the Zedemy community?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Join Zedemy at zedemy.vercel.app to learn, share courses, and connect with tech enthusiasts and educators.',
      },
    },
    {
      '@type': 'Question',
      name: 'Why choose Zedemy for tech education?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Zedemy combines course creation, coding, and certificate verification in a serverless platform, ideal for tech learners and creators.',
      },
    },
  ];

  const structuredData = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Zedemy | Serverless Learning Platform by Sanjay Patidar',
      description: 'Zedemy, founded by Sanjay Patidar, is a serverless platform for tech education with courses, certificate verification, and coding.',
      url: 'https://zedemy.vercel.app/',
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': 'https://zedemy.vercel.app/',
      },
      author: {
        '@type': 'Person',
        name: 'Sanjay Patidar',
      },
      publisher: {
        '@type': 'Person',
        name: 'Sanjay Patidar',
      },
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
      <title>Zedemy | Learning Platform by Sanjay Patidar</title>
      <meta
        name="description"
        content="Zedemy, by Sanjay Patidar, offers tech courses, certificate verification, and in-browser coding for learners. Join now."
      />
      <meta
        name="keywords"
        content="Zedemy, Sanjay Patidar, online learning, tech education, course platform, certificate verification, code editor, serverless LMS, React.js, AWS Lambda"
      />
      <meta name="author" content="Sanjay Patidar" />
      <meta name="robots" content="index, follow" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <link rel="icon" type="image/svg+xml" href="/zedemy-logo.png" />
      <link rel="canonical" href="https://zedemy.vercel.app/" />
      <meta property="og:title" content="Zedemy | Learning Platform by Sanjay Patidar" />
      <meta
        property="og:description"
        content="Zedemy, by Sanjay Patidar, offers tech courses, certificate verification, and in-browser coding for learners. Join now."
      />
      <meta property="og:image" content="https://sanjaybasket.s3.ap-south-1.amazonaws.com/zedemy-logo.png" />
      <meta property="og:image:alt" content="Zedemy Logo" />
      <meta property="og:url" content="https://zedemy.vercel.app/" />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="Zedemy" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="Zedemy | Learning Platform by Sanjay Patidar" />
      <meta
        name="twitter:description"
        content="Zedemy, by Sanjay Patidar, offers tech courses, certificate verification, and in-browser coding for learners. Join now."
      />
      <meta name="twitter:image" content="https://sanjaybasket.s3.ap-south-1.amazonaws.com/zedemy-logo.png" />
      <meta name="twitter:site" content="@sanjaypatidar" />
      <meta name="twitter:creator" content="@sanjaypatidar" />
      <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
    </Helmet>
            
            
            <HomeContainer>
    
      <ContentWrapper style={{ opacity: isVisible ? 1 : 0 }}>
        <TextContainer>
        <StyledText>
 <H3>Welcome to <span className="eduxcel-text">Hog<span className="x-letter">W</span>arts<span className="x-letter">E</span>dx</span> <br/>E-Learning Wonderland!</H3>
</StyledText>
          <Subtitle>Experience the future of education with intelligent features</Subtitle>
          <CallToAction onClick={() => navigate('/explore')}>
            Explore Now
          </CallToAction>
          <CertificatePreview onClick={handleCertificatePreview}>
          <h4>Sample Certificate</h4>
          <p>Earn your HogWartxEdx certificate in courses like Wizarding VS Code Mastery!</p>
        </CertificatePreview>
        </TextContainer>
        <GifContainer>
          <img 
            src="https://sanjaybasket.s3.ap-south-1.amazonaws.com/Student-home-header-1.gif" 
            alt="Smart Learning Experience" 
          />
        </GifContainer>
        <TypedContainer>
          <TypedText>
            <span ref={typedRef} />
          </TypedText>
        </TypedContainer>
       
      </ContentWrapper>
   
    </HomeContainer>
    </>
  );
};

export default Home;
