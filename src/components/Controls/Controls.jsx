import { useEffect, useRef, useState } from "react";
import TextareaAutosize from "react-textarea-autosize";
import styles from "./Controls.module.css";
import PropTypes from "prop-types";

export function Controls({ isDisabled = false, onSend, content, setContent }) {
  const textareaRef = useRef(null);
  
  const [isRecording, setIsRecording] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [wordCount, setWordCount] = useState(0);

  const quickReplies = [
    "👋 Hello!",
    "✨ Tell me more",
    "🤔 I need help with...",
    "📚 Explain this",
    "💡 Any suggestions?"
  ];

  const emojis = ["😊", "👍", "❤️", "🎉", "🤔", "💡", "🔥", "⭐", "🚀", "🎯"];

  useEffect(() => {
    if (!isDisabled) {
      textareaRef.current?.focus();
    }
  }, [isDisabled]);

  useEffect(() => {
    const words = content.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length === 1 && words[0] === "" ? 0 : words.length);
  }, [content]);

  function handleContentChange(event) {
    setContent(event.target.value);
  }

  function handleContentSend() {
    if (content.trim().length > 0) {
      onSend(content.trim());
      setContent("");
      setWordCount(0);
    }
  }

  function handleQuickReply(reply) {
    onSend(reply);
  }

  function handleEmojiSelect(emoji) {
    setContent(prev => prev + emoji);
    setShowEmojiPicker(false);
    textareaRef.current?.focus();
  }

  function handleEnterPress(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleContentSend();
    }
  }

  function handleVoiceToggle() {
    setIsRecording(!isRecording);
    // Voice recording implementation
  }

  function handleAttachment() {
    // File attachment implementation
    console.log("Attachment clicked");
  }

  return (
    <div className={styles.Controls}>
      {/* Quick Reply Suggestions */}
      <div className={styles.quickReplies}>
        {quickReplies.map((reply, index) => (
          <button
            key={index}
            className={styles.quickReplyButton}
            onClick={() => handleQuickReply(reply)}
            disabled={isDisabled}
          >
            {reply}
          </button>
        ))}
      </div>
 
      {/* Main Input Area */}
      <div className={styles.inputSection}>
        <div className={styles.TextAreaContainer}>
          {/* Attachment Button */}
          <button
            className={styles.attachmentButton}
            onClick={handleAttachment}
            disabled={isDisabled}
            title="Attach file"
          >
            <AttachmentIcon />
          </button>

          {/* Text Input */}
          <TextareaAutosize
            ref={textareaRef}
            className={styles.TextArea}
            disabled={isDisabled}
            placeholder="Type your message here... (Shift + Enter for new line)"
            value={content}
            minRows={1}
            maxRows={6}
            onChange={handleContentChange}
            onKeyDown={handleEnterPress}
          />

          {/* Emoji Picker Button */}
          <div className={styles.emojiContainer}>
            <button
              className={styles.emojiButton}
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              disabled={isDisabled}
              title="Add emoji"
            >
              😊
            </button>
            
            {showEmojiPicker && (
              <div className={styles.emojiPicker}>
                {emojis.map((emoji, index) => (
                  <button
                    key={index}
                    className={styles.emojiOption}
                    onClick={() => handleEmojiSelect(emoji)}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className={styles.actionButtons}>
          {/* Voice Input Button */}
          <button
            className={`${styles.voiceButton} ${isRecording ? styles.recording : ''}`}
            onClick={handleVoiceToggle}
            disabled={isDisabled}
            title={isRecording ? "Stop recording" : "Voice input"}
          >
            <VoiceIcon isRecording={isRecording} />
          </button>

          {/* Send Button */}
          <button
            className={`${styles.sendButton} ${content.trim() ? styles.active : ''}`}
            disabled={isDisabled || !content.trim()}
            onClick={handleContentSend}
            title="Send message"
          >
            <SendIcon />
          </button>
        </div>
      </div>

      {/* Status Bar */}
      <div className={styles.statusBar}>
        <div className={styles.wordCount}>
          {wordCount > 0 && `${wordCount} word${wordCount !== 1 ? 's' : ''}`}
        </div>
        <div className={styles.typing}>
          {content && !isDisabled && (
            <span className={styles.typingIndicator}>
              Press Enter to send, Shift+Enter for new line
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function AttachmentIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path 
        d="M21.44 11.05L12.25 20.24C11.1242 21.3658 9.59722 21.9983 8.005 21.9983C6.41278 21.9983 4.88583 21.3658 3.76 20.24C2.63417 19.1142 2.00166 17.5872 2.00166 15.995C2.00166 14.4028 2.63417 12.8758 3.76 11.75L12.33 3.18C13.0806 2.42944 14.0893 2.00563 15.14 2.00563C16.1907 2.00563 17.1994 2.42944 17.95 3.18C18.7006 3.93056 19.1244 4.93927 19.1244 5.99C19.1244 7.04073 18.7006 8.04944 17.95 8.8L10.12 16.63C9.74944 17.0006 9.24056 17.2073 8.71 17.2073C8.17944 17.2073 7.67056 17.0006 7.3 16.63C6.92944 16.2594 6.72274 15.7506 6.72274 15.22C6.72274 14.6894 6.92944 14.1806 7.3 13.81L15.19 5.92" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </svg>
  );
}

function VoiceIcon({ isRecording }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path 
        d="M12 2C10.3431 2 9 3.34315 9 5V12C9 13.6569 10.3431 15 12 15C13.6569 15 15 13.6569 15 12V5C15 3.34315 13.6569 2 12 2Z" 
        fill={isRecording ? "#ef4444" : "currentColor"}
      />
      <path 
        d="M19 10V12C19 16.4183 15.4183 20 11 20H10V22H14C18.4183 22 22 18.4183 22 14V10H19Z" 
        fill={isRecording ? "#ef4444" : "currentColor"}
      />
      <path 
        d="M5 10V12C5 15.866 8.13401 19 12 19C15.866 19 19 15.866 19 12V10" 
        stroke={isRecording ? "#ef4444" : "currentColor"} 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path 
        d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </svg>
  );
}
Controls.propTypes = {
  isDisabled: PropTypes.bool,
  onSend: PropTypes.func.isRequired,
};

VoiceIcon.propTypes = {
  isRecording: PropTypes.bool.isRequired,
};
