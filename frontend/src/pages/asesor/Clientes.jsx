import { useState, useEffect } from 'react';
import { Box, Typography, TextField, Card, CardContent, Button, Alert, Chip } from '@mui/material';
import { User, Search, Phone, Mail, MapPin, Save } from 'lucide-react';
import { useColors } from '../../context/ThemeContext';
import { api } from '../../lib/localApi';

export default function AsesorClientes() {
  const [cedula, setCedula] = useState('');
  const [cliente, setCliente] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState({ type: '', text: '' });
  const [form, setForm] = useState({ nombre: '', telefono: '', email: '', direccion: '' });
  const colors = useColors();

  useEffect(() => {
    if (mensaje.text) {
      const timer = setTimeout(() => setMensaje({ type: '', text: '' }), 4000);
      return () => clearTimeout(timer);
    }
  }, [mensaje]);

  async function buscarCliente() {
    if (!cedula.trim()) return;
    setLoading(true);
    try {
      const res = await api.clientes.consultar(cedula);
      setCliente(res);
      setForm({ nombre: res.nombre || '', telefono: res.telefono || '', email: res.email || '', direccion: res.direccion || '' });
    } catch (err) {
      setCliente(null);
      setMensaje({ type: 'error', text: 'Cliente no encontrado' });
    }
    setLoading(false);
  }

  async function guardarCliente() {
    try {
      await api.clientes.actualizar(cedula, { ...form, activo: true });
      setMensaje({ type: 'success', text: 'Cliente actualizado exitosamente' });
    } catch (err) {
      setMensaje({ type: 'error', text: 'Error al guardar' });
    }
  }

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography sx={{ fontSize: '1.75rem', fontWeight: 700, color: colors.text, mb: 0.5 }}>
          Buscar Cliente
        </Typography>
        <Typography sx={{ fontSize: '0.85rem', color: colors.textSecondary }}>
          Consulta y actualiza la informacion de tus clientes
        </Typography>
      </Box>

      {mensaje.text && (
        <Alert severity={mensaje.type} sx={{ mb: 3, borderRadius: 2.5 }}>
          {mensaje.text}
        </Alert>
      )}

      <Box sx={{ display: 'flex', gap: 1.5, mb: 4, maxWidth: 500 }}>
        <TextField
          placeholder="Cedula / NIT"
          value={cedula}
          onChange={(e) => setCedula(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && buscarCliente()}
          size="small"
          sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
        />
        <Button onClick={buscarCliente} startIcon={<Search size={16} />} variant="contained" sx={{ borderRadius: 2.5, textTransform: 'none', fontWeight: 600 }}>
          Buscar
        </Button>
      </Box>

      {loading && (
        <Typography sx={{ color: colors.textSecondary, fontStyle: 'italic' }}>Buscando cliente...</Typography>
      )}

      {cliente && (
        <Card
          sx={{
            backgroundColor: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: 3,
            transition: 'all 0.2s ease-in-out',
            '&:hover': { boxShadow: `0 8px 24px ${colors.bg}40` },
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Box sx={{ width: 52, height: 52, borderRadius: 3, backgroundColor: colors.accent + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <User size={24} color={colors.accent} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontSize: '1.1rem', fontWeight: 700, color: colors.text }}>
                  {cliente.nombre}
                </Typography>
                <Typography sx={{ color: colors.textSecondary, fontSize: '0.85rem' }}>
                  CC: {cliente.cedula}
                </Typography>
              </Box>
              <Chip
                label={cliente.activo ? 'Activo' : 'Inactivo'}
                size="small"
                sx={{
                  fontWeight: 700,
                  fontSize: '0.7rem',
                  borderRadius: '20px',
                  height: 26,
                  backgroundColor: cliente.activo ? colors.success + '18' : colors.error + '18',
                  color: cliente.activo ? colors.success : colors.error,
                  border: `1px solid ${cliente.activo ? colors.success + '30' : colors.error + '30'}`,
                }}
              />
            </Box>

            <Box sx={{ display: 'grid', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 36, height: 36, borderRadius: 2, backgroundColor: colors.surfaceAlt, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <User size={16} color={colors.textSecondary} />
                </Box>
                <TextField
                  label="Nombre"
                  value={form.nombre}
                  onChange={(e) => setForm({...form, nombre: e.target.value})}
                  size="small"
                  fullWidth
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
                />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 36, height: 36, borderRadius: 2, backgroundColor: colors.surfaceAlt, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Phone size={16} color={colors.textSecondary} />
                </Box>
                <TextField
                  label="Telefono"
                  value={form.telefono}
                  onChange={(e) => setForm({...form, telefono: e.target.value})}
                  size="small"
                  fullWidth
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
                />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 36, height: 36, borderRadius: 2, backgroundColor: colors.surfaceAlt, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Mail size={16} color={colors.textSecondary} />
                </Box>
                <TextField
                  label="Email"
                  value={form.email}
                  onChange={(e) => setForm({...form, email: e.target.value})}
                  size="small"
                  fullWidth
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
                />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 36, height: 36, borderRadius: 2, backgroundColor: colors.surfaceAlt, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <MapPin size={16} color={colors.textSecondary} />
                </Box>
                <TextField
                  label="Direccion"
                  value={form.direccion}
                  onChange={(e) => setForm({...form, direccion: e.target.value})}
                  size="small"
                  fullWidth
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
                />
              </Box>
              <Button
                onClick={guardarCliente}
                startIcon={<Save size={16} />}
                variant="contained"
                sx={{ borderRadius: 2.5, textTransform: 'none', fontWeight: 600, py: 1.25, background: `linear-gradient(135deg, ${colors.accent} 0%, #1D4ED8 100%)`, '&:hover': { background: `linear-gradient(135deg, ${colors.accent} 0%, #1E40AF 100%)` } }}
              >
                Guardar Cambios
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}