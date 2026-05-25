import { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('sm_token');
    const nombre = localStorage.getItem('sm_user');
    const rol = localStorage.getItem('sm_rol');
    const cedula = localStorage.getItem('sm_cedula');
    const operarioId = localStorage.getItem('sm_operario_id');

    if (token && nombre) {
      setUser({ nombre, rol, cedula, operarioId, token });
      axios.defaults.headers.common.Authorization = `Bearer ${token}`;
    }

    setLoading(false);
  }, []);

  const login = (userData) => {
    const { token, nombre, rol, cedula, operarioId } = userData;
    localStorage.setItem('sm_token', token);
    localStorage.setItem('sm_user', nombre);
    localStorage.setItem('sm_rol', rol);
    localStorage.setItem('sm_cedula', cedula);
    if (operarioId) {
      localStorage.setItem('sm_operario_id', operarioId);
    } else {
      localStorage.removeItem('sm_operario_id');
    }

    axios.defaults.headers.common.Authorization = `Bearer ${token}`;
    setUser({ nombre, rol, cedula, operarioId, token });
  };

  const logout = () => {
    localStorage.removeItem('sm_token');
    localStorage.removeItem('sm_user');
    localStorage.removeItem('sm_rol');
    localStorage.removeItem('sm_cedula');
    localStorage.removeItem('sm_operario_id');
    delete axios.defaults.headers.common.Authorization;
    setUser(null);
  };

  const hasRole = (roles) => {
    if (!user) return false;
    if (Array.isArray(roles)) {
      return roles.includes(user.rol);
    }
    return user.rol === roles;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
