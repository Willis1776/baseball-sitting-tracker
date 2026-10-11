<?php

namespace App\Services;

use App\Models\Game;
use App\Models\Player;
use App\Models\Sit;
use Illuminate\Support\Collection;

class SittingTotals
{
    /**
     * Sit counts keyed by player id, then game id.
     *
     * @param  Collection<int, Game>  $games
     * @return array<int, array<int, int>>
     */
    public static function byPlayerAndGame(Collection $games): array
    {
        $matrix = [];

        if ($games->isEmpty()) {
            return $matrix;
        }

        Sit::query()
            ->whereIn('game_id', $games->modelKeys())
            ->selectRaw('player_id, game_id, count(*) as sits')
            ->groupBy('player_id', 'game_id')
            ->get()
            ->each(function ($row) use (&$matrix) {
                $matrix[$row->player_id][$row->game_id] = (int) $row->sits;
            });

        return $matrix;
    }

    /**
     * A players-by-games report with per-game counts and running totals, in game order.
     *
     * @param  Collection<int, Player>  $players
     * @param  Collection<int, Game>  $games
     */
    public static function report(Collection $players, Collection $games): array
    {
        $matrix = self::byPlayerAndGame($games);

        $rows = $players->map(function (Player $player) use ($games, $matrix) {
            $running = 0;
            $perGame = [];
            $cumulative = [];

            foreach ($games as $game) {
                $count = $matrix[$player->id][$game->id] ?? 0;
                $running += $count;
                $perGame[] = $count;
                $cumulative[] = $running;
            }

            return [
                'player' => self::player($player),
                'per_game' => $perGame,
                'running' => $cumulative,
                'total' => $running,
            ];
        })->values()->all();

        return [
            'games' => $games->map(fn (Game $game) => self::game($game))->values()->all(),
            'rows' => $rows,
        ];
    }

    public static function player(Player $player): array
    {
        return [
            'id' => $player->id,
            'name' => $player->name,
            'jersey_number' => $player->jersey_number,
            'is_active' => $player->is_active,
            'sort_order' => $player->sort_order,
        ];
    }

    public static function game(Game $game): array
    {
        return [
            'id' => $game->id,
            'competition_id' => $game->competition_id,
            'competition' => $game->relationLoaded('competition') && $game->competition
                ? ['id' => $game->competition->id, 'name' => $game->competition->name, 'type' => $game->competition->type]
                : null,
            'opponent' => $game->opponent,
            'label' => $game->label(),
            'played_on' => $game->played_on->toDateString(),
            'starts_at' => $game->starts_at ? substr($game->starts_at, 0, 5) : null,
            'innings' => $game->innings,
            'notes' => $game->notes,
        ];
    }
}
