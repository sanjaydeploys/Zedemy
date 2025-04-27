import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addPost } from '../actions/postActions';
import { loadUser } from '../actions/authActions';
import axios from 'axios';
import DOMPurify from 'dompurify';
import styled from 'styled-components';
import { Tooltip } from '@material-ui/core';

// Styled Components
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
  opacity: ${(props) => (props.disabled ? 0.6 : 1)};
  pointer-events: ${(props) => (props.disabled ? 'none' : 'auto')};

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
  const [subtitles, setSubtitles] = useState([
    {
      title: '',
      image: null,
      imageHash: null,
      isFAQ: false,
      bulletPoints: [{ text: '', image: null, imageHash: null, video: null, videoHash: null, codeSnippet: '' }],
    },
  ]);
  const [summary, setSummary] = useState('');
  const [video, setVideo] = useState(null);
  const [videoHash, setVideoHash] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const { user } = useSelector((state) => state.auth);
  const categories = [
    'VS Code', 'HTML', 'CSS', 'JavaScript', 'Node.js', 'React', 'Angular', 'Vue.js', 'Next.js', 'Nuxt.js',
    'Gatsby', 'Svelte', 'TypeScript', 'GraphQL', 'PHP', 'Python', 'Ruby', 'Java', 'C#', 'C++', 'Swift',
    'Kotlin', 'Dart', 'Flutter', 'React Native',
  ];
  const [superTitles, setSuperTitles] = useState([
    { superTitle: '', attributes: [{ attribute: '', items: [{ title: '', bulletPoints: [''] }] }] },
  ]);

  // Sanitization configuration for code snippets
  const codeSanitizeConfig = {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  };

  // Sanitize code snippets
  const sanitizeCodeSnippet = (code) => {
    return DOMPurify.sanitize(code, codeSanitizeConfig);
  };

  // File validation
  async function validateFile(file, type) {
    if (!file) return 'No file selected';

    const maxSize = type === 'image' ? 10 * 1024 * 1024 : 50 * 1024 * 1024;
    if (file.size > maxSize) return `File size exceeds ${type === 'image' ? '10MB' : '50MB'}`;

    const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/tiff'];
    const validVideoTypes = ['video/mp4', 'video/mpeg', 'video/webm'];
    const validTypes = type === 'image' ? validImageTypes : validVideoTypes;

    if (!validTypes.includes(file.type)) return `Invalid ${type} format: ${file.type}`;

    if (type === 'image') {
      try {
        const img = new Image();
        const objectUrl = URL.createObjectURL(file);
        const promise = new Promise((resolve, reject) => {
          img.onload = () => {
            URL.revokeObjectURL(objectUrl);
            if (img.width < 10 || img.height < 10) {
              reject(new Error('Image dimensions too small (minimum 10x10 pixels)'));
            } else if (img.width > 10000 || img.height > 10000) {
              reject(new Error('Image dimensions too large (maximum 10000x10000 pixels)'));
            } else {
              resolve('');
            }
          };
          img.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            reject(new Error('Invalid or corrupted image file'));
          };
          img.src = objectUrl;
        });
        return await promise;
      } catch (err) {
        return err.message;
      }
    }

    return '';
  }

  // Generate file hash
  async function generateFileHash(file) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    } catch (err) {
      throw new Error(`Failed to generate file hash: ${err.message}`);
    }
  }

  // Compress and convert to WebP
  async function compressAndConvertToWebP(file, targetSizeKB = 50) {
    async function supportsWebP() {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = 'data:image/webp;base64,UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA';
      });
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();

      function handleReaderLoad(event) {
        img.src = event.target.result;

        async function handleImageLoad() {
          try {
            const useWebP = await supportsWebP();
            const format = useWebP ? 'image/webp' : 'image/jpeg';
            const extension = useWebP ? '.webp' : '.jpg';

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              throw new Error('Failed to get canvas context');
            }

            const maxDimension = 1920;
            let width = img.width;
            let height = img.height;
            if (width > maxDimension || height > maxDimension) {
              const aspectRatio = width / height;
              if (width > height) {
                width = maxDimension;
                height = Math.round(maxDimension / aspectRatio);
              } else {
                height = maxDimension;
                width = Math.round(maxDimension * aspectRatio);
              }
            }

            canvas.width = width;
            canvas.height = height;

            if (file.type === 'image/png' || file.type === 'image/gif') {
              ctx.globalCompositeOperation = 'copy';
            }
            ctx.drawImage(img, 0, 0, width, height);

            let quality = 0.9;
            let blob;

            while (quality > 0.1) {
              blob = await new Promise((resolveBlob) => {
                canvas.toBlob(
                  (b) => resolveBlob(b),
                  format,
                  quality
                );
              });

              if (!blob) {
                throw new Error(`Failed to create ${format} blob`);
              }

              const sizeKB = blob.size / 1024;
              if (sizeKB <= targetSizeKB * 1.2) {
                break;
              }

              width *= 0.9;
              height *= 0.9;
              canvas.width = width;
              canvas.height = height;
              ctx.drawImage(img, 0, 0, width, height);

              quality -= 0.1;
            }

            if (!blob) {
              blob = await new Promise((resolveBlob) => {
                canvas.toBlob(
                  (b) => resolveBlob(b),
                  'image/jpeg',
                  0.7
                );
              });
              if (!blob) {
                reject(new Error(`Failed to compress ${file.name} to target size`));
                return;
              }
              const jpegFile = new File(
                [blob],
                file.name.replace(/\.[^/.]+$/, '.jpg'),
                { type: 'image/jpeg' }
              );
              resolve(jpegFile);
              return;
            }

            const compressedFile = new File(
              [blob],
              file.name.replace(/\.[^/.]+$/, extension),
              { type: format }
            );
            resolve(compressedFile);
          } catch (err) {
            reject(new Error(`Image processing failed for ${file.name}: ${err.message}`));
          }
        }

        img.onload = handleImageLoad;
        img.onerror = () => reject(new Error(`Failed to load image: ${file.name}`));
      }

      reader.onload = handleReaderLoad;
      reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
      reader.readAsDataURL(file);
    });
  }

  // Handle image upload
  async function handleImageUpload(event, setImage, setImageHash, categoryOverride = category, retries = 3) {
    const file = event.target.files[0];
    setError('');
    setIsUploading(true);
    if (!file) {
      setError('No file selected');
      setIsUploading(false);
      return;
    }

    const validationError = await validateFile(file, 'image');
    if (validationError) {
      setError(validationError);
      setIsUploading(false);
      return;
    }

    let compressedFile;
    try {
      compressedFile = await compressAndConvertToWebP(file, 50);
    } catch (err) {
      setError(`Error compressing image ${file.name}: ${err.message}`);
      console.error('Compression error:', err);
      setIsUploading(false);
      return;
    }

    const previewUrl = URL.createObjectURL(compressedFile);

    // For subtitle or bullet point images, update state immediately with preview
    if (setImage !== setTitleImage) {
      setImage({ url: null, preview: previewUrl, file: compressedFile });
    } else {
      setTitleImagePreview(previewUrl);
      setTitleImage(null); // Clear until upload is complete
    }

    let attempt = 1;
    while (attempt <= retries) {
      try {
        console.log(`Uploading image (attempt ${attempt}):`, {
          name: compressedFile.name,
          type: compressedFile.type,
          size: compressedFile.size,
          category: categoryOverride,
        });

        const res = await axios.post(
          'https://se3fw2nzc2.execute-api.ap-south-1.amazonaws.com/prod/get-presigned-url',
          {
            fileType: compressedFile.type,
            folder: 'images',
            category: categoryOverride,
          }
        );
        const { signedUrl, publicUrl, key } = res.data;

        await axios.put(signedUrl, compressedFile, {
          headers: { 'Content-Type': compressedFile.type },
        });

        const fileHash = await generateFileHash(compressedFile);

        await axios.post(
          'https://se3fw2nzc2.execute-api.ap-south-1.amazonaws.com/prod/store-metadata',
          {
            fileKey: key,
            fileHash,
            fileType: 'images',
            category: categoryOverride,
            userId: user?.id || 'anonymous',
          }
        );

        const response = await fetch(publicUrl);
        if (!response.ok) {
          throw new Error(`S3 URL not accessible: ${response.status}`);
        }

        // Set the final URL and hash in a single state update
        if (setImage === setTitleImage) {
          setTitleImage(publicUrl);
          setTitleImagePreview(previewUrl);
        } else {
          // For subtitles and bullet points, set only the URL
          setImage(publicUrl);
        }
        setImageHash(fileHash);
        console.log('Image uploaded:', { filePath: publicUrl, fileHash });
        setIsUploading(false);
        return;
      } catch (err) {
        console.error(`Image upload attempt ${attempt} failed:`, err);
        if (attempt === retries) {
          const errorMsg = err.response?.data?.error || err.message;
          setError(`Error uploading image ${file.name}: ${errorMsg}`);
          console.error('Error uploading image:', {
            message: err.message,
            response: err.response?.data,
            status: err.response?.status,
          });
          setIsUploading(false);
          return;
        }
        attempt++;
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  // Handle video upload
  async function handleVideoUpload(event, setVideo, setVideoHash, categoryOverride = category, retries = 3) {
    const file = event.target.files[0];
    setError('');
    setIsUploading(true);
    if (!file) {
      setError('No file selected');
      setIsUploading(false);
      return;
    }

    const validationError = await validateFile(file, 'video');
    if (validationError) {
      setError(validationError);
      setIsUploading(false);
      return;
    }

    const previewUrl = URL.createObjectURL(file);

    // For subtitle or bullet point videos, update state immediately with preview
    if (setVideo !== setVideo) {
      setVideo({ url: null, preview: previewUrl, file });
    } else {
      setVideoPreview(previewUrl);
      setVideo(null); // Clear until upload is complete
    }

    let attempt = 1;
    while (attempt <= retries) {
      try {
        console.log(`Uploading video (attempt ${attempt}):`, {
          name: file.name,
          type: file.type,
          size: file.size,
          category: categoryOverride,
        });

        const res = await axios.post(
          'https://se3fw2nzc2.execute-api.ap-south-1.amazonaws.com/prod/get-presigned-url',
          {
            fileType: file.type,
            folder: 'videos',
            category: categoryOverride,
          }
        );
        const { signedUrl, publicUrl, key } = res.data;

        await axios.put(signedUrl, file, {
          headers: { 'Content-Type': file.type },
        });

        const fileHash = await generateFileHash(file);

        await axios.post(
          'https://se3fw2nzc2.execute-api.ap-south-1.amazonaws.com/prod/store-metadata',
          {
            fileKey: key,
            fileHash,
            fileType: 'videos',
            category: categoryOverride,
            userId: user?.id || 'anonymous',
          }
        );

        const response = await fetch(publicUrl);
        if (!response.ok) {
          throw new Error(`S3 URL not accessible: ${response.status}`);
        }

        // Set the final URL and hash in a single state update
        if (setVideo === setVideo) {
          setVideo(publicUrl);
          setVideoPreview(previewUrl);
        } else {
          // For bullet points, set only the URL
          setVideo(publicUrl);
        }
        setVideoHash(fileHash);
        console.log('Video uploaded:', { filePath: publicUrl, fileHash });
        setIsUploading(false);
        return;
      } catch (err) {
        console.error(`Video upload attempt ${attempt} failed:`, err);
        if (attempt === retries) {
          const errorMsg = err.response?.data?.error || err.message;
          setError(`Error uploading video ${file.name}: ${errorMsg}`);
          console.error('Error uploading video:', {
            message: err.message,
            response: err.response?.data,
            status: err.response?.status,
          });
          setIsUploading(false);
          return;
        }
        attempt++;
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

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
    setSubtitles([
      ...subtitles,
      {
        title: '',
        image: null,
        imageHash: null,
        isFAQ: false,
        bulletPoints: [{ text: '', image: null, imageHash: null, video: null, videoHash: null, codeSnippet: '' }],
      },
    ]);
  };

  const addBulletPoint = (subtitleIndex) => {
    const newSubtitles = [...subtitles];
    newSubtitles[subtitleIndex].bulletPoints.push({
      text: '',
      image: null,
      imageHash: null,
      video: null,
      videoHash: null,
      codeSnippet: '',
    });
    setSubtitles(newSubtitles);
  };

  // Validate media fields before submission
  const validateMediaFields = () => {
    for (let i = 0; i < subtitles.length; i++) {
      const sub = subtitles[i];
      if (sub.image && typeof sub.image !== 'string') {
        setError(`Subtitle ${i + 1} image upload incomplete or invalid`);
        return false;
      }
      for (let j = 0; j < sub.bulletPoints.length; j++) {
        const point = sub.bulletPoints[j];
        if (point.image && typeof point.image !== 'string') {
          setError(`Subtitle ${i + 1}, bullet point ${j + 1} image upload incomplete or invalid`);
          return false;
        }
        if (point.video && typeof point.video !== 'string') {
          setError(`Subtitle ${i + 1}, bullet point ${j + 1} video upload incomplete or invalid`);
          return false;
        }
      }
    }
    if (titleImage && typeof titleImage !== 'string') {
      setError('Title image upload incomplete or invalid');
      return false;
    }
    if (video && typeof video !== 'string') {
      setError('Video upload incomplete or invalid');
      return false;
    }
    return true;
  };

  async function handleSubmit(event) {
    event.preventDefault();
    if (!user) {
      setError('User not found');
      console.error('User not found');
      return;
    }
    if (!category) {
      setError('Please select a category');
      return;
    }
    if (!validateMediaFields()) {
      console.error('Media field validation failed');
      return;
    }
    try {
      console.log('Subtitles before submission:', JSON.stringify(subtitles, null, 2));

      const processedSubtitles = subtitles.map((sub) => ({
        title: sub.title || '',
        isFAQ: sub.isFAQ || false,
        image: sub.image || null,
        imageHash: sub.imageHash || null,
        bulletPoints: sub.bulletPoints.map((point) => ({
          text: point.text || '',
          codeSnippet: sanitizeCodeSnippet(point.codeSnippet || ''),
          image: point.image || null,
          imageHash: point.imageHash || null,
          video: point.video || null,
          videoHash: point.videoHash || null,
        })),
      }));

      const processedSuperTitles = superTitles.map((superTitle) => ({
        superTitle: superTitle.superTitle || '',
        attributes: superTitle.attributes.map((attr) => ({
          attribute: attr.attribute || '',
          items: attr.items.map((item) => ({
            title: item.title || '',
            bulletPoints: item.bulletPoints || [],
          })),
        })),
      }));

      console.log('Submitting post with category:', category);
      console.log('Processed data:', {
        title,
        content,
        summary,
        subtitles: processedSubtitles,
        superTitles: processedSuperTitles,
        titleImage,
        video,
        titleImageHash,
        videoHash,
      });

      await dispatch(
        addPost(
          title,
          content,
          category,
          processedSubtitles,
          summary,
          titleImage || null,
          processedSuperTitles,
          video || null,
          titleImageHash || null,
          videoHash || null
        )
      );

      // Reset form
      setTitle('');
      setTitleImage(null);
      setTitleImageHash(null);
      setTitleImagePreview(null);
      setContent('');
      setVideo(null);
      setVideoHash(null);
      setVideoPreview(null);
      setCategory('');
      setSubtitles([
        {
          title: '',
          image: null,
          imageHash: null,
          isFAQ: false,
          bulletPoints: [{ text: '', image: null, imageHash: null, video: null, videoHash: null, codeSnippet: '' }],
        },
      ]);
      setSummary('');
      setSuperTitles([{ superTitle: '', attributes: [{ attribute: '', items: [{ title: '', bulletPoints: [''] }] }] }]);
      setError('');
    } catch (err) {
      setError(`Error adding post: ${err.message}`);
      console.error('Error adding post:', err);
    }
  }

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
                  accept="image/jpeg,image/png,image/gif,image/webp,image/bmp,image/tiff"
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
                    accept="image/jpeg,image/png,image/gif,image/webp,image/bmp,image/tiff"
                    onChange={(e) =>
                      handleImageUpload(
                        e,
                        (url) => {
                          setSubtitles((prev) => {
                            const newSubtitles = [...prev];
                            newSubtitles[index].image = url;
                            return newSubtitles;
                          });
                        },
                        (hash) => {
                          setSubtitles((prev) => {
                            const newSubtitles = [...prev];
                            newSubtitles[index].imageHash = hash;
                            return newSubtitles;
                          });
                        },
                        category
                      )
                    }
                  />
                  {subtitle.image && (
                    <PreviewImage
                      src={typeof subtitle.image === 'string' ? subtitle.image : subtitle.image.preview}
                      alt="Subtitle preview"
                      onError={(e) => {
                        console.error('Failed to load subtitle image:', subtitle.image);
                        setError('Failed to preview subtitle image');
                      }}
                    />
                  )}
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
                        accept="image/jpeg,image/png,image/gif,image/webp,image/bmp,image/tiff"
                        onChange={(e) =>
                          handleImageUpload(
                            e,
                            (url) => {
                              setSubtitles((prev) => {
                                const newSubtitles = [...prev];
                                newSubtitles[index].bulletPoints[pointIndex].image = url;
                                return newSubtitles;
                              });
                            },
                            (hash) => {
                              setSubtitles((prev) => {
                                const newSubtitles = [...prev];
                                newSubtitles[index].bulletPoints[pointIndex].imageHash = hash;
                                return newSubtitles;
                              });
                            },
                            category
                          )
                        }
                      />
                      {point.image && (
                        <PreviewImage
                          src={typeof point.image === 'string' ? point.image : point.image.preview}
                          alt="Bullet point preview"
                          onError={(e) => {
                            console.error('Failed to load bullet point image:', point.image);
                            setError('Failed to preview bullet point image');
                          }}
                        />
                      )}
                    </FormGroup>
                    <FormGroup>
                      <Label>Bullet Point Video</Label>
                      <Input
                        Wtype="file"
                        accept="video/mp4,video/mpeg,video/webm"
                        onChange={(e) =>
                          handleVideoUpload(
                            e,
                            (url) => {
                              setSubtitles((prev) => {
                                const newSubtitles = [...prev];
                                newSubtitles[index].bulletPoints[pointIndex].video = url;
                                return newSubtitles;
                              });
                            },
                            (hash) => {
                              setSubtitles((prev) => {
                                const newSubtitles = [...prev];
                                newSubtitles[index].bulletPoints[pointIndex].videoHash = hash;
                                return newSubtitles;
                              });
                            },
                            category
                          )
                        }
                      />
                      {point.video && (
                        <PreviewVideo
                          src={typeof point.video === 'string' ? point.video : point.video.preview}
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
                        <IconButton
                          type="button"
                          onClick={() => {
                            const newSuperTitles = [...superTitles];
                            newSuperTitles[superTitleIndex].attributes[attributeIndex].items[itemIndex].bulletPoints.push('');
                            setSuperTitles(newSuperTitles);
                          }}
                        >
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

          <Button type="submit" disabled={isUploading}>
            {isUploading ? 'Uploading...' : 'Add Post'}
          </Button>
        </form>
      </FullWidthSection>
    </FormContainer>
  );
};

export default AddPostForm;
