import { useRef, useEffect, useMemo, useState } from "react";
import Markdown from "react-markdown";
import styles from "./Chat.module.css";
import PropTypes from "prop-types";

const UserAvatar = () => (
  <div className={styles.userAvatar}>
    <div className={styles.avatarBorder}>
      <img
        src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face"
        alt="User"
      />
    </div>
  </div>
);

const BotAvatar = ({ isTyping }) => (
  <div className={`${styles.botAvatar} ${isTyping ? styles.typing : ""}`}>
    <div className={styles.avatarBorder}>
      <img src="/logo.png" alt="NeuroAI" />
    </div>
  </div>
);

const TypingIndicator = () => (
  <div className={styles.typingIndicator}>
    <div className={styles.typingDots}>
      <span></span>
      <span></span>
      <span></span>
    </div>
  </div>
);

const MessageReactions = ({
  onReaction,
  messageId,
  messages,
  copyToClipboard,
}) => {
  const [showReactions, setShowReactions] = useState(false);
  const reactions = ["👍", "❤️", "😊", "🤔", "👎"];

  return (
    <div className={styles.messageActions}>
      <button
        className={styles.reactionButton}
        onClick={() => setShowReactions(!showReactions)}
      >
        😊
      </button>
      <button
        className={styles.copyButton}
        title="Copy message"
        onClick={() => copyToClipboard(messages[messageId]?.content)}
      >
        📋
      </button>
      {showReactions && (
        <div className={styles.reactionPanel}>
          {reactions.map((reaction) => (
            <button
              key={reaction}
              onClick={() => {
                onReaction(messageId, reaction);
                setShowReactions(false);
              }}
            >
              {reaction}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const WELCOME_MESSAGES = [
  {
    role: "assistant",
    content:
      "# Welcome to NeuroAI! 🌟\n\nI'm your AI companion, here to help you with conversations, questions, and support. I'm designed to:\n\n✨ **Listen** - Share your thoughts and feelings\n🧠 **Analyze** - Help you work through complex problems\n💡 **Suggest** - Provide insights and recommendations\n🎯 **Focus** - Keep conversations productive and meaningful\n\nHow can I assist you today?",
  },
];

// Quick action button configurations
const QUICK_ACTIONS = [
  {
    id: 1,
    label: "💬 Start a conversation",
    message: "Hi! I'd like to start a conversation. What's on your mind today?"
  },
  {
    id: 2,
    label: "🤔 Ask a question",
    message: "I have a question I'd like to ask. Can you help me with that?"
  },
  {
    id: 3,
    label: "📚 Get help with something",
    message: "I need some help with a task or problem. Can you assist me?"
  },
  {
    id: 4,
    label: "🎯 Set a goal",
    message: "I'd like to set some goals and work on personal development."
  }
];

export function Chat({ messages, isTyping, isStreaming, setContent }) {
  const messagesEndRef = useRef(null);
  const [messageReactions, setMessageReactions] = useState({});

  const messagesGroups = useMemo(
    () =>
      messages.reduce((groups, message, index) => {
        if (message.role === "user") groups.push([]);
        const currentGroup = groups[groups.length - 1] || [];
        currentGroup.push({ ...message, id: index });
        return groups;
      }, []),
    [messages]
  );

  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === "user" || isStreaming) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isStreaming]);

  const handleReaction = (messageId, reaction) => {
    setMessageReactions((prev) => ({
      ...prev,
      [messageId]: reaction,
    }));
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  // Handle quick action button clicks
  const handleQuickAction = (message) => {
    if (setContent) {
      setContent(message);
    }
  };

  const renderMessage = (message, index) => {
    const { role, content, id } = message;
    const isUser = role === "user";
    const timestamp = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    return (
      <div
        key={id || index}
        className={`${styles.MessageContainer} ${
          isUser ? styles.userMessage : styles.botMessage
        }`}
      >
        {!isUser && (
          <BotAvatar isTyping={isTyping && index === messages.length - 1} />
        )}

        <div className={styles.messageWrapper}>
          <div
            className={`${styles.Message} ${
              isUser ? styles.userBubble : styles.botBubble
            }`}
          >
            <div className={styles.messageContent}>
              <Markdown
                components={{
                  h1: ({ children }) => (
                    <h1 className={styles.messageHeading}>{children}</h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className={styles.messageHeading}>{children}</h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className={styles.messageHeading}>{children}</h3>
                  ),
                  code: ({ inline, children }) =>
                    inline ? (
                      <code className={styles.inlineCode}>{children}</code>
                    ) : (
                      <pre className={styles.codeBlock}>
                        <code>{children}</code>
                      </pre>
                    ),
                  blockquote: ({ children }) => (
                    <blockquote className={styles.blockquote}>
                      {children}
                    </blockquote>
                  ),
                }}
              >
                {content}
              </Markdown>
            </div>

            {!isUser && typeof id === "number" && (
              <MessageReactions
                onReaction={handleReaction}
                messageId={id}
                messages={messages}
                copyToClipboard={copyToClipboard}
              />
            )}

            {messageReactions[id] && (
              <div className={styles.reactionDisplay}>
                {messageReactions[id]}
              </div>
            )}
          </div>

          <div className={styles.messageTime}>{timestamp}</div>
        </div>

        {isUser && <UserAvatar />}
      </div>
    );
  };

  const showWelcome = messages.length === 0;

  return (
    <div className={styles.Chat}>
      <div className={styles.chatBackground}></div>

      {showWelcome && (
        <div className={styles.welcomeSection}>
          {WELCOME_MESSAGES.map((message, index) =>
            renderMessage(message, index)
          )}

          <div className={styles.quickActions}>
            <div className={styles.quickActionTitle}>Quick Start:</div>
            <div className={styles.actionButtons}>
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action.id}
                  className={styles.actionButton}
                  onClick={() => handleQuickAction(action.message)}
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {messagesGroups.map((messages, groupIndex) => (
        <div key={groupIndex} className={styles.Group}>
          {messages.map(renderMessage)}
        </div>
      ))}

      {isTyping && (
        <div className={`${styles.MessageContainer} ${styles.botMessage}`}>
          <BotAvatar isTyping={true} />
          <div className={styles.messageWrapper}>
            <div className={`${styles.Message} ${styles.botBubble}`}>
              <TypingIndicator />
            </div>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}

Chat.propTypes = {
  messages: PropTypes.arrayOf(
    PropTypes.shape({
      role: PropTypes.string.isRequired,
      content: PropTypes.string.isRequired,
      id: PropTypes.number,
    })
  ).isRequired,
  isTyping: PropTypes.bool,
  isStreaming: PropTypes.bool,
  setContent: PropTypes.func.isRequired, // Added prop type for setContent
};

BotAvatar.propTypes = {
  isTyping: PropTypes.bool,
};

MessageReactions.propTypes = {
  onReaction: PropTypes.func.isRequired,
  messageId: PropTypes.number.isRequired,
  messages: PropTypes.array.isRequired,
  copyToClipboard: PropTypes.func.isRequired,
};