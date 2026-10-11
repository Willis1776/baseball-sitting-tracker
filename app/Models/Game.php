<?php

namespace App\Models;

use Database\Factories\GameFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['team_id', 'competition_id', 'opponent', 'played_on', 'starts_at', 'innings', 'notes'])]
class Game extends Model
{
    /** @use HasFactory<GameFactory> */
    use HasFactory;

    public const MAX_INNINGS = 9;

    protected function casts(): array
    {
        return [
            'played_on' => 'date',
            'innings' => 'integer',
        ];
    }

    protected static function booted(): void
    {
        // Snapshot who's playing: the team's active roster at the time the game is created.
        static::created(function (Game $game) {
            $game->lineup()->attach(
                Player::where('team_id', $game->team_id)->where('is_active', true)->pluck('id')
            );
        });
    }

    public function team(): BelongsTo
    {
        return $this->belongsTo(Team::class);
    }

    public function competition(): BelongsTo
    {
        return $this->belongsTo(Competition::class);
    }

    /**
     * Players in this game's lineup (snapshotted from the active roster when the game is created).
     */
    public function lineup(): BelongsToMany
    {
        return $this->belongsToMany(Player::class)->withTimestamps();
    }

    public function sits(): HasMany
    {
        return $this->hasMany(Sit::class);
    }

    public function label(): string
    {
        return $this->opponent ? 'vs '.$this->opponent : 'Game';
    }
}
