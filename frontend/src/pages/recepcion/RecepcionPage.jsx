import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, Chip, CircularProgress, Tabs, Tab,
  IconButton, Divider, Paper, List, ListItem, ListItemText, ListItemIcon,
  Avatar, Tooltip, Alert
} from '@mui/material';
import {
  ClipboardText, Truck, CalendarBlank, ArrowRight,
  CheckCircle, Warning, Package, X, Clock, FileText,
  MagnifyingGlass, ArrowLeft, Info, Receipt, Plus,
  IdentificationCard, ListChecks, ArrowUpRight, Note
} from 'phosphor-react';
import { useColors } from '../../context/ThemeContext';
import api from '../../lib/localApi';
import { formatFecha } from '../../utils/formatters';

/* ── HELPERS ─────────────────────────────────────────────────────────────── */
function formatDate(date) {
  if (!date) return 'Sin fecha';
  try { return new Date(date).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' }); } catch { return date; }
}

function getStatusColor(status) {
  const map = {
    PENDIENTE: '#6366f1',
    RECEPCIONADO_PARCIAL: '#f59e0b',
    RECEPCIONADO_TOTAL: '#22c55e',
    RECIBIDO: '#22c55e',
    EN_PROCESO: '#3b82f6',
  };
  return map[status] || '#64748b';
}

/* ── COMPONENTS ──────────────────────────────────────────────────────────── */

function StatusBadge({ status }) {
  const color = getStatusColor(status);
  const label = status.replace(/_/g, ' ');
  return (
    <Chip 
      label={label} 
      size="small" 
      sx={{ 
        height: 20, fontSize: 9, fontWeight: 800, 
        background: `${color}12`, color: color, 
        border: `1px solid ${color}25`, borderRadius: '5px',
        textTransform: 'uppercase', letterSpacing: '0.02em'
      }} 
    />
  );
}

function ProgressBar({ progress, color }) {
  return (
    <Box sx={{ width: '100%', mt: 0.5 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography sx={{ fontSize: 9, fontWeight: 800, color: '#94a3b8', letterSpacing: '0.05em' }}>PROGRESO</Typography>
        <Typography sx={{ fontSize: 10, fontWeight: 900, color }}>{progress}%</Typography>
      </Box>
      <Box sx={{ height: 4, width: '100%', background: 'rgba(0,0,0,0.04)', borderRadius: 10, overflow: 'hidden' }}>
        <Box 
          sx={{ 
            height: '100%', 
            width: `${progress}%`, 
            background: `linear-gradient(90deg, ${color}, ${color}dd)`, 
            borderRadius: 10, 
            transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)',
          }} 
        />
      </Box>
    </Box>
  );
}

/* ── MAIN PAGE ───────────────────────────────────────────────────────────── */
export default function RecepcionPage() {
  const navigate = useNavigate();
  const colors = useColors();
  
  // State
  const [mainTab, setMainTab] = useState(0); 
  const [manifestTab, setManifestTab] = useState(0); 
  
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ manifiestos: [], recepciones: [] });
  const [selectedItem, setSelectedItem] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState('');

  // Auto-clear error messages
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [manifiestos, recepciones] = await Promise.all([
        api.manifiestos.listar({ incluirHistorico: true }),
        api.recepciones.listar()
      ]);
      
      const manifList = Array.isArray(manifiestos) ? manifiestos : [];
      const recepList = Array.isArray(recepciones) ? recepciones : [];

      setData({
        manifiestos: manifList,
        recepciones: recepList.sort((a,b) => new Date(b.fechaRecepcion) - new Date(a.fechaRecepcion))
      });
    } catch (err) {
      setError('Error al sincronizar datos de recepción');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleItemClick = async (item, type) => {
    setSelectedItem({ ...item, _type: type });
    setDetailData(null);
    setLoadingDetail(true);
    
    try {
      if (type === 'manifiesto') {
        const res = await api.manifiestos.detalle(item.manifiestoId);
        setDetailData(res);
      } else {
        setDetailData(item); 
      }
    } catch (err) {
      setError('No se pudo cargar el detalle seleccionado');
    } finally {
      setLoadingDetail(false);
    }
  };

  const filteredManifests = data.manifiestos.filter(m => {
    if (manifestTab === 0) return m.estado === 'PENDIENTE';
    if (manifestTab === 1) return m.estado === 'RECEPCIONADO_PARCIAL';
    if (manifestTab === 2) return m.estado === 'RECEPCIONADO_TOTAL' || m.estado === 'RECIBIDO';
    return true;
  });

  return (
    <Box sx={{ 
      pb: 4,
      animation: 'fadeIn 0.5s ease-out',
      '@keyframes fadeIn': { from: { opacity: 0, transform: 'translateY(15px)' }, to: { opacity: 1, transform: 'translateY(0)' } }
    }}>
      {/* Compact Premium Header */}
      <Box sx={{ 
        mb: 3, p: 3, borderRadius: '18px', 
        background: `linear-gradient(135deg, ${colors.surface}, ${colors.surfaceAlt})`,
        border: `1px solid ${colors.border}`,
        position: 'relative', overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
      }}>
        <Box sx={{ position: 'absolute', top: -50, right: -50, width: 150, height: 150, background: 'radial-gradient(circle, #6366f110 0%, transparent 70%)', borderRadius: '50%' }} />
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 0.5 }}>
              <Box sx={{ p: 0.75, borderRadius: '10px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff' }}>
                <Truck size={22} weight="duotone" />
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 900, color: colors.text, letterSpacing: '-0.04em' }}>
                Recepción
              </Typography>
            </Box>
            <Typography sx={{ color: colors.textSecondary, fontSize: 13, maxWidth: 400 }}>
              Control de entrada de productos y auditoría de carga.
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Box sx={{ textAlign: 'right' }}>
              <Typography sx={{ fontSize: 18, fontWeight: 900, color: '#6366f1', lineHeight: 1 }}>{data.manifiestos.filter(m => m.estado === 'PENDIENTE').length}</Typography>
              <Typography sx={{ fontSize: 9, fontWeight: 800, color: colors.textSecondary, textTransform: 'uppercase' }}>Pendientes</Typography>
            </Box>
            <Divider orientation="vertical" flexItem sx={{ mx: 0.5, height: 24, alignSelf: 'center' }} />
            <Box sx={{ textAlign: 'right' }}>
              <Typography sx={{ fontSize: 18, fontWeight: 900, color: '#22c55e', lineHeight: 1 }}>{data.recepciones.length}</Typography>
              <Typography sx={{ fontSize: 9, fontWeight: 800, color: colors.textSecondary, textTransform: 'uppercase' }}>Completadas</Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      {error && (
        <Alert 
          severity="error" 
          variant="filled"
          onClose={() => setError('')}
          sx={{ mb: 3, borderRadius: '12px', fontWeight: 700, animation: 'shake 0.4s ease' }}
        >
          {error}
        </Alert>
      )}

      {/* Main Content Area */}
      <Paper sx={{ 
        borderRadius: '20px', overflow: 'hidden', mb: 3, 
        background: colors.surface, border: `1px solid ${colors.border}`, 
        boxShadow: '0 10px 30px rgba(0,0,0,0.04)',
        display: 'flex', flexDirection: 'column'
      }}>
        <Box sx={{ px: 2, pt: 0.5, borderBottom: `1px solid ${colors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Tabs 
            value={mainTab} 
            onChange={(_, v) => { setMainTab(v); setSelectedItem(null); }}
            sx={{ 
              minHeight: 48,
              '& .MuiTab-root': { 
                textTransform: 'none', fontWeight: 800, fontSize: 13, minHeight: 48,
                color: colors.textSecondary, px: 2, transition: 'all 0.2s'
              },
              '& .Mui-selected': { color: '#6366f1 !important' },
              '& .MuiTabs-indicator': { height: 3, borderRadius: '3px 3px 0 0', backgroundColor: '#6366f1' }
            }}
          >
            <Tab icon={<ListChecks size={18} weight="duotone" />} iconPosition="start" label="Manifiestos" />
            <Tab icon={<Clock size={18} weight="duotone" />} iconPosition="start" label="Historial" />
          </Tabs>

          {mainTab === 0 && (
            <Box sx={{ display: 'flex', gap: 0.5, pr: 2 }}>
              {['Pendientes', 'Parciales', 'Recibidos'].map((label, idx) => (
                <Chip
                  key={label}
                  label={label}
                  size="small"
                  onClick={() => { setManifestTab(idx); setSelectedItem(null); }}
                  sx={{ 
                    fontWeight: 800, fontSize: 10, height: 24,
                    backgroundColor: manifestTab === idx ? '#6366f1' : 'rgba(0,0,0,0.04)',
                    color: manifestTab === idx ? '#fff' : colors.textSecondary,
                  }}
                />
              ))}
            </Box>
          )}
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: selectedItem ? '1fr 360px' : '1fr', minHeight: 500, transition: 'all 0.4s ease' }}>
          
          <Box sx={{ p: 2.5, borderRight: selectedItem ? `1px solid ${colors.border}` : 'none', overflowY: 'auto', maxHeight: 600 }}>
            {loading ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 10, gap: 1.5 }}>
                <CircularProgress size={30} thickness={5} sx={{ color: '#6366f1' }} />
              </Box>
            ) : mainTab === 0 ? (
              filteredManifests.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 10 }}>
                  <Package size={32} weight="duotone" color={colors.border} />
                  <Typography sx={{ color: colors.textSecondary, fontWeight: 700, fontSize: 14, mt: 1 }}>Sin datos</Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 2 }}>
                  {filteredManifests.map(m => (
                    <Paper
                      key={m.manifiestoId}
                      onClick={() => handleItemClick(m, 'manifiesto')}
                      sx={{
                        p: 2, borderRadius: '14px', cursor: 'pointer',
                        border: `2px solid ${selectedItem?.manifiestoId === m.manifiestoId ? '#6366f1' : 'transparent'}`,
                        background: colors.surfaceAlt,
                        '&:hover': { transform: 'translateY(-2px)', background: colors.surface, boxShadow: '0 6px 15px rgba(0,0,0,0.04)' },
                        transition: 'all 0.2s'
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar sx={{ width: 32, height: 32, background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', borderRadius: '10px' }}>
                            <ClipboardText size={20} weight="duotone" />
                          </Avatar>
                          <Box>
                            <Typography sx={{ fontWeight: 900, fontSize: 14, color: colors.text }}>{m.numeroManifiesto}</Typography>
                            <Typography sx={{ fontSize: 11, fontWeight: 600, color: colors.textSecondary }}>{m.proveedor?.substring(0, 20)}</Typography>
                          </Box>
                        </Box>
                        <StatusBadge status={m.estado} />
                      </Box>

                      <Box sx={{ display: 'flex', gap: 2, mb: 1.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <CalendarBlank size={12} color="#6366f1" />
                          <Typography sx={{ fontSize: 11, fontWeight: 700, color: colors.text }}>{formatDate(m.fechaEmision)}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Package size={12} color="#94a3b8" />
                          <Typography sx={{ fontSize: 11, fontWeight: 700, color: colors.text }}>{m.totalLineas || 0} SKU</Typography>
                        </Box>
                      </Box>

                      <ProgressBar 
                        progress={m.sumEsperado > 0 ? Math.round(((m.sumRecibido || 0) / m.sumEsperado) * 100) : 0} 
                        color={getStatusColor(m.estado)} 
                      />
                    </Paper>
                  ))}
                </Box>
              )
            ) : data.recepciones.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 10 }}>
                <Receipt size={32} weight="duotone" color={colors.border} />
                <Typography sx={{ color: colors.textSecondary, fontWeight: 700, fontSize: 14, mt: 1 }}>
                  No hay recepciones registradas
                </Typography>
                <Typography sx={{ color: colors.textSecondary, fontSize: 12, mt: 0.5 }}>
                  Las recepciones completadas aparecerán aquí
                </Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {data.recepciones.map(r => (
                  <Paper
                    key={r.recepcionId}
                    onClick={() => handleItemClick(r, 'recepcion')}
                    sx={{
                      p: 1.5, borderRadius: '12px', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 2,
                      border: `2px solid ${selectedItem?.recepcionId === r.recepcionId ? '#6366f1' : 'transparent'}`,
                      background: colors.surfaceAlt,
                      transition: 'all 0.2s'
                    }}
                  >
                    <Avatar sx={{ width: 34, height: 34, background: '#22c55e', color: '#fff', borderRadius: '10px' }}>
                      <Receipt size={18} weight="duotone" />
                    </Avatar>
                    
                    <Box sx={{ flex: 1 }}>
                      <Typography sx={{ fontWeight: 800, fontSize: 13, color: colors.text }}>{r.numeroRecepcion || 'REC-HIST'}</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Typography sx={{ fontSize: 11, color: colors.textSecondary }}>{formatDate(r.fechaRecepcion)}</Typography>
                        <Typography sx={{ fontSize: 11, color: colors.textSecondary }}>•</Typography>
                        <Typography sx={{ fontSize: 11, color: colors.textSecondary }}>{new Date(r.fechaRecepcion).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</Typography>
                      </Box>
                    </Box>

                    <Box sx={{ textAlign: 'right', pr: 1 }}>
                      <Typography sx={{ fontSize: 12, fontWeight: 800, color: colors.text }}>
                        {r.operarioNombre?.substring(0, 8) || String(r.operarioId ?? '').substring(0, 5)}
                      </Typography>
                    </Box>
                    <ArrowRight size={16} />
                  </Paper>
                ))}
              </Box>
            )}
          </Box>

          {selectedItem && (
            <Box sx={{ 
              backgroundColor: colors.surface,
              borderLeft: `1px solid ${colors.border}`,
              display: 'flex', flexDirection: 'column',
            }}>
              <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: colors.surfaceAlt }}>
                <Box>
                  <Typography sx={{ fontWeight: 900, fontSize: 15, color: colors.text }}>Detalle</Typography>
                  <Typography sx={{ fontSize: 11, color: colors.textSecondary }}>Resumen de operación</Typography>
                </Box>
                <IconButton size="small" onClick={() => setSelectedItem(null)} sx={{ background: 'rgba(0,0,0,0.04)' }}><X size={16} /></IconButton>
              </Box>

              <Divider />

              {loadingDetail ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress size={24} /></Box>
              ) : (
                <Box sx={{ p: 2, overflowY: 'auto', flex: 1 }}>
                  {selectedItem._type === 'manifiesto' ? (
                    <Box>
                      <Box sx={{ p: 2, borderRadius: '14px', background: 'rgba(99, 102, 241, 0.03)', mb: 3, border: `1px solid rgba(99, 102, 241, 0.1)` }}>
                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                          <Box><Typography sx={{ fontSize: 10, color: colors.textSecondary }}>Número</Typography><Typography sx={{ fontSize: 13, fontWeight: 800 }}>{selectedItem.numeroManifiesto}</Typography></Box>
                          <Box><Typography sx={{ fontSize: 10, color: colors.textSecondary }}>Proveedor</Typography><Typography sx={{ fontSize: 13, fontWeight: 800 }}>{selectedItem.proveedor?.substring(0,15)}</Typography></Box>
                          <Box><Typography sx={{ fontSize: 10, color: colors.textSecondary }}>Fecha</Typography><Typography sx={{ fontSize: 13, fontWeight: 800 }}>{formatDate(selectedItem.fechaEmision)}</Typography></Box>
                          <Box><Typography sx={{ fontSize: 10, color: colors.textSecondary }}>Estado</Typography><StatusBadge status={selectedItem.estado} /></Box>
                        </Box>
                      </Box>

                      <Typography sx={{ fontSize: 13, fontWeight: 900, color: colors.text, mb: 1.5 }}>Líneas del Manifiesto</Typography>

                      <List sx={{ p: 0, mb: 3 }}>
                        {(detailData?.lineas || []).map((d, i) => (
                          <Paper key={i} elevation={0} sx={{ p: 1.5, borderRadius: '12px', border: `1px solid ${colors.border}`, mb: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                               <Typography sx={{ fontSize: 13, fontWeight: 800, color: colors.text }}>{d.skuId}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography sx={{ fontSize: 11, color: colors.textSecondary }}>Esp: {d.cantidadEsperada}</Typography>
                              <Typography sx={{ fontSize: 11, fontWeight: 800, color: d.cantidadRecibida > 0 ? '#22c55e' : colors.textSecondary }}>Rec: {d.cantidadRecibida || 0}</Typography>
                            </Box>
                          </Paper>
                        ))}
                      </List>

                      {selectedItem.estado !== 'RECEPCIONADO_TOTAL' && selectedItem.estado !== 'RECIBIDO' && (
                        <Button
                          fullWidth variant="contained"
                          onClick={() => navigate(`/recepcion/registrar?manifiestoId=${selectedItem.manifiestoId}`)}
                          endIcon={<ArrowUpRight size={16} weight="bold" />}
                          sx={{ 
                            height: 44, borderRadius: '12px', textTransform: 'none', fontWeight: 900, fontSize: 14,
                            background: 'linear-gradient(135deg, #6366f1, #4f46e5)', boxShadow: '0 4px 12px rgba(99,102,241,0.3)',
                          }}
                        >
                          Iniciar Recepción
                        </Button>
                      )}
                    </Box>
                  ) : (
                    <Box>
                      <Box sx={{ p: 2.5, borderRadius: '18px', background: 'rgba(34, 197, 94, 0.04)', mb: 3, border: `1px solid rgba(34, 197, 94, 0.15)` }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                          <Avatar sx={{ width: 36, height: 36, backgroundColor: '#22c55e', color: '#fff' }}>
                            <CheckCircle size={22} weight="bold" />
                          </Avatar>
                          <Box>
                            <Typography sx={{ fontWeight: 900, fontSize: 16, color: colors.text }}>Recepción Finalizada</Typography>
                            <Typography sx={{ fontSize: 12, color: colors.textSecondary }}>{selectedItem.numeroRecepcion}</Typography>
                          </Box>
                        </Box>
                        
                        <Divider sx={{ my: 1.5, opacity: 0.1 }} />

                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography sx={{ fontSize: 12, fontWeight: 600, color: colors.textSecondary }}>Fecha Auditoría:</Typography>
                            <Typography sx={{ fontSize: 12, fontWeight: 800 }}>{formatFecha(selectedItem.fechaRecepcion)}</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography sx={{ fontSize: 12, fontWeight: 600, color: colors.textSecondary }}>Hora Registro:</Typography>
                            <Typography sx={{ fontSize: 12, fontWeight: 800 }}>
                              {new Date(selectedItem.fechaRecepcion).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography sx={{ fontSize: 12, fontWeight: 600, color: colors.textSecondary }}>Operario:</Typography>
                            <Box sx={{ textAlign: 'right' }}>
                              <Typography sx={{ fontSize: 12, fontWeight: 800 }}>
                                {selectedItem.operarioNombre || 'Desconocido'}
                              </Typography>
                              <Typography sx={{ fontSize: 10, color: colors.textSecondary }}>
                                CC: {selectedItem.operarioCedula || '—'}
                              </Typography>
                            </Box>
                          </Box>
                          {selectedItem.manifiestoId && (
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography sx={{ fontSize: 12, fontWeight: 600, color: colors.textSecondary }}>Manifiesto Origen:</Typography>
                              <Typography sx={{ fontSize: 12, fontWeight: 800, color: '#6366f1' }}>
                                {data.manifiestos.find(m => String(m.manifiestoId ?? '') === String(selectedItem.manifiestoId ?? ''))?.numeroManifiesto || '—'}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                        <Note size={18} weight="duotone" color="#6366f1" />
                        <Typography sx={{ fontSize: 14, fontWeight: 900 }}>Observaciones del Proceso</Typography>
                      </Box>
                      
                      <Paper elevation={0} sx={{ p: 2, borderRadius: '14px', border: `1px solid ${colors.border}`, background: selectedItem.notas ? '#fffbeb' : colors.surfaceAlt }}>
                        <Typography sx={{ fontSize: 12, color: colors.textSecondary, fontStyle: selectedItem.notas ? 'italic' : 'normal' }}>
                          {selectedItem.notas || 'No se registraron observaciones adicionales durante esta recepción.'}
                        </Typography>
                      </Paper>

                    </Box>
                  )}
                </Box>
              )}
            </Box>
          )}
        </Box>
      </Paper>
    </Box>
  );
}
