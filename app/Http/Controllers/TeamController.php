<?php

namespace App\Http\Controllers;

use App\Models\Competition;
use App\Models\Game;
use App\Models\Team;
use App\Models\TeamMember;
use App\Services\SittingTotals;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class TeamController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $teams = Team::accessibleBy($user)
            ->withCount(['players', 'games', 'competitions'])
            ->orderBy('name')
            ->get()
            ->map(fn (Team $team) => [
                ...$this->team($team),
                'players_count' => $team->players_count,
                'games_count' => $team->games_count,
                'competitions_count' => $team->competitions_count,
                'is_owner' => $team->isOwnedBy($user),
            ]);

        return Inertia::render('Teams/Index', ['teams' => $teams]);
    }

    public function store(Request $request): RedirectResponse
    {
        $team = $request->user()->teams()->create($this->validated($request));

        return redirect()->route('teams.show', [$team, 'tab' => 'roster'])
            ->with('success', 'Team created. Add your players to get started.');
    }

    public function show(Request $request, Team $team): Response
    {
        Gate::authorize('manage', $team);

        $players = $team->players()->get();
        $games = $team->games()->with('competition')->orderBy('played_on')->orderBy('starts_at')->orderBy('id')->get();
        $competitions = $team->competitions()->withCount('games')->orderByDesc('starts_on')->orderBy('name')->get();

        $owner = $team->user;

        return Inertia::render('Teams/Show', [
            'team' => $this->team($team),
            'isOwner' => $team->isOwnedBy($request->user()),
            'owner' => ['name' => $owner->name, 'email' => $owner->email],
            'members' => $team->members()->with('user:id,name,avatar')->get()->map(fn (TeamMember $m) => [
                'id' => $m->id,
                'email' => $m->email,
                'name' => $m->user?->name,
                'avatar' => $m->user?->avatar,
                'pending' => $m->user_id === null,
            ]),
            'players' => $players->map(SittingTotals::player(...)),
            'competitions' => $competitions->map(fn (Competition $c) => CompetitionController::summary($c)),
            'games' => $this->numbered($games)->reverse()->values(),
            'season' => SittingTotals::report($players, $games),
        ]);
    }

    public function update(Request $request, Team $team): RedirectResponse
    {
        Gate::authorize('manage', $team);

        $team->update($this->validated($request));

        return back()->with('success', 'Team updated.');
    }

    public function destroy(Team $team): RedirectResponse
    {
        Gate::authorize('administer', $team);

        $team->delete();

        return redirect()->route('teams.index')->with('success', 'Team deleted.');
    }

    /**
     * Game payloads with each game's number within its league/tournament ("Game 3").
     */
    private function numbered($games)
    {
        $counters = [];

        return $games->map(function (Game $game) use (&$counters) {
            $payload = SittingTotals::game($game);

            if ($game->competition_id) {
                $counters[$game->competition_id] = ($counters[$game->competition_id] ?? 0) + 1;
                $payload['label'] = 'Game '.$counters[$game->competition_id].($game->opponent ? ' · vs '.$game->opponent : '');
            }

            return $payload;
        });
    }

    private function validated(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'season' => ['nullable', 'string', 'max:50'],
            'innings_per_game' => ['required', 'integer', 'min:1', 'max:'.Game::MAX_INNINGS],
        ]);
    }

    public static function team(Team $team): array
    {
        return [
            'id' => $team->id,
            'name' => $team->name,
            'season' => $team->season,
            'innings_per_game' => $team->innings_per_game,
        ];
    }
}
