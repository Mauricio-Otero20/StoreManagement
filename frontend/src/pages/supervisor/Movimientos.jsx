import { useState, useEffect, useCallback } from 'react';
import { Box, Typography, CircularProgress, Button, TextField, Select, MenuItem, InputAdornment, Pagination } from '@mui/material';
import { ArrowCircleDown, ArrowCircleUp, Lock, ArrowsCounterClockwise, MagnifyingGlass, X, Package } from 'phosphor-react';
import { useColors } from '../../context/ThemeContext';
import api from '../../lib/localApi';
import { formatFechaHora } from '../../utils/formatters';

// Valores exactos del enum TipoMovimiento del backend
const MOV_CONFIG = {
  ENTRADA:          { label: 'Entrada',          color: '#22c55e', bg: 'rgba(34,197,94,0.1)',   Icon: ArrowCircleDown },
  COMPROMISO:       { label: 'Compromiso',       color: '#3b82f6', bg: 'rgba(59,130,246,0.1)',  Icon: Lock },
  PICKING:          { label: 'Picking',          color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', Icon: ArrowsCounterClockwise },
  SALIDA:           { label: 'Salida',           color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   Icon: ArrowCircleUp },
  BAJA_AVERIA:      { label: 'Baja Avería',      color: '#f97316', bg: 'rgba(249,115,22,0.1)',  Icon: ArrowCircleUp },
  BAJA_VENCIMIENTO: { label: 'Baja Vencimiento', color: '#dc2626', bg: 'rgba(220,38,38,0.1)',   Icon: ArrowCircleUp },
  FALTANTE:         { label: 'Faltante',         color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  Icon: ArrowsCounterClockwise },
  REASIGNACION:     { label: 'Reasignación',     color: '#64748b', bg: 'rgba(100,116,135,0.1)', Icon: ArrowsCounterClockwise },
};

const TIPOS_MOV = Object.keys(MOV_CONFIG);

const inputSx = (colors, accent = '#6366f1') => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: '10px', backgroundColor: colors.surfaceAlt, height: 38,
    '& fieldset': { borderColor: colors.border },
    '&.Mui-focused fieldset': { borderColor: accent },
  },
  '& input': { color: colors.text, fontSize: 13 },
  '& label': { color: colors.textSecondary },
  '& label.Mui-focused': { color: accent },
});

export default function Movimientos() {
  const colors = useColors();
  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(false);
  const [filtros, setFiltros] = useState({ skuId: '', codigoLote: '', tipoMovimiento: '', fechaDesde: '', fechaHasta: '' });
  const [applied, setApplied] = useState({});
  const [page, setPage] = useState(0);
  const pageSize = 10;

  const fetch = useCallback(async () => {
    setLoading(true);
    try { setData(await api.inventario.getMovimientos(applied)); }
    catch { setData([]); } finally { setLoading(false); }
  }, [applied]);

  useEffect(() => { fetch(); }, [fetch]);

  const paginated = data.slice(page * pageSize, (page + 1) * pageSize);
  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));

  const applyFilters = () => {
    const f = {};
    if (filtros.skuId)          f.skuId          = filtros.skuId;
    if (filtros.codigoLote)     f.codigoLote     = filtros.codigoLote;
    if (filtros.tipoMovimiento) f.tipoMovimiento = filtros.tipoMovimiento;
    if (filtros.fechaDesde)     f.fechaDesde     = filtros.fechaDesde;
    if (filtros.fechaHasta)     f.fechaHasta     = filtros.fechaHasta;
    setApplied(f);
    setPage(0);
  };
  const clearFilters = () => {
    const e = { skuId: '', codigoLote: '', tipoMovimiento: '', fechaDesde: '', fechaHasta: '' };
    setFiltros(e);
    setApplied({});
    setPage(0);
  };
  const hasFilters = Object.values(applied).some(Boolean);

  return (
    <Box sx={{ animation: 'pageIn 0.35s ease-out both', '@keyframes pageIn': { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'translateY(0)' } } }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography sx={{ fontSize: 24, fontWeight: 800, color: colors.text, letterSpacing: '-0.03em' }}>Kardex de Inventario</Typography>
        <Typography sx={{ fontSize: 13, color: colors.textSecondary, mt: 0.5 }}>Historial de movimientos de inventario</Typography>
      </Box>

      {/* Filtros */}
      <Box sx={{ p: '14px 18px', borderRadius: '14px', background: colors.surface, border: `1px solid ${colors.border}`, mb: 2.5 }}>
        <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.07em', mb: 1.5 }}>Filtros</Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center' }}>
          <TextField size="small" placeholder="SKU" value={filtros.skuId} onChange={e => setFiltros(f => ({ ...f, skuId: e.target.value }))}
            InputProps={{ startAdornment: <InputAdornment position="start"><MagnifyingGlass size={14} color={colors.textSecondary} /></InputAdornment> }}
            sx={{ ...inputSx(colors), width: 140 }} />
          <TextField size="small" placeholder="Código Lote" value={filtros.codigoLote} onChange={e => setFiltros(f => ({ ...f, codigoLote: e.target.value }))} sx={{ ...inputSx(colors), width: 160 }} />
          <Select size="small" value={filtros.tipoMovimiento} onChange={e => setFiltros(f => ({ ...f, tipoMovimiento: e.target.value }))} displayEmpty
            sx={{ height: 38, minWidth: 150, borderRadius: '10px', backgroundColor: colors.surfaceAlt, color: filtros.tipoMovimiento ? colors.text : '#64748b', fontSize: 13, '& .MuiOutlinedInput-notchedOutline': { borderColor: colors.border }, '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#6366f1' } }}>
            <MenuItem value="">Todos los tipos</MenuItem>
            {TIPOS_MOV.map(t => <MenuItem key={t} value={t} sx={{ fontSize: 13 }}>{MOV_CONFIG[t].label}</MenuItem>)}
          </Select>
          <TextField size="small" label="Desde" type="date" value={filtros.fechaDesde} onChange={e => setFiltros(f => ({ ...f, fechaDesde: e.target.value }))} InputLabelProps={{ shrink: true }} sx={{ ...inputSx(colors), width: 155 }} />
          <TextField size="small" label="Hasta" type="date" value={filtros.fechaHasta} onChange={e => setFiltros(f => ({ ...f, fechaHasta: e.target.value }))} InputLabelProps={{ shrink: true }} sx={{ ...inputSx(colors), width: 155 }} />
          <Button onClick={applyFilters} variant="contained" sx={{ height: 38, borderRadius: '10px', textTransform: 'none', fontWeight: 600, px: 2.5, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>Filtrar</Button>
          {hasFilters && (
            <Button onClick={clearFilters} startIcon={<X size={13} />} sx={{ height: 38, borderRadius: '10px', textTransform: 'none', fontSize: 12, color: colors.textSecondary }}>Limpiar</Button>
          )}
        </Box>
      </Box>

      {/* Stats strip */}
      {!loading && data.length > 0 && (
        <Box sx={{ display: 'flex', gap: 1.5, mb: 2, flexWrap: 'wrap' }}>
          {TIPOS_MOV.map(t => {
            const cnt = data.filter(m => m.tipoMovimiento === t).length;
            if (!cnt) return null;
            const cfg = MOV_CONFIG[t];
            return (
              <Box key={t} sx={{ px: 1.75, py: 0.75, borderRadius: '8px', background: cfg.bg, border: `1px solid ${cfg.color}30`, display: 'flex', alignItems: 'center', gap: 1 }}>
                <cfg.Icon size={13} weight="duotone" color={cfg.color} />
                <Typography sx={{ fontSize: 12, fontWeight: 700, color: cfg.color }}>{cnt} {cfg.label}{cnt !== 1 ? 's' : ''}</Typography>
              </Box>
            );
          })}
        </Box>
      )}

      {/* Tabla */}
      <Box sx={{ borderRadius: '16px', overflow: 'hidden', border: `1px solid ${colors.border}`, background: colors.surface }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress sx={{ color: '#6366f1' }} /></Box>
        ) : data.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Package size={38} weight="duotone" color="#64748b" style={{ marginBottom: 12 }} />
            <Typography sx={{ color: colors.textSecondary, fontSize: 14 }}>Sin movimientos con esos filtros</Typography>
          </Box>
        ) : (
          <>
            <Box sx={{ display: 'grid', gridTemplateColumns: '140px 100px 110px 1.2fr 120px 80px 130px', gap: 1.5, px: 2.5, py: 1.5, background: colors.surfaceAlt, borderBottom: `1px solid ${colors.border}` }}>
              {['Fecha/Hora', 'Tipo', 'SKU', 'Marca', 'Lote', 'Cantidad', 'Referencia'].map(h => (
                <Typography key={h} sx={{ fontSize: 10.5, fontWeight: 700, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</Typography>
              ))}
            </Box>
            {paginated.map((m, i) => {
              const cfg = MOV_CONFIG[m.tipoMovimiento] || { label: m.tipoMovimiento, color: '#64748b', bg: 'transparent', Icon: Package };
              const positivo = (m.cantidad || 0) > 0;
              // Mapping correcto del DTO: datos anidados en lote y producto
              const codigoLote = m.lote?.codigoLote || m.codigoLote || '—';
              const skuId      = m.producto?.skuId   || m.skuId       || '—';
              const marca      = m.producto?.marca    || m.marcaProducto || '—';
              return (
                <Box key={m.movimientoId || m.id || i} sx={{ display: 'grid', gridTemplateColumns: '140px 100px 110px 1.2fr 120px 80px 130px', gap: 1.5, px: 2.5, py: 1.5, borderTop: `1px solid ${colors.border}`, borderLeft: `3px solid ${cfg.color}`, transition: 'background 0.15s', '&:hover': { background: `${colors.border}40` }, '&:last-child': { borderBottom: 'none' }, animation: `rowIn 0.3s ease-out ${Math.min(i, 10) * 0.03}s both`, '@keyframes rowIn': { from: { opacity: 0, transform: 'translateX(-4px)' }, to: { opacity: 1, transform: 'translateX(0)' } } }}>
                  <Typography sx={{ fontSize: 11.5, color: colors.textSecondary, alignSelf: 'center' }}>{formatFechaHora(m.fechaMovimiento)}</Typography>
                  <Box sx={{ alignSelf: 'center' }}>
                    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, px: 1, py: 0.3, borderRadius: '6px', background: cfg.bg }}>
                      <cfg.Icon size={12} weight="duotone" color={cfg.color} />
                      <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: cfg.color }}>{cfg.label}</Typography>
                    </Box>
                  </Box>
                  <Typography sx={{ fontSize: 12, color: '#8b5cf6', fontFamily: 'monospace', alignSelf: 'center' }}>{skuId}</Typography>
                  <Typography sx={{ fontSize: 12.5, color: colors.text, fontWeight: 500, alignSelf: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{marca}</Typography>
                  <Typography sx={{ fontSize: 12, color: colors.textSecondary, fontFamily: 'monospace', alignSelf: 'center' }}>{codigoLote}</Typography>
                  <Typography sx={{ fontSize: 14, fontWeight: 800, color: cfg.color, alignSelf: 'center', letterSpacing: '-0.01em' }}>
                    {positivo ? `+${m.cantidad}` : m.cantidad}
                  </Typography>
                  <Typography sx={{ fontSize: 11.5, color: '#6366f1', fontFamily: 'monospace', alignSelf: 'center', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {m.numeroPedido || m.pedidoId || m.recepcionId || m.observaciones?.slice(0,20) || '—'}
                  </Typography>
                </Box>
              );
            })}
            {totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 2, borderTop: `1px solid ${colors.border}` }}>
                <Pagination count={totalPages} page={page + 1} onChange={(_, p) => setPage(p - 1)} size="small"
                  sx={{ '& .MuiPaginationItem-root': { color: colors.textSecondary }, '& .Mui-selected': { background: 'rgba(99,102,241,.18) !important', color: '#6366f1', fontWeight: 700 } }} />
              </Box>
            )}
          </>
        )}
      </Box>
    </Box>
  );
}