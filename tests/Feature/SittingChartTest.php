<?php

namespace Tests\Feature;

use App\Models\Game;
use App\Models\Team;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SittingChartTest extends TestCase
{
    use RefreshDatabase;

    private User $owner;

    private Team $team;

    protected function setUp(): void
    {
        parent::setUp();
        $this->owner = User::factory()->create();
        $this->team = Team::factory()->for($this->owner)->create();
        $this->actingAs($this->owner);
    }

    private function newGame(array $attributes = []): Game
    {
        $this->post(route('games.store', $this->team), ['played_on' => '2026-10-10', 'starts_at' => '18:00', ...$attributes]);

        return $this->team->games()->latest('id')->first();
    }

    private function sit(Game $game, int $playerId, int $inning, bool $sat = true)
    {
        return $this->putJson(route('games.sits.toggle', [$this->team, $game]), ['player_id' => $playerId, 'inning' => $inning, 'sat' => $sat]);
    }

    public function test_new_game_snapshots_active_roster_as_lineup(): void
    {
        $active = $this->team->players()->create(['name' => 'Active']);
        $inactive = $this->team->players()->create(['name' => 'Benched', 'is_active' => false]);

        $game = $this->newGame();
        $this->assertEquals([$active->id], $game->lineup()->pluck('players.id')->all());
        $this->assertSame($this->team->innings_per_game, $game->innings);

        // Later roster changes don't rewrite an existing game's lineup.
        $active->update(['is_active' => false]);
        $this->assertEquals([$active->id], $game->lineup()->pluck('players.id')->all());

        // But the lineup can be edited per game.
        $this->put(route('games.lineup.update', [$this->team, $game]), ['player_id' => $inactive->id, 'playing' => true]);
        $this->assertEqualsCanonicalizing([$active->id, $inactive->id], $game->lineup()->pluck('players.id')->all());
    }

    public function test_toggling_sits(): void
    {
        $player = $this->team->players()->create(['name' => 'Kash']);
        $game = $this->newGame();

        $this->sit($game, $player->id, 2)->assertOk();
        $this->sit($game, $player->id, 2)->assertOk(); // idempotent
        $this->assertSame(1, $game->sits()->count());

        $this->sit($game, $player->id, 2, false)->assertOk();
        $this->assertSame(0, $game->sits()->count());

        $this->sit($game, $player->id, 7)->assertUnprocessable(); // beyond innings
    }

    public function test_cannot_sit_a_player_outside_the_lineup(): void
    {
        $player = $this->team->players()->create(['name' => 'Absent', 'is_active' => false]);
        $game = $this->newGame();

        $this->sit($game, $player->id, 1)->assertUnprocessable();
    }

    public function test_removing_from_lineup_clears_that_players_sits(): void
    {
        $player = $this->team->players()->create(['name' => 'Kash']);
        $game = $this->newGame();
        $this->sit($game, $player->id, 1);

        $this->put(route('games.lineup.update', [$this->team, $game]), ['player_id' => $player->id, 'playing' => false]);

        $this->assertSame(0, $game->sits()->count());
        $this->assertSame(0, $game->lineup()->count());
    }

    public function test_game_chart_totals_run_through_this_game_and_season_covers_all(): void
    {
        $player = $this->team->players()->create(['name' => 'Kash']);
        $tournament = $this->team->competitions()->create(['type' => 'tournament', 'name' => 'Classic']);

        $g1 = $this->newGame(['competition_id' => $tournament->id, 'played_on' => '2026-10-01', 'starts_at' => '09:00']);
        $g2 = $this->newGame(['competition_id' => $tournament->id, 'played_on' => '2026-10-01', 'starts_at' => '13:00']);
        $g3 = $this->newGame(['competition_id' => $tournament->id, 'played_on' => '2026-10-02']);
        $standalone = $this->newGame(['played_on' => '2026-09-20']);

        $this->sit($g1, $player->id, 1);
        $this->sit($g1, $player->id, 2);
        $this->sit($g3, $player->id, 1);
        $this->sit($standalone, $player->id, 4);

        $this->get(route('games.show', [$this->team, $g2]))
            ->assertInertia(fn ($page) => $page
                ->component('Games/Show')
                ->where('gameNumber', 2)
                ->where('prevGameId', $g1->id)
                ->where('nextGameId', $g3->id)
                // Earlier tournament games only (g1), excludes later g3 and the standalone game.
                ->where("otherTotals.{$player->id}.competition", 2)
                // Season = every other game regardless of date.
                ->where("otherTotals.{$player->id}.season", 4));

        $this->get(route('competitions.show', [$this->team, $tournament]))
            ->assertInertia(fn ($page) => $page
                ->component('Competitions/Show')
                ->has('report.games', 3)
                ->where('report.rows.0.per_game', [2, 0, 1])
                ->where('report.rows.0.running', [2, 2, 3])
                ->where('report.rows.0.total', 3));
    }

    public function test_attach_and_detach_games_from_a_league(): void
    {
        $league = $this->team->competitions()->create(['type' => 'league', 'name' => 'Rec']);
        $game = $this->newGame();

        $this->post(route('competitions.games.attach', [$this->team, $league]), ['game_ids' => [$game->id]])->assertRedirect();
        $this->assertSame($league->id, $game->fresh()->competition_id);

        $this->delete(route('competitions.games.detach', [$this->team, $league, $game]))->assertRedirect();
        $this->assertNull($game->fresh()->competition_id);
    }

    public function test_deleting_a_competition_keeps_its_games(): void
    {
        $league = $this->team->competitions()->create(['type' => 'league', 'name' => 'Rec']);
        $game = $this->newGame(['competition_id' => $league->id]);

        $this->delete(route('competitions.destroy', [$this->team, $league]));

        $this->assertNull($game->fresh()->competition_id);
    }

    public function test_reducing_innings_drops_sits_beyond_the_new_count(): void
    {
        $player = $this->team->players()->create(['name' => 'Kash']);
        $game = $this->newGame(['innings' => 7]);
        $this->sit($game, $player->id, 7);

        $this->put(route('games.update', [$this->team, $game]), ['played_on' => '2026-10-10', 'starts_at' => '18:00', 'innings' => 6]);

        $this->assertSame(0, $game->sits()->count());
    }

    public function test_extra_innings_can_be_added_up_to_nine(): void
    {
        $game = $this->newGame();
        $this->assertSame(6, $game->innings);

        foreach (range(7, 9) as $expected) {
            $this->post(route('games.innings.add', [$this->team, $game]))->assertRedirect();
            $this->assertSame($expected, $game->fresh()->innings);
        }

        $this->post(route('games.innings.add', [$this->team, $game]))->assertStatus(422);
        $this->put(route('games.update', [$this->team, $game]), ['played_on' => '2026-10-10', 'starts_at' => '18:00', 'innings' => 10])->assertSessionHasErrors('innings');
    }

    public function test_games_require_a_start_time(): void
    {
        $this->post(route('games.store', $this->team), ['played_on' => '2026-10-10'])->assertSessionHasErrors('starts_at');
        $this->assertSame(0, $this->team->games()->count());
    }

    public function test_roster_active_toggles_never_change_existing_game_lineups(): void
    {
        $a = $this->team->players()->create(['name' => 'A']);
        $b = $this->team->players()->create(['name' => 'B']);
        $c = $this->team->players()->create(['name' => 'C', 'is_active' => false]);

        $first = $this->newGame();

        // Deactivate A and activate C from the roster screen.
        $this->patch(route('players.update', [$this->team, $a]), ['is_active' => false])->assertRedirect();
        $this->patch(route('players.update', [$this->team, $c]), ['is_active' => true])->assertRedirect();

        $second = $this->newGame();

        $this->assertEqualsCanonicalizing([$a->id, $b->id], $first->lineup()->pluck('players.id')->all());
        $this->assertEqualsCanonicalizing([$b->id, $c->id], $second->lineup()->pluck('players.id')->all());

        // A can still be charted in the earlier game they were part of.
        $this->sit($first, $a->id, 1)->assertOk();
    }
}
