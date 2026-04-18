export interface ActivityAdjustmentListDb {
  id: number;
  name: string;
  added_minutes: number;
  notes: string;
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

export interface AdjustmentContentResponse {
  adjustmentContent: AdjustmentContent[];
}

export interface AdjustmentContentDetail {
  s3_key: string;
  date: string;
  affected_minutes: number;
  profile: {
    division: string;
    username: string;
    full_name: string;
  };
  adjustment: {
    name: string;
    notes: string;
  };
}
