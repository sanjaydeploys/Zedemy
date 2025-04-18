import React, { useState, useEffect, memo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPostBySlug, fetchCompletedPosts } from '../actions/postActions';
import { useParams } from 'react-router-dom';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import Zoom from 'react-medium-image-zoom';
import 'react-medium-image-zoom/dist/styles.css';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vs } from 'react-syntax-highlighter/dist/esm/styles/prism';
import styled from 'styled-components';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { RingLoader } from 'react-spinners';
import DOMPurify from 'dompurify';

// Function to parse [text](url) links while preserving HTML tags and literal tag text
const parseLinks = (text, category) => {
    if (!text) return text;

    // Define allowed HTML tags for rendering as functional HTML
    const allowedTags = [
        'a', 'p', 'div', 'span', 'strong', 'em', 'b', 'i', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li', 'br', 'hr', 'section', 'article', 'header', 'footer', 'main'
    ];

    // Regular expression for Markdown-style [text](url) links
    const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;

    // Regular expression for HTML tags (opening, closing, or self-closing)
    const tagRegex = /<\/?[a-zA-Z0-9]+(?:\s+[^>]*?)?>/g;

    let result = '';
    let lastIndex = 0;

    // Process text and tags
    const matches = text.matchAll(tagRegex);
    for (const match of matches) {
        const tag = match[0];
        const index = match.index;

        // Add text before the tag, processing Markdown links
        if (index > lastIndex) {
            const textSegment = text.slice(lastIndex, index);
            result += textSegment.replace(linkRegex, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
        }

        // Check if the tag is valid and in allowedTags
        const tagNameMatch = tag.match(/^<\/?([a-zA-Z0-9]+)/);
        if (tagNameMatch && allowedTags.includes(tagNameMatch[1].toLowerCase())) {
            // Preserve valid HTML tag for rendering
            result += tag;
        } else {
            // Treat invalid or non-allowed tags as literal text, escaping for display
            const escapedTag = tag.replace(/</g, '&lt;').replace(/>/g, '&gt;');
            result += `<span>${escapedTag}</span>`;
        }

        lastIndex = index + tag.length;
    }

    // Add remaining text, processing Markdown links
    if (lastIndex < text.length) {
        const textSegment = text.slice(lastIndex);
        result += textSegment.replace(linkRegex, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    }

    return result;
};

// Function to sanitize only code snippets
const sanitizeCodeSnippet = (code) => {
    return DOMPurify.sanitize(code, {
        ALLOWED_TAGS: [],
        ALLOWED_ATTR: []
    });
};

// Function to truncate text for SEO description while preserving HTML
const truncateText = (text, maxLength) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    let truncated = text.slice(0, maxLength);
    const lastTagIndex = truncated.lastIndexOf('>');
    if (lastTagIndex !== -1 && truncated.lastIndexOf('<') > lastTagIndex) {
        truncated = truncated.slice(0, lastTagIndex + 1);
    } else {
        truncated = truncated + '...';
    }
    return truncated;
};

// Styled Components (unchanged)
const Container = styled.div`
    display: flex;
    flex-direction: row;
    min-height: 100vh;
`;

const Content = styled.div`
    flex: 1;
    padding: 20px;
    overflow-y: auto;
    background-color: #f4f4f9;
    color: ${({ color }) => color};
    font-family: ${({ fontFamily }) => fontFamily};
`;

const LoadingOverlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: rgba(255, 255, 255, 0.7);
    z-index: 9999;
`;

const ComparisonTableContainer = styled.div`
    margin-top: 20px;
    overflow-x: auto;
`;

const ComparisonTable = styled.table`
    border-collapse: collapse;
    width: 100%;
    min-width: 800px;
`;

const TableHeader = styled.th`
    background-color: #34495e;
    color: #ecf0f1;
    padding: 15px;
    border: 1px solid #34495e;
`;

const TableCell = styled.td`
    border: 1px solid #34495e;
    padding: 15px;
    vertical-align: top;
`;

const ResponsiveContent = styled.div`
    overflow: auto;
    white-space: nowrap;
`;

const ResponsiveTable = styled.table`
    border-collapse: collapse;
    width: auto;
    min-width: 800px;
`;

const ResponsiveHeader = styled.th`
    background-color: #34495e;
    color: #ecf0f1;
    padding: 15px;
    border: 1px solid #34495e;
    min-width: 150px;
`;

const ResponsiveCell = styled.td`
    border: 1px solid #34495e;
    padding: 15px;
    vertical-align: top;
    min-width: 150px;
    max-width: 300px;
    word-wrap: break-word;
    overflow-wrap: break-word;
    white-space: normal;
`;

const SidebarContainer = styled.div`
    width: 250px;
    background-color: #2c3e50;
    color: #ecf0f1;
    position: sticky;
    top: 0;
    height: 100vh;
    display: flex;
    flex-direction: column;
    @media (max-width: 768px) {
        width: ${(props) => (props.isOpen ? '100%' : '0')};
        position: fixed;
        top: 0;
        left: 0;
        height: 100%;
        transition: width 0.3s;
        z-index: 1000;
    }
`;

const SidebarHeader = styled.div`
    padding: 2px;
    font-size: 1.2em;
    background-color: #34495e;
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
    border-bottom: 1px solid #34495e;
    cursor: pointer;
    &:hover {
        background-color: #34495e;
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
    background: #e74c3c;
    color: white;
    border: none;
    padding: 10px;
    cursor: pointer;
    position: fixed;
    top: 10px;
    left: 10px;
    z-index: 1010;
    @media (max-width: 768px) {
        display: block;
    }
`;

const PostHeader = styled.h1`
    font-size: 2.5em;
    color: #2c3e50;
    text-align: left;
    margin-bottom: 20px;
    @media (max-width: 768px) {
        font-size: 1.5em;
    }
`;

const SubtitleHeader = styled.h2`
    font-size: 2em;
    color: #34495e;
    margin: 20px 0 10px;
`;

const SummaryContainer = styled.div`
    margin-top: 20px;
`;

const CodeSnippetContainer = styled.div`
    position: relative;
    margin: 20px 0;
    background: #1e1e1e;
    border-radius: 5px;
    overflow: hidden;
`;

const CopyButton = styled.button`
    position: absolute;
    top: 10px;
    right: 10px;
    background: #007bff;
    color: #fff;
    border: none;
    padding: 5px 10px;
    border-radius: 5px;
    cursor: pointer;
    &:hover {
        background: #0056b3;
    }
`;

const CompleteButton = styled.button`
    position: sticky;
    bottom: 20px;
    align-self: flex-end;
    margin: 20px;
    padding: 12px 24px;
    background-color: ${({ isCompleted }) => (isCompleted ? '#27ae60' : '#2c3e50')};
    color: #ecf0f1;
    border: none;
    border-radius: 5px;
    cursor: ${({ isCompleted }) => (isCompleted ? 'not-allowed' : 'pointer')};
    font-size: 1.1em;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
    transition: background-color 0.2s;
    &:hover {
        background-color: ${({ isCompleted }) => (isCompleted ? '#27ae60' : '#34495e')};
    }
`;

const ImageError = styled.div`
    color: red;
    margin: 10px 0;
`;

const PostPage = memo(() => {
    const { slug } = useParams();
    const dispatch = useDispatch();
    const post = useSelector((state) => state.postReducer.post);
    const completedPosts = useSelector((state) => state.postReducer.completedPosts || []);
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [imageErrors, setImageErrors] = useState({});

    useEffect(() => {
        dispatch(fetchPostBySlug(slug));
        dispatch(fetchCompletedPosts());
    }, [dispatch, slug]);

    const handleMarkAsCompleted = async () => {
        if (!post) {
            toast.error('No post data available');
            return;
        }

        try {
            const response = await fetch(`https://se3fw2nzc2.execute-api.ap-south-1.amazonaws.com/prod/api/posts/complete/${post.postId}`, {
                method: 'PUT',
                headers: { 'x-auth-token': localStorage.getItem('token') }
            });
            const data = await response.json();

            if (!response.ok) {
                if (response.status === 400 && data.msg === 'Post already marked as completed') {
                    toast.info('This post is already marked as completed');
                    const completedResponse = await fetch('https://se3fw2nzc2.execute-api.ap-south-1.amazonaws.com/pro/api/posts/completed', {
                        headers: { 'x-auth-token': localStorage.getItem('token') }
                    });
                    const updatedCompletedPosts = await completedResponse.json();
                    dispatch({ type: 'FETCH_COMPLETED_POSTS_SUCCESS', payload: updatedCompletedPosts });
                    return;
                }
                throw new Error(data.msg || 'Failed to mark post as completed');
            }

            toast.success('Post marked as completed!');
            if (data.certificateUrl) {
                toast.success(`Category completed! Certificate issued: ${data.certificateUrl}`, {
                    autoClose: 5000,
                    onClick: () => window.open(data.certificateUrl, '_blank')
                });
            }

            const completedResponse = await fetch('https://se3fw2nzc2.execute-api.ap-south-1.amazonaws.com/prod/api/posts/completed', {
                headers: { 'x-auth-token': localStorage.getItem('token') }
            });
            const updatedCompletedPosts = await completedResponse.json();
            dispatch({ type: 'FETCH_COMPLETED_POSTS_SUCCESS', payload: updatedCompletedPosts });
        } catch (error) {
            toast.error(`Failed to mark post as completed: ${error.message}`);
        }
    };

    const isCompleted = completedPosts.some(p => p.postId === post?.postId);

    const scrollToSection = (id) => {
        const section = document.getElementById(id);
        if (section) {
            section.scrollIntoView({ behavior: 'smooth' });
            if (isSidebarOpen) setSidebarOpen(false);
        }
    };

    const handleCopyCode = () => {
        toast.success('Code copied to clipboard!', {
            position: "top-right",
            autoClose: 2000,
            hideProgressBar: true,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
        });
    };

    const handleImageError = (url) => {
        setImageErrors(prev => ({ ...prev, [url]: true }));
    };

    if (!post) {
        return (
            <LoadingOverlay>
                <RingLoader color="#2c3e50" size={150} />
            </LoadingOverlay>
        );
    }

    // SEO-related data
    const pageTitle = `${post.title} | Zedemy`;
    const pageDescription = post.summary ? truncateText(post.summary, 160) : (post.content ? truncateText(post.content, 160) : 'Learn more about this topic at Zedemy.');
    const pageKeywords = post.keywords || `${post.title}, Zedemy, tutorial, education`;
    const canonicalUrl = `https://zedemy.vercel.app/posts/${slug}`;
    const ogImage = post.titleImage || 'https://sanjaybasket.s3.ap-south-1.amazonaws.com/zedemy-logo.png';

    // Structured Data (JSON-LD)
    const structuredData = {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: post.title,
        description: pageDescription,
        author: {
            '@type': 'Person',
            name: post.author || 'Zedemy Team'
        },
        publisher: {
            '@type': 'Organization',
            name: 'Zedemy',
            logo: {
                '@type': 'ImageObject',
                url: 'https://sanjaybasket.s3.ap-south-1.amazonaws.com/zedemy-logo.png'
            }
        },
        datePublished: post.date,
        image: ogImage,
        url: canonicalUrl,
        mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': canonicalUrl
        }
    };

    return (
        <HelmetProvider>
            <Helmet>
                <html lang="en" />
                <title>{pageTitle}</title>
                <meta name="description" content={pageDescription} />
                <meta name="keywords" content={pageKeywords} />
                <meta name="author" content={post.author || 'Zedemy Team'} />
                <meta name="robots" content="index, follow" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <link rel="canonical" href={canonicalUrl} />
                
                {/* Open Graph Tags */}
                <meta property="og:title" content={pageTitle} />
                <meta property="og:description" content={pageDescription} />
                <meta property="og:image" content={ogImage} />
                <meta property="og:url" content={canonicalUrl} />
                <meta property="og:type" content="article" />
                <meta property="og:site_name" content="Zedemy" />

                {/* Twitter Card Tags */}
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content={pageTitle} />
                <meta name="twitter:description" content={pageDescription} />
                <meta name="twitter:image" content={ogImage} />

                {/* Structured Data */}
                <script type="application/ld+json">
                    {JSON.stringify(structuredData)}
                </script>
            </Helmet>
            <Container>
                <Content>
                    <ToggleButton onClick={() => setSidebarOpen(!isSidebarOpen)}>
                        {isSidebarOpen ? 'Close' : 'Menu'}
                    </ToggleButton>
                    <PostHeader dangerouslySetInnerHTML={{ __html: parseLinks(post.title, post.category) }} />
                    {post.titleImage && (
                        <>
                            <img
                                src={post.titleImage}
                                alt={post.title}
                                style={{ width: '100%', maxWidth: '600px', margin: '0 auto', display: 'block' }}
                                onError={() => handleImageError(post.titleImage)}
                            />
                            {imageErrors[post.titleImage] && (
                                <ImageError>Failed to load image: {post.titleImage}</ImageError>
                            )}
                        </>
                    )}
                    {post.titleVideo && (
                        <video controls style={{ width: '100%', maxWidth: '600px', margin: '20px 0' }}>
                            <source src={post.titleVideo} type="video/mp4" />
                            Your browser does not support the video tag.
                        </video>
                    )}
                    <p>Date Published: {post.date}</p>
                    <p>Author: {post.author}</p>
                    <p dangerouslySetInnerHTML={{ __html: parseLinks(post.content, post.category) }} />

                    {post.subtitles.map((subtitle, index) => (
                        <div key={index} id={`subtitle-${index}`}>
                            <SubtitleHeader dangerouslySetInnerHTML={{ __html: parseLinks(subtitle.title, post.category) }} />
                            {subtitle.image && (
                                <Zoom>
                                    <img
                                        src={subtitle.image}
                                        alt={subtitle.title}
                                        style={{ width: '100%', maxWidth: '600px', margin: '20px 0' }}
                                        onError={() => handleImageError(subtitle.image)}
                                    />
                                    {imageErrors[subtitle.image] && (
                                        <ImageError>Failed to load image: {subtitle.image}</ImageError>
                                    )}
                                </Zoom>
                            )}
                            {subtitle.video && (
                                <video controls style={{ width: '100%', maxWidth: '600px', margin: '20px 0' }}>
                                    <source src={subtitle.video} />
                                    Your browser does not support the video tag.
                                </video>
                            )}
                            <ul>
                                {subtitle.bulletPoints.map((point, pointIndex) => (
                                    <li key={pointIndex} style={{ marginBottom: '10px' }}>
                                        <span dangerouslySetInnerHTML={{ __html: parseLinks(point.text, post.category) }} />
                                        {point.image && (
                                            <Zoom>
                                                <img
                                                    src={point.image}
                                                    alt={point.text}
                                                    style={{ width: '100%', maxWidth: '600px', margin: '20px 0' }}
                                                    onError={() => handleImageError(point.image)}
                                                />
                                                {imageErrors[point.image] && (
                                                    <ImageError>Failed to load image: {point.image}</ImageError>
                                                )}
                                            </Zoom>
                                        )}
                                        {point.video && (
                                            <video controls style={{ width: '100%', maxWidth: '400px', margin: '10px 0' }}>
                                                <source src={point.video} type="video/mp4" />
                                                Your browser does not support the video tag.
                                            </video>
                                        )}
                                        {point.codeSnippet && (
                                            <CodeSnippetContainer>
                                                <CopyToClipboard text={point.codeSnippet} onCopy={handleCopyCode}>
                                                    <CopyButton>Copy</CopyButton>
                                                </CopyToClipboard>
                                                <SyntaxHighlighter language="javascript" style={vs}>
                                                    {sanitizeCodeSnippet(point.codeSnippet)}
                                                </SyntaxHighlighter>
                                            </CodeSnippetContainer>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                    {post.superTitles &&
                        post.superTitles.length > 0 &&
                        post.superTitles.some(superTitle =>
                            superTitle.superTitle.trim() !== '' &&
                            superTitle.attributes &&
                            superTitle.attributes.length > 0 &&
                            superTitle.attributes.some(attr =>
                                attr.attribute.trim() !== '' &&
                                attr.items &&
                                attr.items.length > 0 &&
                                attr.items.some(item =>
                                    item.title.trim() !== '' &&
                                    item.bulletPoints &&
                                    item.bulletPoints.length > 0 &&
                                    item.bulletPoints.some(point => point.trim() !== '')
                                )
                            )
                        ) && (
                            <ComparisonTableContainer>
                                <SubtitleHeader>Comparison</SubtitleHeader>
                                <ResponsiveContent>
                                    <ResponsiveTable>
                                        <thead>
                                            <tr>
                                                <TableHeader>Attribute</TableHeader>
                                                {post.superTitles.map((superTitle, index) => (
                                                    superTitle.superTitle.trim() !== '' && superTitle.attributes && superTitle.attributes.length > 0 && (
                                                        <ResponsiveHeader key={index} dangerouslySetInnerHTML={{ __html: parseLinks(superTitle.superTitle, post.category) }} />
                                                    )
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {post.superTitles[0].attributes.map((attr, attrIndex) => (
                                                attr.attribute.trim() !== '' && attr.items && attr.items.length > 0 && attr.items.some(item => item.title.trim() !== '' || (item.bulletPoints && item.bulletPoints.length > 0 && item.bulletPoints.some(point => point.trim() !== ''))) && (
                                                    <tr key={attrIndex}>
                                                        <TableCell dangerouslySetInnerHTML={{ __html: parseLinks(attr.attribute, post.category) }} />
                                                        {post.superTitles.map((superTitle, superIndex) => (
                                                            superTitle.attributes[attrIndex] && superTitle.attributes[attrIndex].items && superTitle.attributes[attrIndex].items.length > 0 && (
                                                                <ResponsiveCell key={superIndex}>
                                                                    {superTitle.attributes[attrIndex].items.map((item, itemIndex) => (
                                                                        (item.title.trim() !== '' || (item.bulletPoints && item.bulletPoints.length > 0 && item.bulletPoints.some(point => point.trim() !== ''))) && (
                                                                            <div key={itemIndex}>
                                                                                <strong dangerouslySetInnerHTML={{ __html: parseLinks(item.title, post.category) }} />
                                                                                <ul>
                                                                                    {item.bulletPoints.map((point, pointIndex) => (
                                                                                        point.trim() !== '' && <li key={pointIndex} dangerouslySetInnerHTML={{ __html: parseLinks(point, post.category) }} />
                                                                                    ))}
                                                                                </ul>
                                                                            </div>
                                                                        )
                                                                    ))}
                                                                </ResponsiveCell>
                                                            )
                                                        ))}
                                                    </tr>
                                                )
                                            ))}
                                        </tbody>
                                    </ResponsiveTable>
                                </ResponsiveContent>
                            </ComparisonTableContainer>
                        )}
                    {post.summary && (
                        <SummaryContainer id="summary">
                            <SubtitleHeader>Summary</SubtitleHeader>
                            <p dangerouslySetInnerHTML={{ __html: parseLinks(post.summary, post.category) }} />
                        </SummaryContainer>
                    )}
                    <CompleteButton
                        onClick={handleMarkAsCompleted}
                        disabled={isCompleted}
                        isCompleted={isCompleted}
                    >
                        {isCompleted ? 'Completed' : 'Mark as Completed'}
                    </CompleteButton>
                </Content>
                <SidebarContainer isOpen={isSidebarOpen}>
                    <SidebarHeader>Contents</SidebarHeader>
                    <SubtitlesList>
                        {post.subtitles.map((subtitle, index) => (
                            <SubtitleItem key={index}>
                                <Button onClick={() => scrollToSection(`subtitle-${index}`)} dangerouslySetInnerHTML={{ __html: parseLinks(subtitle.title, post.category) }} />
                            </SubtitleItem>
                        ))}
                        {post.summary && (
                            <SubtitleItem>
                                <Button onClick={() => scrollToSection('summary')}>Summary</Button>
                            </SubtitleItem>
                        )}
                    </SubtitlesList>
                </SidebarContainer>
            </Container>
        </HelmetProvider>
    );
});

export default PostPage;
