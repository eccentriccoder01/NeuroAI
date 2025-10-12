import React, { useState, useEffect } from "react";
import { Assistant } from "./assistants/googleai";
import { Loader } from "./components/Loader/Loader";
import { Chat } from "./components/Chat/Chat";
import { Controls } from "./components/Controls/Controls";
import { Sidebar } from "./components/Sidebar/Sidebar";
import { Auth } from "./components/Auth/Auth";
import { UserProfile } from "./components/UserProfile/UserProfile";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { exportAsText, exportAsPDF } from "./utils/exportUtils";
import { ChatStorageService, migrateLocalStorageToFirestore, UserChatStats } from "./services/chatStorage";
import styles from "./App.module.css";

function AppContent() {
  const { currentUser, userProfile, refreshUserProfile, loading } = useAuth();
  const assistant = new Assistant();
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [chatSessions, setChatSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState('idle');
  const [chatStorage, setChatStorage] = useState(null);
  const [migrationComplete, setMigrationComplete] = useState(false);
// Initialize chat storage when user is authenticated
  useEffect(() => {
    if (currentUser) {
      console.log('Initializing chat storage for user:', currentUser.uid);
      const storage = new ChatStorageService(currentUser.uid);
      setChatStorage(storage);
    } else {
      setChatStorage(null);
    }
  }, [currentUser]);

  // Load chat sessions when storage is available
  useEffect(() => {
    if (!chatStorage) return;
    
    const loadSessions = async () => {
      try {
        const sessions = await chatStorage.loadChatSessions();
        console.log(`Loaded ${sessions.length} chat sessions`);
        setChatSessions(sessions);
        
        if (sessions.length > 0) {
          const recent = sessions[0]; // First one is most recent
          setCurrentSessionId(recent.id);
          setMessages(recent.messages || []);
        }
      } catch (error) {
        console.error('Error loading sessions:', error);
      }
    };
    
    loadSessions();
  }, [chatStorage]);



  // Close export dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (exportDropdownOpen && !event.target.closest(`.${styles.exportMenu}`)) {
        setExportDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [exportDropdownOpen]);

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

  // Generate a meaningful title from the conversation
  function generateChatTitle(messages) {
    if (!messages || messages.length === 0) {
      return "New Chat";
    }
    
    // Find the first user message
    const firstUserMessage = messages.find(msg => msg.role === 'user');
    if (!firstUserMessage || !firstUserMessage.content) {
      return "New Chat";
    }
    
    let title = firstUserMessage.content.trim();
    
    // Clean up the title
    title = title.replace(/\n/g, ' '); // Replace newlines with spaces
    title = title.replace(/\s+/g, ' '); // Replace multiple spaces with single space
    
    // Truncate if too long
    if (title.length > 50) {
      title = title.substring(0, 50).trim() + '...';
    }
    
    // If title is too short or just punctuation, use a default
    if (title.length < 3 || /^[^a-zA-Z0-9]+$/.test(title)) {
      return "New Chat";
    }
    
    return title;
  }

  async function startNewChat() {
    // Save current session to cloud if authenticated
    if (currentSessionId && messages.length > 0) {
      const chatTitle = generateChatTitle(messages);
      const updatedSession = {
        messages: [...messages],
        title: chatTitle,
        updatedAt: new Date(),
      };

      setChatSessions(prev =>
        prev.map(session =>
          session.id === currentSessionId ? { ...session, ...updatedSession } : session
        )
      );

      // Save to cloud if authenticated
      if (currentUser && chatStorage) {
        try {
          await chatStorage.saveChatSession(currentSessionId, updatedSession);
        } catch (error) {
          console.error('Error saving current session:', error);
        }
      }
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

    // Save new session to cloud if authenticated
    if (currentUser && chatStorage) {
      try {
        await chatStorage.saveChatSession(newSession.id, {
          title: newSession.title,
          messages: newSession.messages,
          createdAt: newSession.timestamp,
        }, true); // Mark as new session for count tracking
        console.log('New chat session created and saved to cloud');
        
        // Refresh user profile to update chat count
        await refreshUserProfile();
      } catch (error) {
        console.error('Error creating new session in cloud:', error);
      }
    }
  }

  function loadChatSession(sessionId) {
    const session = chatSessions.find(s => s.id === sessionId);
    if (session) {
      setCurrentSessionId(sessionId);
      setMessages(session.messages);
    }
  }

  async function deleteChatSession(sessionId) {
    console.log('Deleting chat session:', sessionId);
    
    // First update the local state
    const remainingSessions = chatSessions.filter(s => s.id !== sessionId);
    setChatSessions(remainingSessions);
    
    // Handle current session change
    if (currentSessionId === sessionId) {
      if (remainingSessions.length > 0) {
        setCurrentSessionId(remainingSessions[0].id);
        setMessages(remainingSessions[0].messages || []);
      } else {
        // No more sessions, start a new one
        startNewChat();
        return; // Exit early as startNewChat handles everything
      }
    }
    
    // Delete from cloud if authenticated
    if (currentUser && chatStorage) {
      try {
        await chatStorage.deleteChatSession(sessionId);
        console.log('Chat session deleted from cloud');
        
        // Refresh user profile to update chat count
        await refreshUserProfile();
      } catch (error) {
        console.error('Error deleting session from cloud:', error);
        // Rollback local changes if cloud deletion failed
        setChatSessions(chatSessions); // Restore original sessions
      }
    }
  }

  // Export functions
  function handleExportCurrentAsText() {
    console.log('Exporting as text...', { messagesCount: messages.length });
    const currentSession = chatSessions.find(s => s.id === currentSessionId);
    const title = currentSession?.title || "NeuroAI Chat";
    exportAsText(messages, title);
  }

  function handleExportCurrentAsPDF() {
    console.log('Exporting as PDF...', { messagesCount: messages.length });
    if (messages.length === 0) {
      alert('No messages to export!');
      return;
    }
    const currentSession = chatSessions.find(s => s.id === currentSessionId);
    const title = currentSession?.title || "NeuroAI Chat";
    const success = exportAsPDF(messages, title);
    if (success) {
      console.log('PDF export completed successfully');
    }
  }



  async function handleContentSend(content) {
    const newUserMessage = { content, role: "user" };
    const updatedMessages = [...messages, newUserMessage];
    addMessage(newUserMessage);
    
    // If this is the first message, update the chat title
    const isFirstMessage = messages.length === 0;
    if (isFirstMessage && currentSessionId) {
      const newTitle = generateChatTitle(updatedMessages);
      setChatSessions(prev =>
        prev.map(session =>
          session.id === currentSessionId 
            ? { ...session, title: newTitle, updatedAt: new Date() }
            : session
        )
      );
      
      // Save updated title to cloud
      if (currentUser && chatStorage) {
        try {
          await chatStorage.updateSessionMetadata(currentSessionId, { 
            title: newTitle 
          });
        } catch (error) {
          console.error('Error updating chat title:', error);
        }
      }
    }
    
    setIsLoading(true);
    setIsTyping(true);
    
    try {
      const result = await assistant.chatStream(content, updatedMessages);
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
    } catch {
      addMessage({
        content: "Sorry, I couldn't process your request. Please try again!",
        role: "system",
      });
      setIsLoading(false);
      setIsStreaming(false);
      setIsTyping(false);
    }
  }

  // Show loading during auth check
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        backgroundColor: '#f8fafc'
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  // Show auth screen if not authenticated
  if (!currentUser) {
    return <Auth />;
  }

  return (
    <>
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
          userProfile={userProfile}
          syncStatus={syncStatus}
          onProfileClick={() => setProfileModalOpen(true)}
        />
        <div className={`${styles.mainContent} ${!sidebarOpen ? styles.sidebarClosed : ''}`}>
          <header className={styles.Header}>
            <div className={styles.headerLeft}>
              {/* <button 
                className={styles.menuButton}
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <div className={styles.hamburger}>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </button> */}
              <div className={styles.logo}>
                <img src="/logo.png" alt="NeuroAI" />
                <span className={styles.logoText}>NeuroAI</span>
              </div>
            </div>
            <div className={styles.headerRight}>
              <div className={styles.exportMenu}>
                <button 
                  className={styles.exportButton}
                  onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
                  title="Export Conversation"
                >
                  📥 Export
                </button>
                {exportDropdownOpen && (
                  <>
                    <div 
                      className={styles.exportBackdrop}
                      onClick={() => setExportDropdownOpen(false)}
                    />
                    <div className={styles.exportDropdown}>
                      <button 
                        onClick={() => {
                          handleExportCurrentAsText();
                          setExportDropdownOpen(false);
                        }}
                        className={styles.exportOption}
                        disabled={messages.length === 0}
                      >
                        📄 Current Chat as Text
                      </button>
                      <button 
                        onClick={() => {
                          handleExportCurrentAsPDF();
                          setExportDropdownOpen(false);
                        }}
                        className={styles.exportOption}
                        disabled={messages.length === 0}
                      >
                        📑 Current Chat as PDF
                      </button>
                    </div>
                  </>
                )}
              </div>
              <div className={styles.statusIndicator}>
                <div className={`${styles.statusDot} ${isStreaming ? styles.streaming : styles.ready}`}></div>
                <span>{isStreaming ? 'Responding...' : 'Ready'}</span>
              </div>
            </div>
          </header>
          <div className={styles.ChatContainer}>
            {chatSessions.length === 0 && !currentSessionId ? (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%',
                textAlign: 'center',
                color: '#64748b'
              }}>
                <h2 style={{ marginBottom: '16px', color: '#1e293b' }}>Welcome to NeuroAI!</h2>
                <p style={{ marginBottom: '24px', fontSize: '16px' }}>Start a conversation to begin chatting with AI.</p>
                <button
                  onClick={startNewChat}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#7c3aed',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '16px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseOver={(e) => e.target.style.backgroundColor = '#6d28d9'}
                  onMouseOut={(e) => e.target.style.backgroundColor = '#7c3aed'}
                >
                  Start New Chat
                </button>
              </div>
            ) : (
              <Chat 
                messages={messages} 
                isTyping={isTyping}
                isStreaming={isStreaming}
              />
            )}
          </div>
          {(chatSessions.length > 0 || currentSessionId) && (
            <Controls
              isDisabled={isLoading || isStreaming}
              onSend={handleContentSend}
            />
          )}
        </div>
      </div>
      
      <UserProfile 
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
      />
    </>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

// Error boundary component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App Error:', error, errorInfo);
    console.error('Error stack:', error.stack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          backgroundColor: '#f8fafc',
          fontFamily: 'Inter, sans-serif',
          textAlign: 'center',
          padding: '20px'
        }}>
          <div style={{ maxWidth: '600px' }}>
            <h2 style={{ color: '#ef4444', marginBottom: '16px' }}>App Error Detected</h2>
            <p style={{ color: '#64748b', marginBottom: '16px' }}>The app encountered an error and cannot load properly.</p>
            {this.state.error && (
              <div style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '16px',
                textAlign: 'left',
                fontSize: '14px',
                color: '#991b1b',
                fontFamily: 'monospace',
                overflow: 'auto',
                maxHeight: '200px'
              }}>
                <strong>Error:</strong> {this.state.error.toString()}
                {this.state.error.stack && (
                  <pre style={{ marginTop: '8px', whiteSpace: 'pre-wrap' }}>
                    {this.state.error.stack}
                  </pre>
                )}
              </div>
            )}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button 
                onClick={() => window.location.reload()}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#7c3aed',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                Refresh Page
              </button>
              <button 
                onClick={() => this.setState({ hasError: false, error: null })}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Temporarily export without error boundary to debug
export default App;

// Uncomment when debugging is done:
// export default function WrappedApp() {
//   return (
//     <ErrorBoundary>
//       <App />
//     </ErrorBoundary>
//   );
// }
