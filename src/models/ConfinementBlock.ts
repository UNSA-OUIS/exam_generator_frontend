export interface Block {
  id: number;
  name: string;
  code?: string;
  parent_id?: number;
}

export interface ConfinementBlock {
  confinement: any;
  id?: number;
  confinement_id?: string;
  block_id?: number;
  questions_to_do: number;
  level_id?: number;
  block_name: string;
  block_code?: string;
  parent_block_id?: number;
  block?: Block; 
}
