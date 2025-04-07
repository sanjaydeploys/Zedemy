import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled, { keyframes } from 'styled-components';
import {
  updateColor,
  updateFontFamily,
  updateFontSize,
  updateLineHeight,
  updateBackgroundImage,
  updateBorderRadius,
  updateBoxShadow,
  updateIconColor
} from '../actions/settingsActions';

// Slide-in animation
const slideIn = keyframes`
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0%);
  }
`;

const SettingContainer = styled.div`
  position: fixed;
  top: 0;
  right: 0;
  height: 100vh;
  width: 300px;
  background-color: #fff;
  z-index: 1000;
  padding: 20px;
  box-shadow: -2px 0 10px rgba(0, 0, 0, 0.2);
  animation: ${slideIn} 0.3s ease forwards;
`;

const SettingGroup = styled.div`
  margin-bottom: 20px;
`;

const SettingLabel = styled.label`
  display: block;
  margin-bottom: 5px;
`;

const SettingInput = styled.input`
  width: 100%;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 5px;
`;

const SettingSelect = styled.select`
  width: 100%;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 5px;
`;

const SaveButton = styled.button`
  margin-top: 10px;
  margin-right: 10px;
  padding: 8px 16px;
  background-color: #007bff;
  color: #fff;
  border: none;
  border-radius: 5px;
  cursor: pointer;
`;

const CloseButton = styled.button`
  margin-top: 10px;
  padding: 8px 16px;
  background-color: #dc3545;
  color: #fff;
  border: none;
  border-radius: 5px;
  cursor: pointer;
`;

const SettingComponent = ({ onClose }) => {
  const dispatch = useDispatch();
  const {
    color: currentColor,
    iconColor: currentIconColor,
    fontFamily: currentFontFamily,
    fontSize: currentFontSize,
    lineHeight: currentLineHeight,
    backgroundImage: currentBackgroundImage,
    borderRadius: currentBorderRadius,
    boxShadow: currentBoxShadow
  } = useSelector((state) => state.settings);

  const [color, setColor] = useState(currentColor);
  const [iconColor, setIconColor] = useState(currentIconColor);
  const [fontFamily, setFontFamily] = useState(currentFontFamily);
  const [fontSize, setFontSize] = useState(currentFontSize);
  const [lineHeight, setLineHeight] = useState(currentLineHeight);
  const [backgroundImage, setBackgroundImage] = useState(currentBackgroundImage);
  const [borderRadius, setBorderRadius] = useState(currentBorderRadius);
  const [boxShadow, setBoxShadow] = useState(currentBoxShadow);

  useEffect(() => {
    const savedSettings = JSON.parse(localStorage.getItem('settings'));
    if (savedSettings) {
      setColor(savedSettings.color || '#000000');
      setIconColor(savedSettings.iconColor || '#ffffff');
      setFontFamily(savedSettings.fontFamily || 'Arial');
      setFontSize(savedSettings.fontSize || 16);
      setLineHeight(savedSettings.lineHeight || 1.5);
      setBackgroundImage(savedSettings.backgroundImage || '');
      setBorderRadius(savedSettings.borderRadius || 0);
      setBoxShadow(savedSettings.boxShadow || '');
    }
  }, []);

  const handleSaveChanges = () => {
    const newSettings = {
      color,
      iconColor,
      fontFamily,
      fontSize,
      lineHeight,
      backgroundImage,
      borderRadius,
      boxShadow
    };
    localStorage.setItem('settings', JSON.stringify(newSettings));
    dispatch(updateColor(color));
    dispatch(updateIconColor(iconColor));
    dispatch(updateFontFamily(fontFamily));
    dispatch(updateFontSize(fontSize));
    dispatch(updateLineHeight(lineHeight));
    dispatch(updateBackgroundImage(backgroundImage));
    dispatch(updateBorderRadius(borderRadius));
    dispatch(updateBoxShadow(boxShadow));
    onClose();
  };

  return (
    <SettingContainer>
      <SettingGroup>
        <SettingLabel htmlFor="color">Sidebar Background Color:</SettingLabel>
        <SettingInput type="color" id="color" value={color} onChange={(e) => setColor(e.target.value)} />
      </SettingGroup>

      <SettingGroup>
        <SettingLabel htmlFor="iconColor">Sidebar Icon Color:</SettingLabel>
        <SettingInput type="color" id="iconColor" value={iconColor} onChange={(e) => setIconColor(e.target.value)} />
      </SettingGroup>

      <SettingGroup>
        <SettingLabel htmlFor="fontFamily">Font Family:</SettingLabel>
        <SettingSelect id="fontFamily" value={fontFamily} onChange={(e) => setFontFamily(e.target.value)}>
          <option value="Arial">Arial</option>
          <option value="Helvetica">Helvetica</option>
          <option value="Times New Roman">Times New Roman</option>
          <option value="Courier New">Courier New</option>
        </SettingSelect>
      </SettingGroup>

      <SettingGroup>
        <SettingLabel htmlFor="fontSize">Font Size:</SettingLabel>
        <SettingInput type="number" id="fontSize" value={fontSize} onChange={(e) => setFontSize(e.target.value)} />
      </SettingGroup>

      <SettingGroup>
        <SettingLabel htmlFor="lineHeight">Line Height:</SettingLabel>
        <SettingInput type="number" step="0.1" id="lineHeight" value={lineHeight} onChange={(e) => setLineHeight(e.target.value)} />
      </SettingGroup>

      <SettingGroup>
        <SettingLabel htmlFor="backgroundImage">Background Image URL:</SettingLabel>
        <SettingInput type="text" id="backgroundImage" value={backgroundImage} onChange={(e) => setBackgroundImage(e.target.value)} />
      </SettingGroup>

      <SettingGroup>
        <SettingLabel htmlFor="borderRadius">Border Radius (px):</SettingLabel>
        <SettingInput type="number" id="borderRadius" value={borderRadius} onChange={(e) => setBorderRadius(e.target.value)} />
      </SettingGroup>

      <SettingGroup>
        <SettingLabel htmlFor="boxShadow">Box Shadow:</SettingLabel>
        <SettingInput type="text" id="boxShadow" value={boxShadow} onChange={(e) => setBoxShadow(e.target.value)} />
      </SettingGroup>

      <SaveButton onClick={handleSaveChanges}>Save Changes</SaveButton>
      <CloseButton onClick={onClose}>Close</CloseButton>
    </SettingContainer>
  );
};

export default SettingComponent;
