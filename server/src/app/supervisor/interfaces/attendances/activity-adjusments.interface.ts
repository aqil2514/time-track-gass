export interface ActivityAdjusmentsDb {
  id: number;
  adjusment_id: number;
  profile_id: string;
  affected_minutes: number;
  s3_key?: string;
  date: string;
  created_at: string;
}

export interface AdjustmentContent {
  id: number;
  date: string;
  affected_minutes: number;
  profile: {
    id: string;
    division: string;
    username: string;
    full_name: string;
  };
  adjustment: {
    id: number;
    name: string;
    notes: string;
  };
}


export interface ActivityAdjusmentsDbInsert extends Omit<
  ActivityAdjusmentsDb,
  'id' | 'created_at'
> {}
