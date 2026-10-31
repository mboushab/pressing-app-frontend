/** One opening range of a weekday (0 = Sunday … 6 = Saturday), Nouakchott time. */
export interface OpeningRange {
  weekday: number;
  opens_at: string;
  closes_at: string;
}

export interface Closure {
  id: string;
  day: string;
  reason: string | null;
}

export type ReceptionPause = 'OFF' | '1H' | '2H' | 'NEXT_OPENING' | 'INDEFINITE';

/** Hours, closures and reception of the current pressing. */
export interface Schedule {
  hours: OpeningRange[];
  closures: Closure[];
  /** paused_until null while paused = until switched back on */
  reception: { receiving: boolean; paused_until: string | null };
  status: { open_now: boolean; closes_at: string | null; next_opening: string | null };
}
