import styles from "./Sidebar.module.css";
import PropTypes from "prop-types";

export function Sidebar({ isOpen, toggleSidebar, startNewChat }) {
  return (
    <div className={`${styles.sidebar} ${!isOpen ? styles.closed : ''}`}>
      <div className={styles.menuToggle} onClick={toggleSidebar}>
        <div className={styles.hamburger}>
          <div></div>
          <div></div>
          <div></div>
        </div>
      </div>
      
      <div className={styles.navItems}>
        <div className={styles.navItem} onClick={startNewChat}>
          <div className={styles.addIcon}>+</div>
           {isOpen && <span>New Chat</span>}
        </div>
      </div>
      
      <div className={styles.userProfile}>
        <div className={styles.avatar}>
          <img src="/chat-bot.png" alt="Bot" />
        </div>
        {isOpen && (
          <div className={styles.username}>
            <strong>NeuroAI</strong>
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
};


