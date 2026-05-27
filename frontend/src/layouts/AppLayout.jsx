import { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { Box, keyframes, IconButton, useMediaQuery, useTheme } from '@mui/material';
import { List } from 'phosphor-react';
import Sidebar from '../components/Sidebar';
import { ThemeContext } from '../context/ThemeContext';
import { Toaster } from 'react-hot-toast';

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0);    }
`;

export default function AppLayout() {
  const token = localStorage.getItem('sm_token');
  const user  = localStorage.getItem('sm_user');
  const { mode } = useContext(ThemeContext);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!token || !user) return <Navigate to="/login" replace />;

  const isDark = mode === 'dark';

  return (
    <Box sx={{
      display: 'flex',
      height: '100vh',
      background: isDark
        ? 'linear-gradient(135deg, #09090f 0%, #0f1629 60%, #09090f 100%)'
        : 'linear-gradient(135deg, #f8fafc 0%, #eff6ff 60%, #f8fafc 100%)',
      transition: 'background 0.4s ease',
    }}>
      <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen(s => !s)} />

      {/* Main content */}
      <Box sx={{
        flex: 1,
        overflow: 'auto',
        p: { xs: 2, sm: 3, md: 3.5 },
        animation: `${fadeIn} 0.35s ease-out forwards`,
        '&::-webkit-scrollbar': { width: '6px' },
        '&::-webkit-scrollbar-track': { background: 'transparent' },
        '&::-webkit-scrollbar-thumb': {
          background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)',
          borderRadius: '3px',
        },
      }}>
        {isMobile && (
          <IconButton
            onClick={() => setSidebarOpen(s => !s)}
            sx={{
              mb: 1,
              width: 36, height: 36,
              borderRadius: '10px',
              background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
              '&:hover': { background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' },
            }}
          >
            <List size={18} weight="bold" color={isDark ? '#e2e8f0' : '#475569'} />
          </IconButton>
        )}
        <Outlet />
      </Box>

      {/* Toast notifications */}
      <Toaster
        position="top-right"
        gutter={10}
        toastOptions={{
          duration: 3500,
          style: {
            background: isDark ? '#1e293b' : '#fff',
            color:      isDark ? '#f1f5f9' : '#0f172a',
            border:     isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e2e8f0',
            borderRadius: '12px',
            fontSize: '13px',
            fontWeight: 500,
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          },
          success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } },
          error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />
    </Box>
  );
}