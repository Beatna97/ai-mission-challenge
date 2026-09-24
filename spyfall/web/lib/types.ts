export type Phase = 'lobby' | 'reveal' | 'discussion' | 'voting' | 'results';
export interface PlayerView { id: string; name: string; ready: boolean; online: boolean; voted: boolean }
export interface Result {
  spyId: string; location: string; winner: 'players' | 'spy';
  reason: 'vote' | 'escaped' | 'guess_ok' | 'guess_bad'; guess?: string;
}
export interface RoomState {
  code: string; phase: Phase; hostId: string; me: string; now: number; endsAt: number | null; minPlayers: number;
  players: PlayerView[]; locations: string[]; role: 'spy' | 'player' | null; location: string | null;
  myVote: string | null; votes: Record<string, string> | null; result: Result | null;
}
