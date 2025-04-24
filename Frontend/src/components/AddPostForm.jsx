
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addPost } from '../actions/postActions';
import { loadUser } from '../actions/authActions';
import axios from 'axios';
import DOMPurify from 'dompurify';
import styled from 'styled-components';
import { Tooltip } from '@material-ui/core';
import pica from 'pica';

// Styled Components (unchanged)
const FormContainer = styled.div`
    max-width: 1200px;
    margin: 20px auto;
    padding: 20px;
    background-color: #f9f9f9;
    border-radius: 8px;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
`;

const FormGrid = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-gap: 20px;
`;

const Section = styled.div`
    background: #fff;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 0 5px rgba(0, 0, 0, 0.1);
    margin-bottom: 20px;
`;

const FullWidthSection = styled(Section)`
    grid-column: span 2;
`;

const SectionTitle = styled.h3`
    margin-bottom: 20px;
    color: #333;
    border-bottom: 2px solid #007bff;
    padding-bottom: 5px;
`;

const FormGroup = styled.div`
    display: grid;
    gap: 10px;
`;

const Label = styled.label`
    font-weight: bold;
    margin-bottom: 5px;
`;

const Input = styled.input`
    width: 100%;
    padding: 10px;
    border: 1px solid #ccc;
    border-radius: 5px;
`;

const TextArea = styled.textarea`
    width: 100%;
    padding: 10px;
    border: 1px solid #ccc;
    border-radius: 5px;
`;

const Select = styled.select`
    width: 100%;
    padding: 10px;
    border: 1px solid #ccc;
    border-radius: 5px;
`;

const Button = styled.button`
    padding: 10px 20px;
    background-color: #007bff;
    color: #fff;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    margin-top: 10px;

    &:hover {
        background-color: #0056b3;
    }
`;

const IconButton = styled(Button)`
    background: none;
    color: #007bff;
    border: 1px solid #007bff;
    padding: 5px 10px;
    font-size: 0.9em;
    margin: 5px 0;

    &:hover {
        background-color: #e6f7ff;
        border-color: #0056b3;
    }
`;

const PreviewImage = styled.img`
    max-width: 200px;
    margin-top: 10px;
    border-radius: 5px;
`;

const PreviewVideo = styled.video`
    max-width: 200px;
    margin-top: 10px;
    border-radius: 5px;
`;

const ErrorMessage = styled.div`
    color: red;
    font-size: 0.9em;
    margin-top: 5px;
`;

const AddPostForm = () => {
    const dispatch = useDispatch();
    const [title, setTitle] = useState('');
    const [titleImage, setTitleImage] = useState(null);
    const [titleImageHash, setTitleImageHash] = useState(null);
    const [titleImagePreview, setTitleImagePreview] = useState(null);
    const [content, setContent] = useState('');
    const [category, setCategory] = useState('');
    const [subtitles, setSubtitles] = useState([{ 
        title: '', 
        image: null, 
        imageHash: null, 
        isFAQ: false, 
        bulletPoints: [{ text: '', image: null, imageHash: null, video: null, videoHash: null, codeSnippet: '' }] 
    }]);
    const [summary, setSummary] = useState('');
    const [video, setVideo] = useState(null);
    const [videoHash, setVideoHash] = useState(null);
    const [videoPreview, setVideoPreview] = useState(null);
    const [error, setError] = useState('');
    const { user } = useSelector(state => state.auth);
    const categories = [
        'VS Code', 'HTML', 'CSS', 'JavaScript', 'Node.js', 'React', 'Angular', 'Vue.js', 'Next.js', 'Nuxt.js',
        'Gatsby', 'Svelte', 'TypeScript', 'GraphQL', 'PHP', 'Python', 'Ruby', 'Java', 'C#', 'C++', 'Swift',
        'Kotlin', 'Dart', 'Flutter', 'React Native'
    ];
    const [superTitles, setSuperTitles] = useState([{ superTitle: '', attributes: [{ attribute: '', items: [{ title: '', bulletPoints: [''] }] }] }]);

    // Sanitization configuration for code snippets (strict)
    const codeSanitizeConfig = {
        ALLOWED_TAGS: [],
        ALLOWED_ATTR: []
    };

    // Function to sanitize only code snippets
    const sanitizeCodeSnippet = (code) => {
        return DOMPurify.sanitize(code, codeSanitizeConfig);
    };

      const validateFile = (file, type) => {
        if (!file) return 'No file selected';
        const maxSize = 2 * 1024 * 1024; // 2 MB
        const validImageTypes = ['image/jpeg', 'image/png', 'image/gif'];
        const validVideoTypes = ['video/mp4', 'video/mpeg', 'video/webm'];
    
        if (file.size > maxSize) {
            return `File size exceeds 2 MB (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
        }
    
        if (type === 'image' && !validImageTypes.includes(file.type)) {
            return `Invalid image type: ${file.type}. Allowed: JPEG, PNG, GIF`;
        }
    
        if (type === 'video' && !validVideoTypes.includes(file.type)) {
            return `Invalid video type: ${file.type}. Allowed: MP4, MPEG, WebM`;
        }
    
        return null;
    };
    
    const generateFileHash = async (file) => {
        const arrayBuffer = await file.arrayBuffer();
        const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    };
    
    // New function to compress and convert image to WebP
    const compressAndConvertToWebP = async (file, targetSizeKB = 50) => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const reader = new FileReader();
    
            reader.onload = async (e) => {
                img.src = e.target.result;
    
                img.onload = async () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
    
                    // Set initial dimensions
                    let width = img.width;
                    let height = img.height;
                    canvas.width = width;
                    canvas.height = height;
    
                    // Draw image to canvas
                    ctx.drawImage(img, 0, 0, width, height);
    
                    let quality = 0.9; // Start with high quality
                    let webpBlob;
    
                    // Iterative compression to approach target size
                    while (quality > 0.1) {
                        try {
                            webpBlob = await new Promise((resolveBlob) => {
                                canvas.toBlob(
                                    (blob) => resolveBlob(blob),
                                    'image/webp',
                                    quality
                                );
                            });
    
                            const sizeKB = webpBlob.size / 1024;
                            if (sizeKB <= targetSizeKB * 1.2) { // Allow slight overshoot
                                break;
                            }
    
                            // Reduce dimensions if size is still too large
                            width *= 0.9;
                            height *= 0.9;
                            canvas.width = width;
                            canvas.height = height;
    
                            // Use pica for high-quality resizing
                            await pica().resize(img, canvas, {
                                quality: 3, // Highest quality
                                alpha: true // Preserve transparency for PNG/GIF
                            });
    
                            quality -= 0.1; // Decrease quality incrementally
                        } catch (error) {
                            reject(new Error(`Compression failed: ${error.message}`));
                            return;
                        }
                    }
    
                    if (!webpBlob) {
                        reject(new Error('Failed to compress image to target size'));
                        return;
                    }
    
                    const webpFile = new File([webpBlob], file.name.replace(/\.[^/.]+$/, '.webp'), {
                        type: 'image/webp'
                    });
                    resolve(webpFile);
                };
    
                img.onerror = () => reject(new Error('Failed to load image'));
            };
    
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
        });
    };
    
    const handleImageUpload = async (e, setImage, setImageHash, categoryOverride = category, retries = 3) => {
        const file = e.target.files[0];
        setError('');
        if (!file) {
            setError('No file selected');
            return;
        }
    
        const error = validateFile(file, 'image');
        if (error) {
            setError(error);
            return;
        }
    
        let compressedFile;
        try {
            // Compress and convert to WebP
            compressedFile = await compressAndConvertToWebP(file, 50);
        } catch (error) {
            setError(`Error compressing image: ${error.message}`);
            console.error('Compression error:', error);
            return;
        }
    
        const previewUrl = URL.createObjectURL(compressedFile);
        if (setImage === setTitleImage) {
            setTitleImagePreview(previewUrl);
        }
    
        let attempt = 1;
        while (attempt <= retries) {
            try {
                console.log(`Uploading image (attempt ${attempt}):`, {
                    name: compressedFile.name,
                    type: compressedFile.type, // Will be 'image/webp'
                    size: compressedFile.size,
                    category: categoryOverride
                });
    
                // Get pre-signed URL
                const res = await axios.post(
                    'https://se3fw2nzc2.execute-api.ap-south-1.amazonaws.com/prod/get-presigned-url',
                    {
                        fileType: compressedFile.type, // Use WebP MIME type
                        folder: 'images',
                        category: categoryOverride
                    }
                );
                const { signedUrl, publicUrl, key } = res.data;
    
                // Upload file to S3
                await axios.put(signedUrl, compressedFile, {
                    headers: { 'Content-Type': compressedFile.type }
                });
    
                // Generate file hash
                const fileHash = await generateFileHash(compressedFile);
    
                // Store metadata in DynamoDB
                await axios.post(
                    'https://se3fw2nzc2.execute-api.ap-south-1.amazonaws.com/prod/store-metadata',
                    { fileKey: key, fileHash, fileType: 'images', category: categoryOverride, userId: user.id }
                );
    
                // Verify S3 URL
                const response = await fetch(publicUrl);
                if (!response.ok) {
                    throw new Error(`S3 URL not accessible: ${response.status}`);
                }
    
                setImage(publicUrl);
                setImageHash(fileHash);
                console.log('Image uploaded:', { filePath: publicUrl, fileHash });
                return;
            } catch (error) {
                console.error(`Image upload attempt ${attempt} failed:`, error);
                if (attempt === retries) {
                    const errorMsg = error.response?.data?.error || error.message;
                    setError(`Error uploading image: ${errorMsg}`);
                    console.error('Error uploading image:', {
                        message: error.message,
                        response: error.response?.data,
                        status: error.response?.status
                    });
                    return;
                }
                attempt++;
                await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            }
        }
    };

    const handleVideoUpload = async (e, setVideo, setVideoHash, categoryOverride = category, retries = 3) => {
        const file = e.target.files[0];
        setError('');
        if (!file) {
            setError('No file selected');
            return;
        }

        const error = validateFile(file, 'video');
        if (error) {
            setError(error);
            return;
        }

        const previewUrl = URL.createObjectURL(file);
        if (setVideo === setVideo) {
            setVideoPreview(previewUrl);
        }

        let attempt = 1;
        while (attempt <= retries) {
            try {
                console.log(`Uploading video (attempt ${attempt}):`, {
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    category: categoryOverride
                });

                // Get pre-signed URL
                const res = await axios.post(
                    'https://se3fw2nzc2.execute-api.ap-south-1.amazonaws.com/prod/get-presigned-url',
                    {
                        fileType: file.type,
                        folder: 'videos',
                        category: categoryOverride
                    }
                );
                const { signedUrl, publicUrl, key } = res.data;

                // Upload file to S3
                await axios.put(signedUrl, file, {
                    headers: { 'Content-Type': file.type }
                });

                // Generate file hash
                const fileHash = await generateFileHash(file);

                // Store metadata in DynamoDB
                await axios.post(
                    'https://se3fw2nzc2.execute-api.ap-south-1.amazonaws.com/prod/store-metadata',
                    { fileKey: key, fileHash, fileType: 'videos', category: categoryOverride, userId: user.id }
                );

                // Verify S3 URL
                const response = await fetch(publicUrl);
                if (!response.ok) {
                    throw new Error(`S3 URL not accessible: ${response.status}`);
                }

                setVideo(publicUrl);
                setVideoHash(fileHash);
                console.log('Video uploaded:', { filePath: publicUrl, fileHash });
                return;
            } catch (error) {
                console.error(`Video upload attempt ${attempt} failed:`, error);
                if (attempt === retries) {
                    const errorMsg = error.response?.data?.error || error.message;
                    setError(`Error uploading video: ${errorMsg}`);
                    console.error('Error uploading video:', {
                        message: error.message,
                        response: error.response?.data,
                        status: error.response?.status
                    });
                    return;
                }
                attempt++;
                await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            }
        }
    };

    const handleSuperTitleChange = (index, field, value) => {
        const newSuperTitles = [...superTitles];
        newSuperTitles[index][field] = value;
        setSuperTitles(newSuperTitles); 
    };

    const handleAttributeChange = (superTitleIndex, attributeIndex, field, value) => {
        const newSuperTitles = [...superTitles];
        newSuperTitles[superTitleIndex].attributes[attributeIndex][field] = value;
        setSuperTitles(newSuperTitles);
    };

    const handleItemChange = (superTitleIndex, attributeIndex, itemIndex, field, value) => {
        const newSuperTitles = [...superTitles];
        newSuperTitles[superTitleIndex].attributes[attributeIndex].items[itemIndex][field] = value;
        setSuperTitles(newSuperTitles);
    };

    const addSuperTitle = () => {
        setSuperTitles([...superTitles, { superTitle: '', attributes: [{ attribute: '', items: [{ title: '', bulletPoints: [''] }] }] }]);
    };

    const addAttribute = (superTitleIndex) => {
        const newSuperTitles = [...superTitles];
        newSuperTitles[superTitleIndex].attributes.push({ attribute: '', items: [{ title: '', bulletPoints: [''] }] });
        setSuperTitles(newSuperTitles);
    };

    const addItem = (superTitleIndex, attributeIndex) => {
        const newSuperTitles = [...superTitles];
        newSuperTitles[superTitleIndex].attributes[attributeIndex].items.push({ title: '', bulletPoints: [''] });
        setSuperTitles(newSuperTitles);
    };

    useEffect(() => {
        if (!user) {
            const storedUser = JSON.parse(localStorage.getItem('user'));
            if (storedUser) {
                dispatch({ type: 'FETCH_USER_SUCCESS', payload: { user: storedUser, token: localStorage.getItem('token') } });
            } else {
                dispatch(loadUser());
            }
        }
        return () => {
            if (titleImagePreview) URL.revokeObjectURL(titleImagePreview);
            if (videoPreview) URL.revokeObjectURL(videoPreview);
        };
    }, [dispatch, user, titleImagePreview, videoPreview]);

    const handleSubtitleChange = (index, field, value) => {
        const newSubtitles = [...subtitles];
        newSubtitles[index][field] = value;
        setSubtitles(newSubtitles);
    };

    const handleBulletPointChange = (index, pointIndex, field, value) => {
        const newSubtitles = [...subtitles];
        newSubtitles[index].bulletPoints[pointIndex][field] = value;
        setSubtitles(newSubtitles);
    };

    const addSubtitle = () => {
        setSubtitles([...subtitles, { 
            title: '', 
            image: null, 
            imageHash: null, 
            isFAQ: false, 
            bulletPoints: [{ text: '', image: null, imageHash: null, video: null, videoHash: null, codeSnippet: '' }] 
        }]);
    };

    const addBulletPoint = (subtitleIndex) => {
        const newSubtitles = [...subtitles];
        newSubtitles[subtitleIndex].bulletPoints.push({ text: '', image: null, imageHash: null, video: null, videoHash: null, codeSnippet: '' });
        setSubtitles(newSubtitles);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user) {
            setError('User not found');
            console.error('User not found');
            return;
        }
        if (!category) {
            setError('Please select a category');
            return;
        }
        try {
            // Sanitize only code snippets in subtitles
            const processedSubtitles = subtitles.map(sub => ({
                ...sub,
                title: sub.title,
                isFAQ: sub.isFAQ,
                bulletPoints: sub.bulletPoints.map(point => ({
                    ...point,
                    text: point.text,
                    codeSnippet: sanitizeCodeSnippet(point.codeSnippet)
                })) 
            }));

            // No sanitization for superTitles
            const processedSuperTitles = superTitles.map(superTitle => ({
                ...superTitle,
                superTitle: superTitle.superTitle,
                attributes: superTitle.attributes.map(attr => ({
                    ...attr,
                    attribute: attr.attribute,
                    items: attr.items.map(item => ({
                        ...item,
                        title: item.title,
                        bulletPoints: item.bulletPoints
                    }))
                }))
            }));

            console.log('Submitting post with category:', category);
            console.log('Processed data:', {
                title,
                content,
                summary,
                subtitles: processedSubtitles,
                superTitles: processedSuperTitles
            });

            // Dispatch the post with processed data
            dispatch(addPost(
                title,
                content,
                category,
                processedSubtitles,
                summary,
                titleImage,
                processedSuperTitles,
                video,
                titleImageHash,
                videoHash
            ));

            // Reset form fields
            setTitle('');
            setTitleImage(null);
            setTitleImageHash(null);
            setTitleImagePreview(null);
            setContent('');
            setVideo(null);
            setVideoHash(null);
            setVideoPreview(null);
            setCategory('');
            setSubtitles([{ 
                title: '', 
                image: null, 
                imageHash: null, 
                isFAQ: false, 
                bulletPoints: [{ text: '', image: null, imageHash: null, video: null, videoHash: null, codeSnippet: '' }] 
            }]);
            setSummary('');
            setSuperTitles([{ superTitle: '', attributes: [{ attribute: '', items: [{ title: '', bulletPoints: [''] }] }] }]);
            setError('');
        } catch (error) {
            setError(`Error adding post: ${error.message}`);
            console.error('Error adding post:', error);
        }
    };

    return (
        <FormContainer>
            <FullWidthSection>
                <h2>Add New Post</h2>
                {error && <ErrorMessage>{error}</ErrorMessage>}
                <form onSubmit={handleSubmit}>
                    <Section>
                        <SectionTitle>Post Details</SectionTitle>
                        <FormGroup>
                            <Tooltip title="Select the category for your post">
                                <Label>Category</Label>
                            </Tooltip>
                            <Select value={category} onChange={(e) => setCategory(e.target.value)}>
                                <option value="">Select Category</option>
                                {categories.map((cat) => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </Select>
                        </FormGroup>
                        <FormGroup>
                            <Tooltip title="Enter the title of your post. Use [text](url) for links, e.g., [Visit Zedemy](https://zedemy.vercel.app/). HTML tags like <header> are allowed.">
                                <Label>Title</Label>
                            </Tooltip>
                            <Input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
                        </FormGroup>
                        <FormGrid>
                            <FormGroup>
                                <Label>Title Image</Label>
                                <Input
                                    type="file"
                                    accept="image/jpeg,image/png,image/gif"
                                    onChange={(e) => handleImageUpload(e, setTitleImage, setTitleImageHash, category)}
                                />
                                {titleImagePreview && (
                                    <PreviewImage
                                        src={titleImagePreview}
                                        alt="Title preview"
                                        onError={(e) => {
                                            console.error('Failed to load title image:', titleImagePreview);
                                            setError('Failed to preview title image');
                                        }}
                                    />
                                )}
                            </FormGroup>
                            <FormGroup>
                                <Label>Video</Label>
                                <Input
                                    type="file"
                                    accept="video/mp4,video/mpeg,video/webm"
                                    onChange={(e) => handleVideoUpload(e, setVideo, setVideoHash, category)}
                                />
                                {videoPreview && (
                                    <PreviewVideo
                                        src={videoPreview}
                                        controls
                                        onError={(e) => {
                                            console.error('Failed to load video:', videoPreview);
                                            setError('Failed to preview video');
                                        }}
                                    />
                                )}
                            </FormGroup>
                        </FormGrid>
                        <FormGroup>
                            <Tooltip title="Enter the main content of your post. Use [text](url) for links, e.g., [Visit Zedemy](https://zedemy.vercel.app/). HTML tags like <section> are allowed.">
                                <Label>Content</Label>
                            </Tooltip>
                            <TextArea rows="10" value={content} onChange={(e) => setContent(e.target.value)} required />
                        </FormGroup>
                    </Section>

                    <Section>
                        <SectionTitle>Subtitles</SectionTitle>
                        {subtitles.map((subtitle, index) => (
                            <div key={index}>
                                <FormGroup>
                                    <Label>Subtitle</Label>
                                    <Tooltip title="Enter the subtitle. Use [text](url) for links, e.g., [Visit Zedemy](https://zedemy.vercel.app/). HTML tags like <h2> are allowed.">
                                        <Input
                                            type="text"
                                            value={subtitle.title}
                                            onChange={(e) => handleSubtitleChange(index, 'title', e.target.value)}
                                        />
                                    </Tooltip>
                                </FormGroup>
                                <FormGroup>
                                    <Label>
                                        <input
                                            type="checkbox"
                                            checked={subtitle.isFAQ}
                                            onChange={(e) => handleSubtitleChange(index, 'isFAQ', e.target.checked)}
                                        />
                                        Mark as FAQ
                                    </Label>
                                </FormGroup>
                                <FormGroup>
                                    <Label>Subtitle Image</Label>
                                    <Input
                                        type="file"
                                        accept="image/jpeg,image/png,image/gif"
                                        onChange={(e) => handleImageUpload(e, 
                                            (url) => {
                                                const newSubtitles = [...subtitles];
                                                newSubtitles[index].image = url;
                                                setSubtitles(newSubtitles);
                                            }, 
                                            (hash) => {
                                                const newSubtitles = [...subtitles];
                                                newSubtitles[index].imageHash = hash;
                                                setSubtitles(newSubtitles);
                                            }, 
                                            category)}
                                    />
                                </FormGroup>
                                {subtitle.bulletPoints.map((point, pointIndex) => (
                                    <div key={pointIndex}>
                                        <FormGroup>
                                            <Label>Bullet Point</Label>
                                            <Tooltip title="Enter the bullet point text. Use [text](url) for links, e.g., [Visit Zedemy](https://zedemy.vercel.app/). HTML tags like <strong> are allowed.">
                                                <Input
                                                    type="text"
                                                    value={point.text}
                                                    onChange={(e) => handleBulletPointChange(index, pointIndex, 'text', e.target.value)}
                                                />
                                            </Tooltip>
                                        </FormGroup>
                                        <FormGroup>
                                            <Label>Bullet Point Image</Label>
                                            <Input
                                                type="file"
                                                accept="image/jpeg,image/png,image/gif"
                                                onChange={(e) => handleImageUpload(e, 
                                                    (url) => {
                                                        const newSubtitles = [...subtitles];
                                                        newSubtitles[index].bulletPoints[pointIndex].image = url;
                                                        setSubtitles(newSubtitles);
                                                    }, 
                                                    (hash) => {
                                                        const newSubtitles = [...subtitles];
                                                        newSubtitles[index].bulletPoints[pointIndex].imageHash = hash;
                                                        setSubtitles(newSubtitles);
                                                    }, 
                                                    category)}
                                            />
                                        </FormGroup>
                                        <FormGroup>
                                            <Label>Bullet Point Video</Label>
                                            <Input
                                                type="file"
                                                accept="video/mp4,video/mpeg,video/webm"
                                                onChange={(e) => handleVideoUpload(e, 
                                                    (url) => {
                                                        const newSubtitles = [...subtitles];
                                                        newSubtitles[index].bulletPoints[pointIndex].video = url;
                                                        setSubtitles(newSubtitles);
                                                    }, 
                                                    (hash) => {
                                                        const newSubtitles = [...subtitles];
                                                        newSubtitles[index].bulletPoints[pointIndex].videoHash = hash;
                                                        setSubtitles(newSubtitles);
                                                    }, 
                                                    category)}
                                            />
                                            {point.video && (
                                                <PreviewVideo
                                                    src={point.video}
                                                    controls
                                                    onError={(e) => {
                                                        console.error('Failed to load bullet point video:', point.video);
                                                        setError('Failed to preview bullet point video');
                                                    }}
                                                />
                                            )}
                                        </FormGroup>
                                        <FormGroup>
                                            <Label>Code Snippet</Label>
                                            <Tooltip title="Enter a code snippet. This will be sanitized to prevent XSS attacks.">
                                                <TextArea
                                                    rows="4"
                                                    value={point.codeSnippet}
                                                    onChange={(e) => handleBulletPointChange(index, pointIndex, 'codeSnippet', e.target.value)}
                                                />
                                            </Tooltip>
                                        </FormGroup>
                                    </div>
                                ))}
                                <IconButton type="button" onClick={() => addBulletPoint(index)}>Add Bullet Point</IconButton>
                            </div>
                        ))}
                        <IconButton type="button" onClick={addSubtitle}>Add Subtitle</IconButton>
                    </Section>
                    <Section>
                        <SectionTitle>Comparison Section</SectionTitle>
                        {superTitles.map((superTitle, superTitleIndex) => (
                            <div key={superTitleIndex}>
                                <FormGroup>
                                    <Label>Super Title</Label>
                                    <Tooltip title="Enter the super title. Use [text](url) for links, e.g., [Visit Zedemy](https://zedemy.vercel.app/). HTML tags like <h3> are allowed.">
                                        <Input
                                            type="text"
                                            value={superTitle.superTitle}
                                            onChange={(e) => handleSuperTitleChange(superTitleIndex, 'superTitle', e.target.value)}
                                        />
                                    </Tooltip>
                                </FormGroup>
                                {superTitle.attributes.map((attribute, attributeIndex) => (
                                    <div key={attributeIndex}>
                                        <FormGroup>
                                            <Label>Attribute</Label>
                                            <Tooltip title="Enter the attribute. Use [text](url) for links, e.g., [Visit Zedemy](https://zedemy.vercel.app/). HTML tags like <strong> are allowed.">
                                                <Input
                                                    type="text"
                                                    value={attribute.attribute}
                                                    onChange={(e) => handleAttributeChange(superTitleIndex, attributeIndex, 'attribute', e.target.value)}
                                                />
                                            </Tooltip>
                                        </FormGroup>
                                        {attribute.items.map((item, itemIndex) => (
                                            <div key={itemIndex}>
                                                <FormGroup>
                                                    <Label>Item Title</Label>
                                                    <Tooltip title="Enter the item title. Use [text](url) for links, e.g., [Visit Zedemy](https://zedemy.vercel.app/). HTML tags like <strong> are allowed.">
                                                        <Input
                                                            type="text"
                                                            value={item.title}
                                                            onChange={(e) => handleItemChange(superTitleIndex, attributeIndex, itemIndex, 'title', e.target.value)}
                                                        />
                                                    </Tooltip>
                                                </FormGroup>
                                                {item.bulletPoints.map((bulletPoint, bpIndex) => (
                                                    <FormGroup key={bpIndex}>
                                                        <Label>Bullet Point</Label>
                                                        <Tooltip title="Enter the bullet point. Use [text](url) for links, e.g., [Visit Zedemy](https://zedemy.vercel.app/). HTML tags like <li> are allowed.">
                                                            <Input
                                                                type="text"
                                                                value={bulletPoint}
                                                                onChange={(e) => {
                                                                    const newSuperTitles = [...superTitles];
                                                                    newSuperTitles[superTitleIndex].attributes[attributeIndex].items[itemIndex].bulletPoints[bpIndex] = e.target.value;
                                                                    setSuperTitles(newSuperTitles);
                                                                }}
                                                            />
                                                        </Tooltip>
                                                    </FormGroup>
                                                ))}
                                                <IconButton type="button" onClick={() => {
                                                    const newSuperTitles = [...superTitles];
                                                    newSuperTitles[superTitleIndex].attributes[attributeIndex].items[itemIndex].bulletPoints.push('');
                                                    setSuperTitles(newSuperTitles);
                                                }}>
                                                    Add Bullet Point
                                                </IconButton>
                                            </div>
                                        ))}
                                        <IconButton type="button" onClick={() => addItem(superTitleIndex, attributeIndex)}>Add Item</IconButton>
                                    </div>
                                ))}
                                <IconButton type="button" onClick={() => addAttribute(superTitleIndex)}>Add Attribute</IconButton>
                            </div>
                        ))}
                        <IconButton type="button" onClick={addSuperTitle}>Add Super Title</IconButton>
                    </Section>
                    <Section>
                        <SectionTitle>Summary</SectionTitle>
                        <FormGroup>
                            <Tooltip title="Enter a brief summary of your post. Use [text](url) for links, e.g., [Visit Zedemy](https://zedemy.vercel.app/). HTML tags like <p> are allowed.">
                                <Label>Summary</Label>
                            </Tooltip>
                            <TextArea rows="5" value={summary} onChange={(e) => setSummary(e.target.value)} />
                        </FormGroup>
                    </Section>

                    <Button type="submit">Add Post</Button>
                </form>
            </FullWidthSection>
        </FormContainer>
    );
};

export default AddPostForm;
