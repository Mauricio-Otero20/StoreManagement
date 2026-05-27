import { format, formatDistanceToNow, differenceInMinutes, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';

export const formatFecha = (d) => {
  if (!d) return '—';
  try { return format(new Date(d), 'dd/MM/yyyy', { locale: es }); } catch { return '—'; }
};

export const formatFechaHora = (d) => {
  if (!d) return '—';
  try { return format(new Date(d), "dd/MM/yyyy HH:mm", { locale: es }); } catch { return '—'; }
};

export const formatRelativo = (d) => {
  if (!d) return '—';
  try { return formatDistanceToNow(new Date(d), { locale: es, addSuffix: true }); } catch { return '—'; }
};

/** Muestra "hace X min" si < 60 min, o solo fecha si ya pasó 1 hora */
export const formatRelativoCorto = (d) => {
  if (!d) return '—';
  try {
    const mins = differenceInMinutes(new Date(), new Date(d));
    if (mins < 60) {
      return formatDistanceToNow(new Date(d), { locale: es, addSuffix: true });
    }
    return format(new Date(d), 'dd/MM/yyyy', { locale: es });
  } catch { return '—'; }
};

export const diasHastaVencer = (fechaVencimiento) => {
  if (!fechaVencimiento) return null;
  try { return differenceInDays(new Date(fechaVencimiento), new Date()); } catch { return null; }
};

export const minutosDesde = (fecha, fechaFin) => {
  if (!fecha) return 0;
  try { return differenceInMinutes(new Date(fechaFin ?? new Date()), new Date(fecha)); } catch { return 0; }
};

export const formatEstadoPedido = (estado) => {
  const map = {
    ESPERANDO_RUTA: 'Esperando Ruta',
    RUTA_ASIGNADA:  'Ruta Asignada',
    COMPROMETIDO:   'Comprometido',
    EN_PICKING:     'En Picking',
    DESPACHADO:     'Despachado',
    ENTREGADO:      'Entregado',
  };
  return map[estado] || estado;
};

export const formatCOP = (valor) => {
  if (valor == null) return '—';
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(valor);
};

export const truncate = (str, n = 30) => str?.length > n ? str.slice(0, n) + '…' : (str || '—');

/** Retorna el color de alerta según días hasta vencer */
export const colorVencimiento = (dias) => {
  if (dias == null) return '#64748b';
  if (dias <= 7)  return '#ef4444';
  if (dias <= 30) return '#f59e0b';
  return '#22c55e';
};
