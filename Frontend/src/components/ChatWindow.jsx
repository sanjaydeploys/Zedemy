import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';

// Memoized ChatWindow
const ChatWindow = React.memo(({ id, category, filteredPosts, onClose, initialPosition }) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [messages, setMessages] = useState(() => {
    if (typeof window !== 'undefined') {
      return JSON.parse(localStorage.getItem(`chat-${category}-${id}`)) || [];
    }
    return [];
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [suggestedPost, setSuggestedPost] = useState(null);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editedText, setEditedText] = useState('');
  const [chatSize, setChatSize] = useState({ width: 380, height: 550 });

  // Lazy-load dependencies
  const loadDependencies = useCallback(async () => {
    const [
      { default: ReactMarkdown },
      { default: remarkGfm },
      { default: rehypeRaw },
      { default: Draggable },
      { PrismAsyncLight: SyntaxHighlighter },
      { default: highlight },
      { default: javascript },
      { default: python },
      { oneDark },
    ] = await Promise.all([
      import('react-markdown'),
      import('remark-gfm'),
      import('rehype-raw'),
      import('react-draggable'),
      import('react-syntax-highlighter/dist/esm/prism-async-light'),
      import('highlight.js/lib/core'),
      import('highlight.js/lib/languages/javascript'),
      import('highlight.js/lib/languages/python'),
      import('react-syntax-highlighter/dist/esm/styles/prism/one-dark'),
    ]);

    // Register only needed languages
    highlight.registerLanguage('javascript', javascript);
    highlight.registerLanguage('python', python);

    return { ReactMarkdown, remarkGfm, rehypeRaw, Draggable, SyntaxHighlighter, highlight, oneDark };
  }, []);

  const [deps, setDeps] = useState(null);

  useEffect(() => {
    const load = () => {
      loadDependencies().then(setDeps);
    };
    if (typeof window !== 'undefined' && window.requestIdleCallback) {
      window.requestIdleCallback(load);
    } else {
      load();
    }
  }, [loadDependencies]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const save = () => {
      localStorage.setItem(`chat-${category}-${id}`, JSON.stringify(messages));
    };
    if (window.requestIdleCallback) {
      window.requestIdleCallback(save);
    } else {
      save();
    }
  }, [messages, category, id]);

  const sendMessageToGemini = useCallback(async (message, isPostSuggestion = false) => {
    if (!message.trim()) return;

    const userMessage = {
      sender: 'user',
      text: message,
      id: Date.now(),
      timestamp: new Date().toLocaleTimeString(),
    };
    if (!isPostSuggestion) setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const postTitles = filteredPosts.map(post => post.title).join(', ');
    const formatInstruction = "Respond in a concise, organized markdown format. Use `-` for bullet points, numbered lists where applicable, `**` for bold headings/emphasis, and ```language for code blocks (e.g., ```javascript).";
    const context = isPostSuggestion
      ? `${formatInstruction} Suggest a creative post title and brief description for the category "${category}". Current posts: ${postTitles || 'None'}.`
      : `${formatInstruction} You are a creative AI assistant on a page for the category "${category}". Current posts: ${postTitles || 'None'}. User query: ${message}`;

    try {
      const response = await fetch(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=AIzaSyBsEIJ38VxWk_o5FbbOUP0WS7MCt5-bSX8',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: context }] }] }),
        }
      );

      const data = await response.json();
      const aiResponse = data.candidates[0].content.parts[0].text;
      if (isPostSuggestion) {
        setSuggestedPost(aiResponse);
      } else {
        setMessages(prev => [
          ...prev,
          { sender: 'ai', text: aiResponse, id: Date.now(), timestamp: new Date().toLocaleTimeString() },
        ]);
      }
    } catch (error) {
      console.error('Error fetching Gemini API:', error);
      const errorMsg = {
        sender: 'ai',
        text: 'Oops, my circuits got tangled. Try again!',
        id: Date.now(),
        timestamp: new Date().toLocaleTimeString(),
      };
      if (isPostSuggestion) setSuggestedPost('Error generating suggestion.');
      else setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  }, [filteredPosts, category]);

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !isLoading) sendMessageToGemini(input);
  }, [isLoading, input, sendMessageToGemini]);

  const [speech, setSpeech] = useState(null);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const setupSpeech = () => {
      const recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (recognition) {
        const speechInstance = new recognition();
        speechInstance.continuous = false;
        speechInstance.interimResults = false;
        speechInstance.onresult = (event) => {
          setInput(event.results[0][0].transcript);
          setIsListening(false);
        };
        speechInstance.onerror = () => setIsListening(false);
        speechInstance.onend = () => setIsListening(false);
        setSpeech(speechInstance);
      }
    };
    if (window.requestIdleCallback) {
      window.requestIdleCallback(setupSpeech);
    } else {
      setupSpeech();
    }
  }, []);

  const toggleVoiceInput = useCallback(() => {
    if (!speech) return alert('Speech recognition not supported.');
    if (isListening) speech.stop();
    else {
      setIsListening(true);
      speech.start();
    }
  }, [speech, isListening]);

  const startEditing = useCallback((msg) => {
    if (msg.sender === 'user') {
      setEditingMessageId(msg.id);
      setEditedText(msg.text);
    }
  }, []);

  const saveEditedMessage = useCallback((msgId) => {
    if (editedText.trim()) {
      setMessages(prev =>
        prev.map(msg =>
          msg.id === msgId ? { ...msg, text: editedText, timestamp: new Date().toLocaleTimeString() } : msg
        )
      );
      sendMessageToGemini(editedText);
    }
    setEditingMessageId(null);
    setEditedText('');
  }, [editedText, sendMessageToGemini]);

  const deleteMessage = useCallback((msgId) => {
    setMessages(prev => prev.filter(msg => msg.id !== msgId));
  }, []);

  const suggestedPrompts = useMemo(
    () => [
      `Craft a wild story inspired by "${category}"!`,
      `What’s the strangest fact about "${category}"?`,
      `Imagine "${category}" as a sci-fi universe—what happens?`,
    ],
    [category]
  );

  const handlePromptClick = useCallback(
    (prompt) => {
      setInput(prompt);
      sendMessageToGemini(prompt);
    },
    [sendMessageToGemini]
  );

  const generatePostSuggestion = useCallback(() => {
    sendMessageToGemini(`Suggest a post for "${category}"`, true);
  }, [sendMessageToGemini, category]);

  const handleResize = useCallback((e) => {
    const newWidth = Math.max(300, Math.min(600, e.target.offsetWidth));
    const newHeight = Math.max(400, Math.min(800, e.target.offsetHeight));
    setChatSize({ width: newWidth, height: newHeight });
  }, []);

  const resetSize = useCallback(() => {
    setChatSize({ width: 380, height: 550 });
  }, []);

  if (!deps) {
    return <div>Loading chat dependencies...</div>;
  }

  const { ReactMarkdown, remarkGfm, rehypeRaw, Draggable, SyntaxHighlighter, highlight, oneDark } = deps;

  return (
    <Draggable handle=".chat-header" bounds="parent">
      <motion.div
        className="chat-standalone"
        style={{
          width: `${chatSize.width}px`,
          height: isMinimized ? '60px' : `${chatSize.height}px`,
          position: 'absolute',
          top: `${initialPosition.top}px`,
          left: `${initialPosition.left}px`,
          zIndex: isPinned ? 1002 : 1001,
        }}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: isMinimized ? 0.9 : 1 }}
        transition={{ duration: 0.2 }}
        onMouseUp={handleResize}
      >
        <div className="chat-header">
          <h3>AI Help ChatBot #{id}</h3>
          <div className="chat-controls">
            <button className="pin-btn" onClick={() => setIsPinned(!isPinned)}>
              {isPinned ? '📍' : '📌'}
            </button>
            <button className="reset-btn" onClick={resetSize}>⟳</button>
            <button className="toggle-btn" onClick={() => setIsMinimized(!isMinimized)}>
              {isMinimized ? '□' : '–'}
            </button>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
        </div>
        {!isMinimized && (
          <div className="chat-content">
            <div className="chat-messages">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`chat-message ${msg.sender === 'user' ? 'user-message' : 'ai-message'}`}
                >
                  <div className="message-content">
                    {editingMessageId === msg.id ? (
                      <div className="edit-message">
                        <input
                          type="text"
                          value={editedText}
                          onChange={e => setEditedText(e.target.value)}
                          onKeyPress={e => e.key === 'Enter' && saveEditedMessage(msg.id)}
                        />
                        <button onClick={() => saveEditedMessage(msg.id)}>Save</button>
                        <button onClick={() => setEditingMessageId(null)}>Cancel</button>
                      </div>
                    ) : (
                      <>
                        {msg.sender === 'ai' ? (
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={[rehypeRaw]}
                            components={{
                              code({ node, inline, className, children, ...props }) {
                                const match = /language-(\w+)/.exec(className || '');
                                return !inline && match ? (
                                  <SyntaxHighlighter
                                    style={oneDark}
                                    language={match[1]}
                                    PreTag="div"
                                    customStyle={{ background: 'transparent' }}
                                    {...props}
                                  >
                                    {String(children).replace(/\n$/, '')}
                                  </SyntaxHighlighter>
                                ) : (
                                  <code className={className} {...props}>
                                    {children}
                                  </code>
                                );
                              },
                            }}
                          >
                            {msg.text}
                          </ReactMarkdown>
                        ) : (
                          msg.text
                        )}
                        <span className="message-timestamp">{msg.timestamp}</span>
                      </>
                    )}
                  </div>
                  <div className="message-actions">
                    {msg.sender === 'user' && (
                      <button className="edit-btn" onClick={() => startEditing(msg)}>
                        Edit
                      </button>
                    )}
                    <button className="delete-btn" onClick={() => deleteMessage(msg.id)}>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
              {isLoading && <div className="chat-loading">AI is crafting a masterpiece...</div>}
            </div>
            <div className="chat-suggestions">
              {suggestedPrompts.map((prompt, index) => (
                <button
                  key={index}
                  className="suggestion-btn"
                  onClick={() => handlePromptClick(prompt)}
                  disabled={isLoading}
                >
                  {prompt}
                </button>
              ))}
            </div>
            <div className="post-suggestion-area">
              <button
                className="post-suggestion-btn"
                onClick={generatePostSuggestion}
                disabled={isLoading}
              >
                Suggest a Post
              </button>
              {suggestedPost && (
                <div className="suggested-post">
                  <strong>Suggested Post:</strong>
                  <div className="suggested-post-content">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeRaw]}
                      components={{
                        code({ node, inline, className, children, ...props }) {
                          const match = /language-(\w+)/.exec(className || '');
                          return !inline && match ? (
                            <SyntaxHighlighter
                              style={oneDark}
                              language={match[1]}
                              PreTag="div"
                              customStyle={{ background: 'transparent' }}
                              {...props}
                            >
                              {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                          ) : (
                            <code className={className} {...props}>
                              {children}
                            </code>
                          );
                        },
                      }}
                    >
                      {suggestedPost}
                    </ReactMarkdown>
                  </div>
                </div>
              )}
            </div>
            <div className="chat-input-area">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything..."
                disabled={isLoading}
              />
              <button
                className="voice-btn"
                onClick={toggleVoiceInput}
                disabled={isLoading || !speech}
              >
                {isListening ? 'Stop' : '🎤'}
              </button>
              <button onClick={() => sendMessageToGemini(input)} disabled={isLoading}>
                Send
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </Draggable>
  );
});

export default ChatWindow;
