import { GlobalStyles as MuiGlobalStyles } from '@mui/material';

const globalStyles = {
  '*, *::before, *::after': { boxSizing: 'border-box' },
  'html, body': { margin: 0, padding: 0, scrollBehavior: 'smooth' },
  body: { 
    backgroundAttachment: 'fixed',
    minHeight: '100vh',
  },
  '@keyframes fadeInUp': {
    from: { opacity: 0, transform: 'translateY(16px)' },
    to: { opacity: 1, transform: 'translateY(0)' },
  },
  '@keyframes fadeIn': {
    from: { opacity: 0 },
    to: { opacity: 1 },
  },
  '@keyframes slideInLeft': {
    from: { opacity: 0, transform: 'translateX(-20px)' },
    to: { opacity: 1, transform: 'translateX(0)' },
  },
  '@keyframes slideInRight': {
    from: { opacity: 0, transform: 'translateX(20px)' },
    to: { opacity: 1, transform: 'translateX(0)' },
  },
  '@keyframes scaleIn': {
    from: { opacity: 0, transform: 'scale(0.92)' },
    to: { opacity: 1, transform: 'scale(1)' },
  },
  '@keyframes shimmer': {
    '0%': { backgroundPosition: '-200% 0' },
    '100%': { backgroundPosition: '200% 0' },
  },
  '@keyframes glow': {
    '0%, 100%': { boxShadow: '0 0 5px rgba(59,130,246,0.2)' },
    '50%': { boxShadow: '0 0 20px rgba(59,130,246,0.4)' },
  },
  '@keyframes float': {
    '0%, 100%': { transform: 'translateY(0)' },
    '50%': { transform: 'translateY(-6px)' },
  },
  '@keyframes spin': {
    from: { transform: 'rotate(0deg)' },
    to: { transform: 'rotate(360deg)' },
  },
  '.animate-fade-in-up': { animation: 'fadeInUp 0.4s ease-out forwards' },
  '.animate-fade-in': { animation: 'fadeIn 0.3s ease-out forwards' },
  '.animate-slide-in-left': { animation: 'slideInLeft 0.35s ease-out forwards' },
  '.animate-slide-in-right': { animation: 'slideInRight 0.35s ease-out forwards' },
  '.animate-scale-in': { animation: 'scaleIn 0.3s ease-out forwards' },
  '.animate-shimmer': {
    background: 'linear-gradient(90deg, transparent 25%, rgba(255,255,255,0.05) 50%, transparent 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 2s infinite',
  },
  '.animate-glow': { animation: 'glow 3s ease-in-out infinite' },
  '.animate-float': { animation: 'float 3s ease-in-out infinite' },
  '::-webkit-scrollbar': { width: '6px', height: '6px' },
  '::-webkit-scrollbar-track': { background: 'transparent' },
  '::-webkit-scrollbar-thumb': { background: 'rgba(100,116,139,0.3)', borderRadius: '10px' },
  '::-webkit-scrollbar-thumb:hover': { background: 'rgba(100,116,139,0.5)' },
  '::selection': { background: 'rgba(59,130,246,0.3)', color: 'inherit' },
};

export default function GlobalStyles() {
  return <MuiGlobalStyles styles={globalStyles} />;
}