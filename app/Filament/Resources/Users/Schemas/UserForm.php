<?php

namespace App\Filament\Resources\Users\Schemas;

use App\Models\User;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Schema;
use Illuminate\Support\Facades\Auth;

class UserForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextInput::make('name')
                    ->required()
                    ->maxLength(255),
                TextInput::make('email')
                    ->label('Email address')
                    ->email()
                    ->required()
                    ->unique(ignoreRecord: true)
                    ->helperText('They can sign in with this email and the password below, or with Google if it is a Google account.'),
                TextInput::make('password')
                    ->password()
                    ->revealable()
                    ->minLength(8)
                    ->dehydrated(fn (?string $state) => filled($state))
                    ->helperText(fn (string $operation) => $operation === 'edit'
                        ? 'Leave blank to keep their current password.'
                        : 'Optional if they will only use Google sign-in.'),
                Toggle::make('is_admin')
                    ->label('Admin panel access')
                    ->helperText('Only the super admin can change this.')
                    ->disabled(fn (?User $record) => ! Auth::user()?->isSuperAdmin() || $record?->isSuperAdmin())
                    ->dehydrated(fn () => (bool) Auth::user()?->isSuperAdmin()),
            ]);
    }
}
