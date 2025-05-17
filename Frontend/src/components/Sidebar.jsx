import React, { useMemo } from 'react';
import styled from 'styled-components';
import { parseLinks, slugify } from './utils';

// Styled Components to match SSR sidebar
const SidebarWrapper = styled.aside`
  width: 260px;
  position: sticky;
  top: 0;
  height: 100vh;
  box-sizing: border-box;
  z-index: 1000;
  @media (max-width: 1024px) {
    width: ${(props) => (props.isOpen ? 'min(80%, 260px)' : '0')};
    position: fixed;
    top: 0;
    left: var(--sidebar-width, 48px);
    transition: width 0.3s ease;
    overflow: hidden;
  }
`;

const SidebarContainer = styled.div`
  background: #111827;
  color: #f9fafb;
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 260px;
`;

const SidebarHeader = styled.div`
  padding: 0.75rem;
  font-size: 1.05rem;
  background: #0f172a;
  text-align: center;
  font-weight: 600;
`;

const SubtitlesList = styled.ul`
  list-style: none;
  padding: 0;
  overflow-y: auto;
  flex: 1;
  max-height: calc(100vh - 40px);
`;

const SubtitleItem = styled.li`
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #374151;
  background: ${(props) => (props.isActive ? '#1f2937' : 'transparent')};
  &:hover,
  &:focus-within {
    background: #1f2937;
  }
`;

const SubtitleButton = styled.button`
  background: none;
  border: none;
  color: #d1d5db;
  text-align: left;
  width: 100%;
  padding: 0;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  &:hover,
  &:focus {
    color: #22c55e;
    outline: none;
  }
`;

const ToggleButton = styled.button`
  display: none;
  background: #dc2626;
  color: #fff;
  border: none;
  padding: 0.5rem;
  cursor: pointer;
  position: fixed;
  top: 0.5rem;
  left: calc(var(--sidebar-width, 48px) + 0.5rem);
  z-index: 1010;
  border-radius: 6px;
  font-size: 0.85rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  &:hover,
  &:focus {
    background: #b91c1c;
    outline: none;
  }
  @media (max-width: 1024px) {
    display: block;
  }
`;

const FallbackMessage = styled.div`
  padding: 1rem;
  font-size: 0.8rem;
  color: #9ca3af;
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
      if (isSidebarOpen) {
        setSidebarOpen(false); // Close sidebar on mobile
      }
    } else {
      console.error('scrollToSection is not a function');
    }
  };

  return (
    <SidebarWrapper id="sidebar-wrapper" isOpen={isSidebarOpen} role="navigation" aria-label="Table of contents">
      <ToggleButton
        onClick={() => setSidebarOpen(!isSidebarOpen)}
        aria-label={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
      >
        {isSidebarOpen ? 'Close' : 'Menu'}
      </ToggleButton>
      <SidebarContainer className="sidebar">
        <SidebarHeader>Contents</SidebarHeader>
        <SubtitlesList>
          {subtitles.length === 0 && !post.summary ? (
            <FallbackMessage>No sections available</FallbackMessage>
          ) : (
            <>
              {subtitles.map((subtitle, index) => (
                <SubtitleItem
                  key={`subtitle-${index}`}
                  isActive={activeSection === `subtitle-${index}`}
                  data-section={`subtitle-${index}`}
                >
                  <SubtitleButton
                    onClick={() => handleScrollToSection(`subtitle-${index}`)}
                    aria-label={`Navigate to ${subtitle.title || `Section ${index + 1}`}`}
                  >
                    {parseLinks(subtitle.title || `Section ${index + 1}`, post.category || '')}
                  </SubtitleButton>
                </SubtitleItem>
              ))}
              {post.summary && (
                <SubtitleItem isActive={activeSection === 'summary'} data-section="summary">
                  <SubtitleButton
                    onClick={() => handleScrollToSection('summary')}
                    aria-label="Navigate to summary"
                  >
                    Summary
                  </SubtitleButton>
                </SubtitleItem>
              )}
            </>
          )}
        </SubtitlesList>
      </SidebarContainer>
    </SidebarWrapper>
  );
};

export default Sidebar;
