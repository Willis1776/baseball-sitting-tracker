<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\TeamMember;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;
use Symfony\Component\HttpFoundation\RedirectResponse as SymfonyRedirect;
use Throwable;

class GoogleController extends Controller
{
    public function redirect(): SymfonyRedirect
    {
        return Socialite::driver('google')->redirect();
    }

    public function callback(): RedirectResponse
    {
        try {
            $google = Socialite::driver('google')->user();
        } catch (Throwable $e) {
            report($e);

            return redirect()->route('login')->with('error', 'Google sign-in failed. Please try again.');
        }

        $email = Str::lower($google->getEmail());

        $user = User::where('google_id', $google->getId())->first()
            ?? User::where('email', $email)->first();

        // Invite-only: the super admin, users added in the admin panel, and invited coaches.
        $invited = TeamMember::where('email', $email)->exists();

        if (! $user && ! $invited && $email !== config('sitting.super_admin_email')) {
            return redirect()->route('login')->with('error', "{$email} hasn't been given access. Ask the administrator to add you.");
        }

        $user ??= new User(['email' => $email]);
        $user->fill([
            'name' => $user->name ?: ($google->getName() ?: Str::before($email, '@')),
            'google_id' => $google->getId(),
            'avatar' => $google->getAvatar(),
        ]);
        $user->email_verified_at ??= now();
        $user->save();

        // Claim any pending coach invites sent to this email.
        TeamMember::where('email', $email)->whereNull('user_id')->update(['user_id' => $user->id]);

        Auth::login($user, remember: true);
        request()->session()->regenerate();

        return redirect()->intended(route('teams.index'));
    }

    public function logout(Request $request): RedirectResponse
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login');
    }
}
