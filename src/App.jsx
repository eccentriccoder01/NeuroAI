import { useState, useEffect, useContext } from "react";
import { Assistant } from "./assistants/googleai";
import { Loader } from "./components/Loader/Loader";
import { Chat } from "./components/Chat/Chat";
import { Controls } from "./components/Controls/Controls";
import { Sidebar } from "./components/Sidebar/Sidebar";
import { ThemeProvider, ThemeContext } from "./contexts/ThemeContext";
import styles from "./App.module.css";

function AppContent() {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const assistant = new Assistant();
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [chatSessions, setChatSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  useEffect(() => {
  localStorage.setItem("chatSessions", JSON.stringify(chatSessions));
}, [chatSessions]);

useEffect(() => {
  const savedSessions = localStorage.getItem("chatSessions");
  if (savedSessions) {
    try {
      const sessions = JSON.parse(savedSessions);
      if (Array.isArray(sessions) && sessions.length > 0) {
        setChatSessions(sessions);
        setCurrentSessionId(sessions[0].id);
        setMessages(sessions[0].messages || []);
      } else {
        startNewChat();
      }
    } catch (err) {
      console.error("Failed to parse chatSessions from localStorage:", err);
      localStorage.removeItem("chatSessions");
      startNewChat();
    }
  } else {
    startNewChat();
  }
}, []);

  function updateLastMessageContent(content) {
    setMessages((prevMessages) =>
      prevMessages.map((message, index) =>
        index === prevMessages.length - 1
          ? { ...message, content: `${message.content}${content}` }
          : message
      )
    );
  }

  function addMessage(message) {
    setMessages((prevMessages) => [...prevMessages, message]);
  }

  function startNewChat() {
    // Save current session
    if (currentSessionId && messages.length > 0) {
      setChatSessions(prev =>
        prev.map(session =>
          session.id === currentSessionId
            ? {
                ...session,
                messages: [...messages],
                title: messages[0]?.content?.substring(0, 30) + "..." || "New Chat",
              }
            : session
        )
      );
    }

    // Create new session
    const newSession = {
      id: Date.now(),
      title: "New Chat",
      messages: [],
      timestamp: new Date()
    };
    
    setChatSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    setMessages([]);
  }

  function loadChatSession(sessionId) {
    const session = chatSessions.find(s => s.id === sessionId);
    if (session) {
      setCurrentSessionId(sessionId);
      setMessages(session.messages);
    }
  }

  function deleteChatSession(sessionId) {
    setChatSessions(prev => prev.filter(s => s.id !== sessionId));
    if (currentSessionId === sessionId) {
      const remaining = chatSessions.filter(s => s.id !== sessionId);
      if (remaining.length > 0) {
        setCurrentSessionId(remaining[0].id);
        setMessages(remaining[0].messages);
      } else {
        startNewChat();
      }
    }
  }

  async function handleContentSend(content) {
    addMessage({ content, role: "user" });
    setIsLoading(true);
    setIsTyping(true);
    
    try {
      const result = await assistant.chatStream(content, messages);
      let isFirstChunk = false;

      for await (const chunk of result) {
        if (!isFirstChunk) {
          isFirstChunk = true;
          addMessage({ content: "", role: "assistant" });
          setIsLoading(false);
          setIsStreaming(true);
          setIsTyping(false);
        }

        updateLastMessageContent(chunk);
      }

      setIsStreaming(false);
    } catch (error) {
      addMessage({
        content: "Sorry, I couldn't process your request. Please try again!",
        role: "system",
      });
      setIsLoading(false);
      setIsStreaming(false);
      setIsTyping(false);
    }
  }

  return (
      <div className={styles.App}>
        {isLoading && <Loader />}
        <Sidebar 
          isOpen={sidebarOpen} 
          toggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
          startNewChat={startNewChat}
          chatSessions={chatSessions}
          currentSessionId={currentSessionId}
          onLoadSession={loadChatSession}
          onDeleteSession={deleteChatSession}
        />
        <div className={`${styles.mainContent} ${!sidebarOpen ? styles.sidebarClosed : ''}`}>
          <header className={styles.Header}>
            <div className={styles.headerLeft}>
              <button 
                className={styles.menuButton}
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <div className={styles.hamburger}>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </button>
              <div className={styles.logo}>
                <img src="/logo.png" alt="NeuroAI" />
                <span className={styles.logoText}>NeuroAI</span>
              </div>
            </div>
            <div className={styles.headerRight}>
              <button 
                className={styles.themeToggle}
                onClick={toggleTheme}
                title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              >
                {theme === 'light' ? '🌙' : '☀️'}
              </button>
              <div className={styles.statusIndicator}>
                <div className={`${styles.statusDot} ${isStreaming ? styles.streaming : styles.ready}`}></div>
                <span>{isStreaming ? 'Responding...' : 'Ready'}</span>
              </div>
            </div>
          </header>
          <div className={styles.ChatContainer}>
            <Chat 
              messages={messages} 
              isTyping={isTyping}
              isStreaming={isStreaming}
            />
          </div>
          <Controls
            isDisabled={isLoading || isStreaming}
            onSend={handleContentSend}
          />
        </div>
      </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;