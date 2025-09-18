import { CollaboratorApi } from "../../infrastructure/api/CollaboratorApi";
import type { Collaborator } from "../../models/Collaborator";

export const GetCollaborator = async (id: number): Promise<Collaborator> => {
  return await CollaboratorApi.get(id);
};