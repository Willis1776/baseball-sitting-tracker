<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use RuntimeException;

abstract class TestCase extends BaseTestCase
{
    /**
     * Refuse to run anywhere but in-memory SQLite. A cached config (bootstrap/cache/config.php)
     * overrides phpunit.xml, and RefreshDatabase would then wipe the development database.
     */
    public function createApplication()
    {
        $app = parent::createApplication();

        $connection = $app['config']['database.default'];
        $database = $app['config']["database.connections.{$connection}.database"];

        if ($connection !== 'sqlite' || $database !== ':memory:') {
            throw new RuntimeException(
                "Tests must use in-memory SQLite, but the database is [{$connection}: {$database}]. "
                .'Run `php artisan config:clear` and try again.'
            );
        }

        return $app;
    }
}
