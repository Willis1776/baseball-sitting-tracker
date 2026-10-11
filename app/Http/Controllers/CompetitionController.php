<?php

namespace App\Http\Controllers;

use App\Models\Competition;
use App\Models\Game;
use App\Models\Team;
use App\Services\SittingTotals;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class CompetitionController extends Controller
{
    public function store(Request $request, Team $team): RedirectResponse
    {
        Gate::authorize('manage', $team);

        $competition = $team->competitions()->create($this->validated($request));

        return redirect()->route('competitions.show', [$team, $competition])
            ->with('success', ucfirst($competition->type).' created.');
    }

    public function show(Team $team, Competition $competition): Response
    {
        Gate::authorize('manage', $team);

        $games = $competition->games()->with('competition')->get();

        return Inertia::render('Competitions/Show', [
            'team' => TeamController::team($team),
            'competition' => self::summary($competition->loadCount('games')),
            'report' => SittingTotals::report($team->players()->get(), $games),
            'availableGames' => $team->games()
                ->whereNull('competition_id')
                ->orderByDesc('played_on')
                ->get()
                ->map(SittingTotals::game(...)),
        ]);
    }

    public function update(Request $request, Team $team, Competition $competition): RedirectResponse
    {
        Gate::authorize('manage', $team);

        $competition->update($this->validated($request));

        return back()->with('success', 'Saved.');
    }

    public function destroy(Team $team, Competition $competition): RedirectResponse
    {
        Gate::authorize('manage', $team);

        // Games stay with the team (competition_id is nulled by the foreign key).
        $competition->delete();

        return redirect()->route('teams.show', [$team, 'tab' => 'competitions'])
            ->with('success', ucfirst($competition->type).' deleted. Its games are still on the team.');
    }

    public function attachGames(Request $request, Team $team, Competition $competition): RedirectResponse
    {
        Gate::authorize('manage', $team);

        $ids = $request->validate([
            'game_ids' => ['required', 'array', 'min:1'],
            'game_ids.*' => ['integer', Rule::exists('games', 'id')->where('team_id', $team->id)],
        ])['game_ids'];

        $team->games()->whereKey($ids)->update(['competition_id' => $competition->id]);

        return back()->with('success', count($ids) === 1 ? 'Game added.' : count($ids).' games added.');
    }

    public function detachGame(Team $team, Competition $competition, Game $game): RedirectResponse
    {
        Gate::authorize('manage', $team);
        abort_unless($game->competition_id === $competition->id, 404);

        $game->update(['competition_id' => null]);

        return back()->with('success', 'Game removed from '.$competition->name.'.');
    }

    private function validated(Request $request): array
    {
        return $request->validate([
            'type' => ['required', Rule::in(Competition::TYPES)],
            'name' => ['required', 'string', 'max:100'],
            'starts_on' => ['nullable', 'date'],
            'ends_on' => ['nullable', 'date', 'after_or_equal:starts_on'],
        ]);
    }

    public static function summary(Competition $competition): array
    {
        return [
            'id' => $competition->id,
            'type' => $competition->type,
            'name' => $competition->name,
            'starts_on' => $competition->starts_on?->toDateString(),
            'ends_on' => $competition->ends_on?->toDateString(),
            'games_count' => $competition->games_count ?? null,
        ];
    }
}
