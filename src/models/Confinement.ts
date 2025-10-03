export interface Confinement {
  id: string; // UUID
  name: string;
  total: number;
  start_date: string; // Usar started_at en lugar de start_date
  end_date: string;   // Usar ended_at en lugar de end_date
  created_at: string;
  updated_at: string;
}