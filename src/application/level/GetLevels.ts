import { LevelApi } from '../../infrastructure/api/LevelApi';

export const GetLevels = async () => {
  return await LevelApi.getAll();
};