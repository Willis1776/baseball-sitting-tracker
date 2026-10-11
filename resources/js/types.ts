export type User = {
    id: number;
    name: string;
    email: string;
    avatar: string | null;
    is_admin: boolean;
    has_password: boolean;
};

export type Team = {
    id: number;
    name: string;
    season: string | null;
    innings_per_game: number;
};

export type Player = {
    id: number;
    name: string;
    jersey_number: string | null;
    is_active: boolean;
    sort_order: number;
};

export type CompetitionType = 'league' | 'tournament';

export type Competition = {
    id: number;
    type: CompetitionType;
    name: string;
    starts_on: string | null;
    ends_on: string | null;
    games_count: number | null;
};

export type Game = {
    id: number;
    competition_id: number | null;
    competition: Pick<Competition, 'id' | 'name' | 'type'> | null;
    opponent: string | null;
    label: string;
    played_on: string;
    starts_at: string | null;
    innings: number;
    notes: string | null;
};

export type ReportRow = {
    player: Player;
    per_game: number[];
    running: number[];
    total: number;
};

export type Report = {
    games: Game[];
    rows: ReportRow[];
};

export type SharedProps = {
    auth: { user: User | null };
    flash: { success: string | null; error: string | null };
};
