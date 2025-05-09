import React, { useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { truncateText } from './utils';

const StructuredData = ({ post, readTime, slug }) => {
  const structuredData = useMemo(() => {
    const pageTitle = `${post.title} | Zedemy, India`;
    const pageDescription = truncateText(post.summary || post.content, 160) || `Learn ${post.title?.toLowerCase() || ''} with Zedemy's tutorials.`;
    const pageKeywords = post.keywords
      ? `${post.keywords}, Zedemy, ${post.category || ''}, ${post.title?.toLowerCase() || ''}`
      : `Zedemy, ${post.category || ''}, ${post.title?.toLowerCase() || ''}`;
    const canonicalUrl = `https://zedemy.vercel.app/post/${slug}`;
    const ogImage = post.titleImage
      ? `${post.titleImage}?w=1200&format=avif&q=1`
      : 'https://zedemy-media-2025.s3.ap-south-1.amazonaws.com/zedemy-logo.png';
    return [
      {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: post.title || '',
        description: pageDescription,
        keywords: pageKeywords.split(', ').filter(Boolean),
        articleSection: post.category || 'Tech Tutorials',
        author: { '@type': 'Person', name: post.author || 'Zedemy Team' },
        publisher: {
          '@type': 'Organization',
          name: 'Zedemy',
          logo: { '@type': 'ImageObject', url: ogImage },
        },
        datePublished: post.date || new Date().toISOString(),
        dateModified: post.date || new Date().toISOString(),
        image: ogImage,
        url: canonicalUrl,
        mainEntityOfPage: { '@type': 'WebPage', '@id': canonicalUrl },
        timeRequired: `PT${readTime}M`,
        wordCount: 0,
        inLanguage: 'en',
        sameAs: ['https://x.com/zedemy', 'https://linkedin.com/company/zedemy'],
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
            name: post.category || 'Blog',
            item: `https://zedemy.vercel.app/category/${post.category?.toLowerCase() || 'blog'}`,
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: post.title || '',
            item: canonicalUrl,
          },
        ],
      },
    ];
  }, [post, readTime, slug]);

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
    </Helmet>
  );
};

export default StructuredData;
