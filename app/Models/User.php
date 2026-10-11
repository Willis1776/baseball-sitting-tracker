<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Filament\Models\Contracts\FilamentUser;
use Filament\Models\Contracts\HasAvatar;
use Filament\Panel;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Str;

#[Fillable(['name', 'email', 'password', 'google_id', 'avatar', 'is_admin'])]
#[Hidden(['password', 'remember_token', 'google_id'])]
class User extends Authenticatable implements FilamentUser, HasAvatar
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_admin' => 'boolean',
        ];
    }

    protected static function booted(): void
    {
        static::saving(function (User $user) {
            $user->email = Str::lower(trim($user->email));

            if ($user->isSuperAdmin()) {
                $user->is_admin = true;
            }
        });

        static::deleting(function (User $user) {
            abort_if($user->isSuperAdmin(), 403, 'The super admin account cannot be deleted.');
        });
    }

    public function isSuperAdmin(): bool
    {
        return Str::lower($this->email) === config('sitting.super_admin_email');
    }

    public function teams(): HasMany
    {
        return $this->hasMany(Team::class);
    }

    public function canAccessPanel(Panel $panel): bool
    {
        return $this->is_admin || $this->isSuperAdmin();
    }

    public function getFilamentAvatarUrl(): ?string
    {
        return $this->avatar;
    }
}
