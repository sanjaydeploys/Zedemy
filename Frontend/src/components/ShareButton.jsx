import React from 'react';
import styled from 'styled-components';
import { FaLinkedin, FaWhatsapp, FaFacebook, FaInstagram, FaTwitter, FaEnvelope } from 'react-icons/fa';

const ShareSection = styled.section`
  margin: 2rem 0;
  text-align: center;
`;

const ShareTitle = styled.h2`
  font-size: 1.2rem;
  margin-bottom: 1rem;
  color: #333;
`;

const ShareContainer = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
`;

const ShareLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0.4rem 1rem;
  border-radius: 25px;
  color: #fff;
  text-decoration: none;
  font-size: 0.7rem;
  font-weight: 500;
  transition: transform 0.2s, background-color 0.2s, box-shadow 0.2s;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  }

  &.linkedin {
    background-color: #0077b5;
  }
  &.whatsapp {
    background-color: #25d366;
  }
  &.facebook {
    background-color: #1877f2;
  }
  &.instagram {
    background: linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888);
  }
  &.twitter {
    background-color: #1da1f2;
  }
  &.email {
    background-color: #555;
  }

  svg {
    font-size: 1rem;
  }
`;

const ShareButton = ({ url, title }) => {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const description = encodeURIComponent(
    'Zedemy, founded by Sanjay Patidar, offers online tech courses, certificate verification, and in-browser coding. Learn web development, AI, and more.'
  );
  const image = encodeURIComponent('https://sanjaybasket.s3.ap-south-1.amazonaws.com/zedemy-logo.png');

  const shareLinks = [
    {
      platform: 'linkedin',
      label: 'LinkedIn',
      icon: <FaLinkedin />,
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}&summary=${description}&title=${encodedTitle}`,
    },
    {
      platform: 'whatsapp',
      label: 'WhatsApp',
      icon: <FaWhatsapp />,
      href: `https://api.whatsapp.com/send?text=${encodedTitle}%20-%20${description}%20${encodedUrl}`,
    },
    {
      platform: 'facebook',
      label: 'Facebook',
      icon: <FaFacebook />,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${description}&picture=${image}`,
    },
    {
      platform: 'instagram',
      label: 'Instagram',
      icon: <FaInstagram />,
      href: `https://www.instagram.com/`,
      note: 'Instagram sharing requires manual post creation.',
    },
    {
      platform: 'twitter',
      label: 'Twitter',
      icon: <FaTwitter />,
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}%20-%20${description}`,
    },
    {
      platform: 'email',
      label: 'Email',
      icon: <FaEnvelope />,
      href: `mailto:?subject=${encodedTitle}&body=Check out Zedemy: ${description}%0A${encodedUrl}`,
    },
  ];

  return (
    <ShareSection aria-labelledby="share-heading">
      <ShareTitle id="share-heading">Share Zedemy with Your Network</ShareTitle>
      <ShareContainer>
        {shareLinks.map((link) => (
          <ShareLink
            key={link.platform}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className={link.platform}
            aria-label={`Share Zedemy on ${link.label}`}
            onClick={link.note ? () => alert(link.note) : undefined}
          >
            {link.icon}
            {link.label}
          </ShareLink>
        ))}
      </ShareContainer>
    </ShareSection>
  );
};

export default ShareButton;
