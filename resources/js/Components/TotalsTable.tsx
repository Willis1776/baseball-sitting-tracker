import { Link } from '@inertiajs/react';
import clsx from 'clsx';
import { useMemo, useState } from 'react';
import { shortDate } from '@/lib/format';
import { route } from '@/lib/route';
import { Report, Team } from '@/types';

type Mode = 'running' | 'per_game';
type Sort = 'roster' | 'most' | 'fewest';

/**
 * Players × games grid of sit counts. "Running" shows the cumulative total after each game,
 * "Per game" shows how many innings each player sat in that game.
 */
export default function TotalsTable({ report, team, showInactive = true }: { report: Report; team: Team; showInactive?: boolean }) {
    const [mode, setMode] = useState<Mode>('running');
    const [sort, setSort] = useState<Sort>('roster');

    const rows = useMemo(() => {
        const visible = report.rows.filter((r) => showInactive || r.player.is_active || r.total > 0);
        if (sort === 'roster') return visible;
        return [...visible].sort((a, b) => (sort === 'most' ? b.total - a.total : a.total - b.total) || a.player.sort_order - b.player.sort_order);
    }, [report.rows, sort, showInactive]);

    const max = Math.max(0, ...rows.map((r) => r.total));
    const min = rows.length ? Math.min(...rows.map((r) => r.total)) : 0;

    return (
        <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
                <Segmented
                    value={mode}
                    onChange={setMode}
                    options={[
                        ['running', 'Running total'],
                        ['per_game', 'Per game'],
                    ]}
                />
                <Segmented
                    value={sort}
                    onChange={setSort}
                    options={[
                        ['roster', 'Roster'],
                        ['fewest', 'Fewest'],
                        ['most', 'Most'],
                    ]}
                />
            </div>

            <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/70">
                <table className="w-full border-separate border-spacing-0 text-sm">
                    <thead>
                        <tr className="text-slate-500">
                            <th className="sticky left-0 z-10 border-b border-slate-200 bg-white px-3 py-2 text-left text-xs font-semibold uppercase">Player</th>
                            {report.games.map((g, i) => (
                                <th key={g.id} className="min-w-12 border-b border-slate-200 px-1 py-1.5 text-center font-semibold">
                                    <Link href={route('games.show', [team.id, g.id])} className="block rounded-md px-1 py-0.5 text-navy-700 active:bg-navy-50">
                                        <div className="text-xs">G{i + 1}</div>
                                        <div className="text-[10px] font-normal whitespace-nowrap text-slate-400">{shortDate(g.played_on)}</div>
                                    </Link>
                                </th>
                            ))}
                            <th className="sticky right-0 border-b border-l border-slate-200 bg-navy-50 px-3 py-2 text-center text-xs font-bold text-navy-800 uppercase">
                                Total
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row) => (
                            <tr key={row.player.id} className={clsx(!row.player.is_active && 'text-slate-400')}>
                                <th className="sticky left-0 z-10 border-b border-slate-100 bg-white px-3 py-2 text-left font-semibold whitespace-nowrap">
                                    {row.player.jersey_number && <span className="mr-1.5 text-xs text-slate-400">#{row.player.jersey_number}</span>}
                                    {row.player.name}
                                    {!row.player.is_active && <span className="ml-1.5 text-[10px] font-medium uppercase">inactive</span>}
                                </th>
                                {report.games.map((g, i) => {
                                    const value = mode === 'running' ? row.running[i] : row.per_game[i];
                                    const satThisGame = row.per_game[i] > 0;
                                    return (
                                        <td
                                            key={g.id}
                                            className={clsx(
                                                'border-b border-slate-100 px-1 py-2 text-center tabular-nums',
                                                satThisGame ? 'font-bold text-stitch-600' : 'text-slate-400',
                                            )}
                                        >
                                            {value}
                                        </td>
                                    );
                                })}
                                <td
                                    className={clsx(
                                        'sticky right-0 border-b border-l border-slate-100 px-3 py-2 text-center text-base font-bold tabular-nums',
                                        max > min && row.total === max ? 'bg-stitch-50 text-stitch-700' : max > min && row.total === min ? 'bg-emerald-50 text-emerald-700' : 'bg-navy-50/60 text-navy-800',
                                    )}
                                >
                                    {row.total}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {max > min && (
                <p className="mt-2 flex gap-3 px-1 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                        <span className="size-2.5 rounded-sm bg-emerald-200" /> Sat least
                    </span>
                    <span className="flex items-center gap-1">
                        <span className="size-2.5 rounded-sm bg-stitch-100" /> Sat most
                    </span>
                </p>
            )}
        </div>
    );
}

export function Segmented<T extends string>({
    value,
    onChange,
    options,
}: {
    value: T;
    onChange: (v: T) => void;
    options: [T, string][];
}) {
    return (
        <div className="inline-flex rounded-xl bg-slate-200/70 p-0.5">
            {options.map(([key, label]) => (
                <button
                    key={key}
                    onClick={() => onChange(key)}
                    className={clsx(
                        'h-8 rounded-[10px] px-3 text-xs font-semibold whitespace-nowrap',
                        value === key ? 'bg-white text-navy-800 shadow-sm' : 'text-slate-600',
                    )}
                >
                    {label}
                </button>
            ))}
        </div>
    );
}
