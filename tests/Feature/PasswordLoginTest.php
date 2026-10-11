<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PasswordLoginTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_added_user_can_sign_in_with_email_and_password(): void
    {
        $user = User::factory()->create(['email' => 'coach@example.com', 'password' => 'secret-pass']);

        $this->post(route('login.password'), ['email' => 'Coach@Example.com', 'password' => 'secret-pass'])
            ->assertRedirect(route('teams.index'));

        $this->assertAuthenticatedAs($user);
    }

    public function test_wrong_password_is_rejected_and_throttled(): void
    {
        User::factory()->create(['email' => 'coach@example.com', 'password' => 'secret-pass']);

        foreach (range(1, 5) as $_) {
            $this->post(route('login.password'), ['email' => 'coach@example.com', 'password' => 'nope'])->assertSessionHasErrors('email');
        }

        $this->post(route('login.password'), ['email' => 'coach@example.com', 'password' => 'secret-pass'])->assertSessionHasErrors('email');
        $this->assertGuest();
    }

    public function test_google_only_user_cannot_use_password_login(): void
    {
        User::factory()->create(['email' => 'g@example.com', 'password' => null]);

        $this->post(route('login.password'), ['email' => 'g@example.com', 'password' => ''])->assertSessionHasErrors('password');
        $this->assertGuest();
    }

    public function test_user_can_change_password(): void
    {
        $user = User::factory()->create(['password' => 'old-password']);

        $this->actingAs($user)->put(route('password.update'), [
            'current_password' => 'wrong',
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
        ])->assertSessionHasErrors('current_password');

        $this->put(route('password.update'), [
            'current_password' => 'old-password',
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
        ])->assertSessionHasNoErrors();

        $this->assertTrue(password_verify('new-password', $user->fresh()->password));
    }

    public function test_google_only_user_can_set_a_first_password(): void
    {
        $user = User::factory()->create(['password' => null]);

        $this->actingAs($user)->put(route('password.update'), [
            'password' => 'brand-new-pw',
            'password_confirmation' => 'brand-new-pw',
        ])->assertSessionHasNoErrors();

        $this->assertNotNull($user->fresh()->password);
    }

    public function test_super_admin_cannot_be_deleted_or_lose_admin(): void
    {
        config(['sitting.super_admin_email' => 'boss@example.com']);
        $boss = User::factory()->create(['email' => 'boss@example.com', 'is_admin' => false]);
        $this->assertTrue($boss->is_admin);

        $boss->update(['is_admin' => false]);
        $this->assertTrue($boss->fresh()->is_admin);

        $this->expectException(\Symfony\Component\HttpKernel\Exception\HttpException::class);
        $boss->delete();
    }

    public function test_only_admins_reach_the_admin_panel(): void
    {
        $this->actingAs(User::factory()->create())->get('/admin')->assertForbidden();
        $this->actingAs(User::factory()->create(['is_admin' => true]))->get('/admin')->assertOk();
    }
}
