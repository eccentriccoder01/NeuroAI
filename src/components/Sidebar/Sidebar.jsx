import { useState } from 'react';
import styles from "./Sidebar.module.css";
import PropTypes from "prop-types";

export function Sidebar({ 
  isOpen, 
  toggleSidebar, 
  startNewChat, 
  chatSessions, 
  currentSessionId, 
  onLoadSession, 
  onDeleteSession,
  userProfile,
  syncStatus,
  onProfileClick
}) {
  const [sessionMenuOpen, setSessionMenuOpen] = useState(null);

  const handleSessionClick = (sessionId) => {
    if (sessionId !== currentSessionId) {
      onLoadSession(sessionId);
    }
  };

  const handleDeleteClick = (e, sessionId) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this chat?')) {
      onDeleteSession(sessionId);
    }
    setSessionMenuOpen(null);
  };

  const toggleSessionMenu = (e, sessionId) => {
    e.stopPropagation();
    setSessionMenuOpen(sessionMenuOpen === sessionId ? null : sessionId);
  };

  const getSyncStatusIcon = () => {
    switch (syncStatus) {
      case 'syncing':
        return '🔄';
      case 'synced':
        return '✅';
      case 'error':
        return '❌';
      default:
        return '💾';
    }
  };

  const getSyncStatusText = () => {
    switch (syncStatus) {
      case 'syncing':
        return 'Syncing...';
      case 'synced':
        return 'Synced';
      case 'error':
        return 'Sync Error';
      default:
        return 'Local';
    }
  };

  return (
    <div className={`${styles.sidebar} ${!isOpen ? styles.closed : ''}`}>
      <div className={styles.sidebarHeader}>
        <div className={styles.menuToggle} onClick={toggleSidebar}>
          <div className={styles.hamburger}>
            <div></div>
            <div></div>
            <div></div>
          </div>
        </div>
        
        {isOpen && (
          <div className={styles.newChatButton} onClick={startNewChat}>
            <div className={styles.addIcon}>+</div>
            <span>New Chat</span>
          </div>
        )}
      </div>

      {isOpen && (
        <>
          <div className={styles.syncStatus}>
            <span className={styles.syncIcon}>{getSyncStatusIcon()}</span>
            <span className={styles.syncText}>{getSyncStatusText()}</span>
          </div>

          <div className={styles.chatList}>
            <h3 className={styles.sectionTitle}>Recent Chats</h3>
            {chatSessions.length === 0 ? (
              <div className={styles.emptyState}>
                <p>No chats yet</p>
                <p>Start a new conversation!</p>
              </div>
            ) : (
              chatSessions.map((session) => (
                <div
                  key={session.id}
                  className={`${styles.chatItem} ${
                    session.id === currentSessionId ? styles.active : ''
                  }`}
                  onClick={() => handleSessionClick(session.id)}
                >
                  <div className={styles.chatContent}>
                    <div className={styles.chatTitle}>
                      {session.title || 'New Chat'}
                    </div>
                    <div className={styles.chatDate}>
                      {session.timestamp ? new Date(session.timestamp).toLocaleDateString() : 'Today'}
                    </div>
                  </div>
                  <div className={styles.chatActions}>
                    <button
                      className={styles.menuButton}
                      onClick={(e) => toggleSessionMenu(e, session.id)}
                    >
                      ⋮
                    </button>
                    {sessionMenuOpen === session.id && (
                      <div className={styles.sessionMenu}>
                        <button
                          onClick={(e) => handleDeleteClick(e, session.id)}
                          className={styles.deleteButton}
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
      
      <div className={styles.userProfile}>
        {userProfile?.photoURL ? (
          <img 
            src={userProfile.photoURL} 
            alt="Profile" 
            className={styles.avatar}
            onClick={onProfileClick}
          />
        ) : (
          <div 
            className={styles.avatarPlaceholder}
            onClick={onProfileClick}
          >
            {(userProfile?.displayName || userProfile?.email || 'U')[0].toUpperCase()}
          </div>
        )}
        {isOpen && (
          <div className={styles.userInfo} onClick={onProfileClick}>
            <div className={styles.username}>
              {userProfile?.displayName || 'User'}
            </div>
            <div className={styles.userEmail}>
              {userProfile?.email}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

Sidebar.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  toggleSidebar: PropTypes.func.isRequired,
  startNewChat: PropTypes.func.isRequired,
  chatSessions: PropTypes.array.isRequired,
  currentSessionId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onLoadSession: PropTypes.func.isRequired,
  onDeleteSession: PropTypes.func.isRequired,
  userProfile: PropTypes.object,
  syncStatus: PropTypes.string,
  onProfileClick: PropTypes.func.isRequired,
};


