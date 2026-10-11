<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;

/**
 * Local-only sign-in so the app can be exercised without Google credentials.
 */
class DevLoginController extends Controller
{
    public function __invoke(): RedirectResponse
    {
        abort_unless(app()->environment('local') && config('sitting.dev_login'), 404);

        $user = User::firstOrCreate(
            ['email' => 'coach@example.test'],
            ['name' => 'Dev Coach', 'is_admin' => true, 'email_verified_at' => now()],
        );

        Auth::login($user, remember: true);
        request()->session()->regenerate();

        return redirect()->route('teams.index');
    }
}
