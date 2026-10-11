<?php

namespace App\Filament\Resources\Competitions\Schemas;

use Filament\Forms\Components\DatePicker;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Schemas\Schema;

class CompetitionForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Select::make('team_id')
                    ->relationship('team', 'name')
                    ->required(),
                Select::make('type')
                    ->options(['league' => 'League', 'tournament' => 'Tournament'])
                    ->required(),
                TextInput::make('name')
                    ->required(),
                DatePicker::make('starts_on'),
                DatePicker::make('ends_on'),
            ]);
    }
}
