const parse = (date: string) => {
    const [y, m, d] = date.split('-').map(Number);
    return new Date(y, m - 1, d);
};

export const shortDate = (date: string) =>
    parse(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

export const longDate = (date: string) =>
    parse(date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

export const time = (t: string | null) => {
    if (!t) return null;
    const [h, m] = t.split(':').map(Number);
    return new Date(2000, 0, 1, h, m).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
};

export const dateRange = (start: string | null, end: string | null) => {
    if (!start) return null;
    if (!end || end === start) return shortDate(start);
    return `${shortDate(start)} – ${shortDate(end)}`;
};

export const today = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const typeLabel = (type: 'league' | 'tournament') => (type === 'league' ? 'League' : 'Tournament');

export const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;
