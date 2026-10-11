import { router } from '@inertiajs/react';
import clsx from 'clsx';
import { CalendarDays, Check, ListPlus, Plus, Settings, X } from 'lucide-react';
import { useState } from 'react';
import { CompetitionFormSheet, GameFormSheet } from '@/Components/Forms';
import Sheet, { ConfirmSheet } from '@/Components/Sheet';
import TotalsTable from '@/Components/TotalsTable';
import { Button, Card, EmptyState } from '@/Components/ui';
import AppLayout from '@/Layouts/AppLayout';
import { dateRange, shortDate, typeLabel } from '@/lib/format';
import { route } from '@/lib/route';
import { GameRow } from '@/Pages/Teams/Show';
import { Competition, Game, Report, Team } from '@/types';

type Props = {
    team: Team;
    competition: Competition;
    report: Report;
    availableGames: Game[];
};

export default function CompetitionShow({ team, competition, report, availableGames }: Props) {
    const [creating, setCreating] = useState(false);
    const [attaching, setAttaching] = useState(false);
    const [settings, setSettings] = useState<'menu' | 'edit' | 'delete' | null>(null);
    const [removing, setRemoving] = useState<Game | null>(null);

    const totalSits = report.rows.reduce((sum, r) => sum + r.total, 0);

    return (
        <AppLayout
            title={competition.name}
            subtitle={[typeLabel(competition.type), team.name, dateRange(competition.starts_on, competition.ends_on)].filter(Boolean).join(' · ')}
            back={{ href: route('teams.show', { team: team.id, tab: 'competitions' }), label: team.name }}
            actions={
                <button onClick={() => setSettings('menu')} className="rounded-lg p-2 text-navy-100 active:bg-white/10" aria-label={`${typeLabel(competition.type)} settings`}>
                    <Settings className="size-5" />
                </button>
            }
        >
            <div className="mb-4 grid grid-cols-2 gap-3">
                <Stat label="Games" value={report.games.length} />
                <Stat label="Innings sat" value={totalSits} />
            </div>

            <section className="mb-6">
                <h2 className="mb-3 text-xl font-bold">{typeLabel(competition.type)} totals</h2>
                {report.games.length === 0 ? (
                    <Card>
                        <EmptyState icon={<CalendarDays className="size-12" />} title="No games yet">
                            Create a game or add existing ones to start tracking totals.
                        </EmptyState>
                    </Card>
                ) : (
                    <TotalsTable report={report} team={team} />
                )}
            </section>

            <section>
                <div className="mb-3 flex items-center justify-between gap-2">
                    <h2 className="text-xl font-bold">Games</h2>
                    <div className="flex gap-2">
                        {availableGames.length > 0 && (
                            <Button size="sm" variant="secondary" onClick={() => setAttaching(true)}>
                                <ListPlus className="size-4" /> Add existing
                            </Button>
                        )}
                        <Button size="sm" onClick={() => setCreating(true)}>
                            <Plus className="size-4" /> New
                        </Button>
                    </div>
                </div>
                {report.games.length > 0 && (
                    <Card className="divide-y divide-slate-100 overflow-hidden">
                        {report.games.map((game, i) => (
                            <GameRow
                                key={game.id}
                                team={team}
                                game={{ ...game, competition: null }}
                                label={`Game ${i + 1}${game.opponent ? ` · vs ${game.opponent}` : ''}`}
                                trailing={
                                    <button onClick={() => setRemoving(game)} className="mr-2 rounded-lg p-2.5 text-slate-400 active:bg-slate-100" aria-label={`Remove game ${i + 1} from ${competition.name}`}>
                                        <X className="size-5" />
                                    </button>
                                }
                            />
                        ))}
                    </Card>
                )}
            </section>

            <GameFormSheet open={creating} onClose={() => setCreating(false)} team={team} competitions={[competition]} competitionId={competition.id} />
            <AttachGamesSheet open={attaching} onClose={() => setAttaching(false)} team={team} competition={competition} games={availableGames} />

            <ConfirmSheet
                open={removing !== null}
                onClose={() => setRemoving(null)}
                title={`Remove from this ${competition.type}?`}
                message={`The game stays on ${team.name} with its sitting history, it just won't count toward ${competition.name} totals.`}
                confirmLabel="Remove"
                onConfirm={() =>
                    removing &&
                    router.delete(route('competitions.games.detach', [team.id, competition.id, removing.id]), {
                        preserveScroll: true,
                        onSuccess: () => setRemoving(null),
                    })
                }
            />

            <Sheet open={settings === 'menu'} onClose={() => setSettings(null)} title={competition.name}>
                <div className="divide-y divide-slate-100 rounded-2xl ring-1 ring-slate-200">
                    <button onClick={() => setSettings('edit')} className="block w-full px-4 py-3.5 text-left font-medium active:bg-slate-50">
                        Edit details
                    </button>
                    <button onClick={() => setSettings('delete')} className="block w-full px-4 py-3.5 text-left font-medium text-stitch-600 active:bg-slate-50">
                        Delete {competition.type}
                    </button>
                </div>
            </Sheet>
            <CompetitionFormSheet open={settings === 'edit'} onClose={() => setSettings(null)} team={team} competition={competition} />
            <ConfirmSheet
                open={settings === 'delete'}
                onClose={() => setSettings(null)}
                title={`Delete ${competition.name}?`}
                message={`Its ${report.games.length} game(s) and their sitting history stay on the team as standalone games.`}
                confirmLabel={`Delete ${competition.type}`}
                onConfirm={() => router.delete(route('competitions.destroy', [team.id, competition.id]))}
            />
        </AppLayout>
    );
}

function Stat({ label, value }: { label: string; value: number }) {
    return (
        <Card className="px-4 py-3">
            <div className="text-xs font-semibold text-slate-500 uppercase">{label}</div>
            <div className="text-2xl font-bold text-navy-800 tabular-nums">{value}</div>
        </Card>
    );
}

function AttachGamesSheet({ open, onClose, team, competition, games }: { open: boolean; onClose: () => void; team: Team; competition: Competition; games: Game[] }) {
    const [selected, setSelected] = useState<number[]>([]);
    const [processing, setProcessing] = useState(false);

    const toggle = (id: number) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

    const submit = () =>
        router.post(
            route('competitions.games.attach', [team.id, competition.id]),
            { game_ids: selected },
            {
                preserveScroll: true,
                onStart: () => setProcessing(true),
                onFinish: () => setProcessing(false),
                onSuccess: () => {
                    setSelected([]);
                    onClose();
                },
            },
        );

    return (
        <Sheet
            open={open}
            onClose={onClose}
            title={`Add games to ${competition.name}`}
            footer={
                <Button className="w-full" disabled={!selected.length || processing} onClick={submit}>
                    Add {selected.length || ''} game{selected.length === 1 ? '' : 's'}
                </Button>
            }
        >
            <p className="mb-3 text-sm text-slate-500">Standalone games not already in a league or tournament.</p>
            <div className="divide-y divide-slate-100 rounded-2xl ring-1 ring-slate-200">
                {games.map((g) => {
                    const on = selected.includes(g.id);
                    return (
                        <button key={g.id} onClick={() => toggle(g.id)} className="flex w-full items-center gap-3 px-4 py-3 text-left active:bg-slate-50">
                            <span
                                className={clsx(
                                    'flex size-6 shrink-0 items-center justify-center rounded-md ring-1',
                                    on ? 'bg-navy-800 text-white ring-navy-800' : 'ring-slate-300',
                                )}
                            >
                                {on && <Check className="size-4" />}
                            </span>
                            <span className="flex-1 font-medium">{g.label}</span>
                            <span className="text-sm text-slate-500">{shortDate(g.played_on)}</span>
                        </button>
                    );
                })}
            </div>
        </Sheet>
    );
}
