export const SERVICE_COLORS = [
    '#3B82F6',
    '#10B981',
    '#F59E0B',
    '#EF4444',
    '#8B5CF6',
    '#EC4899',
    '#14B8A6',
    '#F97316',
    '#6366F1',
    '#84CC16',
    '#06B6D4',
    '#A855F7',
] as const;

export const ENTORNO_STYLES = {
    'Producción': {
        badge: 'bg-green-100 text-green-800 border-green-200',
        dot: 'bg-green-500',
    },
    'Preproducción': {
        badge: 'bg-amber-100 text-amber-800 border-amber-200',
        dot: 'bg-amber-500',
    },
} as const;
