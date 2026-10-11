import { Link } from '@inertiajs/react';
import { ChevronRight, Plus, Users } from 'lucide-react';
import { useState } from 'react';
import { TeamFormSheet } from '@/Components/Forms';
import { Badge, Button, Card, EmptyState } from '@/Components/ui';
import AppLayout from '@/Layouts/AppLayout';
import { plural } from '@/lib/format';
import { route } from '@/lib/route';
import { Team } from '@/types';

type TeamRow = Team & { players_count: number; games_count: number; competitions_count: number; is_owner: boolean };

export default function TeamsIndex({ teams }: { teams: TeamRow[] }) {
    const [creating, setCreating] = useState(false);

    return (
        <AppLayout title="My Teams">
            {teams.length === 0 ? (
                <Card>
                    <EmptyState icon={<Users className="size-12" />} title="No teams yet">
                        Create your first team, then add players to the roster.
                        <div className="mt-5">
                            <Button onClick={() => setCreating(true)}>
                                <Plus className="size-5" /> New team
                            </Button>
                        </div>
                    </EmptyState>
                </Card>
            ) : (
                <>
                    <div className="space-y-3">
                        {teams.map((team) => (
                            <Link key={team.id} href={route('teams.show', team.id)} className="block">
                                <Card className="flex items-center gap-4 p-4 active:bg-slate-50">
                                    <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-navy-800 text-lg font-bold text-white">
                                        {team.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="truncate text-lg font-bold">{team.name}</span>
                                            {!team.is_owner && <Badge tone="navy">Shared</Badge>}
                                        </div>
                                        <div className="truncate text-sm text-slate-500">
                                            {[team.season, plural(team.players_count, 'player'), plural(team.games_count, 'game')].filter(Boolean).join(' · ')}
                                        </div>
                                    </div>
                                    <ChevronRight className="size-5 text-slate-400" />
                                </Card>
                            </Link>
                        ))}
                    </div>
                    <Button variant="secondary" className="mt-4 w-full" onClick={() => setCreating(true)}>
                        <Plus className="size-5" /> Add another team
                    </Button>
                </>
            )}
            <TeamFormSheet open={creating} onClose={() => setCreating(false)} />
        </AppLayout>
    );
}
