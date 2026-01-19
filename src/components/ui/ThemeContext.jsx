import React, { createContext, useContext, useState, useEffect } from 'react';

const themes = {
  blue: {
    primary: '#007AFF',
    primaryHover: '#0056b3',
    accent: '#5856D6',
    gradient: 'from-blue-500 to-indigo-600'
  },
  purple: {
    primary: '#AF52DE',
    primaryHover: '#8e44ad',
    accent: '#5856D6',
    gradient: 'from-purple-500 to-pink-600'
  },
  green: {
    primary: '#34C759',
    primaryHover: '#2da44e',
    accent: '#30D158',
    gradient: 'from-green-500 to-emerald-600'
  },
  orange: {
    primary: '#FF9500',
    primaryHover: '#e67e00',
    accent: '#FF9F0A',
    gradient: 'from-orange-500 to-amber-600'
  },
  pink: {
    primary: '#FF2D55',
    primaryHover: '#d91a40',
    accent: '#FF375F',
    gradient: 'from-pink-500 to-rose-600'
  },
  teal: {
    primary: '#5AC8FA',
    primaryHover: '#32b4e8',
    accent: '#64D2FF',
    gradient: 'from-cyan-500 to-teal-600'
  }
};

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('app_dark_mode') === 'true';
    }
    return false;
  });

  const [colorTheme, setColorTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('app_color_theme') || 'blue';
    }
    return 'blue';
  });

  useEffect(() => {
    localStorage.setItem('app_dark_mode', darkMode);
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('app_color_theme', colorTheme);
    const theme = themes[colorTheme];
    document.documentElement.style.setProperty('--color-primary', theme.primary);
    document.documentElement.style.setProperty('--color-primary-hover', theme.primaryHover);
    document.documentElement.style.setProperty('--color-accent', theme.accent);
  }, [colorTheme]);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  return (
    <ThemeContext.Provider value={{ 
      darkMode, 
      toggleDarkMode, 
      colorTheme, 
      setColorTheme, 
      themes,
      currentTheme: themes[colorTheme]
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export default ThemeContext;