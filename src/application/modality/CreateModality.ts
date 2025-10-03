import { createModality } from "../../infrastructure/api/ModalityApi";
import type { Modality } from "../../models/Modality";

export const CreateModality = async (data: Partial<Modality>) => {
  return await createModality(data);
};
