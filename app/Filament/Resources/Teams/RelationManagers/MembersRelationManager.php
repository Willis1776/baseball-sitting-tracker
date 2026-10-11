<?php

namespace App\Filament\Resources\Teams\RelationManagers;

use App\Models\TeamMember;
use App\Models\User;
use Filament\Actions\CreateAction;
use Filament\Actions\DeleteAction;
use Filament\Forms\Components\TextInput;
use Filament\Resources\RelationManagers\RelationManager;
use Filament\Schemas\Schema;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

class MembersRelationManager extends RelationManager
{
    protected static string $relationship = 'members';

    protected static ?string $title = 'Coaches';

    public function form(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextInput::make('email')
                    ->email()
                    ->required()
                    ->unique(ignoreRecord: true, modifyRuleUsing: fn ($rule) => $rule->where('team_id', $this->getOwnerRecord()->id)),
            ]);
    }

    public function table(Table $table): Table
    {
        return $table
            ->recordTitleAttribute('email')
            ->columns([
                TextColumn::make('email')->searchable(),
                TextColumn::make('user.name')->label('Name')->placeholder('Not signed in yet'),
                TextColumn::make('role')->badge(),
                TextColumn::make('created_at')->label('Added')->since(),
            ])
            ->headerActions([
                CreateAction::make()
                    ->label('Add coach')
                    ->mutateDataUsing(fn (array $data) => [
                        ...$data,
                        'role' => TeamMember::ROLE_EDITOR,
                        'user_id' => User::where('email', strtolower($data['email']))->value('id'),
                        'invited_by' => auth()->id(),
                    ]),
            ])
            ->recordActions([
                DeleteAction::make()->label('Remove'),
            ]);
    }
}
