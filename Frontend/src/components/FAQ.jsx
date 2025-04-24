import React, { useState, memo } from 'react';
import styled, { css, keyframes } from 'styled-components';

const scrollOpen = keyframes`
  0% {
    max-height: 0;
    opacity: 0;
    transform: scaleY(0.95);
  }
  100% {
    max-height: 1000px;
    opacity: 1;
    transform: scaleY(1);
  }
`;

const FAQSection = styled.section`
  max-width: 800px;
  margin: 3rem auto;
  padding: 2rem;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02));
  border-radius: 2rem;
  backdrop-filter: blur(18px);
  box-shadow: 0 8px 20px rgba(0,0,0,0.2);
  color: #eee;
`;

const QuestionWrapper = styled.div`
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  padding: 1rem 0;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;

  &:hover h3 {
    color: #ffd580;
    text-shadow: 0 0 8px #ffc10766;
  }

  &:hover::after {
    content: "";
    position: absolute;
    left: -10px;
    top: 0;
    height: 100%;
    width: 4px;
    background: linear-gradient(to bottom, #ffcc80, #ff8c00);
    border-radius: 8px;
  }
`;

const FAQQuestion = styled.h3`
  font-size: clamp(1.2rem, 2vw, 1.5rem);
  font-weight: 600;
  margin: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: 0.3s ease;
`;

const Icon = styled.span`
  font-size: 1.5rem;
  transition: transform 0.3s ease;
  color: #ffcc80;
  ${({ isOpen }) => isOpen && css`transform: rotate(45deg);`}
`;

const FAQAnswer = styled.div`
  font-size: 1rem;
  color: #ddd;
  line-height: 1.6;
  margin-top: 1rem;
  max-height: ${({ isOpen }) => (isOpen ? '1000px' : '0')};
  opacity: ${({ isOpen }) => (isOpen ? '1' : '0')};
  overflow: hidden;
  animation: ${({ isOpen }) => isOpen && css`${scrollOpen} 0.5s ease-out forwards`};
  transform-origin: top;
  transition: all 0.4s ease-in-out;

  a {
    color: #ffd580;
    text-decoration: underline;
    &:hover {
      color: #ffa726;
    }
  }
`;

const FAQ = memo(({ faqs }) => {
  const [activeIndex, setActiveIndex] = useState(null);

  const toggleFAQ = (index) => {
    setActiveIndex(index === activeIndex ? null : index);
  };

  return (
    <FAQSection aria-labelledby="faq-heading">
      <h2 id="faq-heading" style={{ fontSize: '2rem', textAlign: 'center', marginBottom: '2rem', color: '#ffcc80' }}>
        ✨ Frequently Asked Questions ✨
      </h2>
      {faqs.map((faq, index) => (
        <QuestionWrapper key={index} onClick={() => toggleFAQ(index)}>
          <FAQQuestion>
            {faq.name}
            <Icon isOpen={activeIndex === index}>{activeIndex === index ? '−' : '+'}</Icon>
          </FAQQuestion>
          <FAQAnswer
            isOpen={activeIndex === index}
            dangerouslySetInnerHTML={{ __html: faq.text }}
          />
        </QuestionWrapper>
      ))}
    </FAQSection>
  );
});

export default FAQ;
