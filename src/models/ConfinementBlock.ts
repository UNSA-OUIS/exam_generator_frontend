export interface ConfinementBlock {
  id?: number;
  confinement_id?: number;
  block_id?: number;
  questions_to_do: number;
  level_id?: number;
  block_name?: string;
  block_code?: string;
  parent_block_id?: number;
}