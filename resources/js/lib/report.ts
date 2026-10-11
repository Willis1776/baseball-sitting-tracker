import { Game, Report } from '@/types';

/** Narrow a report to a subset of its games, recomputing running totals. */
export function filterReport(report: Report, keep: (game: Game) => boolean): Report {
    const indexes = report.games.map((g, i) => (keep(g) ? i : -1)).filter((i) => i >= 0);

    return {
        games: indexes.map((i) => report.games[i]),
        rows: report.rows.map((row) => {
            let running = 0;
            const per_game = indexes.map((i) => row.per_game[i]);
            const cumulative = per_game.map((n) => (running += n));
            return { ...row, per_game, running: cumulative, total: running };
        }),
    };
}
