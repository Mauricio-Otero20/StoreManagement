import { ESTADOS_PEDIDO, ESTADOS_MANIFIESTO, TIPOS_EXCEPCION } from '../../utils/constants';

/**
 * StatusBadge — badge genérico de estado
 * 
 * Props:
 *   estado  : string  — valor del enum (ej: "COMPROMETIDO")
 *   tipo    : 'pedido' | 'manifiesto' | 'excepcion'  (default: 'pedido')
 *   size    : 'sm' | 'md'  (default: 'sm')
 */
export default function StatusBadge({ estado, tipo = 'pedido', size = 'sm' }) {
  let config = { label: estado, color: '#64748b', bg: 'rgba(100,116,139,0.12)' };

  if (tipo === 'pedido' && ESTADOS_PEDIDO[estado]) {
    config = ESTADOS_PEDIDO[estado];
  } else if (tipo === 'manifiesto' && ESTADOS_MANIFIESTO[estado]) {
    config = ESTADOS_MANIFIESTO[estado];
  } else if (tipo === 'excepcion') {
    const found = TIPOS_EXCEPCION.find(t => t.value === estado);
    if (found) config = { label: found.label, color: found.color, bg: `${found.color}18` };
  }

  const fontSize = size === 'sm' ? 11 : 13;
  const px = size === 'sm' ? '8px 12px' : '6px 14px';

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      backgroundColor: config.bg,
      color: config.color,
      padding: px,
      borderRadius: 999,
      fontSize,
      fontWeight: 600,
      whiteSpace: 'nowrap',
      border: `1px solid ${config.color}30`,
      letterSpacing: '0.01em',
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: '50%',
        backgroundColor: config.color,
        flexShrink: 0,
      }} />
      {config.label}
    </span>
  );
}
