<?php

namespace App\Filament\Resources\Games\Schemas;

use Filament\Forms\Components\DatePicker;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TimePicker;
use Filament\Schemas\Components\Utilities\Get;
use Filament\Schemas\Schema;
use Illuminate\Database\Eloquent\Builder;

class GameForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Select::make('team_id')
                    ->relationship('team', 'name')
                    ->required()
                    ->live(),
                Select::make('competition_id')
                    ->label('League / tournament')
                    ->relationship('competition', 'name', fn (Builder $query, Get $get) => $query->where('team_id', $get('team_id'))),
                TextInput::make('opponent'),
                DatePicker::make('played_on')
                    ->required(),
                TimePicker::make('starts_at'),
                TextInput::make('innings')
                    ->required()
                    ->numeric()
                    ->default(6),
                Textarea::make('notes')
                    ->columnSpanFull(),
            ]);
    }
}
