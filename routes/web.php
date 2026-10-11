<?php

use App\Http\Controllers\Auth\DevLoginController;
use App\Http\Controllers\Auth\GoogleController;
use App\Http\Controllers\Auth\PasswordController;
use App\Http\Controllers\Auth\PasswordLoginController;
use App\Http\Controllers\CompetitionController;
use App\Http\Controllers\GameController;
use App\Http\Controllers\PlayerController;
use App\Http\Controllers\TeamController;
use App\Http\Controllers\TeamMemberController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::middleware('guest')->group(function () {
    Route::get('/login', fn () => Inertia::render('Auth/Login', [
        'devLogin' => app()->environment('local') && config('sitting.dev_login'),
    ]))->name('login');
    Route::post('/login', [PasswordLoginController::class, 'store'])->name('login.password');
    Route::get('/auth/google/redirect', [GoogleController::class, 'redirect'])->name('google.redirect');
    Route::get('/auth/google/callback', [GoogleController::class, 'callback'])->name('google.callback');
    Route::get('/dev-login', DevLoginController::class)->name('dev-login');
});

Route::middleware('auth')->group(function () {
    Route::redirect('/', '/teams');
    Route::post('/logout', [GoogleController::class, 'logout'])->name('logout');
    Route::put('/password', [PasswordController::class, 'update'])->name('password.update');

    Route::resource('teams', TeamController::class)->only(['index', 'store', 'show', 'update', 'destroy']);

    Route::prefix('teams/{team}')->scopeBindings()->group(function () {
        Route::post('players', [PlayerController::class, 'store'])->name('players.store');
        Route::put('players/order', [PlayerController::class, 'reorder'])->name('players.reorder');
        Route::patch('players/{player}', [PlayerController::class, 'update'])->name('players.update');
        Route::delete('players/{player}', [PlayerController::class, 'destroy'])->name('players.destroy');

        Route::post('competitions', [CompetitionController::class, 'store'])->name('competitions.store');
        Route::get('competitions/{competition}', [CompetitionController::class, 'show'])->name('competitions.show');
        Route::put('competitions/{competition}', [CompetitionController::class, 'update'])->name('competitions.update');
        Route::delete('competitions/{competition}', [CompetitionController::class, 'destroy'])->name('competitions.destroy');
        Route::post('competitions/{competition}/games', [CompetitionController::class, 'attachGames'])->name('competitions.games.attach');
        Route::delete('competitions/{competition}/games/{game}', [CompetitionController::class, 'detachGame'])->name('competitions.games.detach');

        Route::post('games', [GameController::class, 'store'])->name('games.store');
        Route::get('games/{game}', [GameController::class, 'show'])->name('games.show');
        Route::put('games/{game}', [GameController::class, 'update'])->name('games.update');
        Route::delete('games/{game}', [GameController::class, 'destroy'])->name('games.destroy');
        Route::put('games/{game}/sits', [GameController::class, 'toggleSit'])->name('games.sits.toggle');
        Route::post('games/{game}/innings', [GameController::class, 'addInning'])->name('games.innings.add');
        Route::put('games/{game}/lineup', [GameController::class, 'updateLineup'])->name('games.lineup.update');

        Route::post('members', [TeamMemberController::class, 'store'])->name('members.store');
        Route::delete('members/{member}', [TeamMemberController::class, 'destroy'])->name('members.destroy');
    });
});
