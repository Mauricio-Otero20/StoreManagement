import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import GlobalStyles from './components/GlobalStyles';
import SplashScreen from './pages/SplashScreen';
import Login from './pages/Login';
import AppLayout from './layouts/AppLayout';

import PickingPage from './pages/picking/PickingPage';
import DespachoPage from './pages/despacho/DespachoPage';
import RecepcionPage from './pages/recepcion/RecepcionPage';
import RegistrarRecepcion from './pages/recepcion/RegistrarRecepcion';
import ExcepcionesPage from './pages/supervisor/Excepciones';

import SupervisorDashboard from './pages/supervisor/Dashboard';
import SupervisorAsignacion from './pages/supervisor/Asignacion';
import SupervisorCatalogo from './pages/supervisor/Catalogo';
import SupervisorInventario from './pages/supervisor/Inventario';
import SupervisorMovimientos from './pages/supervisor/Movimientos';
import SupervisorExcepciones from './pages/supervisor/Excepciones';
import SupervisorRecepciones from './pages/supervisor/Recepciones'; // Manifiestos del supervisor

import AsesorPedidos from './pages/asesor/Pedidos';
import AsesorDetallePedido from './pages/asesor/DetallePedido';
import AsesorCatalogo from './pages/asesor/Catalogo';
import AsesorCarrito from './pages/asesor/CarritoPage';

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <GlobalStyles />
        <AuthProvider>
          <Routes>
          <Route path="/" element={<SplashScreen />} />
          <Route path="/login" element={<Login />} />
          
          <Route element={<AppLayout />}>
            <Route path="/picking" element={<PickingPage />} />
            <Route path="/despacho" element={<DespachoPage />} />

            <Route path="/recepcion" element={<RecepcionPage />} />
            <Route path="/recepcion/registrar" element={<RegistrarRecepcion />} />
            <Route path="/recepcion/excepciones" element={<ExcepcionesPage />} />
            
            <Route path="/supervisor" element={<SupervisorDashboard />} />
            <Route path="/supervisor/asignacion" element={<SupervisorAsignacion />} />
            <Route path="/supervisor/catalogo" element={<SupervisorCatalogo />} />
            <Route path="/supervisor/inventario" element={<SupervisorInventario />} />
            <Route path="/supervisor/movimientos" element={<SupervisorMovimientos />} />
            <Route path="/supervisor/excepciones" element={<SupervisorExcepciones />} />
            <Route path="/supervisor/manifiestos" element={<SupervisorRecepciones />} />
            <Route path="/supervisor/pedidos/:id" element={<AsesorDetallePedido />} />
            
            <Route path="/asesor/catalogo" element={<AsesorCatalogo />} />
            <Route path="/asesor/carrito"  element={<AsesorCarrito />} />
            <Route path="/asesor/pedidos"  element={<AsesorPedidos />} />
            <Route path="/asesor/pedidos/:id" element={<AsesorDetallePedido />} />
          </Route>
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}