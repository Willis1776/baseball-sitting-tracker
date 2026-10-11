<?php

namespace Database\Factories;

use App\Models\Team;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Team>
 */
class TeamFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'name' => fake()->city().' '.fake()->randomElement(['Thunder', 'Bombers', 'Sluggers', 'Hawks']),
            'season' => (string) now()->year,
            'innings_per_game' => 6,
        ];
    }
}
