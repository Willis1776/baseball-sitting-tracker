<?php

namespace Tests\Feature;

use App\Models\Team;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\User as SocialiteUser;
use Tests\TestCase;

class GoogleLoginTest extends TestCase
{
    use RefreshDatabase;

    private function fakeGoogle(string $email, string $id = 'g-123'): void
    {
        $google = (new SocialiteUser)->map(['id' => $id, 'name' => 'Pat Coach', 'email' => $email, 'avatar' => 'https://example.test/a.png']);
        Socialite::shouldReceive('driver->user')->andReturn($google);
    }

    public function test_guests_are_sent_to_login(): void
    {
        $this->get('/teams')->assertRedirect('/login');
        $this->get('/login')->assertOk();
    }

    public function test_uninvited_google_accounts_are_rejected(): void
    {
        $this->fakeGoogle('stranger@gmail.com');

        $this->get('/auth/google/callback')->assertRedirect(route('login'));

        $this->assertGuest();
        $this->assertDatabaseMissing('users', ['email' => 'stranger@gmail.com']);
    }

    public function test_users_added_by_admin_can_sign_in_with_google(): void
    {
        $user = User::factory()->create(['email' => 'pat@example.com', 'name' => 'Pat From Admin']);
        $this->fakeGoogle('Pat@Example.com');

        $this->get('/auth/google/callback')->assertRedirect(route('teams.index'));

        $this->assertAuthenticatedAs($user);
        $this->assertSame('g-123', $user->fresh()->google_id);
        $this->assertSame('Pat From Admin', $user->fresh()->name);
    }

    public function test_super_admin_can_always_sign_in_and_is_admin(): void
    {
        config(['sitting.super_admin_email' => 'boss@example.com']);
        $this->fakeGoogle('boss@example.com');

        $this->get('/auth/google/callback')->assertRedirect(route('teams.index'));

        $boss = User::firstWhere('email', 'boss@example.com');
        $this->assertTrue($boss->is_admin);
        $this->assertTrue($boss->isSuperAdmin());
    }

    public function test_invited_coach_can_sign_in_and_claims_invite(): void
    {
        $team = Team::factory()->create();
        $team->members()->create(['email' => 'helper@example.com', 'role' => 'editor']);
        $this->fakeGoogle('helper@example.com', 'g-999');

        $this->get('/auth/google/callback');

        $user = User::firstWhere('email', 'helper@example.com');
        $this->assertSame($user->id, $team->members()->first()->user_id);
        $this->get(route('teams.show', $team))->assertOk();
    }

    public function test_dev_login_is_disabled_unless_enabled_locally(): void
    {
        config(['sitting.dev_login' => false]);
        $this->get('/dev-login')->assertNotFound();
    }
}
