<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Local demo data mirroring the original Google Sheet sitting chart.
     */
    public function run(): void
    {
        // Super admin, password from ADMIN_PASSWORD in .env; firstOrCreate so re-seeding never resets a changed password.
        if ($password = config('sitting.admin_password')) {
            User::firstOrCreate(
                ['email' => config('sitting.super_admin_email')],
                ['name' => 'Michael Willis', 'password' => $password, 'is_admin' => true, 'email_verified_at' => now()],
            );
        } else {
            $this->command?->warn('ADMIN_PASSWORD is not set in .env, so the super admin account was not seeded.');
        }

        $user = User::firstOrCreate(
            ['email' => 'coach@example.test'],
            ['name' => 'Dev Coach', 'is_admin' => true, 'email_verified_at' => now()],
        );

        $team = $user->teams()->create(['name' => 'Demo Team', 'season' => (string) now()->year, 'innings_per_game' => 6]);

        $names = ['Crew G', 'Gibson', 'Samuel', 'Tyce', 'Kash', 'Alec', 'Crew F', 'Jace', 'Colt', 'Aidan', 'Andrew', 'Dean'];
        $players = collect($names)->mapWithKeys(fn ($name, $i) => [
            $name => $team->players()->create(['name' => $name, 'is_active' => true, 'sort_order' => $i + 1]),
        ]);

        $tournament = $team->competitions()->create([
            'type' => 'tournament',
            'name' => 'Demo Tournament',
            'starts_on' => now()->subDay()->toDateString(),
            'ends_on' => now()->toDateString(),
        ]);

        // Sits from "GAME 1" in the sheet: player => innings sat.
        $chart = [
            [now()->subDay(), '09:00', ['Crew G' => [1], 'Gibson' => [3], 'Tyce' => [3], 'Kash' => [2], 'Crew F' => [3]]],
            [now()->subDay(), '13:00', []],
        ];

        foreach ($chart as [$date, $time, $sits]) {
            $game = $team->games()->create([
                'competition_id' => $tournament->id,
                'played_on' => $date->toDateString(),
                'starts_at' => $time,
                'innings' => 6,
            ]);

            foreach ($sits as $name => $innings) {
                foreach ($innings as $inning) {
                    $game->sits()->create(['player_id' => $players[$name]->id, 'inning' => $inning]);
                }
            }
        }
    }
}
