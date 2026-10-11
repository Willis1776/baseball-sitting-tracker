<?php

namespace App\Http\Controllers;

use App\Models\Player;
use App\Models\Team;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class PlayerController extends Controller
{
    public function store(Request $request, Team $team): RedirectResponse
    {
        Gate::authorize('manage', $team);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:60'],
            'jersey_number' => ['nullable', 'string', 'max:4'],
        ]);

        $team->players()->create([
            ...$data,
            'is_active' => true,
            'sort_order' => (int) $team->players()->max('sort_order') + 1,
        ]);

        return back()->with('success', "{$data['name']} added to the roster.");
    }

    public function update(Request $request, Team $team, Player $player): RedirectResponse
    {
        Gate::authorize('manage', $team);

        $player->update($request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:60'],
            'jersey_number' => ['sometimes', 'nullable', 'string', 'max:4'],
            'is_active' => ['sometimes', 'boolean'],
        ]));

        return back();
    }

    public function destroy(Team $team, Player $player): RedirectResponse
    {
        Gate::authorize('manage', $team);

        $player->delete();

        return back()->with('success', "{$player->name} removed from the roster.");
    }

    public function reorder(Request $request, Team $team): RedirectResponse
    {
        Gate::authorize('manage', $team);

        $ids = $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['integer', Rule::exists('players', 'id')->where('team_id', $team->id)],
        ])['ids'];

        DB::transaction(function () use ($ids, $team) {
            foreach (array_values($ids) as $index => $id) {
                $team->players()->whereKey($id)->update(['sort_order' => $index + 1]);
            }
        });

        return back();
    }
}
