<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

use function Laravel\Prompts\password;
use function Laravel\Prompts\text;

/**
 * Bootstrap or recover an email + password login, e.g. for the super admin
 * before Google sign-in is configured.
 */
#[Signature('app:set-password {email} {--name=}')]
#[Description('Create a user or set their password for email + password sign-in')]
class SetUserPassword extends Command
{
    public function handle(): int
    {
        $email = strtolower(trim($this->argument('email')));
        $user = User::firstWhere('email', $email);

        if (! $user) {
            $user = new User([
                'email' => $email,
                'name' => $this->option('name') ?: text('Name', required: true),
            ]);
        }

        $user->password = password('New password (min 8 characters)', required: true, validate: fn ($v) => strlen($v) < 8 ? 'Use at least 8 characters.' : null);
        $user->save();

        $this->info("Password set for {$email}".($user->isSuperAdmin() ? ' (super admin)' : '').'.');

        return self::SUCCESS;
    }
}
