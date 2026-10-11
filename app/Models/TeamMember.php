<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A coach invited to help manage a team. Invites are keyed by email and
 * linked to a user the first time that Google account signs in.
 */
#[Fillable(['team_id', 'email', 'user_id', 'role', 'invited_by'])]
class TeamMember extends Model
{
    public const ROLE_EDITOR = 'editor';

    protected static function booted(): void
    {
        static::saving(fn (TeamMember $member) => $member->email = strtolower(trim($member->email)));
    }

    public function team(): BelongsTo
    {
        return $this->belongsTo(Team::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function inviter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'invited_by');
    }
}
