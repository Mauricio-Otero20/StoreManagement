import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Box, Typography, Button, TextField, CircularProgress, 
  Alert, Chip, Paper, Divider, IconButton, Avatar,
  Autocomplete
} from '@mui/material';
import { 
  CheckCircle, Trash, Plus, ArrowLeft, Warning, Fire,
  Package, CalendarBlank, Tag, CurrencyCircleDollar,
  Note, ShoppingCartSimple, WarningCircle, ClipboardText, X
} from 'phosphor-react';
import { useColors } from '../../context/ThemeContext';
import api from '../../lib/localApi';
import ReportarExcepcionModal from '../../components/ReportarExcepcionModal';

const HOY = new Date().toISOString().split('T')[0];
const UMBRAL_CRITICO_DIAS = 30;

const LINEA_DEFAULT = {
  skuId: '', marca: '', codigoLote: '',
  fechaVencimiento: '', fechaFabricacion: '',
  cantidadRecibida: '', costoUnitarioProducto: '',
};

/* ── Toast ─────────────────────────────────────────────────────────────────── */
function Toast({ msg, color, onClose }) {
  const colors = useColors();
  return (
    <Box sx={{ position: 'fixed', top: 20, right: 24, zIndex: 9999, p: '12px 18px', borderRadius: '12px', background: `${color}15`, border: `1px solid ${color}40`, display: 'flex', alignItems: 'center', gap: 1.5, boxShadow: '0 8px 24px rgba(0,0,0,0.25)', animation: 'tIn 0.3s cubic-bezier(0.34,1.56,0.64,1) both', '@keyframes tIn': { from: { opacity: 0, transform: 'translateX(20px)' }, to: { opacity: 1, transform: 'translateX(0)' } } }}>
      <CheckCircle size={16} weight="fill" color={color} />
      <Typography sx={{ fontSize: 13, fontWeight: 600, color }}>{msg}</Typography>
      <Box onClick={onClose} sx={{ ml: 1, cursor: 'pointer', opacity: 0.6, '&:hover': { opacity: 1 } }}><X size={14} color={color} /></Box>
    </Box>
  );
}

function diasHasta(fecha) {
  if (!fecha) return null;
  return Math.ceil((new Date(fecha) - new Date()) / (1000 * 60 * 60 * 24));
}

/* ── Linea Form ─────────────────────────────────────────────────────────────── */
function LineaForm({ linea, idx, onChange, onRemove, productos, disabled, cantManifiesto, submitted }) {
  const colors = useColors();
  const dias = diasHasta(linea.fechaVencimiento);
  const critico = dias != null && dias >= 0 && dias <= UMBRAL_CRITICO_DIAS;
  const vencido = dias != null && dias < 0;
  const cantNum = Number(linea.cantidadRecibida) || 0;
  const discrepancia = cantManifiesto != null && cantNum !== cantManifiesto && cantNum > 0;

  const inputSx = (hasError) => ({
    '& .MuiOutlinedInput-root': {
      borderRadius: '10px', backgroundColor: colors.surface, height: 42,
      '& fieldset': { borderColor: hasError ? '#ef4444' : colors.border },
      '&:hover fieldset': { borderColor: hasError ? '#ef4444' : '#6366f1' },
      '&.Mui-focused fieldset': { borderColor: hasError ? '#ef4444' : '#6366f1', borderWidth: '1.5px' },
    },
    '& input': { color: colors.text, fontSize: 13, py: 1 },
    '& label': { color: colors.textSecondary, fontSize: 13 },
    '& label.Mui-focused': { color: hasError ? '#ef4444' : '#6366f1', fontWeight: 700 },
  });

  return (
    <Paper elevation={0} sx={{ 
      p: 2, borderRadius: '16px', 
      background: colors.surfaceAlt, 
      border: `1px solid ${discrepancia ? '#f59e0b50' : vencido ? '#ef444450' : colors.border}`,
      position: 'relative',
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ width: 26, height: 26, background: '#6366f1', color: '#fff', fontSize: 12, fontWeight: 900 }}>
            {idx + 1}
          </Avatar>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Typography sx={{ fontSize: 11, fontWeight: 900, color: colors.text, textTransform: 'uppercase' }}>Ingreso SKU</Typography>
            {critico && !vencido && <Chip label="CRÍTICO" size="small" sx={{ height: 18, fontSize: 8, fontWeight: 800, background: '#fffbeb', color: '#92400e' }} />}
            {vencido && <Chip label="VENCIDO" size="small" sx={{ height: 18, fontSize: 8, fontWeight: 800, background: '#fef2f2', color: '#b91c1c' }} />}
          </Box>
        </Box>
        {idx > 0 && !cantManifiesto && (
          <IconButton size="small" onClick={onRemove} sx={{ color: '#ef4444' }}><Trash size={16} /></IconButton>
        )}
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 1.5 }}>
        <Box sx={{ gridColumn: '1 / span 12' }}>
          <Autocomplete
            size="small"
            options={productos}
            getOptionLabel={(option) => `${option.marca} (${option.skuId})`}
            value={productos.find(p => p.skuId === linea.skuId) || null}
            onChange={(_, newValue) => onChange({ ...linea, skuId: newValue?.skuId || '', marca: newValue?.marca || '' })}
            disabled={disabled || !!cantManifiesto}
            renderInput={(params) => (
              <TextField {...params} label="Producto *" sx={inputSx(submitted && !linea.skuId)} />
            )}
          />
        </Box>

        <Box sx={{ gridColumn: '1 / span 4' }}>
          <TextField fullWidth size="small" label="Lote *" value={linea.codigoLote}
            onChange={e => onChange({ ...linea, codigoLote: e.target.value })} disabled={disabled} 
            sx={inputSx(submitted && !linea.codigoLote?.trim())} />
        </Box>
        <Box sx={{ gridColumn: '5 / span 4' }}>
          <TextField fullWidth size="small" label="Costo *" type="number" value={linea.costoUnitarioProducto}
            onChange={e => onChange({ ...linea, costoUnitarioProducto: e.target.value })} disabled={disabled} 
            sx={inputSx(submitted && linea.costoUnitarioProducto === '')} />
        </Box>
        <Box sx={{ gridColumn: '9 / span 4' }}>
          <TextField fullWidth size="small" label="Cant *" type="number" value={linea.cantidadRecibida}
            onChange={e => onChange({ ...linea, cantidadRecibida: e.target.value })} disabled={disabled} 
            sx={inputSx(submitted && !linea.cantidadRecibida)}
            helperText={discrepancia ? `Esp: ${cantManifiesto}` : undefined}
            FormHelperTextProps={{ sx: { fontSize: 9, mt: 0, color: '#f59e0b' } }} />
        </Box>

        <Box sx={{ gridColumn: '1 / span 6' }}>
          <TextField fullWidth size="small" label="Fabricación" type="date" value={linea.fechaFabricacion}
            onChange={e => onChange({ ...linea, fechaFabricacion: e.target.value })} disabled={disabled} 
            sx={inputSx(submitted && !linea.fechaFabricacion)} InputLabelProps={{ shrink: true }} />
        </Box>
        <Box sx={{ gridColumn: '7 / span 6' }}>
          <TextField fullWidth size="small" label="Vencimiento" type="date" value={linea.fechaVencimiento}
            onChange={e => onChange({ ...linea, fechaVencimiento: e.target.value })} disabled={disabled} 
            sx={inputSx(submitted && !linea.fechaVencimiento)} InputLabelProps={{ shrink: true }} />
        </Box>
      </Box>

      {critico && !vencido && (
        <Box sx={{ mt: 1.5, p: 1, borderRadius: '8px', background: '#fffbeb', display: 'flex', alignItems: 'center', gap: 1 }}>
          <Warning size={14} color="#d97706" />
          <Typography sx={{ fontSize: 11, color: '#92400e' }}>Lote próximo a vencer — Prioridad FEFO</Typography>
        </Box>
      )}
    </Paper>
  );
}

/* ── MAIN ─────────────────────────────────────────────────────────────────── */
export default function RegistrarRecepcion() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const colors = useColors();

  const [productos, setProductos] = useState([]);
  const [lineas, setLineas] = useState([{ ...LINEA_DEFAULT }]);
  const [notas, setNotas] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const [numManifiesto, setNumManifiesto] = useState('');
  const [excModal, setExcModal] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const manifiestoId = params.get('manifiestoId') || null;

  useEffect(() => {
    const init = async () => {
      if (!manifiestoId) return;
      try {
        const res = await api.manifiestos.detalle(manifiestoId);
        if (res) {
          setNumManifiesto(res.numeroManifiesto || '');
          if (res.lineas) {
            const manifestProds = res.lineas.map(l => ({ skuId: l.skuId, marca: l.marca, presentacion: l.presentacion }));
            setProductos(manifestProds);
            const prefilled = res.lineas.map(l => ({ ...LINEA_DEFAULT, skuId: l.skuId, marca: l.marca, cantidadManifiesto: l.cantidadEsperada, cantidadRecibida: l.cantidadEsperada, costoUnitarioProducto: '' }));
            setLineas(prefilled.length > 0 ? prefilled : [{ ...LINEA_DEFAULT }]);
          }
        }
      } catch (err) { setError(`Error: ${err.message}`); }
    };
    init();
  }, [manifiestoId]);

  // Auto-clear error and success messages
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const addLinea = () => setLineas(l => [...l, { ...LINEA_DEFAULT }]);
  const updLinea = (i, v) => setLineas(l => l.map((x, j) => j === i ? v : x));
  const delLinea = (i) => setLineas(l => l.filter((_, j) => j !== i));

  const handleSubmit = async () => {
    setSubmitted(true);
    setError('');

    const hasEmpty = lineas.some(l => 
      !l.skuId || !l.codigoLote?.trim() || !l.fechaVencimiento || 
      !l.fechaFabricacion || !l.cantidadRecibida || l.costoUnitarioProducto === ''
    );

    if (hasEmpty) {
      setError('Hay campos obligatorios vacíos');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        manifiestoId: manifiestoId || null,
        operarioId: localStorage.getItem('sm_operario_id') || '',
        notas: notas.trim() || undefined,
        lineasRecepcion: lineas.map(l => ({
          skuId: l.skuId, codigoLote: l.codigoLote.trim(),
          fechaVencimiento: l.fechaVencimiento, fechaFabricacion: l.fechaFabricacion,
          cantidadRecibida: Number(l.cantidadRecibida), costoUnitarioProducto: Number(l.costoUnitarioProducto),
        })),
      };
      await api.recepciones.registrar(payload);
      setToast({ msg: 'Recepción registrada correctamente', color: '#22c55e' });
      setTimeout(() => navigate('/recepcion'), 1500);
    } catch (err) { setError(err.response?.data?.message || 'Error'); } finally { setSaving(false); }
  };

  return (
    <Box sx={{ maxWidth: 700, mx: 'auto', pb: 6 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <Box>
          <Button size="small" onClick={() => navigate('/recepcion')} startIcon={<ArrowLeft size={14} />} sx={{ textTransform: 'none', color: colors.textSecondary, mb: 1 }}>Volver</Button>
          <Typography variant="h5" sx={{ fontWeight: 900 }}>Confirmar Ingreso</Typography>
          <Typography sx={{ fontSize: 12, color: colors.textSecondary }}>Manifiesto: <span style={{ color: '#6366f1', fontWeight: 700 }}>{numManifiesto}</span></Typography>
        </Box>
        <Button variant="outlined" size="small" onClick={() => setExcModal(true)} startIcon={<Warning size={14} />} sx={{ borderRadius: '10px', textTransform: 'none', color: '#f43f5e', borderColor: '#f43f5e' }}>Excepción</Button>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
        {lineas.map((l, i) => (
          <LineaForm key={i} linea={l} idx={i} onChange={v => updLinea(i, v)} onRemove={() => delLinea(i)} productos={productos} disabled={saving} cantManifiesto={l.cantidadManifiesto} submitted={submitted} />
        ))}
        <TextField fullWidth multiline rows={2} placeholder="Notas..." value={notas} onChange={e => setNotas(e.target.value)} disabled={saving} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', fontSize: 13 } }} />
      </Box>

      {toast && <Toast msg={toast.msg} color={toast.color} onClose={() => setToast(null)} />}
      {error && <Alert severity="error" sx={{ mb: 3, borderRadius: '12px', fontSize: 12, fontWeight: 700 }}>{error}</Alert>}

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
        <Button 
          onClick={handleSubmit} 
          disabled={saving} 
          variant="contained" 
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <CheckCircle size={18} />} 
          sx={{ 
            borderRadius: '12px', textTransform: 'none', fontWeight: 800, px: 5, height: 44,
            background: 'linear-gradient(135deg,#6366f1,#4f46e5)',
            boxShadow: '0 4px 12px rgba(99,102,241,0.3)'
          }}
        >
          Confirmar Ingreso
        </Button>
      </Box>

      <ReportarExcepcionModal open={excModal} onClose={() => setExcModal(false)} onRegistrado={() => { setExcModal(false); setToast({ msg: 'Excepción reportada', color: '#f59e0b' }); }} productosPredefinidos={productos} />
    </Box>
  );
}
