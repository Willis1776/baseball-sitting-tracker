<?php

namespace App\Filament\Resources\Teams\RelationManagers;

use App\Filament\Resources\Competitions\CompetitionResource;
use Filament\Actions\CreateAction;
use Filament\Resources\RelationManagers\RelationManager;
use Filament\Tables\Table;

class CompetitionsRelationManager extends RelationManager
{
    protected static string $relationship = 'competitions';

    protected static ?string $relatedResource = CompetitionResource::class;

    public function table(Table $table): Table
    {
        return $table
            ->headerActions([
                CreateAction::make(),
            ]);
    }
}
