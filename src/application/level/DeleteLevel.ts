import { LevelApi } from '../../infrastructure/api/LevelApi';

export const DeleteLevel = async (id: number) => {
  await LevelApi.delete(id);
};