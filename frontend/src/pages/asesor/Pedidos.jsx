import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Typography, TextField, Button, Select, MenuItem,
  CircularProgress, InputAdornment, Skeleton, Pagination, Alert, Snackbar
} from '@mui/material';
import { MagnifyingGlass, Plus, Eye, FolderOpen, X } from 'phosphor-react';
import { useColors } from '../../context/ThemeContext';
import api from '../../lib/localApi';
import StatusBadge from '../../components/common/StatusBadge';
import { formatFechaHora } from '../../utils/formatters';

// EstadoPedido enum exacto del backend
const ESTADOS = ['ESPERANDO_RUTA', 'COMPROMETIDO', 'EN_PICKING', 'PICKUP', 'DESPACHADO', 'ENTREGADO'];
const ESTADO_LABELS = {
  ESPERANDO_RUTA: 'Esperando Ruta',
  COMPROMETIDO:   'Comprometido',
  EN_PICKING:     'En Picking',
  PICKUP:         'Pickup',
  DESPACHADO:     'Despachado',
  ENTREGADO:      'Entregado',
};

const PAGE_SIZE = 20;

export default function ListaPedidos() {
  const navigate  = useNavigate();
  const colors    = useColors();
  const isAsesor  = localStorage.getItem('sm_rol') === 'ASESOR_COMERCIAL';

  const location  = useLocation();
  const [pedidos, setPedidos]       = useState([]);
  const [paginacion, setPaginacion] = useState(null); // PaginacionDTO real del backend
  const [loading, setLoading]       = useState(false);
  const [page, setPage]             = useState(1);    // 1-indexed para MUI Pagination
  const [filtros, setFiltros]       = useState({ estado: '', clienteCc: '', numeroPedido: '' });
  const [applied, setApplied]       = useState({ estado: '', clienteCc: '', numeroPedido: '' });
  const [showSuccess, setShowSuccess] = useState(!!location.state?.nuevo);

  const fetchPedidos = useCallback(async (pageNum = page) => {
    setLoading(true);
    try {
      // PedidosListResponseDTO: { pedidos: PedidoResumenDTO[], paginacion: PaginacionDTO }
      const res = await api.pedidos.listar({ ...applied, page: pageNum - 1, size: PAGE_SIZE });
      setPedidos(res.content || []);
      setPaginacion(res.paginacion || null);
    } catch {
      setPedidos([]);
      setPaginacion(null);
    } finally {
      setLoading(false);
    }
  }, [applied, page]);

  useEffect(() => { fetchPedidos(page); }, [applied, page, fetchPedidos]);

  const applyFilters = () => {
    setPage(1);
    setApplied({ ...filtros });
  };
  const clearFilters = () => {
    const e = { estado: '', clienteCc: '', numeroPedido: '' };
    setFiltros(e);
    setApplied(e);
    setPage(1);
  };

  const totalPages = paginacion?.totalPages ?? (pedidos.length < PAGE_SIZE ? 1 : 2);
  const totalElements = paginacion?.totalElements ?? pedidos.length;

  const inputSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: '10px', backgroundColor: colors.surfaceAlt, height: 38,
      '& fieldset': { borderColor: colors.border },
      '&:hover fieldset': { borderColor: colors.borderHover },
      '&.Mui-focused fieldset': { borderColor: '#6366f1' },
    },
    '& input': { color: colors.text, fontSize: 13 },
    '& .MuiInputLabel-root': { color: colors.textSecondary },
  };

  return (
    <Box sx={{ animation: 'pageIn 0.35s ease-out both', '@keyframes pageIn': { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'translateY(0)' } } }}>
      
      <Snackbar open={showSuccess} autoHideDuration={6000} onClose={() => setShowSuccess(false)} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert onClose={() => setShowSuccess(false)} severity="success" variant="filled" sx={{ width: '100%', borderRadius: '12px', fontWeight: 700 }}>
          ¡Pedido {typeof location.state?.nuevo === 'string' ? location.state.nuevo : ''} creado exitosamente!
        </Alert>
      </Snackbar>

      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography sx={{ fontSize: 24, fontWeight: 800, color: colors.text, letterSpacing: '-0.03em' }}>
            {isAsesor ? 'Mis Pedidos' : 'Pedidos'}
          </Typography>
          <Typography sx={{ fontSize: 13, color: colors.textSecondary, mt: 0.5 }}>
            {paginacion
              ? `${totalElements} pedidos en total · página ${page} de ${totalPages}`
              : pedidos.length > 0
                ? `${pedidos.length} pedidos encontrados`
                : 'Consulta y filtra pedidos'}
          </Typography>
        </Box>
        {isAsesor && (
          <Button
            onClick={() => navigate('/asesor/catalogo')}
            variant="contained"
            startIcon={<Plus size={16} weight="bold" />}
            sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 600, px: 2.5, height: 42, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 4px 14px rgba(99,102,241,0.4)', '&:hover': { background: 'linear-gradient(135deg,#818cf8,#a78bfa)', transform: 'translateY(-1px)' }, transition: 'all 0.2s' }}>
            Nuevo Pedido
          </Button>
        )}
      </Box>

      {/* Filtros */}
      <Box sx={{ p: '14px 16px', borderRadius: '14px', background: colors.surface, border: `1px solid ${colors.border}`, mb: 2.5, display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center' }}>
        <TextField
          size="small" placeholder="N° Pedido" value={filtros.numeroPedido}
          onChange={e => setFiltros(f => ({ ...f, numeroPedido: e.target.value }))}
          onKeyDown={e => e.key === 'Enter' && applyFilters()}
          InputProps={{ startAdornment: <InputAdornment position="start"><MagnifyingGlass size={14} color={colors.textSecondary} /></InputAdornment> }}
          sx={{ ...inputSx, width: 170 }}
        />
        <TextField
          size="small" placeholder="Cédula cliente" value={filtros.clienteCc}
          onChange={e => setFiltros(f => ({ ...f, clienteCc: e.target.value.replace(/\D/g, '') }))}
          onKeyDown={e => e.key === 'Enter' && applyFilters()}
          sx={{ ...inputSx, width: 160 }}
        />
        <Select
          size="small" value={filtros.estado}
          onChange={e => setFiltros(f => ({ ...f, estado: e.target.value }))}
          displayEmpty
          sx={{ height: 38, minWidth: 175, borderRadius: '10px', backgroundColor: colors.surfaceAlt, '& .MuiOutlinedInput-notchedOutline': { borderColor: colors.border }, '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#6366f1' }, color: filtros.estado ? colors.text : colors.textSecondary, fontSize: 13 }}>
          <MenuItem value="">Todos los estados</MenuItem>
          {ESTADOS.map(e => <MenuItem key={e} value={e} sx={{ fontSize: 13 }}>{ESTADO_LABELS[e]}</MenuItem>)}
        </Select>
        <Button onClick={applyFilters} variant="contained"
          sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, height: 38, px: 2.5, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
          Filtrar
        </Button>
        {(applied.estado || applied.clienteCc || applied.numeroPedido) && (
          <Button onClick={clearFilters} startIcon={<X size={14} />}
            sx={{ borderRadius: '10px', textTransform: 'none', fontSize: 12, color: colors.textSecondary, '&:hover': { color: '#ef4444' } }}>
            Limpiar
          </Button>
        )}
        <Button onClick={() => fetchPedidos(page)} disabled={loading} variant="outlined"
          sx={{ height: 38, borderRadius: '10px', textTransform: 'none', fontSize: 12, fontWeight: 600, borderColor: colors.border, color: colors.textSecondary, '&:hover': { borderColor: '#6366f1', color: '#6366f1' }, ml: 'auto' }}>
          Actualizar
        </Button>
      </Box>

      {/* Tabla */}
      <Box sx={{ borderRadius: '16px', overflowX: 'auto', overflowY: 'hidden', border: `1px solid ${colors.border}`, background: colors.surface }}>
        {/* Header cols — campos reales de PedidoResumenDTO */}
        <Box sx={{ display: 'grid', gridTemplateColumns: '160px 1fr 130px 145px 80px 52px', gap: 1.5, px: 2.5, py: 1.5, background: colors.surfaceAlt, borderBottom: `1px solid ${colors.border}` }}>
          {['N° Pedido', 'Cliente', 'Creado', 'Estado', 'Und.', ''].map(h => (
            <Typography key={h} sx={{ fontSize: 10.5, fontWeight: 700, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</Typography>
          ))}
        </Box>

        {loading ? (
          <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
            {[1, 2, 3, 4].map(i => <Skeleton key={i} height={52} sx={{ borderRadius: '10px', bgcolor: colors.surfaceAlt }} />)}
          </Box>
        ) : pedidos.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <FolderOpen size={38} weight="duotone" color="#64748b" style={{ marginBottom: 12 }} />
            <Typography sx={{ color: colors.textSecondary, fontSize: 14 }}>No se encontraron pedidos</Typography>
            {isAsesor && (
              <Button onClick={() => navigate('/asesor/catalogo')} variant="outlined"
                sx={{ mt: 2, borderRadius: '10px', textTransform: 'none', borderColor: '#6366f1', color: '#6366f1' }}>
                Crear primer pedido
              </Button>
            )}
          </Box>
        ) : (
          pedidos.map((p, i) => (
            <Box
              key={p.pedidoId || i}
              sx={{
                display: 'grid', gridTemplateColumns: '160px 1fr 130px 145px 80px 52px',
                gap: 1.5, px: 2.5, py: 1.75,
                borderTop: `1px solid ${colors.border}`,
                transition: 'background 0.15s',
                '&:hover': { background: `${colors.border}50` },
                animation: `rowIn 0.3s ease-out ${i * 0.03}s both`,
                '@keyframes rowIn': { from: { opacity: 0, transform: 'translateX(-6px)' }, to: { opacity: 1, transform: 'translateX(0)' } },
              }}>
              {/* numeroPedido — campo real */}
              <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#6366f1', alignSelf: 'center', fontFamily: 'monospace' }}>
                {p.numeroPedido || `PED-${i + 1}`}
              </Typography>
              {/* clienteNombre + clienteCc — campos reales de PedidoResumenDTO */}
              <Box sx={{ alignSelf: 'center', minWidth: 0 }}>
                <Typography sx={{ fontSize: 13, fontWeight: 600, color: colors.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {p.clienteNombre || '—'}
                </Typography>
                <Typography sx={{ fontSize: 11, color: colors.textSecondary }}>CC: {p.clienteCc || '—'}</Typography>
              </Box>
              {/* fechaCreacion */}
              <Box sx={{ alignSelf: 'center' }}>
                <Typography sx={{ fontSize: 12, color: colors.text }}>{formatFechaHora(p.fechaCreacion)}</Typography>
              </Box>
              {/* estado */}
              <Box sx={{ alignSelf: 'center' }}>
                <StatusBadge estado={p.estado} tipo="pedido" />
              </Box>
              {/* totalUnidades — campo real (no totalSolicitado) */}
              <Typography sx={{ fontSize: 13, fontWeight: 700, color: colors.text, alignSelf: 'center' }}>
                {p.totalUnidades ?? p.totalLineas ?? '—'}
              </Typography>
              {/* Ver detalle */}
              <Box
                onClick={() => navigate(`/asesor/pedidos/${p.pedidoId}`)}
                sx={{ alignSelf: 'center', width: 34, height: 34, borderRadius: '9px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', '&:hover': { background: 'rgba(99,102,241,0.18)', transform: 'scale(1.08)' } }}>
                <Eye size={16} weight="duotone" color="#6366f1" />
              </Box>
            </Box>
          ))
        )}
      </Box>

      {/* Paginación real con PaginacionDTO del backend */}
      {!loading && totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, mt: 2.5 }}>
          <Typography sx={{ fontSize: 12, color: colors.textSecondary }}>
            {totalElements} pedidos · página {page} de {totalPages}
          </Typography>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, p) => setPage(p)}
            size="small"
            sx={{
              '& .MuiPaginationItem-root': { color: colors.textSecondary, borderColor: colors.border },
              '& .Mui-selected': { background: 'rgba(99,102,241,0.15) !important', color: '#6366f1', fontWeight: 700, borderColor: '#6366f1' },
              '& .MuiPaginationItem-root:hover': { background: 'rgba(99,102,241,0.08)' },
            }}
          />
        </Box>
      )}
    </Box>
  );
}