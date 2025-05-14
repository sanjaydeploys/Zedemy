import React, { memo, useEffect, useState, useRef } from 'react';
import { minify } from 'csso';

const criticalCss = minify(`
article,section{margin:0;padding:0;}
header > h1{font-size:clamp(1.25rem, 3vw, 2rem);color:#011020;font-weight:800;line-height:1.2;margin:0;padding:0.5rem 0;}
header > div:last-child{color:#666;font-size:clamp(0.7rem, 1.5vw, 0.875rem);padding:0.25rem 0;margin:0;}
header > div:first-child{width:100%;max-width:min(100%, 360px);margin:0 auto;padding:0.5rem 0;}
header > div:first-child > img{width:100%;height:auto;object-fit:contain;}
article{font-size:clamp(0.8125rem, 2vw, 1.125rem);line-height:clamp(1.3, 2vw, 1.6);width:100%;max-width:800px;padding:0.25rem 0;margin:0;word-break:break-word;}
article > *:last-child{margin-bottom:0;}
article p,article ul,article ol,article pre,article h2,article h3,article blockquote,article figure,article table{margin:0 0 0.5rem 0;padding:0;}
article a{color:#0066cc;text-decoration:underline;}
article img{max-width:min(100%, 360px);height:auto;object-fit:contain;}
div[aria-hidden="true"]{background:linear-gradient(90deg,#e0e0e0 25%,#f0f0f0 50%,#e0e0e0 75%);background-size:200% 100%;animation:shimmer 1.5s infinite;}
.non-critical-container{height:100%;min-height:50px;}
@keyframes shimmer{0%{background-position:200% 0;}100%{background-position:-200% 0;}}
`).css;

const LCPContent = ({ lcpContent, preRenderedContent }) => {
    const startTime = performance.now();
    let effectiveLcpContent = lcpContent;
    if (!lcpContent && preRenderedContent) {
        const firstSentence = preRenderedContent.match(/[^.!?]+[.!?]/)?.[0] || preRenderedContent.slice(0, 100);
        effectiveLcpContent = `<p>${firstSentence}</p>`;
        console.log('[LCPContent] Using preRenderedContent fallback:', effectiveLcpContent);
    }
    const lcpImage = effectiveLcpContent?.match(/src=["']([^"']+)["']/i)?.[1];

    console.log('LCP render time:', performance.now() - startTime);

    return (
        <>
            {effectiveLcpContent?.startsWith('<p') ? (
                <div dangerouslySetInnerHTML={{ __html: effectiveLcpContent }} />
            ) : effectiveLcpContent?.startsWith('<img') ? (
                <img
                    src={lcpImage}
                    width={effectiveLcpContent.match(/width=["'](\d+)["']/i)?.[1] || 240}
                    height={effectiveLcpContent.match(/height=["'](\d+\.?\d*)["']/i)?.[1] || 135}
                    alt="LCP image"
                    loading="eager"
                    fetchpriority="high"
                    decoding="sync"
                    style={{ width: '100%', height: 'auto', objectFit: 'contain' }}
                    onError={(e) => console.error('LCP image failed:', e.target.src)}
                />
            ) : (
                <div aria-hidden="true" style={{ height: '50px' }} />
            )}
        </>
    );
};

const areEqual = (prev, next) => {
    return (
        prev.post?.title === next.post?.title &&
        prev.post?.titleImage === next.post?.titleImage &&
        prev.post?.lcpContent === next.post?.lcpContent &&
        prev.post?.preRenderedContent === next.post?.preRenderedContent &&
        prev.post?.contentHeight === next.post?.contentHeight &&
        prev.post?.titleImageAspectRatio === next.post?.titleImageAspectRatio &&
        prev.readTime === next.readTime
    );
};

const PriorityContent = memo(({ post: rawPost, readTime }) => {
    const post = rawPost || {
        preRenderedContent: '',
        lcpContent: '',
        contentHeight: 0,
        title: 'Loading...',
        titleImage: null,
        titleImageAspectRatio: '16:9',
    };
    const [nonCriticalContent, setNonCriticalContent] = useState(null);
    const [imageSrc, setImageSrc] = useState('data:image/gif;base64,R0lGODlhAQABAIAAAMLCwgAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw=='); // 1x1 transparent GIF as LQIP
    const isLoading = !post || (!post.title && !post.lcpContent);
    const viewport = post.contentStyles?.viewport || 'mobile';
    const style = post.contentStyles?.[viewport] || {
        image: { width: 240, height: 135 },
        margin: 8,
        padding: 4,
    };
    const contentHeight = post.contentHeight || 0;
    const contentRef = useRef(null);

    useEffect(() => {
        if (post.titleImage) {
            const img = new Image();
            img.src = post.titleImage;
            img.onload = () => setImageSrc(post.titleImage);
            img.onerror = () => console.error('Title image failed to load:', post.titleImage);
        }
    }, [post.titleImage]);

    useEffect(() => {
        if (contentRef.current && !isLoading) {
            const actualHeight = contentRef.current.offsetHeight;
            console.log('[PriorityContent] contentHeight (backend):', contentHeight, 'Actual height:', actualHeight);
            if (Math.abs(actualHeight - contentHeight) > 10) {
                console.warn('[PriorityContent] Height mismatch detected!');
            }
        }
    }, [contentHeight, nonCriticalContent, isLoading]);

    useEffect(() => {
        if (!post.preRenderedContent || !post.lcpContent) {
            console.log('[PriorityContent] Skipping non-critical render: missing preRenderedContent or lcpContent');
            setNonCriticalContent(null);
            return;
        }

        const renderNonCritical = () => {
            try {
                const content = post.lcpContent ? post.preRenderedContent.replace(post.lcpContent, '') : post.preRenderedContent;
                setNonCriticalContent(<div className="non-critical-container" dangerouslySetInnerHTML={{ __html: content }} style={{ fetchPriority: 'low' }} />);
                console.log('[PriorityContent] Non-critical content rendered');
            } catch (error) {
                console.error('[PriorityContent] Non-critical render failed:', error);
                setNonCriticalContent(<div className="non-critical-container" aria-hidden="true" style={{ height: `${contentHeight}px` }} />);
            }
        };

        if (window.requestIdleCallback) {
            window.requestIdleCallback(renderNonCritical, { timeout: 500 });
        } else {
            setTimeout(renderNonCritical, 0);
        }
    }, [post.preRenderedContent, post.lcpContent, contentHeight]);

    const aspectRatio = post.titleImageAspectRatio || '16:9';
    const [aspectWidth, aspectHeight] = aspectRatio.split(':').map(Number);
    const imageHeight = Math.round((style.image.width / aspectWidth) * aspectHeight);

    try {
        return (
            <>
                <style>{criticalCss}</style>
                <article
                    style={{
                        width: '100%',
                        maxWidth: '800px',
                        display: 'flex',
                        flexDirection: 'column',
                        fetchPriority: 'high',
                        margin: 0,
                        padding: 0,
                    }}
                    aria-live="polite"
                >
                    {isLoading ? (
                        <div
                            aria-hidden="true"
                            style={{
                                width: '100%',
                                height: '200px',
                                fetchPriority: 'high',
                            }}
                        />
                    ) : (
                        <>
                            <header style={{ width: '100%', margin: 0, padding: 0 }}>
                                {post.titleImage && (
                                    <div>
                                        <img
                                            src={imageSrc}
                                            srcSet={`
                                                ${post.titleImage?.replace('w=240', 'w=220') || ''} 220w,
                                                ${post.titleImage || ''} 240w,
                                                ${post.titleImage?.replace('w=240', 'w=280') || ''} 280w
                                            `}
                                            sizes="(max-width: 360px) 220px, (max-width: 768px) 240px, 280px"
                                            alt={post.title || 'Post image'}
                                            width={style.image.width}
                                            height={imageHeight}
                                            decoding="sync"
                                            loading="eager"
                                            fetchpriority="high"
                                            style={{ width: '100%', height: 'auto', objectFit: 'contain', aspectRatio: `${aspectWidth}/${aspectHeight}` }}
                                            onError={(e) => {
                                                console.error('Title image failed:', e.target.src);
                                                e.target.src = 'https://via.placeholder.com/240x135?text=Image+Failed';
                                            }}
                                        />
                                    </div>
                                )}
                                <h1 style={{ willChange: 'contents', fetchPriority: 'high' }}>
                                    {post.title || 'Untitled'}
                                </h1>
                                <div>
                                    <span>By {post.author || 'Unknown'}</span>
                                    <span>
                                        {' | '}
                                        {post.date && !isNaN(new Date(post.date).getTime())
                                            ? new Date(post.date).toLocaleDateString('en-US', {
                                                  year: 'numeric',
                                                  month: 'long',
                                                  day: 'numeric',
                                              })
                                            : 'Unknown Date'}
                                    </span>
                                    <span>
                                        {' | Read time: '}
                                        <span id="read-time">{readTime || '0'}</span> min
                                    </span>
                                </div>
                            </header>
                            <section
                                role="region"
                                aria-label="Priority content"
                                ref={contentRef}
                                style={{
                                    width: '100%',
                                    maxWidth: '800px',
                                    fetchPriority: 'high',
                                    willChange: 'contents',
                                    margin: 0,
                                    padding: '0.25rem 0',
                                    minHeight: contentHeight > 0 ? `${contentHeight}px` : 'auto',
                                }}
                            >
                                <LCPContent lcpContent={post.lcpContent} preRenderedContent={post.preRenderedContent} />
                                {nonCriticalContent}
                            </section>
                        </>
                    )}
                </article>
            </>
        );
    } catch (error) {
        console.error('[PriorityContent] Render error:', error);
        return (
            <div aria-hidden="true" style={{ height: '200px' }}>
                <p>Error rendering content. Please try refreshing.</p>
            </div>
        );
    }
}, areEqual);

export default PriorityContent;
