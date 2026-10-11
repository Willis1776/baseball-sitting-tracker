import { Link, router, useForm, usePage } from '@inertiajs/react';
import clsx from 'clsx';
import { ArrowDown, ArrowUp, BarChart3, CalendarDays, ChevronRight, Pencil, Plus, Settings, Trophy, Users } from 'lucide-react';
import { FormEvent, ReactNode, useMemo, useState } from 'react';
import { CompetitionFormSheet, GameFormSheet, TeamFormSheet } from '@/Components/Forms';
import Sheet, { ConfirmSheet } from '@/Components/Sheet';
import TotalsTable from '@/Components/TotalsTable';
import { Badge, Button, Card, EmptyState, Field, Input, Toggle } from '@/Components/ui';
import AppLayout from '@/Layouts/AppLayout';
import { dateRange, plural, shortDate, time, typeLabel } from '@/lib/format';
import { filterReport } from '@/lib/report';
import { route } from '@/lib/route';
import { Competition, Game, Player, Report, SharedProps, Team } from '@/types';

type Tab = 'games' | 'competitions' | 'roster' | 'totals';

type Props = {
    team: Team;
    players: Player[];
    competitions: Competition[];
    games: Game[];
    season: Report;
    isOwner: boolean;
    owner: { name: string; email: string };
    members: Member[];
};

type Member = { id: number; email: string; name: string | null; avatar: string | null; pending: boolean };

export default function TeamShow(props: Props) {
    const { team } = props;
    const [tab, setTabState] = useState<Tab>(() => {
        const t = new URLSearchParams(window.location.search).get('tab');
        return (['games', 'competitions', 'roster', 'totals'].includes(t ?? '') ? t : 'games') as Tab;
    });
    const [settings, setSettings] = useState(false);

    const setTab = (t: Tab) => {
        setTabState(t);
        const url = new URL(window.location.href);
        url.searchParams.set('tab', t);
        window.history.replaceState(window.history.state, '', url);
        window.scrollTo({ top: 0 });
    };

    const activeCount = props.players.filter((p) => p.is_active).length;

    return (
        <AppLayout
            title={team.name}
            subtitle={[team.season, `${activeCount}/${props.players.length} active`].filter(Boolean).join(' · ')}
            back={{ href: route('teams.index'), label: 'teams' }}
            actions={
                <button onClick={() => setSettings(true)} className="rounded-lg p-2 text-navy-100 active:bg-white/10" aria-label="Team settings">
                    <Settings className="size-5" />
                </button>
            }
            bottom={
                <div className="grid grid-cols-4">
                    <TabButton active={tab === 'games'} onClick={() => setTab('games')} icon={<CalendarDays />} label="Games" />
                    <TabButton active={tab === 'competitions'} onClick={() => setTab('competitions')} icon={<Trophy />} label="Leagues" />
                    <TabButton active={tab === 'roster'} onClick={() => setTab('roster')} icon={<Users />} label="Roster" />
                    <TabButton active={tab === 'totals'} onClick={() => setTab('totals')} icon={<BarChart3 />} label="Totals" />
                </div>
            }
        >
            {tab === 'games' && <GamesTab {...props} />}
            {tab === 'competitions' && <CompetitionsTab {...props} />}
            {tab === 'roster' && <RosterTab {...props} />}
            {tab === 'totals' && <TotalsTab {...props} />}

            <TeamSettings {...props} open={settings} onClose={() => setSettings(false)} />
        </AppLayout>
    );
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: ReactNode; label: string }) {
    return (
        <button
            onClick={onClick}
            className={clsx('flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-semibold [&_svg]:size-6', active ? 'text-navy-800' : 'text-slate-400')}
        >
            {icon}
            {label}
        </button>
    );
}

function SectionHeader({ title, action }: { title: string; action?: ReactNode }) {
    return (
        <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold">{title}</h2>
            {action}
        </div>
    );
}

/* ----------------------------------------------------------------------------- Games */

function GamesTab({ team, games, competitions, players }: Props) {
    const [creating, setCreating] = useState(false);

    return (
        <div>
            <SectionHeader
                title="Games"
                action={
                    <Button size="sm" onClick={() => setCreating(true)}>
                        <Plus className="size-4" /> New game
                    </Button>
                }
            />
            {players.length === 0 && (
                <Card className="mb-3 border-l-4 border-amber-400 p-4 text-sm text-slate-600">Add players on the Roster tab before charting a game.</Card>
            )}
            {games.length === 0 ? (
                <Card>
                    <EmptyState icon={<CalendarDays className="size-12" />} title="No games yet">
                        Games can stand alone or belong to a league or tournament.
                    </EmptyState>
                </Card>
            ) : (
                <Card className="divide-y divide-slate-100 overflow-hidden">
                    {games.map((game) => (
                        <GameRow key={game.id} team={team} game={game} />
                    ))}
                </Card>
            )}
            <GameFormSheet open={creating} onClose={() => setCreating(false)} team={team} competitions={competitions} />
        </div>
    );
}

export function GameRow({ team, game, label, trailing }: { team: Team; game: Game; label?: string; trailing?: ReactNode }) {
    return (
        <div className="flex items-center">
            <Link href={route('games.show', [team.id, game.id])} className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3 active:bg-slate-50">
                <div className="w-12 shrink-0 text-center">
                    <div className="text-[11px] font-semibold text-slate-400 uppercase">{shortDate(game.played_on).split(' ')[0]}</div>
                    <div className="text-xl leading-none font-bold text-navy-800">{shortDate(game.played_on).split(' ')[1]}</div>
                </div>
                <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold">{label ?? game.label}</div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                        {game.competition && <Badge tone={game.competition.type === 'league' ? 'navy' : 'amber'}>{game.competition.name}</Badge>}
                        {time(game.starts_at) && <span>{time(game.starts_at)}</span>}
                        <span>{game.innings} inn</span>
                    </div>
                </div>
                <ChevronRight className="size-5 shrink-0 text-slate-300" />
            </Link>
            {trailing}
        </div>
    );
}

/* ----------------------------------------------------------------------------- Leagues & tournaments */

function CompetitionsTab({ team, competitions }: Props) {
    const [creating, setCreating] = useState(false);

    return (
        <div>
            <SectionHeader
                title="Leagues & Tournaments"
                action={
                    <Button size="sm" onClick={() => setCreating(true)}>
                        <Plus className="size-4" /> New
                    </Button>
                }
            />
            {competitions.length === 0 ? (
                <Card>
                    <EmptyState icon={<Trophy className="size-12" />} title="None yet">
                        Group games into a league or tournament to see running sitting totals across them.
                    </EmptyState>
                </Card>
            ) : (
                <div className="space-y-3">
                    {competitions.map((c) => (
                        <Link key={c.id} href={route('competitions.show', [team.id, c.id])} className="block">
                            <Card className="flex items-center gap-3 p-4 active:bg-slate-50">
                                <div
                                    className={clsx(
                                        'flex size-11 shrink-0 items-center justify-center rounded-xl',
                                        c.type === 'league' ? 'bg-navy-50 text-navy-700' : 'bg-amber-50 text-amber-600',
                                    )}
                                >
                                    <Trophy className="size-5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="truncate font-bold">{c.name}</div>
                                    <div className="text-sm text-slate-500">
                                        {[typeLabel(c.type), plural(c.games_count ?? 0, 'game'), dateRange(c.starts_on, c.ends_on)].filter(Boolean).join(' · ')}
                                    </div>
                                </div>
                                <ChevronRight className="size-5 text-slate-300" />
                            </Card>
                        </Link>
                    ))}
                </div>
            )}
            <CompetitionFormSheet open={creating} onClose={() => setCreating(false)} team={team} />
        </div>
    );
}

/* ----------------------------------------------------------------------------- Roster */

function RosterTab({ team, players }: Props) {
    const form = useForm({ name: '', jersey_number: '' });
    const [editing, setEditing] = useState<Player | null>(null);
    const [ordering, setOrdering] = useState(false);

    const add = (e: FormEvent) => {
        e.preventDefault();
        form.post(route('players.store', team.id), { preserveScroll: true, onSuccess: () => form.reset() });
    };

    const setActive = (player: Player, is_active: boolean) =>
        router.patch(route('players.update', [team.id, player.id]), { is_active }, { preserveScroll: true });

    const move = (index: number, delta: number) => {
        const ids = players.map((p) => p.id);
        const [id] = ids.splice(index, 1);
        ids.splice(index + delta, 0, id);
        router.put(route('players.reorder', team.id), { ids }, { preserveScroll: true });
    };

    return (
        <div>
            <SectionHeader
                title="Roster"
                action={
                    players.length > 1 && (
                        <Button size="sm" variant={ordering ? 'primary' : 'secondary'} onClick={() => setOrdering(!ordering)}>
                            {ordering ? 'Done' : 'Reorder'}
                        </Button>
                    )
                }
            />

            <Card className="mb-3 p-3">
                <form onSubmit={add} className="flex gap-2">
                    <Input
                        className="w-16 shrink-0 text-center"
                        placeholder="#"
                        inputMode="numeric"
                        maxLength={4}
                        value={form.data.jersey_number}
                        onChange={(e) => form.setData('jersey_number', e.target.value)}
                        aria-label="Jersey number"
                    />
                    <Input placeholder="Player name" value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} aria-label="Player name" />
                    <Button type="submit" disabled={form.processing || !form.data.name.trim()} className="shrink-0 px-3" aria-label="Add player">
                        <Plus className="size-5" />
                    </Button>
                </form>
                {form.errors.name && <p className="mt-1 text-sm text-stitch-600">{form.errors.name}</p>}
            </Card>

            <p className="mb-2 px-1 text-xs text-slate-500">
                <span className="font-semibold text-emerald-600">Active</span> players are added to each new game's lineup. Inactive players keep their totals and can still be added to a specific game.
            </p>

            {players.length === 0 ? (
                <Card>
                    <EmptyState icon={<Users className="size-12" />} title="No players yet">
                        Add your players above.
                    </EmptyState>
                </Card>
            ) : (
                <Card className="divide-y divide-slate-100 overflow-hidden">
                    {players.map((player, index) => (
                        <div key={player.id} className={clsx('flex items-center gap-3 px-4 py-2.5', !player.is_active && 'bg-slate-50')}>
                            <div className="w-8 text-center text-sm font-semibold text-slate-400">{player.jersey_number ? `#${player.jersey_number}` : ''}</div>
                            <div className={clsx('min-w-0 flex-1 truncate font-semibold', !player.is_active && 'text-slate-400')}>{player.name}</div>
                            {ordering ? (
                                <div className="flex gap-1">
                                    <button disabled={index === 0} onClick={() => move(index, -1)} className="rounded-lg p-2 text-slate-600 ring-1 ring-slate-200 disabled:opacity-30" aria-label={`Move ${player.name} up`}>
                                        <ArrowUp className="size-4" />
                                    </button>
                                    <button
                                        disabled={index === players.length - 1}
                                        onClick={() => move(index, 1)}
                                        className="rounded-lg p-2 text-slate-600 ring-1 ring-slate-200 disabled:opacity-30"
                                        aria-label={`Move ${player.name} down`}
                                    >
                                        <ArrowDown className="size-4" />
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <button onClick={() => setEditing(player)} className="rounded-lg p-2 text-slate-400 active:bg-slate-100" aria-label={`Edit ${player.name}`}>
                                        <Pencil className="size-4" />
                                    </button>
                                    <Toggle checked={player.is_active} onChange={(v) => setActive(player, v)} label={`${player.name} active`} />
                                </>
                            )}
                        </div>
                    ))}
                </Card>
            )}

            {editing && <PlayerSheet team={team} player={editing} onClose={() => setEditing(null)} />}
        </div>
    );
}

function PlayerSheet({ team, player, onClose }: { team: Team; player: Player; onClose: () => void }) {
    const form = useForm({ name: player.name, jersey_number: player.jersey_number ?? '' });
    const [confirming, setConfirming] = useState(false);

    const submit = (e: FormEvent) => {
        e.preventDefault();
        form.patch(route('players.update', [team.id, player.id]), { preserveScroll: true, onSuccess: onClose });
    };

    return (
        <>
            <Sheet
                open={!confirming}
                onClose={onClose}
                title="Edit player"
                footer={
                    <div className="grid grid-cols-[auto_1fr] gap-3">
                        <Button variant="secondary" className="text-stitch-600" onClick={() => setConfirming(true)}>
                            Remove
                        </Button>
                        <Button type="submit" form="player-form" disabled={form.processing}>
                            Save
                        </Button>
                    </div>
                }
            >
                <form id="player-form" onSubmit={submit} className="grid grid-cols-[5rem_1fr] gap-3">
                    <Field label="Number" error={form.errors.jersey_number} id="p-num">
                        <Input id="p-num" inputMode="numeric" maxLength={4} value={form.data.jersey_number} onChange={(e) => form.setData('jersey_number', e.target.value)} />
                    </Field>
                    <Field label="Name" error={form.errors.name} id="p-name">
                        <Input id="p-name" value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} />
                    </Field>
                </form>
            </Sheet>
            <ConfirmSheet
                open={confirming}
                onClose={() => setConfirming(false)}
                title={`Remove ${player.name}?`}
                message={
                    <>
                        This permanently deletes {player.name} and <strong>all of their sitting history</strong>. To just hide them from game charts, switch them to
                        inactive instead.
                    </>
                }
                confirmLabel="Remove player"
                onConfirm={() => router.delete(route('players.destroy', [team.id, player.id]), { preserveScroll: true, onSuccess: onClose })}
            />
        </>
    );
}

/* ----------------------------------------------------------------------------- Totals */

function TotalsTab({ team, season, competitions }: Props) {
    const [filter, setFilter] = useState<'all' | 'standalone' | number>('all');

    const report = useMemo(() => {
        if (filter === 'all') return season;
        if (filter === 'standalone') return filterReport(season, (g) => g.competition_id === null);
        return filterReport(season, (g) => g.competition_id === filter);
    }, [season, filter]);

    const chips: [typeof filter, string][] = [
        ['all', 'All games'],
        ...competitions.map((c) => [c.id, c.name] as [number, string]),
        ['standalone', 'Standalone'],
    ];

    return (
        <div>
            <SectionHeader title="Sitting Totals" />
            <div className="no-scrollbar -mx-3 mb-3 flex gap-2 overflow-x-auto px-3">
                {chips.map(([key, label]) => (
                    <button
                        key={String(key)}
                        onClick={() => setFilter(key)}
                        className={clsx(
                            'h-9 shrink-0 rounded-full px-4 text-sm font-semibold whitespace-nowrap',
                            filter === key ? 'bg-navy-800 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200',
                        )}
                    >
                        {label}
                    </button>
                ))}
            </div>
            {report.games.length === 0 ? (
                <Card>
                    <EmptyState icon={<BarChart3 className="size-12" />} title="No games to total yet" />
                </Card>
            ) : (
                <TotalsTable report={report} team={team} />
            )}
        </div>
    );
}

/* ----------------------------------------------------------------------------- Settings */

function TeamSettings({ team, isOwner, owner, members, open, onClose }: Props & { open: boolean; onClose: () => void }) {
    const [mode, setMode] = useState<'menu' | 'edit' | 'delete' | 'coaches'>('menu');
    const close = () => {
        setMode('menu');
        onClose();
    };

    return (
        <>
            <Sheet open={open && mode === 'menu'} onClose={close} title="Team settings">
                <div className="divide-y divide-slate-100 rounded-2xl ring-1 ring-slate-200">
                    <button onClick={() => setMode('edit')} className="block w-full px-4 py-3.5 text-left font-medium active:bg-slate-50">
                        Edit team details
                    </button>
                    <button onClick={() => setMode('coaches')} className="flex w-full items-center justify-between px-4 py-3.5 text-left font-medium active:bg-slate-50">
                        Coaches
                        <span className="text-sm text-slate-400">{members.length + 1}</span>
                    </button>
                    {isOwner && (
                        <button onClick={() => setMode('delete')} className="block w-full px-4 py-3.5 text-left font-medium text-stitch-600 active:bg-slate-50">
                            Delete team
                        </button>
                    )}
                </div>
            </Sheet>
            <TeamFormSheet open={open && mode === 'edit'} onClose={close} team={team} />
            <CoachesSheet open={open && mode === 'coaches'} onClose={close} team={team} isOwner={isOwner} owner={owner} members={members} />
            <ConfirmSheet
                open={open && mode === 'delete'}
                onClose={close}
                title={`Delete ${team.name}?`}
                message="This permanently deletes the team, its roster, leagues, tournaments, games and all sitting history for every coach."
                confirmLabel="Delete team"
                onConfirm={() => router.delete(route('teams.destroy', team.id))}
            />
        </>
    );
}

function CoachesSheet({
    open,
    onClose,
    team,
    isOwner,
    owner,
    members,
}: {
    open: boolean;
    onClose: () => void;
    team: Team;
    isOwner: boolean;
    owner: Props['owner'];
    members: Member[];
}) {
    const { auth } = usePage<SharedProps>().props;
    const form = useForm({ email: '' });
    const [removing, setRemoving] = useState<Member | null>(null);

    const invite = (e: FormEvent) => {
        e.preventDefault();
        form.post(route('members.store', team.id), { preserveScroll: true, onSuccess: () => form.reset() });
    };

    const isMe = (m: Member) => m.email === auth.user?.email.toLowerCase();

    return (
        <>
            <Sheet open={open && !removing} onClose={onClose} title="Coaches">
                <p className="mb-3 text-sm text-slate-500">
                    Coaches can manage the roster, leagues, games and sitting charts. Only the owner can add or remove coaches and delete the team.
                </p>

                {isOwner && (
                    <form onSubmit={invite} className="mb-4">
                        <div className="flex gap-2">
                            <Input
                                type="email"
                                inputMode="email"
                                autoCapitalize="none"
                                placeholder="coach@gmail.com"
                                value={form.data.email}
                                onChange={(e) => form.setData('email', e.target.value)}
                                aria-label="Coach's Google email"
                            />
                            <Button type="submit" disabled={form.processing || !form.data.email.trim()} className="shrink-0">
                                Add
                            </Button>
                        </div>
                        {form.errors.email && <p className="mt-1 text-sm text-stitch-600">{form.errors.email}</p>}
                        <p className="mt-1.5 text-xs text-slate-500">They'll see this team the next time they sign in with that Google account. No email is sent.</p>
                    </form>
                )}

                <div className="divide-y divide-slate-100 rounded-2xl ring-1 ring-slate-200">
                    <div className="flex items-center gap-3 px-4 py-3">
                        <div className="min-w-0 flex-1">
                            <div className="truncate font-semibold">{owner.name}</div>
                            <div className="truncate text-sm text-slate-500">{owner.email}</div>
                        </div>
                        <Badge tone="navy">Owner</Badge>
                    </div>
                    {members.map((m) => (
                        <div key={m.id} className="flex items-center gap-3 px-4 py-3">
                            <div className="min-w-0 flex-1">
                                <div className="truncate font-semibold">{m.name ?? m.email}</div>
                                {m.name && <div className="truncate text-sm text-slate-500">{m.email}</div>}
                            </div>
                            {m.pending && <Badge tone="amber">Not signed in yet</Badge>}
                            {(isOwner || isMe(m)) && (
                                <button onClick={() => setRemoving(m)} className="rounded-lg px-2 py-1 text-sm font-semibold text-stitch-600 active:bg-stitch-50">
                                    {isMe(m) ? 'Leave' : 'Remove'}
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </Sheet>
            <ConfirmSheet
                open={open && removing !== null}
                onClose={() => setRemoving(null)}
                title={removing && isMe(removing) ? `Leave ${team.name}?` : `Remove ${removing?.name ?? removing?.email}?`}
                message={removing && isMe(removing) ? 'You will lose access to this team.' : 'They will lose access to this team. Their past work stays.'}
                confirmLabel={removing && isMe(removing) ? 'Leave team' : 'Remove'}
                onConfirm={() =>
                    removing &&
                    router.delete(route('members.destroy', [team.id, removing.id]), { preserveScroll: true, onSuccess: () => setRemoving(null) })
                }
            />
        </>
    );
}
