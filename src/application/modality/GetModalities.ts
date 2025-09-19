import { getModalities } from "../../infrastructure/api/ModalityApi";

export const GetModalities = async () => {
  return await getModalities();
};
