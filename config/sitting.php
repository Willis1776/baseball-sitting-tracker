<?php

return [

    /*
    | The one permanent super admin. Always has admin panel access, cannot be
    | demoted or deleted, and is the only one who can grant admin to others.
    | This email may always sign in with Google.
    */
    'super_admin_email' => strtolower(trim((string) env('SUPER_ADMIN_EMAIL', 'willis@clarity-hd.com'))),

    /*
    | Enables /dev-login for local development without Google credentials.
    | Only honoured when APP_ENV=local.
    */
    'dev_login' => (bool) env('DEV_LOGIN', false),

];
