<?php

namespace Tests\Feature;

use App\Models\Team;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TeamAccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_users_cannot_see_other_teams(): void
    {
        $team = Team::factory()->create();

        $this->actingAs(User::factory()->create())
            ->get(route('teams.show', $team))
            ->assertForbidden();
    }

    public function test_index_lists_owned_and_shared_teams_only(): void
    {
        $me = User::factory()->create();
        $mine = Team::factory()->for($me)->create(['name' => 'Mine']);
        $shared = Team::factory()->create(['name' => 'Shared']);
        $shared->members()->create(['email' => $me->email, 'user_id' => $me->id]);
        Team::factory()->create(['name' => 'Other']);

        $this->actingAs($me)->get(route('teams.index'))
            ->assertInertia(fn ($page) => $page
                ->component('Teams/Index')
                ->has('teams', 2)
                ->where('teams.0.name', 'Mine')
                ->where('teams.0.is_owner', true)
                ->where('teams.1.is_owner', false));
    }

    public function test_editor_can_manage_but_not_delete_or_invite(): void
    {
        $team = Team::factory()->create();
        $editor = User::factory()->create();
        $team->members()->create(['email' => $editor->email, 'user_id' => $editor->id]);

        $this->actingAs($editor);
        $this->post(route('players.store', $team), ['name' => 'Kash'])->assertRedirect();
        $this->assertSame(1, $team->players()->count());

        $this->post(route('members.store', $team), ['email' => 'x@example.com'])->assertForbidden();
        $this->delete(route('teams.destroy', $team))->assertForbidden();
    }

    public function test_owner_can_invite_and_remove_coaches(): void
    {
        $owner = User::factory()->create();
        $team = Team::factory()->for($owner)->create();

        $this->actingAs($owner)->post(route('members.store', $team), ['email' => ' Help@Example.com '])->assertSessionHasNoErrors();
        $member = $team->members()->first();
        $this->assertSame('help@example.com', $member->email);

        $this->post(route('members.store', $team), ['email' => 'help@example.com'])->assertSessionHasErrors('email');

        $this->delete(route('members.destroy', [$team, $member]))->assertRedirect();
        $this->assertSame(0, $team->members()->count());
    }

    public function test_editor_can_leave_a_team(): void
    {
        $team = Team::factory()->create();
        $editor = User::factory()->create();
        $member = $team->members()->create(['email' => $editor->email, 'user_id' => $editor->id]);

        $this->actingAs($editor)->delete(route('members.destroy', [$team, $member]))->assertRedirect(route('teams.index'));
        $this->get(route('teams.show', $team))->assertForbidden();
    }

    public function test_nested_records_are_scoped_to_their_team(): void
    {
        $owner = User::factory()->create();
        $team = Team::factory()->for($owner)->create();
        $otherPlayer = Team::factory()->create()->players()->create(['name' => 'Spy']);

        $this->actingAs($owner)
            ->patch("/teams/{$team->id}/players/{$otherPlayer->id}", ['is_active' => false])
            ->assertNotFound();
    }
}
