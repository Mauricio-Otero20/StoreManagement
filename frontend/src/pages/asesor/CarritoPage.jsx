import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button, TextField, Alert, CircularProgress, InputAdornment } from '@mui/material';
import { ShoppingCart, ArrowLeft, ArrowRight, Minus, Plus, Trash, User, MagnifyingGlass, CheckCircle, Warning, Package } from 'phosphor-react';
import toast from 'react-hot-toast';
import { useColors } from '../../context/ThemeContext';
import api from '../../lib/localApi';

function loadCarrito()  { try { return JSON.parse(localStorage.getItem('sm_carrito') || '[]'); } catch { return []; } }
function saveCarrito(c) { localStorage.setItem('sm_carrito', JSON.stringify(c)); }
function clearCarrito() { localStorage.removeItem('sm_carrito'); }

/* ── STEP 1: Cantidades ──────────────────────────────────────────────────── */
function StepCantidades({ carrito, setCarrito, onNext, onBack }) {
  const colors   = useColors();
  const navigate = useNavigate();

  const setQty = (skuId, qty, stock) => {
    if (qty < 1 || qty > stock) return;
    setCarrito(prev => prev.map(i => i.skuId === skuId ? { ...i, qty } : i));
  };

  const [editQty, setEditQty] = useState({});

  const removeItem = (skuId) => {
    const next = carrito.filter(i => i.skuId !== skuId);
    setCarrito(next);
    if (next.length === 0) navigate('/asesor/catalogo');
  };

  return (
    <Box sx={{ maxWidth: '100%', animation: 'sIn 0.3s ease both', '@keyframes sIn': { from: { opacity: 0, transform: 'translateX(20px)' }, to: { opacity: 1, transform: 'translateX(0)' } } }}>
      <Typography sx={{ fontSize: 17, fontWeight: 700, color: colors.text, mb: 0.5 }}>Paso 2 — Cantidades</Typography>
      <Typography sx={{ fontSize: 13, color: colors.textSecondary, mb: 2.5 }}>Ajusta las cantidades de los productos seleccionados</Typography>

      <Box sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: 2,
        mb: 4
      }}>
        {carrito.map(item => (
          <Box key={item.skuId} sx={{
            p: '16px',
            borderRadius: '16px',
            background: colors.surface,
            border: `1px solid ${colors.border}`,
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5,
            transition: 'all 0.2s',
            position: 'relative',
            '&:hover': { borderColor: '#f59e0b40', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }
          }}>
            {/* Eliminar (esquina superior) */}
            <Box
              onClick={() => removeItem(item.skuId)}
              sx={{
                position: 'absolute', top: 12, right: 12,
                width: 28, height: 28, borderRadius: '8px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: colors.textSecondary,
                '&:hover': { background: 'rgba(239,68,68,0.1)', color: '#ef4444' }
              }}>
              <Trash size={16} weight="bold" />
            </Box>

            {/* Info del Producto */}
            <Box sx={{ pr: 3.5 }}>
              <Typography sx={{ fontSize: 14, fontWeight: 700, color: colors.text, mb: 0.25, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {item.marca}
              </Typography>
              <Typography sx={{ fontSize: 11.5, color: colors.textSecondary }}>
                {item.presentacion} {item.contenidoMl ? `· ${item.contenidoMl} ml` : ''}
              </Typography>
            </Box>

            {/* Precio y Stock */}
            <Box sx={{ mt: 'auto' }}>
              {item.precio && (
                <Typography sx={{ fontSize: 13, color: '#22c55e', fontWeight: 800, mb: 0.5 }}>
                  {Number(item.precio).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}
                </Typography>
              )}
              {item.stockMax && item.qty > item.stockMax && (
                <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', p: '4px 8px', borderRadius: '6px', background: 'rgba(239,68,68,0.08)', mb: 1 }}>
                  <Warning size={12} weight="fill" color="#ef4444" />
                  <Typography sx={{ fontSize: 10.5, color: '#ef4444', fontWeight: 600 }}>Stock insuficiente ({item.stockMax})</Typography>
                </Box>
              )}
            </Box>

            {/* Controles de Cantidad */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, background: colors.surfaceAlt, p: '10px', borderRadius: '10px' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box onClick={() => setQty(item.skuId, item.qty - 1, item.stockDisponible)} sx={{ width: 32, height: 32, borderRadius: '8px', background: colors.surface, border: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', '&:hover': { borderColor: '#ef4444', color: '#ef4444' } }}>
                  <Minus size={14} weight="bold" />
                </Box>
                <TextField
                  size="small"
                  type="number"
                  value={editQty[item.skuId] ?? item.qty}
                  onChange={(e) => setEditQty(prev => ({ ...prev, [item.skuId]: e.target.value }))}
                  onBlur={(e) => {
                    const v = parseInt(e.target.value);
                    if (isNaN(v) || v < 1) {
                      setQty(item.skuId, 1, item.stockDisponible);
                    } else if (v > item.stockDisponible) {
                      setQty(item.skuId, item.stockDisponible, item.stockDisponible);
                    } else {
                      setQty(item.skuId, v, item.stockDisponible);
                    }
                    setEditQty(prev => ({ ...prev, [item.skuId]: undefined }));
                  }}
                  inputProps={{ min: 1, max: item.stockDisponible, style: { textAlign: 'center', fontWeight: 800, fontSize: 16 } }}
                  sx={{ width: 60, '& .MuiInputBase-input': { p: '4px' } }}
                />
                <Box onClick={() => setQty(item.skuId, item.qty + 1, item.stockDisponible)} sx={{ width: 32, height: 32, borderRadius: '8px', background: colors.surface, border: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', '&:hover': { borderColor: '#6366f1', color: '#6366f1' } }}>
                  <Plus size={14} weight="bold" />
                </Box>
              </Box>
              <Typography sx={{ fontSize: 11, textAlign: 'center', fontWeight: 700, color: item.qty >= item.stockDisponible ? '#ef4444' : colors.textSecondary }}>
                Máx: {item.stockDisponible}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>

      {/* Resumen */}
      <Box sx={{ p: '16px 20px', borderRadius: '16px', background: 'linear-gradient(135deg, rgba(245,158,11,0.08) 0%, rgba(245,158,11,0.04) 100%)', border: '1.5px solid rgba(245,158,11,0.2)', mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography sx={{ fontSize: 13, color: colors.textSecondary }}>Total unidades:</Typography>
          <Typography sx={{ fontSize: 14, fontWeight: 700, color: colors.text }}>{carrito.reduce((s, i) => s + i.qty, 0)} und.</Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 1.5, borderTop: `1px solid rgba(245,158,11,0.15)` }}>
          <Typography sx={{ fontSize: 14, fontWeight: 700, color: colors.text }}>Total Pedido:</Typography>
          <Typography sx={{ fontSize: 18, fontWeight: 800, color: '#f59e0b' }}>
            {Number(carrito.reduce((s, i) => s + (i.qty * (i.precio || 0)), 0)).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', gap: 1.5 }}>
        <Button onClick={onBack} startIcon={<ArrowLeft size={14} weight="bold" />}
          sx={{ borderRadius: '10px', textTransform: 'none', color: colors.textSecondary, '&:hover': { background: colors.surfaceAlt } }}>
          Volver al catálogo
        </Button>
        <Button onClick={onNext} variant="contained" endIcon={<ArrowRight size={15} weight="bold" />}
          disabled={carrito.some(i => i.stockMax && i.qty > i.stockMax)}
          sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700, px: 3, background: 'linear-gradient(135deg,#f59e0b,#d97706)', boxShadow: '0 4px 14px rgba(245,158,11,0.4)', '&:hover': { background: 'linear-gradient(135deg,#fbbf24,#f59e0b)' }, '&:disabled': { opacity: 0.4 } }}>
          Buscar cliente
        </Button>
      </Box>
    </Box>
  );
}

/* ── STEP 2: Cliente ──────────────────────────────────────────────────────── */
function StepCliente({ cliente, setCliente, onNext, onBack }) {
  const colors   = useColors();
  const [cedula, setCedula]     = useState(cliente?.cc || '');
  const [buscando, setBuscando] = useState(false);
  const [error, setError]       = useState('');

  // Auto-quitar error después de 5 segundos
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const buscar = async () => {
    if (!cedula.trim()) return;
    setBuscando(true); setError(''); setCliente(null);
    try {
      const data = await api.clientes.consultar(cedula.trim());
      // FR-044: Impedir clientes inactivos
      if (data.estado === 'INACTIVO' || data.estado === 'Inactivo' || data.activo === false) {
        setError('Este cliente está inactivo y no puede asociarse a un pedido.');
      } else {
        setCliente(data);
      }
    } catch (err) {
      if (err.response?.status === 404) setError('No se encontró cliente con ese documento.');
      else if (!err.response) setError('Error de conectividad con el módulo de usuarios.');
      else setError('Cliente no encontrado. Verifica la cédula o el NIT.');
    } finally { setBuscando(false); }
  };

  return (
    <Box sx={{ maxWidth: 480, animation: 'sIn 0.3s ease both', '@keyframes sIn': { from: { opacity: 0, transform: 'translateX(20px)' }, to: { opacity: 1, transform: 'translateX(0)' } } }}>
      <Typography sx={{ fontSize: 17, fontWeight: 700, color: colors.text, mb: 0.5 }}>Paso 3 — Datos del cliente</Typography>
      <Typography sx={{ fontSize: 13, color: colors.textSecondary, mb: 2.5 }}>Ingresa la cédula o NIT del cliente para vincular el pedido</Typography>

      <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
        <TextField
          size="small" fullWidth label="Cédula / NIT del cliente" value={cedula}
          onChange={e => { setCedula(e.target.value.replace(/\D/g, '')); setCliente(null); setError(''); }}
          onKeyDown={e => e.key === 'Enter' && buscar()}
          placeholder="Ej: 10245678"
          InputProps={{ startAdornment: <InputAdornment position="start"><User size={14} color={colors.textSecondary} /></InputAdornment> }}
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', backgroundColor: colors.surfaceAlt, height: 44, '& fieldset': { borderColor: colors.border }, '&.Mui-focused fieldset': { borderColor: '#f59e0b' } }, '& input': { color: colors.text, fontSize: 13 }, '& label': { color: colors.textSecondary }, '& label.Mui-focused': { color: '#f59e0b' } }}
        />
        <Button onClick={buscar} disabled={!cedula.trim() || buscando} variant="contained"
          sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 700, px: 2.5, height: 44, flexShrink: 0, background: 'linear-gradient(135deg,#f59e0b,#d97706)', boxShadow: '0 4px 12px rgba(245,158,11,0.4)', '&:disabled': { opacity: 0.4 } }}>
          {buscando ? <CircularProgress size={16} color="inherit" /> : <MagnifyingGlass size={16} weight="bold" />}
        </Button>
      </Box>

      {error && (
        <Box sx={{ p: '10px 14px', borderRadius: '10px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', gap: 1, alignItems: 'center', mb: 1.5 }}>
          <Warning size={14} weight="fill" color="#ef4444" />
          <Typography sx={{ fontSize: 12.5, color: '#ef4444' }}>{error}</Typography>
        </Box>
      )}

      {cliente && (
        <Box sx={{ p: '14px 16px', borderRadius: '14px', background: 'rgba(34,197,94,0.06)', border: '1.5px solid rgba(34,197,94,0.25)', display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Box sx={{ width: 44, height: 44, borderRadius: '50%', flexShrink: 0, background: 'rgba(34,197,94,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <User size={20} weight="duotone" color="#22c55e" />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontSize: 15, fontWeight: 700, color: colors.text }}>{cliente.nombre}</Typography>
            <Typography sx={{ fontSize: 12, color: colors.textSecondary }}>CC/NIT: {cliente.cc || cedula}</Typography>
            {cliente.telefono && <Typography sx={{ fontSize: 12, color: colors.textSecondary }}>Tel: {cliente.telefono}</Typography>}
            {(cliente.estado === 'ACTIVO' || cliente.activo === true) && (
              <Typography sx={{ fontSize: 10.5, color: '#22c55e', fontWeight: 600 }}>● Activo</Typography>
            )}
          </Box>
          <CheckCircle size={22} weight="fill" color="#22c55e" />
        </Box>
      )}

      <Box sx={{ display: 'flex', gap: 1.5, mt: 2 }}>
        <Button onClick={onBack} startIcon={<ArrowLeft size={14} weight="bold" />}
          sx={{ borderRadius: '10px', textTransform: 'none', color: colors.textSecondary, '&:hover': { background: colors.surfaceAlt } }}>
          Atrás
        </Button>
        <Button onClick={onNext} disabled={!cliente} variant="contained" endIcon={<ArrowRight size={15} weight="bold" />}
          sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700, px: 3, background: 'linear-gradient(135deg,#f59e0b,#d97706)', boxShadow: '0 4px 14px rgba(245,158,11,0.4)', '&:hover': { background: 'linear-gradient(135deg,#fbbf24,#f59e0b)' }, '&:disabled': { opacity: 0.4 } }}>
          Ver resumen
        </Button>
      </Box>
    </Box>
  );
}

/* ── STEP 3: Confirmar ───────────────────────────────────────────────────── */
function StepConfirmar({ carrito, cliente, onBack, onCreado }) {
  const colors   = useColors();
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');

  // Auto-quitar error después de 5 segundos
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleCrear = async () => {
    setSaving(true); setError('');
    try {
      const asesorId = localStorage.getItem('sm_operario_id') || undefined;
      const res = await api.pedidos.crear({
        clienteCc: cliente.cc || cliente.cedula,
        asesorId,
        lineas: carrito.map(i => ({ skuId: i.skuId, cantidadSolicitada: i.qty })),
      });

      const numero = res.numero_pedido || res.numeroPedido || '';
      toast.success(
        <Box>
          <Typography sx={{ fontWeight: 700, fontSize: 15 }}>¡Pedido creado!</Typography>
          <Typography sx={{ fontSize: 13, opacity: 0.85 }}>N.º {numero}</Typography>
        </Box>,
        { duration: 3500, style: { borderRadius: '14px', padding: '14px 20px' } }
      );

      clearCarrito();
      setTimeout(() => onCreado(res), 2000);
    } catch (err) {
      if (err.response?.status === 409) setError('Stock insuficiente para algún producto. Revisa las cantidades.');
      else setError(err.response?.data?.message || 'Error al crear el pedido');
      setSaving(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 540, animation: 'sIn 0.3s ease both', '@keyframes sIn': { from: { opacity: 0, transform: 'translateX(20px)' }, to: { opacity: 1, transform: 'translateX(0)' } } }}>
      <Typography sx={{ fontSize: 17, fontWeight: 700, color: colors.text, mb: 0.5 }}>Paso 4 — Confirmar pedido</Typography>
      <Typography sx={{ fontSize: 13, color: colors.textSecondary, mb: 2.5 }}>Revisa los datos antes de confirmar</Typography>

      {/* Cliente */}
      <Box sx={{ p: '12px 16px', borderRadius: '12px', background: colors.surface, border: `1px solid ${colors.border}`, mb: 2 }}>
        <Typography sx={{ fontSize: 11, fontWeight: 700, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.07em', mb: 1 }}>Cliente</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(245,158,11,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User size={17} weight="duotone" color="#f59e0b" /></Box>
          <Box>
            <Typography sx={{ fontSize: 14, fontWeight: 700, color: colors.text }}>{cliente.nombre}</Typography>
            <Typography sx={{ fontSize: 12, color: colors.textSecondary }}>CC/NIT: {cliente.cc || cliente.cedula}</Typography>
          </Box>
        </Box>
      </Box>

      {/* Líneas */}
      <Box sx={{ borderRadius: '12px', overflowX: 'auto', overflowY: 'hidden', border: `1px solid ${colors.border}`, mb: 2 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 100px 80px 80px', gap: 1, px: 2, py: 1.25, background: colors.surfaceAlt }}>
          {['Producto', 'Presentación', 'Unit.', 'Cant.'].map(h => <Typography key={h} sx={{ fontSize: 10, fontWeight: 700, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</Typography>)}
        </Box>
        {carrito.map(item => (
          <Box key={item.skuId} sx={{ display: 'grid', gridTemplateColumns: '1fr 100px 80px 80px', gap: 1, px: 2, py: 1.5, borderTop: `1px solid ${colors.border}` }}>
            <Box>
              <Typography sx={{ fontSize: 13, fontWeight: 600, color: colors.text }}>{item.marca}</Typography>
              {item.contenidoMl && <Typography sx={{ fontSize: 11, color: colors.textSecondary }}>{item.contenidoMl} ml</Typography>}
            </Box>
            <Typography sx={{ fontSize: 12, color: colors.textSecondary, alignSelf: 'center' }}>{item.presentacion}</Typography>
            <Typography sx={{ fontSize: 12, color: '#22c55e', fontWeight: 600, alignSelf: 'center' }}>
              {item.precio != null ? Number(item.precio).toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: (Number(item.precio) < 100 ? 2 : 0) }) : '—'}
            </Typography>
            <Typography sx={{ fontSize: 15, fontWeight: 800, color: '#f59e0b', alignSelf: 'center' }}>{item.qty}</Typography>
          </Box>
        ))}
        <Box sx={{ px: 2, py: 1.5, borderTop: `1px solid ${colors.border}`, display: 'flex', flexDirection: 'column', gap: 0.75, background: 'rgba(245,158,11,0.04)' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography sx={{ fontSize: 13, color: colors.textSecondary }}>Total unidades</Typography>
            <Typography sx={{ fontSize: 14, fontWeight: 700, color: colors.text }}>{carrito.reduce((s, i) => s + Number(i.qty || 0), 0)}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 0.5 }}>
            <Typography sx={{ fontSize: 14, fontWeight: 700, color: colors.text }}>Total a pagar</Typography>
            <Typography sx={{ fontSize: 18, fontWeight: 900, color: '#f59e0b' }}>
              {Number(carrito.reduce((s, i) => s + (Number(i.qty || 0) * Number(i.precio || 0)), 0)).toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })}
            </Typography>
          </Box>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: '10px' }}>{error}</Alert>}

      <Box sx={{ display: 'flex', gap: 1.5 }}>
        <Button onClick={onBack} disabled={saving} startIcon={<ArrowLeft size={14} weight="bold" />}
          sx={{ borderRadius: '10px', textTransform: 'none', color: colors.textSecondary }}>
          Atrás
        </Button>
        <Button onClick={handleCrear} disabled={saving} variant="contained"
          startIcon={saving ? <CircularProgress size={15} color="inherit" /> : <CheckCircle size={16} weight="bold" />}
          sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700, px: 3, flex: 1, background: 'linear-gradient(135deg,#22c55e,#16a34a)', boxShadow: '0 4px 14px rgba(34,197,94,0.4)', '&:hover': { background: 'linear-gradient(135deg,#4ade80,#22c55e)' }, '&:disabled': { opacity: 0.5 } }}>
          {saving ? 'Creando pedido…' : 'Confirmar y crear pedido'}
        </Button>
      </Box>
    </Box>
  );
}

/* ── MAIN ─────────────────────────────────────────────────────────────────── */
export default function CarritoPage() {
  const navigate  = useNavigate();
  const colors    = useColors();
  const [step, setStep]         = useState(1);   // 1=cantidades, 2=cliente, 3=confirmar
  const [carrito, setCarrito]   = useState(loadCarrito);
  const [cliente, setCliente]   = useState(null);

  // Sync carrito changes to localStorage and notify sidebar
  useEffect(() => { 
    saveCarrito(carrito); 
    window.dispatchEvent(new Event('sm_cart_updated'));
  }, [carrito]);

  // If cart empty, back to catalog
  useEffect(() => { if (carrito.length === 0) navigate('/asesor/catalogo'); }, [carrito, navigate]);

  const handleCreado = (res) => {
    clearCarrito(); // Borra localStorage
    setCarrito([]); // Limpia la pantalla inmediatamente
    navigate('/asesor/pedidos', { state: { nuevo: res.numeroPedido || true } });
  };

  const STEPS = [
    { n: 1, label: 'Cantidades' },
    { n: 2, label: 'Cliente' },
    { n: 3, label: 'Confirmar' },
  ];

  return (
    <Box sx={{ animation: 'pageIn 0.35s ease-out both', '@keyframes pageIn': { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'translateY(0)' } } }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Button onClick={() => navigate('/asesor/catalogo')} startIcon={<ArrowLeft size={14} weight="bold" />}
          sx={{ borderRadius: '8px', textTransform: 'none', color: colors.textSecondary, mb: 1.5, '&:hover': { background: colors.surfaceAlt } }}>
          Volver al catálogo
        </Button>
        <Typography sx={{ fontSize: 24, fontWeight: 800, color: colors.text, letterSpacing: '-0.03em' }}>Realizar Pedido</Typography>
      </Box>

      {/* Step bar */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, maxWidth: 500 }}>
        {STEPS.map(({ n, label }, i) => {
          const done   = step > n;
          const active = step === n;
          return (
            <Box key={n} sx={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 'none' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, cursor: done ? 'pointer' : 'default' }} onClick={() => done && setStep(n)}>
                <Box sx={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: done ? '#22c55e' : active ? '#f59e0b' : colors.surfaceAlt, border: `2px solid ${done ? '#22c55e' : active ? '#f59e0b' : colors.border}`, transition: 'all 0.3s' }}>
                  {done ? <CheckCircle size={14} weight="fill" color="#fff" /> : <Typography sx={{ fontSize: 12, fontWeight: 800, color: active ? '#fff' : colors.textSecondary }}>{n}</Typography>}
                </Box>
                <Typography sx={{ fontSize: 12, fontWeight: active ? 700 : done ? 500 : 400, color: active ? colors.text : done ? '#22c55e' : colors.textSecondary, whiteSpace: 'nowrap' }}>{label}</Typography>
              </Box>
              {i < STEPS.length - 1 && (
                <Box sx={{ flex: 1, height: 2, mx: 1.5, background: done ? '#22c55e40' : colors.border, position: 'relative', overflow: 'hidden', borderRadius: '1px' }}>
                  {done && <Box sx={{ position: 'absolute', inset: 0, background: '#22c55e', animation: 'lineIn 0.4s ease both', '@keyframes lineIn': { from: { width: 0 }, to: { width: '100%' } } }} />}
                </Box>
              )}
            </Box>
          );
        })}
      </Box>

      {/* Steps */}
      {step === 1 && (
        <StepCantidades carrito={carrito} setCarrito={setCarrito} onNext={() => setStep(2)} onBack={() => navigate('/asesor/catalogo')} />
      )}
      {step === 2 && (
        <StepCliente cliente={cliente} setCliente={setCliente} onNext={() => setStep(3)} onBack={() => setStep(1)} />
      )}
      {step === 3 && (
        <StepConfirmar carrito={carrito} cliente={cliente} onBack={() => setStep(2)} onCreado={handleCreado} />
      )}
    </Box>
  );
}
