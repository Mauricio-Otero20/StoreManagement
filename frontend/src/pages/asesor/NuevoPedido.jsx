import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box, Typography, TextField, Button, CircularProgress,
  Alert, Autocomplete, Chip, Dialog, DialogContent, DialogActions,
} from '@mui/material';
import {
  User, Package, CheckCircle, MagnifyingGlass, Trash,
  ArrowRight, ArrowLeft, ShoppingCart, Warning, X,
} from 'phosphor-react';
import { useColors } from '../../context/ThemeContext';
import api from '../../lib/localApi';
import { formatFecha } from '../../utils/formatters';

/* ── Step indicator ─────────────────────────────────────────────────────── */
function Stepper({ step }) {
  const colors = useColors();
  const steps = ['Cliente', 'Productos', 'Confirmación'];
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, gap: 0 }}>
      {steps.map((label, i) => {
        const done   = i < step;
        const active = i === step;
        const color  = active ? '#6366f1' : done ? '#22c55e' : colors.textSecondary;
        return (
          <Box key={label} sx={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : 'none' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{
                width: 34, height: 34, borderRadius: '50%',
                background: active ? '#6366f118' : done ? '#22c55e18' : colors.surfaceAlt,
                border: `2px solid ${color}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.3s',
                fontWeight: 700, fontSize: 13, color,
              }}>
                {done ? <CheckCircle size={16} weight="fill" color="#22c55e" /> : i + 1}
              </Box>
              <Typography sx={{ fontSize: 11, fontWeight: active ? 700 : 500, color, whiteSpace: 'nowrap' }}>
                {label}
              </Typography>
            </Box>
            {i < steps.length - 1 && (
              <Box sx={{ flex: 1, height: 2, mx: 1, mb: 2.5, background: done ? '#22c55e' : colors.border, transition: 'background 0.3s' }} />
            )}
          </Box>
        );
      })}
    </Box>
  );
}

/* ── Cliente card ─────────────────────────────────────────────────────────── */
function ClienteCard({ cliente, onClear }) {
  const colors = useColors();
  return (
    <Box sx={{
      p: '14px 16px', borderRadius: '12px',
      background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.25)',
      display: 'flex', alignItems: 'center', gap: 2,
    }}>
      <Box sx={{ width: 40, height: 40, borderRadius: '10px', background: 'rgba(34,197,94,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <User size={20} weight="duotone" color="#22c55e" />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontSize: 14, fontWeight: 700, color: colors.text }}>{cliente.nombre}</Typography>
        <Typography sx={{ fontSize: 12, color: colors.textSecondary }}>
          CC: {cliente.cc || cliente.cedula} · {cliente.telefono || '—'} · {cliente.direccion || '—'}
        </Typography>
      </Box>
      <Chip label={cliente.activo ? 'Activo' : 'Inactivo'} size="small"
        sx={{ background: cliente.activo ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)', color: cliente.activo ? '#22c55e' : '#ef4444', border: `1px solid ${cliente.activo ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`, borderRadius: '8px', fontWeight: 700, fontSize: 10 }} />
      {onClear && (
        <Box onClick={onClear} sx={{ cursor: 'pointer', opacity: 0.6, '&:hover': { opacity: 1 } }}>
          <X size={16} color={colors.textSecondary} />
        </Box>
      )}
    </Box>
  );
}

/* ── Paso 1: Cliente ──────────────────────────────────────────────────────── */
function PasoCliente({ cliente, onClienteFound, onNext }) {
  const colors = useColors();
  const [cedula, setCedula]   = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const buscar = async () => {
    if (!cedula.trim()) return;
    setLoading(true); setError('');
    try {
      const res = await api.clientes.consultar(cedula.trim());
      onClienteFound(res);
    } catch {
      setError(`No se encontró cliente con cédula ${cedula}`);
      onClienteFound(null);
    } finally { setLoading(false); }
  };

  return (
    <Box>
      <Typography sx={{ fontSize: 16, fontWeight: 700, color: colors.text, mb: 2 }}>Identificar cliente</Typography>
      <Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
        <TextField
          fullWidth size="small"
          placeholder="Cédula del cliente"
          value={cedula}
          onChange={e => setCedula(e.target.value.replace(/\D/g, ''))}
          onKeyDown={e => e.key === 'Enter' && buscar()}
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', backgroundColor: colors.surfaceAlt, '& fieldset': { borderColor: colors.border }, '&.Mui-focused fieldset': { borderColor: '#6366f1' } }, '& input': { color: colors.text }, '& .MuiInputLabel-root': { color: colors.textSecondary } }}
        />
        <Button
          onClick={buscar} disabled={loading || !cedula.trim()} variant="contained"
          startIcon={loading ? <CircularProgress size={14} color="inherit" /> : <MagnifyingGlass size={16} weight="bold" />}
          sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 600, px: 3, whiteSpace: 'nowrap', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', '&:hover': { background: 'linear-gradient(135deg,#818cf8,#a78bfa)' } }}>
          Buscar
        </Button>
      </Box>
      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: '10px', fontSize: 13 }}>{error}</Alert>}
      {cliente && <ClienteCard cliente={cliente} onClear={() => onClienteFound(null)} />}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
        <Button
          onClick={onNext} disabled={!cliente} variant="contained"
          endIcon={<ArrowRight size={16} weight="bold" />}
          sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 700, px: 3, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', '&:disabled': { background: 'rgba(99,102,241,0.3)' } }}>
          Siguiente
        </Button>
      </Box>
    </Box>
  );
}

/* ── Paso 2: Líneas ───────────────────────────────────────────────────────── */
function PasoLineas({ lineas, onLineasChange, onNext, onBack, setStockError }) {
  const colors = useColors();
  const [productos, setProductos] = useState([]);
  const [selProd, setSelProd]     = useState(null);
  const [cantidad, setCantidad]   = useState(1);
  const [errLinea, setErrLinea]   = useState('');
  const [checking, setChecking]   = useState(false);

  useEffect(() => {
    api.productos.listar({}).then(r => setProductos(r.content || [])).catch(() => {});
  }, []);

  const agregar = () => {
    if (!selProd) return;
    if (cantidad < 1) { setErrLinea('La cantidad debe ser mayor a 0'); return; }
    if (lineas.find(l => l.skuId === selProd.skuId)) { setErrLinea('Producto ya agregado'); return; }
    onLineasChange([...lineas, { skuId: selProd.skuId, marca: selProd.marca, presentacion: selProd.presentacion, stockDisponible: selProd.stockDisponible, cantidadSolicitada: Number(cantidad) }]);
    setSelProd(null); setCantidad(1); setErrLinea('');
  };

  const eliminar = (skuId) => onLineasChange(lineas.filter(l => l.skuId !== skuId));
  const totalUnd = lineas.reduce((s, l) => s + l.cantidadSolicitada, 0);

  const handleSiguiente = async () => {
    setChecking(true);
    try {
      const payload = {
        pedidoId: 'NUEVO',
        lineas: lineas.map(l => ({ skuId: l.skuId, cantidad: l.cantidadSolicitada }))
      };
      const res = await api.inventario.consultarDisponibilidad(payload);
      if (!res.disponible) {
        // Filtrar los que no cumplen
        const malos = res.detalles.filter(d => !d.cumple).map(d => ({
          skuId: d.skuId, disponible: d.cantidadDisponible, solicitado: d.cantidadSolicitada
        }));
        setStockError(malos);
      } else {
        onNext();
      }
    } catch (e) {
      // Manejo de error opcional en producción
      // console.error(e);
      // Si falla, pasamos igual y que el backend decida al crear
      onNext();
    } finally {
      setChecking(false);
    }
  };

  return (
    <Box>
      <Typography sx={{ fontSize: 16, fontWeight: 700, color: colors.text, mb: 2 }}>Líneas del pedido</Typography>
      <Box sx={{ display: 'flex', gap: 1.5, mb: errLinea ? 1 : 2, flexWrap: 'wrap' }}>
        <Autocomplete
          sx={{ flex: 1, minWidth: 220 }}
          options={productos}
          value={selProd}
          onChange={(_, v) => { setSelProd(v); setErrLinea(''); }}
          getOptionLabel={o => `${o.marca} ${o.presentacion} (${o.skuId})`}
          renderInput={p => (
            <TextField {...p} size="small" placeholder="Buscar producto…"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', backgroundColor: colors.surfaceAlt, '& fieldset': { borderColor: colors.border }, '&.Mui-focused fieldset': { borderColor: '#6366f1' } }, '& input': { color: colors.text } }} />
          )}
        />
        <TextField
          size="small" type="number" label="Cantidad" value={cantidad}
          onChange={e => setCantidad(Math.max(1, Number(e.target.value)))}
          inputProps={{ min: 1 }}
          sx={{ width: 100, '& .MuiOutlinedInput-root': { borderRadius: '12px', backgroundColor: colors.surfaceAlt, '& fieldset': { borderColor: colors.border }, '&.Mui-focused fieldset': { borderColor: '#6366f1' } }, '& input': { color: colors.text }, '& label': { color: colors.textSecondary }, '& label.Mui-focused': { color: '#6366f1' } }}
        />
        <Button
          onClick={agregar} disabled={!selProd} variant="outlined"
          sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 600, borderColor: '#6366f1', color: '#6366f1', '&:hover': { background: 'rgba(99,102,241,0.08)' } }}>
          + Agregar
        </Button>
      </Box>
      {errLinea && <Typography sx={{ fontSize: 12, color: '#ef4444', mb: 1.5 }}>{errLinea}</Typography>}

      {lineas.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 5, borderRadius: '12px', background: colors.surfaceAlt, border: `1px dashed ${colors.border}` }}>
          <ShoppingCart size={32} weight="duotone" color="#64748b" style={{ marginBottom: 10 }} />
          <Typography sx={{ color: colors.textSecondary, fontSize: 13 }}>Agrega productos al pedido</Typography>
        </Box>
      ) : (
        <Box sx={{ borderRadius: '12px', overflowX: 'auto', overflowY: 'hidden', border: `1px solid ${colors.border}` }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 120px 90px 80px 36px', gap: 1, px: 2, py: 1.25, background: colors.surfaceAlt }}>
            {['Producto', 'SKU', 'Cant.', 'Stock', ''].map(h => (
              <Typography key={h} sx={{ fontSize: 10.5, fontWeight: 700, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</Typography>
            ))}
          </Box>
          {lineas.map((l, i) => (
            <Box key={l.skuId} sx={{
              display: 'grid', gridTemplateColumns: '1fr 120px 90px 80px 36px',
              gap: 1, px: 2, py: 1.5,
              borderTop: `1px solid ${colors.border}`,
              animation: `rowIn 0.25s ease-out ${i * 0.03}s both`,
              '@keyframes rowIn': { from: { opacity: 0, transform: 'translateX(-6px)' }, to: { opacity: 1, transform: 'translateX(0)' } },
              '&:hover': { background: `${colors.border}40` }, transition: 'background 0.15s',
            }}>
              <Box>
                <Typography sx={{ fontSize: 13, fontWeight: 600, color: colors.text }}>{l.marca}</Typography>
                <Typography sx={{ fontSize: 11, color: colors.textSecondary }}>{l.presentacion}</Typography>
              </Box>
              <Typography sx={{ fontSize: 11.5, color: '#8b5cf6', fontFamily: 'monospace', alignSelf: 'center' }}>{l.skuId}</Typography>
              <Typography sx={{ fontSize: 13, fontWeight: 700, color: colors.text, alignSelf: 'center' }}>{l.cantidadSolicitada}</Typography>
              <Box sx={{ alignSelf: 'center' }}>
                {(l.stockDisponible ?? 0) >= l.cantidadSolicitada
                  ? <Typography sx={{ fontSize: 12, color: '#22c55e', fontWeight: 600 }}>✓ {l.stockDisponible}</Typography>
                  : <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Warning size={12} weight="fill" color="#f59e0b" />
                      <Typography sx={{ fontSize: 11, color: '#f59e0b', fontWeight: 600 }}>{l.stockDisponible ?? 0}</Typography>
                    </Box>
                }
              </Box>
              <Box onClick={() => eliminar(l.skuId)} sx={{ alignSelf: 'center', width: 28, height: 28, borderRadius: '8px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', '&:hover': { background: 'rgba(239,68,68,0.15)' } }}>
                <Trash size={13} weight="bold" color="#ef4444" />
              </Box>
            </Box>
          ))}
          <Box sx={{ px: 2, py: 1.5, borderTop: `1px solid ${colors.border}`, background: colors.surfaceAlt, display: 'flex', justifyContent: 'flex-end' }}>
            <Typography sx={{ fontSize: 13, fontWeight: 700, color: colors.text }}>Total: {totalUnd} unidades</Typography>
          </Box>
        </Box>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button onClick={onBack} startIcon={<ArrowLeft size={16} weight="bold" />}
          sx={{ borderRadius: '12px', textTransform: 'none', color: colors.textSecondary, '&:hover': { background: colors.surfaceAlt } }}>
          Atrás
        </Button>
        <Button onClick={handleSiguiente} disabled={lineas.length === 0 || checking} variant="contained"
          endIcon={checking ? <CircularProgress size={14} color="inherit" /> : <ArrowRight size={16} weight="bold" />}
          sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 700, px: 3, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', '&:disabled': { background: 'rgba(99,102,241,0.3)' } }}>
          {checking ? 'Verificando stock…' : 'Revisar pedido'}
        </Button>
      </Box>
    </Box>
  );
}

/* ── Paso 3: Confirmación ─────────────────────────────────────────────────── */
function PasoConfirmacion({ cliente, lineas, onBack, onConfirmar, loading }) {
  const colors = useColors();
  const totalUnd = lineas.reduce((s, l) => s + l.cantidadSolicitada, 0);
  const nombre = localStorage.getItem('sm_user') || '—';

  return (
    <Box>
      <Typography sx={{ fontSize: 16, fontWeight: 700, color: colors.text, mb: 2 }}>Revisión del pedido</Typography>

      {/* Resumen */}
      <Box sx={{ p: '16px 18px', borderRadius: '12px', background: colors.surfaceAlt, border: `1px solid ${colors.border}`, mb: 2 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, mb: 2 }}>
          {[
            { l: 'Cliente', v: cliente.nombre },
            { l: 'Cédula', v: cliente.cc || cliente.cedula },
            { l: 'Asesor', v: nombre },
            { l: 'Dirección', v: cliente.direccion || '—' },
          ].map(({ l, v }) => (
            <Box key={l}>
              <Typography sx={{ fontSize: 10, fontWeight: 700, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{l}</Typography>
              <Typography sx={{ fontSize: 13, color: colors.text, fontWeight: 500 }}>{v}</Typography>
            </Box>
          ))}
        </Box>
        <Box sx={{ borderTop: `1px solid ${colors.border}`, pt: 1.5, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
          {lineas.map(l => (
            <Box key={l.skuId} sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography sx={{ fontSize: 13, color: colors.text }}>{l.marca} <span style={{ color: colors.textSecondary }}>{l.presentacion}</span></Typography>
              <Typography sx={{ fontSize: 13, fontWeight: 700, color: colors.text }}>{l.cantidadSolicitada} und</Typography>
            </Box>
          ))}
          <Box sx={{ borderTop: `1px solid ${colors.border}`, pt: 1, mt: 0.5, display: 'flex', justifyContent: 'space-between' }}>
            <Typography sx={{ fontSize: 13, fontWeight: 700, color: colors.text }}>Total</Typography>
            <Typography sx={{ fontSize: 14, fontWeight: 800, color: '#6366f1' }}>{totalUnd} unidades</Typography>
          </Box>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
        <Button onClick={onBack} disabled={loading} startIcon={<ArrowLeft size={16} weight="bold" />}
          sx={{ borderRadius: '12px', textTransform: 'none', color: colors.textSecondary }}>
          Volver a editar
        </Button>
        <Button onClick={onConfirmar} disabled={loading} variant="contained"
          startIcon={loading ? <CircularProgress size={14} color="inherit" /> : <CheckCircle size={17} weight="bold" />}
          sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 700, px: 3, background: 'linear-gradient(135deg,#22c55e,#16a34a)', boxShadow: '0 4px 14px rgba(34,197,94,0.4)', '&:hover': { background: 'linear-gradient(135deg,#4ade80,#22c55e)' } }}>
          {loading ? 'Creando pedido…' : 'Confirmar Pedido'}
        </Button>
      </Box>
    </Box>
  );
}

/* ── Modal error stock ────────────────────────────────────────────────────── */
function StockErrorModal({ open, detalle, onClose }) {
  const colors = useColors();
  return (
    <Dialog open={open} onClose={onClose} PaperProps={{ sx: { borderRadius: '20px', maxWidth: 420, background: colors.surface, border: `1px solid ${colors.border}` } }}>
      <DialogContent sx={{ pt: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
          <Warning size={22} weight="fill" color="#f59e0b" />
          <Typography sx={{ fontSize: 16, fontWeight: 700, color: colors.text }}>Stock insuficiente</Typography>
        </Box>
        <Typography sx={{ fontSize: 13, color: colors.textSecondary, mb: 2 }}>
          Los siguientes productos no tienen suficiente stock para completar el pedido:
        </Typography>
        {detalle?.map((d, i) => (
          <Box key={i} sx={{ p: '8px 12px', borderRadius: '8px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', mb: 1 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 600, color: colors.text }}>{d.skuId || d}</Typography>
            {d.disponible != null && <Typography sx={{ fontSize: 11, color: colors.textSecondary }}>Disponible: {d.disponible} · Solicitado: {d.solicitado}</Typography>}
          </Box>
        ))}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} variant="contained" sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, background: '#f59e0b', '&:hover': { background: '#d97706' } }}>
          Entendido, volver a editar
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/* ── MAIN ─────────────────────────────────────────────────────────────────── */
export default function NuevoPedido() {
  const navigate      = useNavigate();
  const [params]      = useSearchParams();
  const colors        = useColors();
  const [step, setStep]             = useState(0);
  const [cliente, setCliente]       = useState(null);
  const [lineas, setLineas]         = useState([]);
  const [loading, setLoading]       = useState(false);
  const [stockError, setStockError] = useState(null);

  // Pre-cargar cliente desde query param
  useEffect(() => {
    const cc = params.get('clienteCc');
    if (cc) {
      api.clientes.consultar(cc).then(r => { setCliente(r); setStep(1); }).catch(() => {});
    }
  }, [params]);

  const confirmar = async () => {
    setLoading(true);
    try {
      const asesorId = localStorage.getItem('sm_operario_id') || '';
      const res = await api.pedidos.crear({
        clienteCc: cliente.cc || cliente.cedula,
        asesorId,
        lineas: lineas.map(l => ({ skuId: l.skuId, cantidadSolicitada: l.cantidadSolicitada })),
      });
      navigate(`/asesor/pedidos/${res.pedido_id || res.pedidoId}`, { state: { nuevo: true, numero: res.numero_pedido || res.numeroPedido } });
    } catch (err) {
      if (err.response?.status === 409) {
        const body = err.response?.data;
        setStockError(Array.isArray(body?.skusSinStock) ? body.skusSinStock : [body?.message || 'Stock insuficiente']);
        setStep(1);
      } else {
        alert(err.response?.data?.message || 'Error al crear el pedido');
      }
    } finally { setLoading(false); }
  };

  return (
    <Box sx={{ animation: 'pageIn 0.35s ease-out both', '@keyframes pageIn': { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'translateY(0)' } } }}>
      <Box sx={{ mb: 3 }}>
        <Typography sx={{ fontSize: 24, fontWeight: 800, color: colors.text, letterSpacing: '-0.03em' }}>Nuevo Pedido</Typography>
        <Typography sx={{ fontSize: 13, color: colors.textSecondary, mt: 0.5 }}>Crea un pedido de ventas para tu cliente</Typography>
      </Box>

      <Box sx={{ maxWidth: 680, p: '28px 30px', borderRadius: '20px', background: colors.surface, border: `1px solid ${colors.border}`, boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
        <Stepper step={step} />
        {step === 0 && <PasoCliente cliente={cliente} onClienteFound={setCliente} onNext={() => setStep(1)} />}
        {step === 1 && <PasoLineas lineas={lineas} onLineasChange={setLineas} onNext={() => setStep(2)} onBack={() => setStep(0)} setStockError={setStockError} />}
        {step === 2 && <PasoConfirmacion cliente={cliente} lineas={lineas} onBack={() => setStep(1)} onConfirmar={confirmar} loading={loading} />}
      </Box>

      <StockErrorModal open={!!stockError} detalle={stockError} onClose={() => setStockError(null)} />
    </Box>
  );
}
