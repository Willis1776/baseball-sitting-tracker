<?php

namespace App\Filament\Resources\Games\Schemas;

use Filament\Infolists\Components\TextEntry;
use Filament\Schemas\Schema;

class GameInfolist
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextEntry::make('team.name')
                    ->label('Team'),
                TextEntry::make('competition.name')
                    ->label('Competition')
                    ->placeholder('-'),
                TextEntry::make('opponent')
                    ->placeholder('-'),
                TextEntry::make('played_on')
                    ->date(),
                TextEntry::make('starts_at')
                    ->time()
                    ->placeholder('-'),
                TextEntry::make('innings')
                    ->numeric(),
                TextEntry::make('notes')
                    ->placeholder('-')
                    ->columnSpanFull(),
                TextEntry::make('created_at')
                    ->dateTime()
                    ->placeholder('-'),
                TextEntry::make('updated_at')
                    ->dateTime()
                    ->placeholder('-'),
            ]);
    }
}
