'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

interface AccessibilitySettings {
  highContrast: boolean;
  reducedMotion: boolean;
  fontSize: 'sm' | 'md' | 'lg' | 'xl';
  focusRingStyle: 'default' | 'high-contrast' | 'thick';
  screenReaderAnnouncements: boolean;
  keyboardNavigation: boolean;
}

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  updateSetting: <K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K]
  ) => void;
  announceToScreenReader: (message: string, priority?: 'polite' | 'assertive') => void;
  isKeyboardUser: boolean;
  setKeyboardUser: (isKeyboard: boolean) => void;
}

const defaultSettings: AccessibilitySettings = {
  highContrast: false,
  reducedMotion: false,
  fontSize: 'md',
  focusRingStyle: 'default',
  screenReaderAnnouncements: true,
  keyboardNavigation: true
};

const AccessibilityContext = createContext<AccessibilityContextType | null>(null);

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return context;
};

interface AccessibilityProviderProps {
  children: React.ReactNode;
}

export const AccessibilityProvider: React.FC<AccessibilityProviderProps> = ({
  children
}) => {
  const [settings, setSettings] = useState<AccessibilitySettings>(defaultSettings);
  const [isKeyboardUser, setIsKeyboardUser] = useState(false);

  // Screen reader announcement function
  const announceToScreenReader = useCallback((
    message: string,
    priority: 'polite' | 'assertive' = 'polite'
  ) => {
    if (!settings.screenReaderAnnouncements) return;

    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.setAttribute('class', 'sr-only');
    announcement.textContent = message;

    document.body.appendChild(announcement);

    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }, [settings.screenReaderAnnouncements]);

  // Update setting function
  const updateSetting = useCallback(<K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));

    // Save to localStorage
    const updatedSettings = { ...settings, [key]: value };
    localStorage.setItem('accessibility-settings', JSON.stringify(updatedSettings));

    // Announce changes
    announceToScreenReader(`设置已更新: ${key}`);
  }, [settings, announceToScreenReader]);

  // Set keyboard user state
  const setKeyboardUser = useCallback((isKeyboard: boolean) => {
    setIsKeyboardUser(isKeyboard);
    document.documentElement.classList.toggle('keyboard-user', isKeyboard);
  }, []);

  // Initialize settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('accessibility-settings');
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (error) {
        console.warn('Failed to parse accessibility settings:', error);
      }
    }

    // Detect system preferences
    const mediaQueries = {
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)'),
      highContrast: window.matchMedia('(prefers-contrast: more)')
    };

    // Apply system preferences if not overridden
    if (mediaQueries.reducedMotion.matches) {
      setSettings(prev => ({ ...prev, reducedMotion: true }));
    }

    if (mediaQueries.highContrast.matches) {
      setSettings(prev => ({ ...prev, highContrast: true }));
    }

    // Listen for system preference changes
    const handleMotionChange = (e: MediaQueryListEvent) => {
      setSettings(prev => ({ ...prev, reducedMotion: e.matches }));
    };

    const handleContrastChange = (e: MediaQueryListEvent) => {
      setSettings(prev => ({ ...prev, highContrast: e.matches }));
    };

    mediaQueries.reducedMotion.addEventListener('change', handleMotionChange);
    mediaQueries.highContrast.addEventListener('change', handleContrastChange);

    return () => {
      mediaQueries.reducedMotion.removeEventListener('change', handleMotionChange);
      mediaQueries.highContrast.removeEventListener('change', handleContrastChange);
    };
  }, []);

  // Apply accessibility settings to document
  useEffect(() => {
    const root = document.documentElement;

    // High contrast
    root.classList.toggle('high-contrast', settings.highContrast);

    // Reduced motion
    root.classList.toggle('reduced-motion', settings.reducedMotion);

    // Font size
    root.setAttribute('data-font-size', settings.fontSize);

    // Focus ring style
    root.setAttribute('data-focus-style', settings.focusRingStyle);

    // CSS custom properties for dynamic styling
    root.style.setProperty('--accessibility-font-scale', {
      sm: '0.875',
      md: '1',
      lg: '1.125',
      xl: '1.25'
    }[settings.fontSize]);

  }, [settings]);

  // Keyboard navigation detection
  useEffect(() => {
    let keyboardTimeout: NodeJS.Timeout;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        setKeyboardUser(true);
        clearTimeout(keyboardTimeout);
        keyboardTimeout = setTimeout(() => setKeyboardUser(false), 3000);
      }
    };

    const handleMouseDown = () => {
      setKeyboardUser(false);
      clearTimeout(keyboardTimeout);
    };

    if (settings.keyboardNavigation) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handleMouseDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
      clearTimeout(keyboardTimeout);
    };
  }, [settings.keyboardNavigation, setKeyboardUser]);

  const contextValue: AccessibilityContextType = {
    settings,
    updateSetting,
    announceToScreenReader,
    isKeyboardUser,
    setKeyboardUser
  };

  return (
    <AccessibilityContext.Provider value={contextValue}>
      {children}
    </AccessibilityContext.Provider>
  );
};

// Accessibility settings panel component
export const AccessibilityPanel: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const { settings, updateSetting } = useAccessibility();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        className="glass-container max-w-md w-full mx-4 p-6"
        role="dialog"
        aria-labelledby="accessibility-title"
        aria-modal="true"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 id="accessibility-title" className="text-xl font-semibold text-white">
            无障碍设置
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
            aria-label="关闭设置"
          >
            ×
          </button>
        </div>

        <div className="space-y-6">
          {/* High Contrast */}
          <div className="flex items-center justify-between">
            <label htmlFor="high-contrast" className="text-glass">
              高对比度模式
            </label>
            <button
              id="high-contrast"
              role="switch"
              aria-checked={settings.highContrast}
              onClick={() => updateSetting('highContrast', !settings.highContrast)}
              className={`w-12 h-6 rounded-full transition-colors ${
                settings.highContrast ? 'bg-primary-600' : 'bg-gray-600'
              }`}
            >
              <div
                className={`w-4 h-4 bg-white rounded-full transition-transform ${
                  settings.highContrast ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Reduced Motion */}
          <div className="flex items-center justify-between">
            <label htmlFor="reduced-motion" className="text-glass">
              减少动画效果
            </label>
            <button
              id="reduced-motion"
              role="switch"
              aria-checked={settings.reducedMotion}
              onClick={() => updateSetting('reducedMotion', !settings.reducedMotion)}
              className={`w-12 h-6 rounded-full transition-colors ${
                settings.reducedMotion ? 'bg-primary-600' : 'bg-gray-600'
              }`}
            >
              <div
                className={`w-4 h-4 bg-white rounded-full transition-transform ${
                  settings.reducedMotion ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Font Size */}
          <div>
            <label className="block text-glass mb-2">字体大小</label>
            <div className="grid grid-cols-4 gap-2">
              {(['sm', 'md', 'lg', 'xl'] as const).map(size => (
                <button
                  key={size}
                  onClick={() => updateSetting('fontSize', size)}
                  className={`px-3 py-2 text-sm rounded ${
                    settings.fontSize === size
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                  }`}
                  aria-pressed={settings.fontSize === size}
                >
                  {size.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Focus Ring Style */}
          <div>
            <label className="block text-glass mb-2">焦点样式</label>
            <select
              value={settings.focusRingStyle}
              onChange={(e) => updateSetting('focusRingStyle', e.target.value as any)}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="default">默认</option>
              <option value="high-contrast">高对比度</option>
              <option value="thick">粗边框</option>
            </select>
          </div>

          {/* Screen Reader Announcements */}
          <div className="flex items-center justify-between">
            <label htmlFor="screen-reader" className="text-glass">
              屏幕阅读器提醒
            </label>
            <button
              id="screen-reader"
              role="switch"
              aria-checked={settings.screenReaderAnnouncements}
              onClick={() => updateSetting('screenReaderAnnouncements', !settings.screenReaderAnnouncements)}
              className={`w-12 h-6 rounded-full transition-colors ${
                settings.screenReaderAnnouncements ? 'bg-primary-600' : 'bg-gray-600'
              }`}
            >
              <div
                className={`w-4 h-4 bg-white rounded-full transition-transform ${
                  settings.screenReaderAnnouncements ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
