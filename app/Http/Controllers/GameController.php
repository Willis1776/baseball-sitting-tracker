<?php

namespace App\Http\Controllers;

use App\Models\Game;
use App\Models\Player;
use App\Models\Sit;
use App\Models\Team;
use App\Services\SittingTotals;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class GameController extends Controller
{
    public function store(Request $request, Team $team): RedirectResponse
    {
        Gate::authorize('manage', $team);

        $game = $team->games()->create($this->validated($request, $team));

        return redirect()->route('games.show', [$team, $game]);
    }

    public function show(Team $team, Game $game): Response
    {
        Gate::authorize('manage', $team);

        $game->load('competition');
        $roster = $team->players()->get();
        $lineupIds = $game->lineup()->pluck('players.id');
        $sits = $game->sits()->get(['player_id', 'inning']);

        $otherGames = $team->games()->whereKeyNot($game->id)->get(['id', 'competition_id', 'played_on', 'starts_at']);
        $matrix = SittingTotals::byPlayerAndGame($otherGames);

        // League/tournament column is a running total through this game, so only earlier games count.
        $earlierCompetitionGames = $game->competition_id
            ? $otherGames->where('competition_id', $game->competition_id)
                ->filter(fn (Game $other) => self::playedBefore($other, $game))
                ->modelKeys()
            : [];

        $otherTotals = $roster->mapWithKeys(fn (Player $p) => [$p->id => [
            'season' => array_sum($matrix[$p->id] ?? []),
            'competition' => $game->competition_id
                ? array_sum(array_intersect_key($matrix[$p->id] ?? [], array_flip($earlierCompetitionGames)))
                : null,
        ]]);

        $siblings = $game->competition_id ? $game->competition->games()->get(['games.id'])->values() : collect();
        $index = $siblings->search(fn (Game $g) => $g->id === $game->id);

        return Inertia::render('Games/Show', [
            'team' => TeamController::team($team),
            'game' => SittingTotals::game($game),
            'gameNumber' => $index === false ? null : $index + 1,
            'prevGameId' => $index ? $siblings[$index - 1]->id : null,
            'nextGameId' => $index !== false && isset($siblings[$index + 1]) ? $siblings[$index + 1]->id : null,
            'roster' => $roster->map(SittingTotals::player(...))->values(),
            'lineup' => $lineupIds->values(),
            'sits' => $sits->map(fn (Sit $s) => [$s->player_id, $s->inning])->values(),
            'otherTotals' => $otherTotals,
            'competitions' => $team->competitions()->orderBy('name')->get(['id', 'name', 'type']),
        ]);
    }

    public function update(Request $request, Team $team, Game $game): RedirectResponse
    {
        Gate::authorize('manage', $team);

        $data = $this->validated($request, $team);
        $game->update($data);

        // Drop sits recorded for innings that no longer exist.
        $game->sits()->where('inning', '>', $game->innings)->delete();

        return back()->with('success', 'Game updated.');
    }

    public function destroy(Team $team, Game $game): RedirectResponse
    {
        Gate::authorize('manage', $team);

        $competitionId = $game->competition_id;
        $game->delete();

        return $competitionId
            ? redirect()->route('competitions.show', [$team, $competitionId])->with('success', 'Game deleted.')
            : redirect()->route('teams.show', $team)->with('success', 'Game deleted.');
    }

    /**
     * Mark or unmark a single player/inning cell. Called from the sitting chart on every tap.
     */
    public function toggleSit(Request $request, Team $team, Game $game)
    {
        Gate::authorize('manage', $team);

        $data = $request->validate([
            'player_id' => ['required', 'integer', Rule::exists('game_player', 'player_id')->where('game_id', $game->id)],
            'inning' => ['required', 'integer', 'min:1', 'max:'.$game->innings],
            'sat' => ['required', 'boolean'],
        ]);

        $key = ['game_id' => $game->id, 'player_id' => $data['player_id'], 'inning' => $data['inning']];

        $data['sat'] ? Sit::firstOrCreate($key) : Sit::where($key)->delete();

        return response()->json(['ok' => true]);
    }

    /**
     * Add an extra inning from the sitting chart (up to the max).
     */
    public function addInning(Team $team, Game $game): RedirectResponse
    {
        Gate::authorize('manage', $team);
        abort_if($game->innings >= Game::MAX_INNINGS, 422, 'Games are limited to '.Game::MAX_INNINGS.' innings.');

        $game->increment('innings');

        return back();
    }

    /**
     * Add or remove a player from this game's lineup. Removing also clears their sits in this game.
     */
    public function updateLineup(Request $request, Team $team, Game $game)
    {
        Gate::authorize('manage', $team);

        $data = $request->validate([
            'player_id' => ['required', 'integer', Rule::exists('players', 'id')->where('team_id', $team->id)],
            'playing' => ['required', 'boolean'],
        ]);

        if ($data['playing']) {
            $game->lineup()->syncWithoutDetaching([$data['player_id']]);
        } else {
            $game->lineup()->detach($data['player_id']);
            $game->sits()->where('player_id', $data['player_id'])->delete();
        }

        return back();
    }

    /**
     * Chronological order used for running totals: date, then start time, then creation order.
     */
    public static function playedBefore(Game $a, Game $b): bool
    {
        return [$a->played_on->toDateString(), $a->starts_at ?? '', $a->id]
            < [$b->played_on->toDateString(), $b->starts_at ?? '', $b->id];
    }

    private function validated(Request $request, Team $team): array
    {
        $data = $request->validate([
            'competition_id' => ['nullable', 'integer', Rule::exists('competitions', 'id')->where('team_id', $team->id)],
            'opponent' => ['nullable', 'string', 'max:100'],
            'played_on' => ['required', 'date'],
            'starts_at' => ['required', 'date_format:H:i'],
            'innings' => ['nullable', 'integer', 'min:1', 'max:'.Game::MAX_INNINGS],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $data['innings'] ??= $team->innings_per_game;

        return $data;
    }
}
