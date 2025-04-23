import React from 'react';
import styled from 'styled-components';
import { parseLinksForHtml } from './utils';
// Styled Components
const SidebarContainer = styled.div`
  width: 250px;
  background-color: rgba(15, 1, 1, 0.82);
  color: #ecf0f1;
  position: sticky;
  top: 0;
  height: 100vh;
  display: flex;
  flex-direction: column;
  @media (max-width: 768px) {
    width: ${props => (props.isOpen ? '100%' : '0')};
    position: fixed;
    top: 0;
    left: 0;
    height: 100%;
    transition: width 0.3s;
    z-index: 1000;
    overflow: hidden;
  }
`;

const SidebarHeader = styled.div`
  padding: 2px;
  font-size: 1.2em;
  background-color: rgb(4, 18, 33);
  text-align: center;
`;

const SubtitlesList = styled.ul`
  list-style-type: none;
  padding: 0;
  overflow-y: auto;
  flex: 1;
  height: 100%;
`;

const SubtitleItem = styled.li`
  padding: 10px 20px;
  border-bottom: 1px solid rgb(228, 231, 235);
  cursor: pointer;
  background-color: ${props => (props.isActive ? '#34495e' : 'transparent')};
  &:hover {
    background-color: rgb(59, 118, 20);
  }
`;

const Button = styled.button`
  background: none;
  border: none;
  color: inherit;
  text-align: left;
  width: 100%;
  padding: 0;
  font-size: 1em;
`;

const ToggleButton = styled.button`
  display: none;
  background: #d32f2f;
  color: #ffffff;
  border: none;
  padding: 10px;
  cursor: pointer;
  position: fixed;
  top: 10px;
  left: 10px;
  z-index: 1010;
  &:hover {
    background: #b71c1c;
  }
  @media (max-width: 768px) {
    display: block;
  }
`;

const Sidebar = ({ post, isSidebarOpen, setSidebarOpen, activeSection, scrollToSection, subtitlesListRef }) => {
  return (
    <>
      <ToggleButton onClick={() => setSidebarOpen(!isSidebarOpen)}>
        {isSidebarOpen ? 'Close' : 'Menu'}
      </ToggleButton>
      <SidebarContainer isOpen={isSidebarOpen}>
        <SidebarHeader>Contents</SidebarHeader>
        <SubtitlesList ref={subtitlesListRef}>
          {post.subtitles.map((subtitle, index) => (
            <SubtitleItem
              key={index}
              isActive={activeSection === `subtitle-${index}`}
              data-section={`subtitle-${index}`}
            >
              <Button
                dangerouslySetInnerHTML={{ __html: parseLinksForHtml(subtitle.title, post.category) }}
                onClick={() => scrollToSection(`subtitle-${index}`)}
                aria-label={`Navigate to ${subtitle.title}`}
              />
            </SubtitleItem>
          ))}
          {post.summary && (
            <SubtitleItem
              isActive={activeSection === 'summary'}
              data-section="summary"
            >
              <Button onClick={() => scrollToSection('summary')} aria-label="Navigate to summary">
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
