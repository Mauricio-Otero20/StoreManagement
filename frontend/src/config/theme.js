import { createTheme } from '@mui/material/styles';

export const lightTheme = createTheme({
  palette: { mode: 'light', primary: { main: '#2563EB' }, secondary: { main: '#10B981' } },
  typography: { fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif', h1: { fontWeight: 700 }, h2: { fontWeight: 700 }, h3: { fontWeight: 600 }, h4: { fontWeight: 600 }, h5: { fontWeight: 600 }, h6: { fontWeight: 600 } },
  shape: { borderRadius: 12 },
  components: {
    MuiCard: { styleOverrides: { root: { boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #E2E8F0' } } },
    MuiButton: { styleOverrides: { root: { textTransform: 'none', fontWeight: 600, borderRadius: 10 } } },
    MuiTextField: { styleOverrides: { root: { '& .MuiOutlinedInput-root': { borderRadius: 12 } } } },
    MuiSelect: { styleOverrides: { root: { borderRadius: 12 } } },
    MuiChip: { styleOverrides: { root: { borderRadius: 20, fontWeight: 600 } } },
  },
});

export const darkTheme = createTheme({
  palette: {
    mode: 'dark', primary: { main: '#3B82F6' }, secondary: { main: '#10B981' },
    background: { default: '#090B11', paper: 'rgba(22,27,34,0.85)' },
    text: { primary: '#F1F5F9', secondary: '#94A3B8' },
    divider: 'rgba(255,255,255,0.06)',
  },
  typography: { fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif', h1: { fontWeight: 700 }, h2: { fontWeight: 700 }, h3: { fontWeight: 600 }, h4: { fontWeight: 600 }, h5: { fontWeight: 600 }, h6: { fontWeight: 600 } },
  shape: { borderRadius: 12 },
  components: {
    MuiCard: { styleOverrides: { root: { boxShadow: '0 2px 16px rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)' } } },
    MuiButton: { styleOverrides: { root: { textTransform: 'none', fontWeight: 600, borderRadius: 10 } } },
    MuiTextField: { styleOverrides: { root: { '& .MuiOutlinedInput-root': { borderRadius: 12 } } } },
    MuiSelect: { styleOverrides: { root: { borderRadius: 12 } } },
    MuiChip: { styleOverrides: { root: { borderRadius: 20, fontWeight: 600 } } },
    MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
  },
});

export const cardSx = (c, glow) => ({
  background: c.surface, backdropFilter: 'blur(20px)', border: `1px solid ${c.border}`, borderRadius: '16px',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  boxShadow: glow ? `0 0 24px ${glow}` : '0 2px 12px rgba(0,0,0,0.08)',
  '&:hover': { transform: 'translateY(-2px)', border: `1px solid ${c.borderHover}`, boxShadow: glow ? `0 0 32px ${glow}` : '0 8px 24px rgba(0,0,0,0.15)' },
});

export const inputSx = (c) => ({
  '& .MuiOutlinedInput-root': { borderRadius: '12px', backgroundColor: c.surfaceAlt, '& fieldset': { borderColor: c.border }, '&:hover fieldset': { borderColor: c.borderHover }, '&.Mui-focused fieldset': { borderColor: c.accent } },
});

export const badgeSx = (color, glow) => ({
  px: 1.5, py: 0.5, borderRadius: '20px', fontSize: '0.7rem', fontWeight: 700,
  backgroundColor: glow, color: color, border: `1px solid ${color}30`,
});

export const pageTitleSx = { fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.02em', mb: 3 };
export const sectionTitleSx = { fontSize: '1.05rem', fontWeight: 600, mb: 1.5 };
export const statValueSx = { fontSize: '2rem', fontWeight: 700, lineHeight: 1.2 };
export const fadeIn = { '@keyframes fadeIn': { from: { opacity: 0, transform: 'translateY(10px)' }, to: { opacity: 1, transform: 'translateY(0)' } }, animation: 'fadeIn 0.4s ease-out forwards' };
export const glassSx = (c) => ({ background: c.surfaceGlass, backdropFilter: 'blur(16px)', border: `1px solid ${c.border}`, borderRadius: '16px' });