import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import styles from './UserProfile.module.css';
import PropTypes from 'prop-types';

export function UserProfile({ isOpen, onClose }) {
  const { currentUser, userProfile, updateUserProfile, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    displayName: userProfile?.displayName || '',
    preferences: {
      theme: userProfile?.preferences?.theme || 'light',
      exportFormat: userProfile?.preferences?.exportFormat || 'text'
    }
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('preferences.')) {
      const prefKey = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        preferences: {
          ...prev.preferences,
          [prefKey]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSave = async () => {
    if (!formData.displayName.trim()) {
      setMessage('Display name cannot be empty');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      await updateUserProfile(formData);
      setMessage('Profile updated successfully!');
      setIsEditing(false);
    } catch (error) {
      setMessage('Failed to update profile. Please try again.');
      console.error('Profile update error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      displayName: userProfile?.displayName || '',
      preferences: {
        theme: userProfile?.preferences?.theme || 'light',
        exportFormat: userProfile?.preferences?.exportFormat || 'text'
      }
    });
    setIsEditing(false);
    setMessage('');
  };

  const handleLogout = async () => {
    try {
      console.log('Logging out from UserProfile');
      onClose(); // Close the modal first
      await logout(); // Then logout
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.profileModal} onClick={e => e.stopPropagation()}>
        <div className={styles.profileHeader}>
          <h2>User Profile</h2>
          <button className={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        </div>

        <div className={styles.profileContent}>
          <div className={styles.profileSection}>
            <div className={styles.avatarSection}>
              {userProfile?.photoURL ? (
                <img 
                  src={userProfile.photoURL} 
                  alt="Profile" 
                  className={styles.avatar}
                />
              ) : (
                <div className={styles.avatarPlaceholder}>
                  {(userProfile?.displayName || userProfile?.email || 'U')[0].toUpperCase()}
                </div>
              )}
              <div className={styles.userInfo}>
                <h3>{userProfile?.displayName || 'User'}</h3>
                <p>{userProfile?.email}</p>
                <span className={styles.joinDate}>
                  Joined {userProfile?.createdAt ? new Date(userProfile.createdAt.toDate()).toLocaleDateString() : 'Recently'}
                </span>
              </div>
            </div>
          </div>

          <div className={styles.profileForm}>
            {isEditing ? (
              <>
                <div className={styles.inputGroup}>
                  <label htmlFor="displayName">Display Name</label>
                  <input
                    type="text"
                    id="displayName"
                    name="displayName"
                    value={formData.displayName}
                    onChange={handleInputChange}
                    disabled={loading}
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label htmlFor="theme">Theme Preference</label>
                  <select
                    id="theme"
                    name="preferences.theme"
                    value={formData.preferences.theme}
                    onChange={handleInputChange}
                    disabled={loading}
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="system">System</option>
                  </select>
                </div>

                <div className={styles.inputGroup}>
                  <label htmlFor="exportFormat">Default Export Format</label>
                  <select
                    id="exportFormat"
                    name="preferences.exportFormat"
                    value={formData.preferences.exportFormat}
                    onChange={handleInputChange}
                    disabled={loading}
                  >
                    <option value="text">Text (.txt)</option>
                    <option value="pdf">PDF (.pdf)</option>
                  </select>
                </div>

                <div className={styles.buttonGroup}>
                  <button 
                    onClick={handleSave} 
                    className={styles.saveButton}
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button 
                    onClick={handleCancel} 
                    className={styles.cancelButton}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className={styles.infoRow}>
                  <span className={styles.label}>Display Name:</span>
                  <span>{userProfile?.displayName || 'Not set'}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.label}>Theme:</span>
                  <span className={styles.capitalize}>{userProfile?.preferences?.theme || 'Light'}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.label}>Export Format:</span>
                  <span className={styles.uppercase}>{userProfile?.preferences?.exportFormat || 'Text'}</span>
                </div>
                
                <button 
                  onClick={() => setIsEditing(true)} 
                  className={styles.editButton}
                >
                  Edit Profile
                </button>
              </>
            )}

            {message && (
              <div className={`${styles.message} ${message.includes('successfully') ? styles.success : styles.error}`}>
                {message}
              </div>
            )}
          </div>

          <div className={styles.profileFooter}>
            <div className={styles.statsSection}>
              <h4>Account Statistics</h4>
              <div className={styles.stats}>
                <div className={styles.stat}>
                  <span className={styles.statValue}>
                    {userProfile?.totalChats || 0}
                  </span>
                  <span className={styles.statLabel}>Total Chats</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statValue}>
                    {userProfile?.lastLoginAt ? new Date(userProfile.lastLoginAt.toDate()).toLocaleDateString() : 'N/A'}
                  </span>
                  <span className={styles.statLabel}>Last Active</span>
                </div>
              </div>
            </div>
            
            <button 
              onClick={handleLogout} 
              className={styles.logoutButton}
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

UserProfile.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};