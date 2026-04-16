export interface ActivityAdjusmentsDb {
  id: number;
  adjusment_id: number;
  profile_id: string;
  affected_minutes: number;
  date: string;
  created_at: string;
}

export interface ActivityAdjusmentsDbInsert extends Omit<
  ActivityAdjusmentsDb,
  'id' | 'created_at'
> {}
