import type { Block } from "./Block";
import type { Confinement } from "./Confinement";

export interface ConfinementText {
  id: number;
  confinement_id: string;
  block_id: number;
  texts_to_do: number;
  questions_per_text: number;
  created_at: string;
  updated_at: string;
  confinement?: Confinement;
  block?: Block;
}