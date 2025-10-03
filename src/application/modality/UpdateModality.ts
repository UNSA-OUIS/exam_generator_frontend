import { updateModality } from "../../infrastructure/api/ModalityApi";
import type { Modality } from "../../models/Modality";

export const UpdateModality = async (id: number, data: Partial<Modality>) => {
  return await updateModality(id, data);
};
