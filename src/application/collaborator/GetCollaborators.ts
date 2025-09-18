import { CollaboratorApi } from "../../infrastructure/api/CollaboratorApi";
import type { Collaborator } from "../../models/Collaborator";

export const GetCollaborators = async (): Promise<Collaborator[]> => {
  return await CollaboratorApi.getAll();
};