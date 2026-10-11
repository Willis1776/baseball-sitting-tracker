<?php

namespace App\Http\Controllers;

use App\Models\Team;
use App\Models\TeamMember;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class TeamMemberController extends Controller
{
    public function store(Request $request, Team $team): RedirectResponse
    {
        Gate::authorize('administer', $team);

        $request->merge(['email' => Str::lower(trim((string) $request->input('email')))]);

        $email = $request->validate([
            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('team_members', 'email')->where('team_id', $team->id),
                Rule::notIn([Str::lower($team->user->email)]),
            ],
        ], [
            'email.unique' => 'That coach already has access.',
            'email.not_in' => 'That is the team owner.',
        ])['email'];

        $team->members()->create([
            'email' => $email,
            'user_id' => User::where('email', $email)->value('id'),
            'role' => TeamMember::ROLE_EDITOR,
            'invited_by' => $request->user()->id,
        ]);

        return back()->with('success', "{$email} can now help manage {$team->name}.");
    }

    public function destroy(Request $request, Team $team, TeamMember $member): RedirectResponse
    {
        $leaving = $member->user_id === $request->user()->id || $member->email === Str::lower($request->user()->email);

        if (! $leaving) {
            Gate::authorize('administer', $team);
        }

        $member->delete();

        return $leaving
            ? redirect()->route('teams.index')->with('success', "You left {$team->name}.")
            : back()->with('success', "Removed {$member->email}.");
    }
}
