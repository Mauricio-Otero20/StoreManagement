import { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Dialog, DialogTitle, DialogContent,
  TextField, Select, MenuItem, CircularProgress, Alert, Autocomplete,
} from '@mui/material';
import { Warning, Plus, X } from 'phosphor-react';
import { useColors } from '../context/ThemeContext';
import api from '../lib/localApi';

/**
 * Modal reutilizable para reportar una excepción de inventario.
 *
 * Props:
 *  - open          {boolean}   Controla la visibilidad del modal
 *  - onClose       {function}  Llamada cuando el usuario cancela o cierra
 *  - onRegistrado  {function}  Llamada tras un registro exitoso (recibe el resultado)
 *  - skuIdInicial  {string?}   Pre-rellena el SKU (útil cuando se abre desde una fila concreta)
 *  - loteInicial   {string?}   Pre-rellena el código de lote
 */
const TIPOS = ['AVERIA', 'VENCIMIENTO', 'DIFERENCIA', 'FALTANTE'];
const TIPO_CONFIG = {
  AVERIA:     { label: 'Avería',                   color: '#ef4444' },
  VENCIMIENTO:{ label: 'Vencimiento',              color: '#f59e0b' },
  DIFERENCIA: { label: 'Diferencia de Inventario', color: '#8b5cf6' },
  FALTANTE:   { label: 'Faltante',                 color: '#3b82f6' },
};

const FORM_INIT = {
  tipoExcepcion: '', skuId: '', codigoLote: '',
  cantidadAfectada: '', descripcion: '', evidenciaUrl: '',
};

export default function ReportarExcepcionModal({
  open, onClose, onRegistrado, skuIdInicial = '', loteInicial = '', productosPredefinidos = null, lotesPredefinidos = null
}) {
  const colors  = useColors();
  const [form,     setForm]  = useState(FORM_INIT);
  const [productos, setProds] = useState([]);
  const [saving,   setSaving] = useState(false);
  const [errors,   setErrors] = useState({});

  // Cargar productos y pre-rellenar cuando el modal abre
  useEffect(() => {
    if (!open) return;
    setForm({ ...FORM_INIT, skuId: skuIdInicial, codigoLote: loteInicial });
    setErrors({});
    
    if (productosPredefinidos) {
      setProds(productosPredefinidos);
    } else {
      api.productos.listar({}).then(r => setProds(r.content || [])).catch(() => {});
    }
  }, [open, skuIdInicial, loteInicial, productosPredefinidos]);

  const set = (key, val) => { setForm(f => ({ ...f, [key]: val })); setErrors(e => ({ ...e, [key]: undefined })); };

  const validate = () => {
    const e = {};
    if (!form.tipoExcepcion) e.tipoExcepcion = 'Selecciona un tipo';
    if (!form.skuId) e.skuId = 'El SKU es obligatorio';
    if (!form.codigoLote) {
      e.codigoLote = lotesPredefinidos?.length ? 'Selecciona un lote del pedido' : 'El lote es obligatorio';
    }
    if (!form.cantidadAfectada || Number(form.cantidadAfectada) < 1) e.cantidadAfectada = 'Debe ser ≥ 1';
    if (!form.descripcion.trim() || form.descripcion.trim().length < 10) e.descripcion = 'Mínimo 10 caracteres';
    return e;
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    try {
      const operarioId = localStorage.getItem('sm_operario_id') || '';
      const res = await api.excepciones.crear({
        ...form,
        cantidadAfectada: Number(form.cantidadAfectada),
        operarioId,
      });
      onRegistrado && onRegistrado(res);
    } catch (err) {
      setErrors({ general: err.response?.data?.message || 'Error al registrar la excepción' });
    } finally {
      setSaving(false);
    }
  };

  const inputSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: '10px', backgroundColor: colors.surfaceAlt,
      '& fieldset': { borderColor: colors.border },
      '&.Mui-focused fieldset': { borderColor: '#ef4444' },
    },
    '& input, & textarea': { color: colors.text },
    '& label': { color: colors.textSecondary },
    '& label.Mui-focused': { color: '#ef4444' },
  };

  return (
    <Dialog
      open={open}
      onClose={!saving ? onClose : undefined}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '20px',
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          boxShadow: '0 24px 48px rgba(0,0,0,0.4)',
        },
      }}
    >
      {/* ── Título ── */}
      <DialogTitle sx={{ pb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ width: 36, height: 36, borderRadius: '10px', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Warning size={18} weight="duotone" color="#ef4444" />
          </Box>
          <Box>
            <Typography sx={{ fontSize: 16, fontWeight: 700, color: colors.text }}>Reportar Excepción</Typography>
            <Typography sx={{ fontSize: 11, color: colors.textSecondary }}>Averías · Vencimientos · Diferencias · Faltantes</Typography>
          </Box>
        </Box>
        <Box onClick={!saving ? onClose : undefined} sx={{ cursor: 'pointer', opacity: 0.6, '&:hover': { opacity: 1 } }}>
          <X size={18} color={colors.textSecondary} />
        </Box>
      </DialogTitle>

      {/* ── Cuerpo ── */}
      <DialogContent sx={{ pt: '8px !important', display: 'flex', flexDirection: 'column', gap: 1.75 }}>
        {errors.general && <Alert severity="error" sx={{ borderRadius: '10px' }}>{errors.general}</Alert>}

        {/* Tipo */}
        <Select
          value={form.tipoExcepcion}
          onChange={e => set('tipoExcepcion', e.target.value)}
          displayEmpty size="small"
          error={!!errors.tipoExcepcion}
          sx={{
            borderRadius: '10px', backgroundColor: colors.surfaceAlt,
            color: form.tipoExcepcion ? colors.text : '#64748b', fontSize: 13,
            '& .MuiOutlinedInput-notchedOutline': { borderColor: errors.tipoExcepcion ? '#ef4444' : colors.border },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#ef4444' },
          }}
        >
          <MenuItem value="" disabled><em style={{ color: '#64748b', fontSize: 13 }}>Tipo de excepción *</em></MenuItem>
          {TIPOS.map(t => (
            <MenuItem key={t} value={t} sx={{ fontSize: 13 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', background: TIPO_CONFIG[t].color }} />
                {TIPO_CONFIG[t].label}
              </Box>
            </MenuItem>
          ))}
        </Select>
        {errors.tipoExcepcion && (
          <Typography sx={{ fontSize: 11, color: '#ef4444', mt: -1 }}>{errors.tipoExcepcion}</Typography>
        )}

        {/* SKU — Autocomplete si hay productos cargados, de lo contrario campo libre */}
        {productos.length > 0 ? (
          <Autocomplete
            options={productos}
            getOptionLabel={o => `${o.marca} ${o.presentacion} (${o.skuId})`}
            value={productos.find(p => p.skuId === form.skuId) || null}
            onChange={(_, v) => set('skuId', v?.skuId || '')}
            size="small"
            renderInput={p => (
              <TextField {...p} label="Producto (SKU) *" error={!!errors.skuId} helperText={errors.skuId} sx={inputSx} />
            )}
          />
        ) : (
          <TextField
            size="small" label="SKU *" value={form.skuId}
            onChange={e => set('skuId', e.target.value)}
            error={!!errors.skuId} helperText={errors.skuId}
            sx={inputSx}
          />
        )}

        {/* Lote */}
        {lotesPredefinidos && lotesPredefinidos.length > 0 ? (
          <Autocomplete
            options={lotesPredefinidos}
            value={form.codigoLote || null}
            onChange={(_, v) => set('codigoLote', v || '')}
            size="small"
            renderInput={p => (
              <TextField {...p} label="Código de Lote *" error={!!errors.codigoLote} helperText={errors.codigoLote} sx={inputSx} />
            )}
          />
        ) : (
          <TextField
            size="small" label="Código de Lote *"
            value={form.codigoLote} onChange={e => set('codigoLote', e.target.value)}
            error={!!errors.codigoLote} helperText={errors.codigoLote}
            sx={inputSx}
          />
        )}

        {/* Cantidad */}
        <TextField
          size="small" label="Cantidad Afectada *" type="number"
          value={form.cantidadAfectada} onChange={e => set('cantidadAfectada', e.target.value)}
          error={!!errors.cantidadAfectada} helperText={errors.cantidadAfectada}
          inputProps={{ min: 1 }} sx={inputSx}
        />

        {/* Descripción */}
        <TextField
          multiline rows={3}
          label="Descripción * (mínimo 10 caracteres)"
          value={form.descripcion} onChange={e => set('descripcion', e.target.value)}
          error={!!errors.descripcion} helperText={errors.descripcion}
          sx={inputSx}
        />

        {/* Evidencia URL (opcional) */}
        <TextField
          size="small" label="URL de Evidencia (foto, documento…)"
          value={form.evidenciaUrl} onChange={e => set('evidenciaUrl', e.target.value)}
          placeholder="https://drive.google.com/..." sx={inputSx}
        />
      </DialogContent>

      {/* ── Acciones ── */}
      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', px: 3, pb: 2.5, pt: 1 }}>
        <Button
          onClick={onClose} disabled={saving}
          sx={{ borderRadius: '10px', textTransform: 'none', color: colors.textSecondary }}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit} disabled={saving} variant="contained"
          startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <Plus size={15} weight="bold" />}
          sx={{
            borderRadius: '10px', textTransform: 'none', fontWeight: 700,
            background: 'linear-gradient(135deg,#ef4444,#dc2626)',
            boxShadow: '0 4px 12px rgba(239,68,68,0.35)',
            '&:hover': { background: 'linear-gradient(135deg,#f87171,#ef4444)' },
          }}
        >
          {saving ? 'Registrando…' : 'Registrar Excepción'}
        </Button>
      </Box>
    </Dialog>
  );
}
