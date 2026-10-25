import { Link, router } from '@inertiajs/react';
import clsx from 'clsx';
import { ChevronLeft, ChevronRight, Plus, Settings, UserCheck } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GameFormSheet } from '@/Components/Forms';
import Sheet, { ConfirmSheet } from '@/Components/Sheet';
import { Segmented } from '@/Components/TotalsTable';
import { Card, EmptyState, Toggle } from '@/Components/ui';
import AppLayout from '@/Layouts/AppLayout';
import { longDate, time, typeLabel } from '@/lib/format';
import { sendJson } from '@/lib/http';
import { route } from '@/lib/route';
import { Competition, Game, Player, Team } from '@/types';

type Props = {
    team: Team;
    game: Game;
    gameNumber: number | null;
    prevGameId: number | null;
    nextGameId: number | null;
    roster: Player[];
    lineup: number[];
    sits: [number, number][];
    otherTotals: Record<number, { season: number; competition: number | null }>;
    competitions: Pick<Competition, 'id' | 'name' | 'type'>[];
};

const key = (playerId: number, inning: number) => `${playerId}:${inning}`;
const totalCell = 'w-7 shrink-0 text-center';
const MAX_INNINGS = 9;

export default function GameShow({ team, game, gameNumber, prevGameId, nextGameId, roster, lineup, sits, otherTotals, competitions }: Props) {
    const players = useMemo(() => roster.filter((p) => lineup.includes(p.id)), [roster, lineup]);
    const [sat, setSat] = useState(() => new Set(sits.map(([p, i]) => key(p, i))));
    const [error, setError] = useState<string | null>(null);
    const [sort, setSort] = useState<'roster' | 'fewest'>('roster');
    const [panel, setPanel] = useState<'lineup' | 'menu' | 'edit' | 'delete' | null>(null);
    const queue = useRef<Promise<unknown>>(Promise.resolve());
    const pendingSaves = useRef(0);
    const scroller = useRef<HTMLDivElement>(null);
    const previousInnings = useRef(game.innings);
    const [addingInning, setAddingInning] = useState(false);

    // After adding an inning, slide the grid over so the new column is in view.
    useEffect(() => {
        if (game.innings > previousInnings.current) {
            scroller.current?.scrollTo({ left: scroller.current.scrollWidth, behavior: 'smooth' });
        }
        previousInnings.current = game.innings;
    }, [game.innings]);

    const addInning = () =>
        router.post(route('games.innings.add', [team.id, game.id]), {}, {
            preserveScroll: true,
            preserveState: true,
            onStart: () => setAddingInning(true),
            onFinish: () => setAddingInning(false),
        });

    const innings = Array.from({ length: game.innings }, (_, i) => i + 1);
    const competition = game.competition;
    const compLetter = competition ? (competition.type === 'league' ? 'Lg' : 'Trn') : null;

    const toggle = useCallback(
        (playerId: number, inning: number) => {
            const k = key(playerId, inning);
            const next = !sat.has(k);

            setSat((prev) => {
                const s = new Set(prev);
                next ? s.add(k) : s.delete(k);
                return s;
            });
            navigator.vibrate?.(10);

            // Serialize writes so rapid taps on the same cell land in order.
            pendingSaves.current++;
            queue.current = queue.current.then(() =>
                sendJson('PUT', route('games.sits.toggle', [team.id, game.id]), { player_id: playerId, inning, sat: next })
                    .then(() => {
                        pendingSaves.current--;
                        // Mirror the saved sit into the page props, which Inertia also keeps in browser
                        // history. Otherwise Back, or a phone reloading the tab after a long idle,
                        // restores the sits as they were when the page first loaded.
                        router.replaceProp('sits', (current: [number, number][]) => [
                            ...current.filter(([p, i]) => p !== playerId || i !== inning),
                            ...(next ? [[playerId, inning] as [number, number]] : []),
                        ]);
                    })
                    .catch(() => {
                        pendingSaves.current--;
                        setSat((prev) => {
                            const s = new Set(prev);
                            next ? s.delete(k) : s.add(k);
                            return s;
                        });
                        setError('Could not save. Check your connection and try again.');
                        setTimeout(() => setError(null), 3500);
                    }),
            );
        },
        [sat, team.id, game.id],
    );

    // Whenever fresh sits arrive from the server (or a saved tap is mirrored above), show them,
    // unless taps are still saving, in which case the local state is the newer one.
    useEffect(() => {
        if (pendingSaves.current === 0) setSat(new Set(sits.map(([p, i]) => key(p, i))));
    }, [sits]);

    // Coming back to the page (unlocking the phone, switching back to the browser) re-reads the
    // chart, so anything restored from a stale copy, or changed by another coach, is corrected.
    useEffect(() => {
        const refresh = () => {
            if (document.visibilityState === 'visible' && pendingSaves.current === 0) {
                router.reload({ only: ['sits', 'lineup', 'otherTotals', 'game'] });
            }
        };
        // `persisted`: restored from the back-forward cache rather than a normal load.
        const onPageShow = (e: PageTransitionEvent) => e.persisted && refresh();
        document.addEventListener('visibilitychange', refresh);
        window.addEventListener('pageshow', onPageShow);
        return () => {
            document.removeEventListener('visibilitychange', refresh);
            window.removeEventListener('pageshow', onPageShow);
        };
    }, []);

    const gameCount = (playerId: number) => innings.filter((i) => sat.has(key(playerId, i))).length;

    // Sort on totals from *other* games so rows don't jump around while tapping.
    const rows = useMemo(() => {
        if (sort === 'roster') return players;
        const metric = (p: Player) => otherTotals[p.id]?.competition ?? otherTotals[p.id]?.season ?? 0;
        return [...players].sort((a, b) => metric(a) - metric(b) || a.sort_order - b.sort_order);
    }, [players, sort, otherTotals]);

    const compTotals = rows.map((p) => (otherTotals[p.id]?.competition ?? 0) + gameCount(p.id));
    const maxComp = Math.max(0, ...compTotals);
    const minComp = compTotals.length ? Math.min(...compTotals) : 0;

    const title = gameNumber ? `Game ${gameNumber}${game.opponent ? ` · vs ${game.opponent}` : ''}` : game.label;
    const backHref = competition ? route('competitions.show', [team.id, competition.id]) : route('teams.show', team.id);

    return (
        <AppLayout
            tight
            title={title}
            subtitle={[longDate(game.played_on), time(game.starts_at), competition?.name].filter(Boolean).join(' · ')}
            back={{ href: backHref, label: competition?.name ?? team.name }}
            actions={
                <button onClick={() => setPanel('menu')} className="rounded-lg p-2 text-navy-100 active:bg-white/10" aria-label="Game settings">
                    <Settings className="size-5" />
                </button>
            }
        >
            {(prevGameId || nextGameId) && (
                <div className="mb-3 flex items-center justify-between px-1.5 sm:px-0">
                    <NavLink team={team} id={prevGameId} dir="prev" />
                    <span className="text-xs font-semibold text-slate-500 uppercase">{competition && typeLabel(competition.type)}</span>
                    <NavLink team={team} id={nextGameId} dir="next" />
                </div>
            )}

            <div className="mb-3 flex items-center justify-between gap-2 px-1.5 sm:px-0">
                <Segmented
                    value={sort}
                    onChange={setSort}
                    options={[
                        ['roster', 'Roster order'],
                        ['fewest', 'Fewest sits first'],
                    ]}
                />
                <button
                    onClick={() => setPanel('lineup')}
                    className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-white px-3 text-xs font-semibold text-navy-800 ring-1 ring-slate-300 active:bg-slate-50"
                >
                    <UserCheck className="size-4" /> {players.length}/{roster.length} playing
                </button>
            </div>

            {players.length === 0 ? (
                <Card>
                    <EmptyState title="Nobody in this game's lineup">
                        {roster.length ? (
                            <button onClick={() => setPanel('lineup')} className="font-semibold text-navy-700 underline">
                                Choose who's playing
                            </button>
                        ) : (
                            <Link href={route('teams.show', { team: team.id, tab: 'roster' })} className="font-semibold text-navy-700 underline">
                                Add players to the roster
                            </Link>
                        )}{' '}
                        to chart this game.
                    </EmptyState>
                </Card>
            ) : (
                <Card className="overflow-hidden">
                    <div ref={scroller} className="overflow-x-auto overscroll-x-contain">
                        <table className="w-full border-separate border-spacing-0 select-none">
                            <thead>
                                <tr className="text-[11px] font-bold text-slate-500 uppercase">
                                    <th className="sticky left-0 z-10 bg-slate-50 py-2 pl-2.5 text-left">Player</th>
                                    {innings.map((i) => (
                                        <th key={i} className="bg-slate-50 px-0.5 py-2 text-center text-xs text-navy-800">
                                            {i}
                                        </th>
                                    ))}
                                    <th className="sticky right-0 z-10 border-l border-slate-200 bg-navy-50 py-2 pr-1 text-navy-800">
                                        <div className="flex text-[11px]">
                                            <span className={totalCell} title="Innings sat this game">Gm</span>
                                            {competition && <span className={totalCell} title={`${typeLabel(competition.type)} total through this game`}>{compLetter}</span>}
                                            <span className={totalCell} title="Season total">Ssn</span>
                                        </div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((player, rowIndex) => {
                                    const g = gameCount(player.id);
                                    const comp = compTotals[rowIndex];
                                    const season = (otherTotals[player.id]?.season ?? 0) + g;
                                    return (
                                        <tr key={player.id} className={clsx(rowIndex % 2 === 1 && 'bg-slate-50/60')}>
                                            <th
                                                className={clsx(
                                                    'sticky left-0 z-10 max-w-[4.75rem] truncate border-t border-slate-100 py-1 pl-2.5 pr-1 text-left text-sm font-semibold',
                                                    rowIndex % 2 === 1 ? 'bg-slate-50' : 'bg-white',
                                                )}
                                            >
                                                {player.name}
                                            </th>
                                            {innings.map((inning) => {
                                                const on = sat.has(key(player.id, inning));
                                                return (
                                                    <td key={inning} className="border-t border-slate-100 p-[2px] text-center">
                                                        <button
                                                            onClick={() => toggle(player.id, inning)}
                                                            aria-pressed={on}
                                                            aria-label={`${player.name} inning ${inning}: ${on ? 'sitting' : 'playing'}`}
                                                            className={clsx(
                                                                'h-10 w-full min-w-7 rounded-lg text-[10px] font-bold transition-colors',
                                                                on ? 'bg-stitch-600 text-white shadow-inner' : 'bg-slate-100 text-transparent active:bg-slate-200',
                                                            )}
                                                        >
                                                            SIT
                                                        </button>
                                                    </td>
                                                );
                                            })}
                                            <td className={clsx('sticky right-0 z-10 border-t border-l border-slate-100 pr-1', rowIndex % 2 === 1 ? 'bg-slate-50' : 'bg-white')}>
                                                <div className="flex items-center text-[15px] font-bold tabular-nums">
                                                    <span className={clsx(totalCell, g ? 'text-stitch-600' : 'text-slate-300')}>{g}</span>
                                                    {competition && (
                                                        <span
                                                            className={clsx(
                                                                totalCell,
                                                                'rounded-md py-1',
                                                                maxComp > minComp && comp === maxComp && 'bg-stitch-50 text-stitch-700',
                                                                maxComp > minComp && comp === minComp && 'bg-emerald-50 text-emerald-700',
                                                                !(maxComp > minComp && (comp === maxComp || comp === minComp)) && 'text-navy-800',
                                                            )}
                                                        >
                                                            {comp}
                                                        </span>
                                                    )}
                                                    <span className={clsx(totalCell, 'font-medium text-slate-500')}>{season}</span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            <tfoot>
                                <tr className="text-xs font-semibold text-slate-500">
                                    <th className="sticky left-0 z-10 border-t border-slate-200 bg-slate-50 py-2 pl-3 text-left text-[11px] uppercase">Sitting</th>
                                    {innings.map((inning) => (
                                        <td key={inning} className="border-t border-slate-200 bg-slate-50 py-2 text-center tabular-nums text-navy-800">
                                            {players.filter((p) => sat.has(key(p.id, inning))).length}
                                        </td>
                                    ))}
                                    <td className="sticky right-0 z-10 border-t border-l border-slate-200 bg-slate-50" />
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </Card>
            )}

            {players.length > 0 && (
                <div className="mt-2 flex items-center justify-between gap-2 px-1.5 sm:px-0">
                    <span className="text-xs text-slate-500">{game.innings > 6 && 'Swipe the innings sideways to see them all.'}</span>
                    {game.innings < MAX_INNINGS && (
                        <button
                            onClick={addInning}
                            disabled={addingInning}
                            className="inline-flex h-9 shrink-0 items-center gap-1 rounded-xl bg-white px-3 text-xs font-semibold text-navy-800 ring-1 ring-slate-300 active:bg-slate-50 disabled:opacity-50"
                        >
                            <Plus className="size-4" /> Add inning {game.innings + 1}
                        </button>
                    )}
                </div>
            )}

            <p className="mt-2 px-1 text-xs text-slate-500">
                Tap a box to mark a player sitting that inning. <strong>Gm</strong> = this game
                {competition && (
                    <>
                        , <strong>{compLetter}</strong> = {competition.name} total through this game
                    </>
                )}
                , <strong>Ssn</strong> = all games.
            </p>

            {game.notes && <Card className="mt-4 p-4 text-sm whitespace-pre-line text-slate-600">{game.notes}</Card>}

            {error && (
                <div className="fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+1rem)] z-40 flex justify-center px-4">
                    <div className="rounded-full bg-stitch-600 px-4 py-2 text-sm font-semibold text-white shadow-lg">{error}</div>
                </div>
            )}

            <LineupSheet
                open={panel === 'lineup'}
                onClose={() => setPanel(null)}
                team={team}
                game={game}
                roster={roster}
                lineup={lineup}
                sitCount={gameCount}
                onRemoved={(playerId) =>
                    setSat((prev) => new Set([...prev].filter((k) => !k.startsWith(`${playerId}:`))))
                }
            />

            <Sheet open={panel === 'menu'} onClose={() => setPanel(null)} title="Game settings">
                <div className="divide-y divide-slate-100 rounded-2xl ring-1 ring-slate-200">
                    <button onClick={() => setPanel('edit')} className="block w-full px-4 py-3.5 text-left font-medium active:bg-slate-50">
                        Edit game details
                    </button>
                    <button onClick={() => setPanel('delete')} className="block w-full px-4 py-3.5 text-left font-medium text-stitch-600 active:bg-slate-50">
                        Delete game
                    </button>
                </div>
            </Sheet>
            <GameFormSheet open={panel === 'edit'} onClose={() => setPanel(null)} team={team} game={game} competitions={competitions} />
            <ConfirmSheet
                open={panel === 'delete'}
                onClose={() => setPanel(null)}
                title="Delete this game?"
                message="This permanently deletes the game and its sitting chart."
                confirmLabel="Delete game"
                onConfirm={() => router.delete(route('games.destroy', [team.id, game.id]))}
            />
        </AppLayout>
    );
}

function NavLink({ team, id, dir }: { team: Team; id: number | null; dir: 'prev' | 'next' }) {
    if (!id) return <span className="w-24" />;
    return (
        <Link
            href={route('games.show', [team.id, id])}
            className="inline-flex h-9 w-24 items-center justify-center gap-1 rounded-xl bg-white text-sm font-semibold text-navy-800 ring-1 ring-slate-300 active:bg-slate-50"
        >
            {dir === 'prev' && <ChevronLeft className="size-4" />}
            {dir === 'prev' ? 'Prev' : 'Next'}
            {dir === 'next' && <ChevronRight className="size-4" />}
        </Link>
    );
}

function LineupSheet({
    open,
    onClose,
    team,
    game,
    roster,
    lineup,
    sitCount,
    onRemoved,
}: {
    open: boolean;
    onClose: () => void;
    team: Team;
    game: Game;
    roster: Player[];
    lineup: number[];
    sitCount: (playerId: number) => number;
    onRemoved: (playerId: number) => void;
}) {
    const [confirming, setConfirming] = useState<Player | null>(null);

    const save = (player: Player, playing: boolean) =>
        router.put(
            route('games.lineup.update', [team.id, game.id]),
            { player_id: player.id, playing },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    if (!playing) onRemoved(player.id);
                    setConfirming(null);
                },
            },
        );

    const change = (player: Player, playing: boolean) => {
        if (!playing && sitCount(player.id) > 0) {
            setConfirming(player);
            return;
        }
        save(player, playing);
    };

    return (
        <>
            <Sheet open={open && !confirming} onClose={onClose} title="Who's playing this game?">
                <p className="mb-3 text-sm text-slate-500">
                    Changes apply to this game only. New games start with the roster's active players.
                </p>
                <div className="divide-y divide-slate-100 rounded-2xl ring-1 ring-slate-200">
                    {roster.map((p) => {
                        const playing = lineup.includes(p.id);
                        return (
                            <div key={p.id} className="flex items-center gap-3 px-4 py-2.5">
                                <span className={clsx('flex-1 font-semibold', !playing && 'text-slate-400')}>
                                    {p.jersey_number && <span className="mr-1.5 text-xs text-slate-400">#{p.jersey_number}</span>}
                                    {p.name}
                                    {!p.is_active && <span className="ml-1.5 text-[10px] font-medium text-slate-400 uppercase">inactive on roster</span>}
                                </span>
                                <Toggle checked={playing} onChange={(v) => change(p, v)} label={`${p.name} playing`} />
                            </div>
                        );
                    })}
                </div>
            </Sheet>
            <ConfirmSheet
                open={open && confirming !== null}
                onClose={() => setConfirming(null)}
                title={`Remove ${confirming?.name} from this game?`}
                message={`${confirming?.name} has ${confirming ? sitCount(confirming.id) : 0} inning(s) marked sitting in this game. Removing them clears those marks.`}
                confirmLabel="Remove"
                onConfirm={() => confirming && save(confirming, false)}
            />
        </>
    );
}
