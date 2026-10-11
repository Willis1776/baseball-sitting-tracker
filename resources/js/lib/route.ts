import { route as ziggyRoute } from 'ziggy-js';

/** Relative URLs so the app works behind any host (Herd, tunnels, production). */
export const route = (name: string, params?: Record<string, unknown> | number | (string | number)[]) =>
    ziggyRoute(name, params as any, false);
