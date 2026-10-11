<?php

namespace App\Policies;

use App\Models\Team;
use App\Models\User;

class TeamPolicy
{
    /**
     * The owner and invited coaches can manage the roster, leagues, games and sits.
     */
    public function manage(User $user, Team $team): bool
    {
        return $team->hasMember($user);
    }

    /**
     * Only the owner can delete the team or change who has access.
     */
    public function administer(User $user, Team $team): bool
    {
        return $team->isOwnedBy($user);
    }
}
