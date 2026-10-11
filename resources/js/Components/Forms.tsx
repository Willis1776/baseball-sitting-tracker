import { useForm } from '@inertiajs/react';
import clsx from 'clsx';
import { FormEvent } from 'react';
import Sheet from '@/Components/Sheet';
import { Button, Field, Input, Select, Textarea } from '@/Components/ui';
import { today } from '@/lib/format';
import { route } from '@/lib/route';
import { Competition, CompetitionType, Game, Team } from '@/types';

type SheetProps = { open: boolean; onClose: () => void };

export function TeamFormSheet({ open, onClose, team }: SheetProps & { team?: Team }) {
    const form = useForm({
        name: team?.name ?? '',
        season: team?.season ?? String(new Date().getFullYear()),
        innings_per_game: team?.innings_per_game ?? 6,
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        const options = { preserveScroll: true, onSuccess: () => onClose() };
        team ? form.put(route('teams.update', team.id), options) : form.post(route('teams.store'), options);
    };

    return (
        <Sheet
            open={open}
            onClose={onClose}
            title={team ? 'Edit team' : 'New team'}
            footer={
                <Button type="submit" form="team-form" className="w-full" disabled={form.processing}>
                    {team ? 'Save team' : 'Create team'}
                </Button>
            }
        >
            <form id="team-form" onSubmit={submit} className="space-y-4">
                <Field label="Team name" error={form.errors.name} id="team-name">
                    <Input id="team-name" value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} placeholder="e.g. 10U Thunder" autoFocus={!team} />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                    <Field label="Season" error={form.errors.season} id="team-season">
                        <Input id="team-season" value={form.data.season} onChange={(e) => form.setData('season', e.target.value)} placeholder="Spring 2026" />
                    </Field>
                    <Field label="Innings / game" error={form.errors.innings_per_game} id="team-innings">
                        <Input
                            id="team-innings"
                            type="number"
                            inputMode="numeric"
                            min={1}
                            max={9}
                            value={form.data.innings_per_game}
                            onChange={(e) => form.setData('innings_per_game', Number(e.target.value))}
                        />
                    </Field>
                </div>
            </form>
        </Sheet>
    );
}

export function CompetitionFormSheet({
    open,
    onClose,
    team,
    competition,
    defaultType = 'tournament',
}: SheetProps & { team: Team; competition?: Competition; defaultType?: CompetitionType }) {
    const form = useForm({
        type: competition?.type ?? defaultType,
        name: competition?.name ?? '',
        starts_on: competition?.starts_on ?? '',
        ends_on: competition?.ends_on ?? '',
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        const options = { preserveScroll: true, onSuccess: () => onClose() };
        competition
            ? form.put(route('competitions.update', [team.id, competition.id]), options)
            : form.post(route('competitions.store', team.id), options);
    };

    return (
        <Sheet
            open={open}
            onClose={onClose}
            title={competition ? `Edit ${form.data.type}` : 'New league or tournament'}
            footer={
                <Button type="submit" form="competition-form" className="w-full" disabled={form.processing}>
                    {competition ? 'Save' : `Create ${form.data.type}`}
                </Button>
            }
        >
            <form id="competition-form" onSubmit={submit} className="space-y-4">
                <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
                    {(['league', 'tournament'] as const).map((type) => (
                        <button
                            key={type}
                            type="button"
                            onClick={() => form.setData('type', type)}
                            className={clsx(
                                'h-10 rounded-lg text-sm font-semibold capitalize',
                                form.data.type === type ? 'bg-white text-navy-800 shadow-sm' : 'text-slate-500',
                            )}
                        >
                            {type}
                        </button>
                    ))}
                </div>
                <Field label="Name" error={form.errors.name} id="comp-name">
                    <Input
                        id="comp-name"
                        value={form.data.name}
                        onChange={(e) => form.setData('name', e.target.value)}
                        placeholder={form.data.type === 'league' ? 'e.g. Fall Rec League' : 'e.g. Labor Day Classic'}
                    />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                    <Field label="Starts" error={form.errors.starts_on} id="comp-start">
                        <Input id="comp-start" type="date" value={form.data.starts_on} onChange={(e) => form.setData('starts_on', e.target.value)} />
                    </Field>
                    <Field label="Ends" error={form.errors.ends_on} id="comp-end">
                        <Input id="comp-end" type="date" value={form.data.ends_on} onChange={(e) => form.setData('ends_on', e.target.value)} />
                    </Field>
                </div>
            </form>
        </Sheet>
    );
}

export function GameFormSheet({
    open,
    onClose,
    team,
    game,
    competitions,
    competitionId,
}: SheetProps & {
    team: Team;
    game?: Game;
    competitions: Pick<Competition, 'id' | 'name' | 'type'>[];
    competitionId?: number | null;
}) {
    const form = useForm({
        opponent: game?.opponent ?? '',
        played_on: game?.played_on ?? today(),
        starts_at: game?.starts_at ?? '',
        innings: game?.innings ?? team.innings_per_game,
        competition_id: (game ? game.competition_id : competitionId) ?? ('' as number | ''),
        notes: game?.notes ?? '',
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        form.transform((data) => ({ ...data, competition_id: data.competition_id || null, starts_at: data.starts_at || null }));
        const options = { preserveScroll: true, onSuccess: () => onClose() };
        game ? form.put(route('games.update', [team.id, game.id]), options) : form.post(route('games.store', team.id), options);
    };

    return (
        <Sheet
            open={open}
            onClose={onClose}
            title={game ? 'Edit game' : 'New game'}
            footer={
                <Button type="submit" form="game-form" className="w-full" disabled={form.processing}>
                    {game ? 'Save game' : 'Create game & open chart'}
                </Button>
            }
        >
            <form id="game-form" onSubmit={submit} className="space-y-4">
                <Field label="Opponent" error={form.errors.opponent} id="game-opp">
                    <Input id="game-opp" value={form.data.opponent} onChange={(e) => form.setData('opponent', e.target.value)} placeholder="Optional" />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                    <Field label="Date" error={form.errors.played_on} id="game-date">
                        <Input id="game-date" type="date" value={form.data.played_on} onChange={(e) => form.setData('played_on', e.target.value)} />
                    </Field>
                    <Field label="Time" error={form.errors.starts_at} id="game-time">
                        <Input id="game-time" type="time" value={form.data.starts_at} onChange={(e) => form.setData('starts_at', e.target.value)} />
                    </Field>
                </div>
                <div className="grid grid-cols-[1fr_7rem] gap-3">
                    <Field label="League / tournament" error={form.errors.competition_id} id="game-comp">
                        <Select
                            id="game-comp"
                            value={form.data.competition_id}
                            onChange={(e) => form.setData('competition_id', e.target.value ? Number(e.target.value) : '')}
                        >
                            <option value="">None (standalone)</option>
                            {competitions.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.name} ({c.type})
                                </option>
                            ))}
                        </Select>
                    </Field>
                    <Field label="Innings" error={form.errors.innings} id="game-innings">
                        <Input
                            id="game-innings"
                            type="number"
                            inputMode="numeric"
                            min={1}
                            max={9}
                            value={form.data.innings}
                            onChange={(e) => form.setData('innings', Number(e.target.value))}
                        />
                    </Field>
                </div>
                <Field label="Notes" error={form.errors.notes} id="game-notes">
                    <Textarea id="game-notes" rows={2} value={form.data.notes} onChange={(e) => form.setData('notes', e.target.value)} />
                </Field>
            </form>
        </Sheet>
    );
}
