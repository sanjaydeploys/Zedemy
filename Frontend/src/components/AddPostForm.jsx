import React, { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addPost } from '../actions/postActions';
import { loadUser } from '../actions/authActions';
import '../styles/AddPostForm.css';

// Lazy-load heavy dependencies
const loadDependencies = async () => {
  const [
    { default: axios },
  ] = await Promise.all([
    import('axios'),
  ]);
  return { axios };
};

// Custom Tooltip Component
const Tooltip = ({ title, children }) => {
  const [isVisible, setIsVisible] = useState(false);
  const tooltipRef = React.useRef(null);

  const handleMouseEnter = () => setIsVisible(true);
  const handleMouseLeave = () => setIsVisible(false);

  return (
    <div className="tooltip-container" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      {children}
      {isVisible && (
        <div className="tooltip" ref={tooltipRef}>
          {title}
        </div>
      )}
    </div>
  );
};

// Memoized FormGroup Component
const FormGroup = React.memo(({ children }) => (
  <div className="form-group">{children}</div>
));

// Memoized AddPostForm
const AddPostForm = React.memo(() => {
  const dispatch = useDispatch();
  const [deps, setDeps] = useState(null);
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
  const { user } = useSelector(state => state.auth);

  const categories = useMemo(() => [
    'VS Code', 'HTML', 'CSS', 'JavaScript', 'Node.js', 'React', 'Angular', 'Vue.js', 'Next.js', 'Nuxt.js',
    'Gatsby', 'Svelte', 'TypeScript', 'GraphQL', 'PHP', 'Python', 'Ruby', 'Java', 'C#', 'C++', 'Swift',
    'Kotlin', 'Dart', 'Flutter', 'React Native','Life-Insurance'
  ], []);

  const [superTitles, setSuperTitles] = useState([
    { superTitle: '', attributes: [{ attribute: '', items: [{ title: '', bulletPoints: [''] }] }] },
  ]);

  // Load dependencies during idle time
  useEffect(() => {
    if (typeof window !== 'undefined' && window.requestIdleCallback) {
      window.requestIdleCallback(() => loadDependencies().then(setDeps));
    } else {
      loadDependencies().then(setDeps);
    }
  }, []);

  // File validation
  const validateFile = useCallback(async (file, type) => {
    console.log(`[Validation] Checking file: ${file?.name}, type: ${type}`);
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
  }, []);

  // Generate file hash
  const generateFileHash = useCallback(async (file) => {
    console.log(`[Hash] Generating hash for file: ${file?.name}`);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (err) {
      throw new Error(`Failed to generate file hash: ${err.message}`);
    }
  }, []);

  // Compress and convert to WebP
  const compressAndConvertToWebP = useCallback(async (file, targetSizeKB = 50) => {
    console.log(`[Compression] Starting compression for file: ${file?.name}`);
    const supportsWebP = async () => {
      return new Promise(resolve => {
        const img = new Image();
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = 'data:image/webp;base64,UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA';
      });
    };

    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();

      const handleReaderLoad = event => {
        img.src = event.target.result;

        const handleImageLoad = async () => {
          try {
            const useWebP = await supportsWebP();
            const format = useWebP ? 'image/webp' : 'image/jpeg';
            const extension = useWebP ? '.webp' : '.jpg';

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error('Failed to get canvas context');

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
              blob = await new Promise(resolveBlob => {
                canvas.toBlob(b => resolveBlob(b), format, quality);
              });

              if (!blob) throw new Error(`Failed to create ${format} blob`);

              const sizeKB = blob.size / 1024;
              if (sizeKB <= targetSizeKB * 1.2) break;

              width *= 0.9;
              height *= 0.9;
              canvas.width = width;
              canvas.height = height;
              ctx.drawImage(img, 0, 0, width, height);

              quality -= 0.1;
            }

            if (!blob) {
              blob = await new Promise(resolveBlob => {
                canvas.toBlob(b => resolveBlob(b), 'image/jpeg', 0.7);
              });
              if (!blob) {
                reject(new Error(`Failed to compress ${file.name} to target size`));
                return;
              }
              const jpegFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.jpg'), { type: 'image/jpeg' });
              resolve(jpegFile);
              return;
            }

            const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, extension), { type: format });
            console.log(`[Compression] Successfully compressed ${file.name} to ${compressedFile.type}, size: ${compressedFile.size / 1024} KB`);
            resolve(compressedFile);
          } catch (err) {
            reject(new Error(`Image processing failed for ${file.name}: ${err.message}`));
          }
        };

        img.onload = handleImageLoad;
        img.onerror = () => reject(new Error(`Failed to load image: ${file.name}`));
      };

      reader.onload = handleReaderLoad;
      reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
      reader.readAsDataURL(file);
    });
  }, []);

  // Handle image upload
  const handleImageUpload = useCallback(async (event, setImage, setImageHash, categoryOverride = category, retries = 3) => {
    if (!deps?.axios) return;
    const file = event.target.files[0];
    console.log(`[Upload] Starting image upload for file: ${file?.name}`);
    setError('');
    setIsUploading(true);
    if (!file) {
      setError('No file selected');
      setIsUploading(false);
      console.log('[Upload] No file selected');
      return;
    }

    const validationError = await validateFile(file, 'image');
    if (validationError) {
      setError(validationError);
      setIsUploading(false);
      console.log(`[Upload] Validation failed for ${file.name}: ${validationError}`);
      return;
    }

    let compressedFile;
    try {
      compressedFile = await compressAndConvertToWebP(file, 50);
    } catch (err) {
      setError(`Error compressing image ${file.name}: ${err.message}`);
      console.error('Compression error:', err);
      setIsUploading(false);
      console.log(`[Upload] Compression failed for ${file.name}: ${err.message}`);
      return;
    }

    const previewUrl = URL.createObjectURL(compressedFile);
    console.log(`[Upload] Generated preview URL for ${file.name}: ${previewUrl}`);

    if (setImage !== setTitleImage) {
      setImage({ url: null, preview: previewUrl, file: compressedFile });
    } else {
      setTitleImagePreview(previewUrl);
      setTitleImage(null);
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

        const res = await deps.axios.post(
          'https://g3u06ptici.execute-api.ap-south-1.amazonaws.com/prod/get-presigned-url',
          {
            fileType: compressedFile.type,
            folder: 'images',
            category: categoryOverride,
          }
        );
        const { signedUrl, publicUrl, key } = res.data;
        console.log(`[Upload] Received signed URL: ${signedUrl}, public URL: ${publicUrl}, key: ${key}`);

        await deps.axios.put(signedUrl, compressedFile, {
          headers: { 'Content-Type': compressedFile.type },
        });
        console.log(`[Upload] Successfully uploaded ${compressedFile.name} to ${signedUrl}`);

        const fileHash = await generateFileHash(compressedFile);
        console.log(`[Upload] Generated hash for ${compressedFile.name}: ${fileHash}`);

        await deps.axios.post(
          'https://g3u06ptici.execute-api.ap-south-1.amazonaws.com/prod/store-metadata',
          {
            fileKey: key,
            fileHash,
            fileType: 'images',
            category: categoryOverride,
            userId: user?.id || 'anonymous',
          }
        );
        console.log(`[Upload] Stored metadata for ${key}`);

        // Console log to verify cache is enabled (fetch HEAD to check headers)
        const cacheResponse = await fetch(publicUrl, { method: 'HEAD' });
        const cacheControl = cacheResponse.headers.get('Cache-Control');
        const etag = cacheResponse.headers.get('ETag');
        console.log(`[Cache Verification] Uploaded image ${key} Cache-Control: ${cacheControl || 'Not set'}`);
        console.log(`[Cache Verification] ETag: ${etag || 'Not set'}`);

        if (!cacheResponse.ok) {
          throw new Error(`S3 URL not accessible: ${cacheResponse.status}`);
        }
        console.log(`[Upload] Cache response OK for ${publicUrl}`);

        if (setImage === setTitleImage) {
          setTitleImage(publicUrl);
          setTitleImagePreview(previewUrl);
        } else {
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
          console.log(`[Upload] Final attempt failed for ${file.name}: ${errorMsg}`);
          return;
        }
        attempt++;
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }, [deps, category, user, validateFile, compressAndConvertToWebP, generateFileHash, setTitleImage, setTitleImagePreview]);

  // Handle video upload
  const handleVideoUpload = useCallback(async (event, setVideo, setVideoHash, categoryOverride = category, retries = 3) => {
    if (!deps?.axios) return;
    const file = event.target.files[0];
    console.log(`[Upload] Starting video upload for file: ${file?.name}`);
    setError('');
    setIsUploading(true);
    if (!file) {
      setError('No file selected');
      setIsUploading(false);
      console.log('[Upload] No file selected');
      return;
    }

    const validationError = await validateFile(file, 'video');
    if (validationError) {
      setError(validationError);
      setIsUploading(false);
      console.log(`[Upload] Validation failed for ${file.name}: ${validationError}`);
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    console.log(`[Upload] Generated preview URL for ${file.name}: ${previewUrl}`);

    if (setVideo !== setVideo) {
      setVideo({ url: null, preview: previewUrl, file });
    } else {
      setVideoPreview(previewUrl);
      setVideo(null);
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

        const res = await deps.axios.post(
          'https://g3u06ptici.execute-api.ap-south-1.amazonaws.com/prod/get-presigned-url',
          {
            fileType: file.type,
            folder: 'videos',
            category: categoryOverride,
          }
        );
        const { signedUrl, publicUrl, key } = res.data;
        console.log(`[Upload] Received signed URL: ${signedUrl}, public URL: ${publicUrl}, key: ${key}`);

        await deps.axios.put(signedUrl, file, {
          headers: { 'Content-Type': file.type },
        });
        console.log(`[Upload] Successfully uploaded ${file.name} to ${signedUrl}`);

        const fileHash = await generateFileHash(file);
        console.log(`[Upload] Generated hash for ${file.name}: ${fileHash}`);

        await deps.axios.post(
          'https://g3u06ptici.execute-api.ap-south-1.amazonaws.com/prod/store-metadata',
          {
            fileKey: key,
            fileHash,
            fileType: 'videos',
            category: categoryOverride,
            userId: user?.id || 'anonymous',
          }
        );
        console.log(`[Upload] Stored metadata for ${key}`);

        const response = await fetch(publicUrl);
        if (!response.ok) {
          throw new Error(`S3 URL not accessible: ${response.status}`);
        }
        console.log(`[Upload] Cache response OK for ${publicUrl}`);

        if (setVideo === setVideo) {
          setVideo(publicUrl);
          setVideoPreview(previewUrl);
        } else {
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
          console.log(`[Upload] Final attempt failed for ${file.name}: ${errorMsg}`);
          return;
        }
        attempt++;
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }, [deps, category, user, validateFile, generateFileHash, setVideo, setVideoPreview]);

  // Memoized handlers
  const handleSuperTitleChange = useCallback((index, field, value) => {
    setSuperTitles(prev => {
      const newSuperTitles = [...prev];
      newSuperTitles[index][field] = value;
      return newSuperTitles;
    });
  }, []);

  const handleAttributeChange = useCallback((superTitleIndex, attributeIndex, field, value) => {
    setSuperTitles(prev => {
      const newSuperTitles = [...prev];
      newSuperTitles[superTitleIndex].attributes[attributeIndex][field] = value;
      return newSuperTitles;
    });
  }, []);

  const handleItemChange = useCallback((superTitleIndex, attributeIndex, itemIndex, field, value) => {
    setSuperTitles(prev => {
      const newSuperTitles = [...prev];
      newSuperTitles[superTitleIndex].attributes[attributeIndex].items[itemIndex][field] = value;
      return newSuperTitles;
    });
  }, []);

  const addSuperTitle = useCallback(() => {
    setSuperTitles(prev => [
      ...prev,
      { superTitle: '', attributes: [{ attribute: '', items: [{ title: '', bulletPoints: [''] }] }] },
    ]);
  }, []);

  const addAttribute = useCallback((superTitleIndex) => {
    setSuperTitles(prev => {
      const newSuperTitles = [...prev];
      newSuperTitles[superTitleIndex].attributes.push({ attribute: '', items: [{ title: '', bulletPoints: [''] }] });
      return newSuperTitles;
    });
  }, []);

  const addItem = useCallback((superTitleIndex, attributeIndex) => {
    setSuperTitles(prev => {
      const newSuperTitles = [...prev];
      newSuperTitles[superTitleIndex].attributes[attributeIndex].items.push({ title: '', bulletPoints: [''] });
      return newSuperTitles;
    });
  }, []);

  const handleSubtitleChange = useCallback((index, field, value) => {
    setSubtitles(prev => {
      const newSubtitles = [...prev];
      newSubtitles[index][field] = value;
      return newSubtitles;
    });
  }, []);

  const handleBulletPointChange = useCallback((index, pointIndex, field, value) => {
    setSubtitles(prev => {
      const newSubtitles = [...prev];
      newSubtitles[index].bulletPoints[pointIndex][field] = value;
      return newSubtitles;
    });
  }, []);

  const addSubtitle = useCallback(() => {
    setSubtitles(prev => [
      ...prev,
      {
        title: '',
        image: null,
        imageHash: null,
        isFAQ: false,
        bulletPoints: [{ text: '', image: null, imageHash: null, video: null, videoHash: null, codeSnippet: '' }],
      },
    ]);
  }, []);

  const addBulletPoint = useCallback((subtitleIndex) => {
    setSubtitles(prev => {
      const newSubtitles = [...prev];
      newSubtitles[subtitleIndex].bulletPoints.push({
        text: '',
        image: null,
        imageHash: null,
        video: null,
        videoHash: null,
        codeSnippet: '',
      });
      return newSubtitles;
    });
  }, []);

  // Validate media fields
  const validateMediaFields = useCallback(() => {
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
  }, [subtitles, titleImage, video]);

  // Handle form submission
  const handleSubmit = useCallback(async event => {
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
      const processedSubtitles = subtitles.map(sub => ({
        title: sub.title || '',
        isFAQ: sub.isFAQ || false,
        image: sub.image || null,
        imageHash: sub.imageHash || null,
        bulletPoints: sub.bulletPoints.map(point => ({
          text: point.text || '',
          codeSnippet: point.codeSnippet || '',
          image: point.image || null,
          imageHash: point.imageHash || null,
          video: point.video || null,
          videoHash: point.videoHash || null,
        })),
      }));

      const processedSuperTitles = superTitles.map(superTitle => ({
        superTitle: superTitle.superTitle || '',
        attributes: superTitle.attributes.map(attr => ({
          attribute: attr.attribute || '',
          items: attr.items.map(item => ({
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
  }, [
    user,
    category,
    subtitles,
    superTitles,
    title,
    content,
    summary,
    titleImage,
    video,
    titleImageHash,
    videoHash,
    dispatch,
    validateMediaFields,
  ]);

  // User loading and cleanup
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

  if (!deps) {
    return <div>Loading form dependencies...</div>;
  }

  return (
    <div className="form-container">
      <div className="full-width-section">
        <h2>Add New Post</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="section">
            <h3 className="section-title">Post Details</h3>
            <FormGroup>
              <Tooltip title="Select the category for your post">
                <label className="label">Category</label>
              </Tooltip>
              <select className="select" value={category} onChange={e => setCategory(e.target.value)}>
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </FormGroup>
            <FormGroup>
              <Tooltip title="Enter the title of your post. Use [text](url) for links, e.g., [Visit Zedemy](https://zedemy.vercel.app/). HTML tags like <header> are allowed.">
                <label className="label">Title</label>
              </Tooltip>
              <input className="input" type="text" value={title} onChange={e => setTitle(e.target.value)} required />
            </FormGroup>
            <div className="form-grid">
              <FormGroup>
                <label className="label">Title Image</label>
                <input
                  className="input"
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp,image/bmp,image/tiff"
                  onChange={e => handleImageUpload(e, setTitleImage, setTitleImageHash, category)}
                />
                {titleImagePreview && (
                  <img
                    className="preview-image"
                    src={titleImagePreview}
                    alt="Title preview"
                    onError={e => {
                      console.error('Failed to load title image:', titleImagePreview);
                      setError('Failed to preview title image');
                    }}
                  />
                )}
              </FormGroup>
              <FormGroup>
                <label className="label">Video</label>
                <input
                  className="input"
                  type="file"
                  accept="video/mp4,video/mpeg,video/webm"
                  onChange={e => handleVideoUpload(e, setVideo, setVideoHash, category)}
                />
                {videoPreview && (
                  <video
                    className="preview-video"
                    src={videoPreview}
                    controls
                    onError={e => {
                      console.error('Failed to load video:', videoPreview);
                      setError('Failed to preview video');
                    }}
                  />
                )}
              </FormGroup>
            </div>
            <FormGroup>
              <Tooltip title="Enter the main content of your post. Use [text](url) for links, e.g., [Visit Zedemy](https://zedemy.vercel.app/). HTML tags like <section> are allowed.">
                <label className="label">Content</label>
              </Tooltip>
              <textarea className="textarea" rows="10" value={content} onChange={e => setContent(e.target.value)} required />
            </FormGroup>
          </div>

          <div className="section">
            <h3 className="section-title">Subtitles</h3>
            {subtitles.map((subtitle, index) => (
              <div key={index}>
                <FormGroup>
                  <label className="label">Subtitle</label>
                  <Tooltip title="Enter the subtitle. Use [text](url) for links, e.g., [Visit Zedemy](https://zedemy.vercel.app/). HTML tags like <h2> are allowed.">
                    <input
                      className="input"
                      type="text"
                      value={subtitle.title}
                      onChange={e => handleSubtitleChange(index, 'title', e.target.value)}
                    />
                  </Tooltip>
                </FormGroup>
                <FormGroup>
                  <label className="label">
                    <input
                      type="checkbox"
                      checked={subtitle.isFAQ}
                      onChange={e => handleSubtitleChange(index, 'isFAQ', e.target.checked)}
                    />
                    Mark as FAQ
                  </label>
                </FormGroup>
                <FormGroup>
                  <label className="label">Subtitle Image</label>
                  <input
                    className="input"
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp,image/bmp,image/tiff"
                    onChange={e =>
                      handleImageUpload(
                        e,
                        url => {
                          setSubtitles(prev => {
                            const newSubtitles = [...prev];
                            newSubtitles[index].image = url;
                            return newSubtitles;
                          });
                        },
                        hash => {
                          setSubtitles(prev => {
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
                    <img
                      className="preview-image"
                      src={typeof subtitle.image === 'string' ? subtitle.image : subtitle.image.preview}
                      alt="Subtitle preview"
                      onError={e => {
                        console.error('Failed to load subtitle image:', subtitle.image);
                        setError('Failed to preview subtitle image');
                      }}
                    />
                  )}
                </FormGroup>
                {subtitle.bulletPoints.map((point, pointIndex) => (
                  <div key={pointIndex}>
                    <FormGroup>
                      <label className="label">Bullet Point</label>
                      <Tooltip title="Enter the bullet point text. Use [text](url) for links, e.g., [Visit Zedemy](https://zedemy.vercel.app/). HTML tags like <strong> are allowed.">
                        <input
                          className="input"
                          type="text"
                          value={point.text}
                          onChange={e => handleBulletPointChange(index, pointIndex, 'text', e.target.value)}
                        />
                      </Tooltip>
                    </FormGroup>
                    <FormGroup>
                      <label className="label">Bullet Point Image</label>
                      <input
                        className="input"
                        type="file"
                        accept="image/jpeg,image/png,image/gif,image/webp,image/bmp,image/tiff"
                        onChange={e =>
                          handleImageUpload(
                            e,
                            url => {
                              setSubtitles(prev => {
                                const newSubtitles = [...prev];
                                newSubtitles[index].bulletPoints[pointIndex].image = url;
                                return newSubtitles;
                              });
                            },
                            hash => {
                              setSubtitles(prev => {
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
                        <img
                          className="preview-image"
                          src={typeof point.image === 'string' ? point.image : point.image.preview}
                          alt="Bullet point preview"
                          onError={e => {
                            console.error('Failed to load bullet point image:', point.image);
                            setError('Failed to preview bullet point image');
                          }}
                        />
                      )}
                    </FormGroup>
                    <FormGroup>
                      <label className="label">Bullet Point Video</label>
                      <input
                        className="input"
                        type="file"
                        accept="video/mp4,video/mpeg,video/webm"
                        onChange={e =>
                          handleVideoUpload(
                            e,
                            url => {
                              setSubtitles(prev => {
                                const newSubtitles = [...prev];
                                newSubtitles[index].bulletPoints[pointIndex].video = url;
                                return newSubtitles;
                              });
                            },
                            hash => {
                              setSubtitles(prev => {
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
                        <video
                          className="preview-video"
                          src={typeof point.video === 'string' ? point.video : point.video.preview}
                          controls
                          onError={e => {
                            console.error('Failed to load bullet point video:', point.video);
                            setError('Failed to preview bullet point video');
                          }}
                        />
                      )}
                    </FormGroup>
                    <FormGroup>
                      <label className="label">Code Snippet</label>
                      <Tooltip title="Enter a code snippet. This will be displayed as entered.">
                        <textarea
                          className="textarea"
                          rows="4"
                          value={point.codeSnippet}
                          onChange={e => handleBulletPointChange(index, pointIndex, 'codeSnippet', e.target.value)}
                        />
                      </Tooltip>
                    </FormGroup>
                  </div>
                ))}
                <button className="icon-button" type="button" onClick={() => addBulletPoint(index)}>Add Bullet Point</button>
              </div>
            ))}
            <button className="icon-button" type="button" onClick={addSubtitle}>Add Subtitle</button>
          </div>

          <div className="section">
            <h3 className="section-title">Comparison Section</h3>
            {superTitles.map((superTitle, superTitleIndex) => (
              <div key={superTitleIndex}>
                <FormGroup>
                  <label className="label">Super Title</label>
                  <Tooltip title="Enter the super title. Use [text](url) for links, e.g., [Visit Zedemy](https://zedemy.vercel.app/). HTML tags like <h3> are allowed.">
                    <input
                      className="input"
                      type="text"
                      value={superTitle.superTitle}
                      onChange={e => handleSuperTitleChange(superTitleIndex, 'superTitle', e.target.value)}
                    />
                  </Tooltip>
                </FormGroup>
                {superTitle.attributes.map((attribute, attributeIndex) => (
                  <div key={attributeIndex}>
                    <FormGroup>
                      <label className="label">Attribute</label>
                      <Tooltip title="Enter the attribute. Use [text](url) for links, e.g., [Visit Zedemy](https://zedemy.vercel.app/). HTML tags like <strong> are allowed.">
                        <input
                          className="input"
                          type="text"
                          value={attribute.attribute}
                          onChange={e => handleAttributeChange(superTitleIndex, attributeIndex, 'attribute', e.target.value)}
                        />
                      </Tooltip>
                    </FormGroup>
                    {attribute.items.map((item, itemIndex) => (
                      <div key={itemIndex}>
                        <FormGroup>
                          <label className="label">Item Title</label>
                          <Tooltip title="Enter the item title. Use [text](url) for links, e.g., [Visit Zedemy](https://zedemy.vercel.app/). HTML tags like <strong> are allowed.">
                            <input
                              className="input"
                              type="text"
                              value={item.title}
                              onChange={e => handleItemChange(superTitleIndex, attributeIndex, itemIndex, 'title', e.target.value)}
                            />
                          </Tooltip>
                        </FormGroup>
                        {item.bulletPoints.map((bulletPoint, bpIndex) => (
                          <FormGroup key={bpIndex}>
                            <label className="label">Bullet Point</label>
                            <Tooltip title="Enter the bullet point. Use [text](url) for links, e.g., [Visit Zedemy](https://zedemy.vercel.app/). HTML tags like <li> are allowed.">
                              <input
                                className="input"
                                type="text"
                                value={bulletPoint}
                                onChange={e => {
                                  setSuperTitles(prev => {
                                    const newSuperTitles = [...prev];
                                    newSuperTitles[superTitleIndex].attributes[attributeIndex].items[itemIndex].bulletPoints[bpIndex] = e.target.value;
                                    return newSuperTitles;
                                  });
                                }}
                              />
                            </Tooltip>
                          </FormGroup>
                        ))}
                        <button
                          className="icon-button"
                          type="button"
                          onClick={() => {
                            setSuperTitles(prev => {
                              const newSuperTitles = [...prev];
                              newSuperTitles[superTitleIndex].attributes[attributeIndex].items[itemIndex].bulletPoints.push('');
                              return newSuperTitles;
                            });
                          }}
                        >
                          Add Bullet Point
                        </button>
                      </div>
                    ))}
                    <button className="icon-button" type="button" onClick={() => addItem(superTitleIndex, attributeIndex)}>Add Item</button>
                  </div>
                ))}
                <button className="icon-button" type="button" onClick={() => addAttribute(superTitleIndex)}>Add Attribute</button>
              </div>
            ))}
            <button className="icon-button" type="button" onClick={addSuperTitle}>Add Super Title</button>
          </div>

          <div className="section">
            <h3 className="section-title">Summary</h3>
            <FormGroup>
              <Tooltip title="Enter a brief summary of your post. Use [text](url) for links, e.g., [Visit Zedemy](https://zedemy.vercel.app/). HTML tags like <p> are allowed.">
                <label className="label">Summary</label>
              </Tooltip>
              <textarea className="textarea" rows="5" value={summary} onChange={e => setSummary(e.target.value)} />
            </FormGroup>
          </div>

          <button className="button" type="submit" disabled={isUploading}>
            {isUploading ? 'Uploading...' : 'Add Post'}
          </button>
        </form>
      </div>
    </div>
  );
});

export default AddPostForm;
