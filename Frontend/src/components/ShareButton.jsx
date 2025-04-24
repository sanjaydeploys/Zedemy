import React from 'react';
import styled from 'styled-components';

const ShareContainer = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: center;
  margin: 1rem 0;
`;

const ShareLink = styled.a`
  display: inline-flex;
  align-items: center;
  padding: 0.5rem 1rem;
  border-radius: 25px;
  color: #fff;
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 600;
  transition: transform 0.2s, background-color 0.2s;

  &:hover {
    transform: translateY(-2px);
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
    background-color: #e4405f;
  }
  &.twitter {
    background-color: #1da1f2;
  }
  &.email {
    background-color: #666;
  }
`;

const ShareButton = ({ url, title }) => {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const shareLinks = [
    {
      platform: 'linkedin',
      label: 'LinkedIn',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    },
    {
      platform: 'whatsapp',
      label: 'WhatsApp',
      href: `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`,
    },
    {
      platform: 'facebook',
      label: 'Facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    },
    {
      platform: 'instagram',
      label: 'Instagram',
      href: `https://www.instagram.com/`,
      note: 'Instagram sharing requires manual post creation.',
    },
    {
      platform: 'twitter',
      label: 'Twitter',
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    },
    {
      platform: 'email',
      label: 'Email',
      href: `mailto:?subject=${encodedTitle}&body=Check out this awesome platform: ${encodedUrl}`,
    },
  ];

  return (
    <ShareContainer aria-label="Share Zedemy on social media">
      {shareLinks.map((link) => (
        <ShareLink
          key={link.platform}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className={link.platform}
          aria-label={`Share on ${link.label}`}
          onClick={link.note ? () => alert(link.note) : undefined}
        >
          {link.label}
        </ShareLink>
      ))}
    </ShareContainer>
  );
};

export default ShareButton;
