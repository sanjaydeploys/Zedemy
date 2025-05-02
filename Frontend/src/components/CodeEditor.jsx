import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { Helmet } from 'react-helmet';
import '../styles/CodeEditor.css';

// Lazy-load framer-motion
const MotionDiv = lazy(() => import('framer-motion').then(m => ({ default: m.motion.div })));

// Lazy-load CodeMirror
const CodeMirror = lazy(() => import('@uiw/react-codemirror'));

// Theme configuration
const themes = {
  oneDark: { backgroundColor: '#282c34' },
  dracula: { backgroundColor: '#282a36' }
};

// Lightweight custom debounce with cancel method
const debounce = (func, wait) => {
  let timeout;
  const debounced = (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
  debounced.cancel = () => {
    clearTimeout(timeout);
  };
  return debounced;
};

const CodeEditor = () => {
  const [language, setLanguage] = useState('javascript');
  const [theme, setTheme] = useState('oneDark');
  const [fontSize, setFontSize] = useState(14);
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [syntaxHighlighting, setSyntaxHighlighting] = useState(true);
  const [autoSave, setAutoSave] = useState(true);
  const [lineWrapping, setLineWrapping] = useState(true);
  const [windows, setWindows] = useState(() => {
    const savedWindows = JSON.parse(localStorage.getItem('windows')) || [];
    return savedWindows.length > 0 
      ? savedWindows 
      : [{ id: 1, name: 'File 1', code: '', wordCount: 0, characterCount: 0 }];
  });
  const [extensions, setExtensions] = useState(null);
  const codeRef = useRef(null);

  // Load extensions dynamically
  useEffect(() => {
    const loadExtensions = async () => {
      try {
        // Load language extension
        let langExt;
        switch (language) {
          case 'javascript':
            langExt = await import('@codemirror/lang-javascript').then(m => m.javascript());
            break;
          case 'python':
            langExt = await import('@codemirror/lang-python').then(m => m.python());
            break;
          case 'css':
            langExt = await import('@codemirror/lang-css').then(m => m.css());
            break;
          case 'html':
            langExt = await import('@codemirror/lang-html').then(m => m.html());
            break;
          case 'markdown':
            langExt = await import('@codemirror/lang-markdown').then(m => m.markdown());
            break;
          default:
            langExt = await import('@codemirror/lang-javascript').then(m => m.javascript());
        }

        // Load theme
        const themeExt = theme === 'oneDark'
          ? await import('@codemirror/theme-one-dark').then(m => m.oneDark)
          : await import('@uiw/codemirror-theme-dracula').then(m => m.dracula);

        // Load other extensions
        const { history } = await import('@codemirror/commands');
        const { keymap } = await import('@codemirror/view');
        const { autocompletion } = await import('@codemirror/autocomplete');

        setExtensions([
          syntaxHighlighting ? langExt : [],
          themeExt,
          history(),
          keymap.of([
            { key: 'Mod-z', run: (await import('@codemirror/commands')).undo },
            { key: 'Mod-y', run: (await import('@codemirror/commands')).redo }
          ]),
          autocompletion()
        ]);
      } catch (error) {
        console.error('Failed to load extensions:', error);
        setExtensions([]);
      }
    };
    loadExtensions();
  }, [language, theme, syntaxHighlighting]);

  // Autosave with custom debounce
  const debouncedSave = debounce(() => {
    localStorage.setItem('windows', JSON.stringify(windows));
  }, 1000);

  useEffect(() => {
    if (autoSave) {
      debouncedSave();
      return () => debouncedSave.cancel();
    }
  }, [windows, autoSave]);

  const updateCounts = (text) => {
    const wordCount = text.split(/\s+/).filter(word => word.length > 0).length;
    const characterCount = text.length;
    return { wordCount, characterCount };
  };

  const handleDownload = async () => {
    try {
      const { toPng } = await import('html-to-image');
      const { default: download } = await import('downloadjs');
      const dataUrl = await toPng(codeRef.current);
      download(dataUrl, 'code.png');
    } catch (error) {
      console.error('Failed to download as PNG:', error);
    }
  };

  const handleDownloadTextFile = async () => {
    try {
      const { default: download } = await import('downloadjs');
      const blob = new Blob([windows.map(win => win.code).join('\n')], { type: 'text/plain' });
      download(blob, 'code.txt');
    } catch (error) {
      console.error('Failed to download as text:', error);
    }
  };

  const addNewWindow = () => {
    const newId = windows.length + 1;
    setWindows([...windows, { id: newId, name: `File ${newId}`, code: '', wordCount: 0, characterCount: 0 }]);
  };

  const closeWindow = (id) => {
    setWindows(windows.filter(win => win.id !== id));
  };

  const updateWindowCode = (id, newCode) => {
    setWindows(windows.map(win => 
      win.id === id 
        ? { ...win, code: newCode, ...updateCounts(newCode) }
        : win
    ));
  };

  const updateWindowName = (id, newName) => {
    setWindows(windows.map(win => 
      win.id === id ? { ...win, name: newName } : win
    ));
  };

  const toggleSyntaxHighlighting = () => setSyntaxHighlighting(!syntaxHighlighting);
  const toggleLineWrapping = () => setLineWrapping(!lineWrapping);

  return (
    <div className="editor-container">
      <Helmet>
        <title>Code Editor - Customize and Download Your Code</title>
        <meta name="description" content="Experience a powerful code editor with syntax highlighting, multiple themes, and download options." />
        <meta name="keywords" content="code editor, syntax highlighting, code download, code themes, JavaScript, Python, CSS, HTML, Markdown" />
        <meta property="og:title" content="Code Editor - Customize and Download Your Code" />
        <meta property="og:description" content="Experience a powerful code editor with syntax highlighting, multiple themes, and download options." />
        <meta property="og:image" content="https://sanjaybasket.s3.ap-south-1.amazonaws.com/HogwartsEdX/code-image.webp" />
        <meta property="og:url" content="https://learnandshare.vercel.app/editor" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Code Editor - Customize and Download Your Code" />
        <meta name="twitter:description" content="Experience a powerful code editor with syntax highlighting, multiple themes, and download options." />
        <meta name="twitter:image" content="https://sanjaybasket.s3.ap-south-1.amazonaws.com/HogwartsEdX/code-image.webp" />
      </Helmet>
      <Suspense fallback={<div>Loading editor...</div>}>
        <MotionDiv
          className={`containereditor ${theme}`}
          style={{ backgroundColor: themes[theme].backgroundColor }}
        >
          <div className="toolbar">
            <select value={language} onChange={(e) => setLanguage(e.target.value)}>
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="css">CSS</option>
              <option value="html">HTML</option>
              <option value="markdown">Markdown</option>
            </select>
            <select value={theme} onChange={(e) => setTheme(e.target.value)}>
              <option value="oneDark">One Dark</option>
              <option value="dracula">Dracula</option>
            </select>
            <select value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))}>
              <option value={12}>12px</option>
              <option value={14}>14px</option>
              <option value={16}>16px</option>
              <option value={18}>18px</option>
              <option value={20}>20px</option>
            </select>
            <label>
              <input type="checkbox" checked={showLineNumbers} onChange={(e) => setShowLineNumbers(e.target.checked)} />
              Line Numbers
            </label>
            <label>
              <input type="checkbox" checked={syntaxHighlighting} onChange={toggleSyntaxHighlighting} />
              Syntax Highlight
            </label>
            <label>
              <input type="checkbox" checked={lineWrapping} onChange={toggleLineWrapping} />
              Line Wrapping
            </label>
            <label>
              <input type="checkbox" checked={autoSave} onChange={(e) => setAutoSave(e.target.checked)} />
              Auto Save
            </label>
          </div>
          <div className="buttonz-container">
            <button className="buttonz" onClick={handleDownload}>Download PNG</button>
            <button className="buttonz" onClick={handleDownloadTextFile}>Download Text</button>
            <button className="buttonz" onClick={addNewWindow}>New Window</button>
          </div>
          <div className="code-windows">
            {windows.map((window) => (
              <MotionDiv
                key={window.id}
                ref={codeRef}
                className="code-container"
              >
                <div className="status-bar">
                  <span>Words: {window.wordCount}</span> <br />
                  <span>Characters: {window.characterCount}</span>
                </div>
                <input
                  type="text"
                  className="window-name-input"
                  value={window.name}
                  onChange={(e) => updateWindowName(window.id, e.target.value)}
                  placeholder="File Name"
                />
                <button className="close-button" onClick={() => closeWindow(window.id)}>Close</button>
                <Suspense fallback={<div>Loading editor...</div>}>
                  {extensions && extensions.length > 0 ? (
                    <CodeMirror
                      value={window.code}
                      height="auto"
                      extensions={extensions}
                      onChange={(value) => updateWindowCode(window.id, value)}
                      className={`code-editor ${theme}`}
                      style={{ fontSize: `${fontSize}px` }}
                      basicSetup={{
                        lineNumbers: showLineNumbers,
                        foldGutter: false,
                        highlightActiveLineGutter: false,
                        highlightSpecialChars: false,
                        drawSelection: true,
                        dropCursor: true,
                        allowMultipleSelections: false,
                        indentOnInput: true,
                        bracketMatching: true,
                        closeBrackets: true,
                        autocompletion: syntaxHighlighting,
                        syntaxHighlighting: syntaxHighlighting,
                        lineWrapping: lineWrapping
                      }}
                    />
                  ) : (
                    <textarea
                      value={window.code}
                      onChange={(e) => updateWindowCode(window.id, e.target.value)}
                      style={{ width: '100%', height: '200px', fontSize: `${fontSize}px` }}
                      placeholder="Code editor failed to load. Type here..."
                    />
                  )}
                </Suspense>
              </MotionDiv>
            ))}
          </div>
        </MotionDiv>
      </Suspense>
    </div>
  );
};

export default CodeEditor;
