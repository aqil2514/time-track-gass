export interface ActivityAdjusmentListDb {
  id: number;
  name: string;
  added_minutes: number;
  notes: string;
  created_at: string;
}

export interface ActivityAdjusmentListDbInsert extends Omit<
  ActivityAdjusmentListDb,
  'id' | 'created_at'
> {}
