import { createContext, useContext, useState, useEffect } from 'react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { lightTheme, darkTheme } from '../config/theme';

export const ThemeContext = createContext(null);

const lightColors = {
  bg: '#F8FAFC', surface: '#FFFFFF', surfaceAlt: '#F1F5F9', surfaceGlass: 'rgba(255,255,255,0.7)',
  border: '#E2E8F0', borderHover: '#CBD5E1', text: '#0F172A', textSecondary: '#64748B',
  accent: '#2563EB', accentGlow: 'rgba(37,99,235,0.15)', success: '#10B981', successGlow: 'rgba(16,185,129,0.1)',
  warning: '#F59E0B', warningGlow: 'rgba(245,158,11,0.1)', error: '#EF4444', errorGlow: 'rgba(239,68,68,0.1)',
  purple: '#7C3AED', purpleGlow: 'rgba(124,58,237,0.1)',
};
const darkColors = {
  bg: '#090B11', surface: 'rgba(22,27,34,0.85)', surfaceAlt: 'rgba(28,34,46,0.6)', surfaceGlass: 'rgba(22,27,34,0.4)',
  border: 'rgba(255,255,255,0.06)', borderHover: 'rgba(255,255,255,0.12)', text: '#F1F5F9', textSecondary: '#94A3B8',
  accent: '#3B82F6', accentGlow: 'rgba(59,130,246,0.25)', success: '#10B981', successGlow: 'rgba(16,185,129,0.2)',
  warning: '#F59E0B', warningGlow: 'rgba(245,158,11,0.2)', error: '#EF4444', errorGlow: 'rgba(239,68,68,0.2)',
  purple: '#8B5CF6', purpleGlow: 'rgba(139,92,246,0.2)',
};

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(() => {
    const saved = localStorage.getItem('sm_theme');
    if (saved) return saved;
    return window.matchMedia('prefers-color-scheme: dark').matches ? 'dark' : 'light';
  });

  useEffect(() => { localStorage.setItem('sm_theme', mode); }, [mode]);
  const toggleMode = () => setMode(prev => prev === 'light' ? 'dark' : 'light');
  const theme = mode === 'dark' ? darkTheme : lightTheme;
  const colors = mode === 'dark' ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ mode, toggleMode, colors }}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
}

export function useThemeMode() { return useContext(ThemeContext); }
export function useColors() {
  const ctx = useContext(ThemeContext);
  if (!ctx) return darkColors;
  return ctx.colors;
}