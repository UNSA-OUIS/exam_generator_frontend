export interface Block {
  id: number;
  level_id: number;
  code: string;
  name: string;
  parent_block_id: number | null;
  createdAt: string;
  updatedAt: string;
  level?: Level;
  parentBlock?: Block;
}

export interface Level {
  id: number;
  stage: number;
  name: string;
  createdAt: string;
  updatedAt: string;
}
