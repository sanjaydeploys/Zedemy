import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { FaHome, FaBook, FaCertificate, FaUserPlus, FaFileUpload, FaCog, FaFileCode } from 'react-icons/fa';
import CategoryCarousel from '../components/CategoryCarousel';
import SettingComponent from './SettingComponent.jsx';
import { useSelector } from 'react-redux';
import Notification from '../components/Notification';

// Sidebar styles
const Sidebar = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  width: 40px;
  background-color: ${({ color }) => color};
  z-index: 999;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const NavContainer = styled.div`
  margin-top: 100px;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
`;

const SidebarItem = styled(Link)`
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  text-decoration: none;
  width: 100%;
  padding: 12px 0;
  transition: background-color 0.3s ease;
  position: relative;

  &:hover {
    background-color: #555;
  }

  &:hover::after {
    content: attr(data-toast);
    position: absolute;
    top: 50%;
    left: 50px;
    transform: translateY(-50%);
    background-color: rgba(0, 0, 0, 0.8);
    color: #fff;
    padding: 5px 10px;
    border-radius: 5px;
    font-size: 12px;
    white-space: nowrap;
  }
`;

const SidebarButton = styled.button`
  all: unset;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  width: 100%;
  padding: 12px 0;
  cursor: pointer;
  position: relative;

  &:hover {
    background-color: #555;
  }

  &:hover::after {
    content: attr(data-toast);
    position: absolute;
    top: 50%;
    left: 50px;
    transform: translateY(-50%);
    background-color: rgba(0, 0, 0, 0.8);
    color: #fff;
    padding: 5px 10px;
    border-radius: 5px;
    font-size: 12px;
    white-space: nowrap;
  }
`;

const Icon = styled.div`
  font-size: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ iconColor }) => iconColor || '#4d9f0c'};
`;

const MainContent = styled.div`
  margin-left: 40px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  color: ${({ color }) => color};
  font-family: ${({ fontFamily }) => fontFamily};
  font-size: ${({ fontSize }) => `${fontSize}px`};
  line-height: ${({ lineHeight }) => lineHeight};
  background-image: ${({ backgroundImage }) => `url(${backgroundImage})`};
  border-radius: ${({ borderRadius }) => `${borderRadius}px`};
  box-shadow: ${({ boxShadow }) => boxShadow};
  min-height: 100vh;
`;

const Layout = ({ children }) => {
  const [isSettingOpen, setIsSettingOpen] = useState(false);
  const {
    color,
    fontFamily,
    fontSize,
    lineHeight,
    iconColor,
    backgroundImage,
    borderRadius,
    boxShadow,
  } = useSelector((state) => state.settings);

  console.log('[Layout.jsx] Rendering Layout component', {
    color,
    fontFamily,
    fontSize,
    lineHeight,
    iconColor,
    backgroundImage,
    borderRadius,
    boxShadow,
  });

  const toggleSettingPanel = () => {
    setIsSettingOpen(!isSettingOpen);
  };

  const handleCloseSetting = () => {
    setIsSettingOpen(false);
  };

  return (
    <>
      <Sidebar color={color}>
        <NavContainer>
          <SidebarItem to="/" aria-label="Home" data-toast="Home">
            <Icon iconColor={iconColor}><FaHome /></Icon>
          </SidebarItem>
          <SidebarItem to="/category" aria-label="Courses" data-toast="Courses">
            <Icon iconColor={iconColor}><FaBook /></Icon>
          </SidebarItem>
          <SidebarItem to="/add-post" aria-label="Add Post" data-toast="Add Post">
            <Icon iconColor={iconColor}><FaFileUpload /></Icon>
          </SidebarItem>
          <SidebarItem to="/login" aria-label="User Login" data-toast="User Login">
            <Icon iconColor={iconColor}><FaUserPlus /></Icon>
          </SidebarItem>
          <SidebarItem to="/certificate-verification" aria-label="Certificate Verification" data-toast="Certificate Verification">
            <Icon iconColor={iconColor}><FaCertificate /></Icon>
          </SidebarItem>
          <SidebarItem to="/editor" aria-label="Code Editor" data-toast="Code Editor">
            <Icon iconColor={iconColor}><FaFileCode /></Icon>
          </SidebarItem>

          <CategoryCarousel />

          <SidebarButton onClick={toggleSettingPanel} aria-label="Settings" data-toast="Settings">
            <Icon iconColor={iconColor}><FaCog /></Icon>
          </SidebarButton>
        </NavContainer>

        <Notification />
      </Sidebar>

      <MainContent
        color={color}
        fontFamily={fontFamily}
        fontSize={fontSize}
        lineHeight={lineHeight}
        backgroundImage={backgroundImage}
        borderRadius={borderRadius}
        boxShadow={boxShadow}
      >
        {children}
      </MainContent>

      {isSettingOpen && <SettingComponent onClose={handleCloseSetting} />}
    </>
  );
};

export default Layout;
