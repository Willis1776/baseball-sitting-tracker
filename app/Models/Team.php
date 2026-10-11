<?php

namespace App\Models;

use Database\Factories\TeamFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['user_id', 'name', 'season', 'innings_per_game'])]
class Team extends Model
{
    /** @use HasFactory<TeamFactory> */
    use HasFactory;

    protected function casts(): array
    {
        return [
            'innings_per_game' => 'integer',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function members(): HasMany
    {
        return $this->hasMany(TeamMember::class)->orderBy('email');
    }

    /**
     * Teams a user owns or has been invited to coach.
     */
    #[Scope]
    protected function accessibleBy(Builder $query, User $user): void
    {
        $query->where(fn (Builder $q) => $q
            ->where('user_id', $user->id)
            ->orWhereHas('members', fn (Builder $m) => $m
                ->where('user_id', $user->id)
                ->orWhere('email', strtolower($user->email))));
    }

    public function isOwnedBy(User $user): bool
    {
        return $this->user_id === $user->id;
    }

    public function hasMember(User $user): bool
    {
        return $this->isOwnedBy($user) || $this->members()
            ->where(fn (Builder $m) => $m->where('user_id', $user->id)->orWhere('email', strtolower($user->email)))
            ->exists();
    }

    public function players(): HasMany
    {
        return $this->hasMany(Player::class)->orderBy('sort_order')->orderBy('id');
    }

    public function competitions(): HasMany
    {
        return $this->hasMany(Competition::class);
    }

    public function games(): HasMany
    {
        return $this->hasMany(Game::class);
    }
}
