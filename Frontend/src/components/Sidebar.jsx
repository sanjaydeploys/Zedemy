import React, { useMemo } from 'react';
import styled from 'styled-components';
import { parseLinks, slugify } from './utils';

// Styled Components
const SidebarContainer = styled.aside`
  width: 250px;
  background: #0f0101;
  color: #ecf0f1;
  display: flex;
  flex-direction: column;
  overflow-x: hidden;
  box-sizing: border-box;
  position: sticky;
  top: 0;
  height: 100vh;
  @media (max-width: 768px) {
    width: ${(props) => (props.isOpen ? 'min(100%, 300px)' : '0')};
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    transition: width 0.3s;
    z-index: 1000;
    overflow: hidden;
    height: auto;
  }
`;

const SidebarHeader = styled.div`
  padding: 0.5rem;
  font-size: 1.125rem;
  background: #041221;
  text-align: center;
  font-weight: 600;
`;

const SubtitlesList = styled.ul`
  list-style: none;
  padding: 0;
  overflow-y: auto;
  flex: 1;
  max-height: calc(100vh - 48px);
`;

const SubtitleItem = styled.li`
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #e4e7eb;
  cursor: pointer;
  background: ${(props) => (props.isActive ? '#34495e' : 'transparent')};
  &:hover {
    background: #3b7614;
  }
`;

const Button = styled.button`
  background: none;
  border: none;
  color: inherit;
  text-align: left;
  width: 100%;
  padding: 0;
  font-size: 0.875rem;
  font-weight: 500;
`;

const ToggleButton = styled.button`
  display: none;
  background: #d32f2f;
  color: #ffffff;
  border: none;
  padding: 0.5rem;
  cursor: pointer;
  position: fixed;
  top: 0.5rem;
  left: 0.5rem;
  z-index: 1010;
  border-radius: 0.25rem;
  &:hover {
    background: #b71c1c;
  }
  @media (max-width: 768px) {
    display: block;
  }
`;

const FallbackMessage = styled.div`
  padding: 1rem;
  font-size: 0.875rem;
  color: #ecf0f1;
  text-align: center;
`;

const Sidebar = ({ post = {}, isSidebarOpen, setSidebarOpen, activeSection, scrollToSection }) => {
  const subtitles = post.subtitles || [];
  const slugs = useMemo(() => {
    const result = subtitles.reduce((acc, s, i) => {
      acc[`subtitle-${i}`] = slugify(s.title || `Section ${i + 1}`);
      return acc;
    }, post.summary ? { summary: 'summary' } : {});
    return result;
  }, [subtitles, post.summary]);

  const handleScrollToSection = (sectionId) => {
    if (typeof scrollToSection === 'function') {
      scrollToSection(sectionId);
      if (slugs[sectionId]) {
        window.history.pushState(null, '', `#${slugs[sectionId]}`);
      }
    } else {
      console.error('scrollToSection is not a function');
    }
  };

  return (
    <>
      <ToggleButton
        onClick={() => setSidebarOpen(!isSidebarOpen)}
        aria-label={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
      >
        {isSidebarOpen ? 'Close' : 'Menu'}
      </ToggleButton>
      <SidebarContainer isOpen={isSidebarOpen} role="navigation" aria-label="Table of contents">
        <SidebarHeader>Contents</SidebarHeader>
        <SubtitlesList>
          {subtitles.length === 0 ? (
            <FallbackMessage>No sections available</FallbackMessage>
          ) : (
            subtitles.map((subtitle, index) => (
              <SubtitleItem
                key={index}
                isActive={activeSection === `subtitle-${index}`}
                data-section={`subtitle-${index}`}
              >
                <Button
                  onClick={() => handleScrollToSection(`subtitle-${index}`)}
                  aria-label={`Navigate to ${subtitle.title || `Section ${index + 1}`}`}
                >
                  {parseLinks(subtitle.title || `Section ${index + 1}`, post.category || '')}
                </Button>
              </SubtitleItem>
            ))
          )}
          {post.summary && (
            <SubtitleItem isActive={activeSection === 'summary'} data-section="summary">
              <Button onClick={() => handleScrollToSection('summary')} aria-label="Navigate to summary">
                Summary
              </Button>
            </SubtitleItem>
          )}
        </SubtitlesList>
      </SidebarContainer>
    </>
  );
};

export default Sidebar;
