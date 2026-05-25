import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, CircularProgress, TextField, InputAdornment, Button, Chip } from '@mui/material';
import { Package, MagnifyingGlass, ShoppingCart, CheckCircle, CurrencyDollar } from 'phosphor-react';
import { useColors } from '../../context/ThemeContext';
import api from '../../lib/localApi';

// ── Persist carrito ──────────────────────────────────────────────────────────
function loadCarrito()  { try { return JSON.parse(localStorage.getItem('sm_carrito') || '[]'); } catch { return []; } }
function saveCarrito(c) { localStorage.setItem('sm_carrito', JSON.stringify(c)); }

/* ── ProductoCard ──────────────────────────────────────────────────────────── */
function ProductoCard({ producto, enCarrito, onToggle }) {
  const colors = useColors();
  const disponible = (producto.stockDisponible ?? 0) > 0;
  const precio = producto.costoCop ?? null;

  return (
    <Box
      onClick={() => disponible && onToggle(producto)}
      sx={{
        p: '20px', borderRadius: '20px',
        cursor: disponible ? 'pointer' : 'default',
        background: enCarrito 
          ? `linear-gradient(135deg, ${colors.surface} 0%, rgba(245,158,11,0.05) 100%)`
          : colors.surface,
        border: `1.5px solid ${enCarrito ? '#f59e0b' : colors.border}`,
        boxShadow: enCarrito 
          ? '0 10px 25px -5px rgba(245,158,11,0.2)'
          : '0 4px 6px -1px rgba(0,0,0,0.05)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative', overflow: 'hidden',
        opacity: !disponible ? 0.6 : 1,
        '&:hover': !disponible ? {} : {
          transform: 'translateY(-6px)',
          borderColor: enCarrito ? '#f59e0b' : '#f59e0b60',
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
        }
      }}>

      {enCarrito && (
        <Box sx={{ position: 'absolute', top: 12, right: 12, zIndex: 1 }}>
          <CheckCircle size={20} weight="fill" color="#f59e0b" />
        </Box>
      )}

      <Box sx={{ 
        width: 48, height: 48, borderRadius: '14px', mb: 2,
        background: enCarrito ? 'rgba(245,158,11,0.15)' : colors.surfaceAlt,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: `1px solid ${enCarrito ? 'rgba(245,158,11,0.3)' : colors.border}`
      }}>
        <Package size={24} weight="duotone" color={enCarrito ? '#f59e0b' : colors.textSecondary} />
      </Box>

      <Box sx={{ mb: 2 }}>
        <Typography sx={{ fontSize: 15, fontWeight: 800, color: colors.text, lineHeight: 1.2, mb: 0.5 }}>
          {producto.marca}
        </Typography>
        <Typography sx={{ fontSize: 12.5, color: colors.textSecondary }}>
          {producto.presentacion}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pt: 2, borderTop: `1px solid ${colors.border}80` }}>
        <Typography sx={{ fontSize: 15, fontWeight: 900, color: '#f59e0b' }}>
          {precio != null ? `$${Number(precio).toLocaleString('es-CO')}` : '—'}
        </Typography>

        <Box sx={{
          px: 1, py: 0.4, borderRadius: '7px',
          background: !disponible ? 'rgba(239,68,68,0.08)' : (producto.stockDisponible < 10 ? 'rgba(245,158,11,0.08)' : 'rgba(34,197,94,0.08)'),
          border: `1px solid ${!disponible ? 'rgba(239,68,68,0.2)' : (producto.stockDisponible < 10 ? 'rgba(245,158,11,0.2)' : 'rgba(34,197,94,0.2)')}`,
        }}>
          <Typography sx={{ fontSize: 9.5, fontWeight: 800, color: !disponible ? '#ef4444' : (producto.stockDisponible < 10 ? '#f59e0b' : '#22c55e'), textTransform: 'uppercase' }}>
            {!disponible ? 'Agotado' : `${producto.stockDisponible} Disponibles`}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

/* ── MAIN ─────────────────────────────────────────────────────────────────── */
export default function CatalogoAsesor() {
  const navigate = useNavigate();
  const colors   = useColors();

  const [productos, setProductos] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [buscar, setBuscar]       = useState('');
  const [carrito, setCarrito]     = useState(loadCarrito);

  useEffect(() => {
    api.productos.listar({})
      .then(r => setProductos(r.content || []))
      .catch(() => setError('No se pudo cargar el catálogo. Verifica la conexión.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    saveCarrito(carrito);
    window.dispatchEvent(new Event('sm_cart_updated'));
  }, [carrito]);

  const toggleProducto = (p) => {
    setCarrito(prev => {
      const idx = prev.findIndex(item => item.skuId === p.skuId);
      if (idx >= 0) return prev.filter((_, i) => i !== idx);
      
      // Tomamos los datos directamente de p
      const nuevoItem = {
        ...p,
        precio: p.costoCop || 0,
        qty: 1
      };
      return [...prev, nuevoItem];
    });
  };

  const filtrados = productos.filter(p => 
    p.marca?.toLowerCase().includes(buscar.toLowerCase()) ||
    p.presentacion?.toLowerCase().includes(buscar.toLowerCase())
  );

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, animation: 'pageIn 0.4s ease-out both', '@keyframes pageIn': { from: { opacity: 0, transform: 'translateY(10px)' }, to: { opacity: 1, transform: 'translateY(0)' } } }}>
      
      {/* Search Header */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography sx={{ fontSize: 28, fontWeight: 900, color: colors.text, letterSpacing: '-0.02em' }}>Catálogo</Typography>
          <Typography sx={{ fontSize: 14, color: colors.textSecondary }}>Selecciona los productos para el nuevo pedido</Typography>
        </Box>

        <TextField
          placeholder="Buscar marca o presentación..."
          value={buscar}
          onChange={(e) => setBuscar(e.target.value)}
          variant="outlined"
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <MagnifyingGlass size={20} color={colors.textSecondary} />
              </InputAdornment>
            ),
          }}
          sx={{
            width: { xs: '100%', sm: 320 },
            '& .MuiOutlinedInput-root': {
              borderRadius: '12px',
              backgroundColor: colors.surface,
              '& fieldset': { borderColor: colors.border },
              '&:hover fieldset': { borderColor: colors.borderHover },
            }
          }}
        />
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 10, gap: 2 }}>
          <CircularProgress size={40} sx={{ color: '#f59e0b' }} />
          <Typography sx={{ color: colors.textSecondary, fontWeight: 600 }}>Cargando catálogo premium...</Typography>
        </Box>
      ) : error ? (
        <Box sx={{ p: 4, borderRadius: '16px', background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)', textAlign: 'center' }}>
          <Typography color="error" sx={{ fontWeight: 700 }}>{error}</Typography>
        </Box>
      ) : filtrados.length === 0 ? (
        <Box sx={{ py: 10, textAlign: 'center' }}>
          <Package size={64} weight="duotone" color={colors.border} style={{ marginBottom: 16 }} />
          <Typography sx={{ color: colors.textSecondary, fontWeight: 600 }}>
            No se encontraron productos para "{buscar}"
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 2.5 }}>
          {filtrados.map((p, i) => (
            <Box key={p.skuId} sx={{ animation: `cIn 0.3s ease-out ${Math.min(i, 15) * 0.04}s both`, '@keyframes cIn': { from: { opacity: 0, transform: 'scale(0.95)' }, to: { opacity: 1, transform: 'scale(1)' } } }}>
              <ProductoCard
                producto={p}
                enCarrito={!!carrito.find(c => c.skuId === p.skuId)}
                onToggle={toggleProducto}
              />
            </Box>
          ))}
        </Box>
      )}

      {/* Floating Cart Button (Diseño Premium FAB) */}
      {carrito.length > 0 && (
        <Box
          onClick={() => navigate('/asesor/carrito')}
          sx={{
            position: 'fixed',
            bottom: { xs: 24, md: 40 },
            right: { xs: 24, md: 40 },
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            color: '#fff',
            height: 64,
            px: 4,
            borderRadius: '32px',
            display: 'flex', alignItems: 'center', gap: 2,
            boxShadow: '0 12px 30px rgba(245,158,11,0.5), inset 0 2px 4px rgba(255,255,255,0.3)',
            cursor: 'pointer',
            zIndex: 2000,
            transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            border: '1px solid rgba(255,255,255,0.2)',
            backdropFilter: 'blur(8px)',
            '&:hover': { 
              transform: 'scale(1.08) translateY(-8px)', 
              boxShadow: '0 20px 40px rgba(245,158,11,0.6)',
              filter: 'brightness(1.1)'
            },
            '&:active': { transform: 'scale(0.95)' },
            animation: 'fabIn 0.6s cubic-bezier(0.23, 1, 0.32, 1) both',
            '@keyframes fabIn': { 
              from: { opacity: 0, transform: 'translateY(100px) scale(0.5)' }, 
              to: { opacity: 1, transform: 'translateY(0) scale(1)' } 
            }
          }}>
          <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <ShoppingCart size={28} weight="duotone" />
            <Box sx={{ 
              position: 'absolute', top: -12, right: -12, 
              background: '#ef4444', color: '#fff', 
              minWidth: 22, height: 22, borderRadius: '11px', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', 
              fontSize: 12, fontWeight: 900, 
              border: '2px solid #fff',
              boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
            }}>
              {carrito.length}
            </Box>
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 900, fontSize: 15, letterSpacing: '0.03em', lineHeight: 1, textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              CONTINUAR PEDIDO
            </Typography>
            <Typography sx={{ fontSize: 10, fontWeight: 700, opacity: 0.9, mt: 0.2, textTransform: 'uppercase' }}>
              {carrito.length} {carrito.length === 1 ? 'producto seleccionado' : 'productos seleccionados'}
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
}