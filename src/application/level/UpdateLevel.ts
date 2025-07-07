import { LevelApi } from '../../infrastructure/api/LevelApi';
import type { Level } from '../../models/Level';

export const UpdateLevel = async (id: number, level: Omit<Level, 'id'>) => {
  return await LevelApi.update(id, level);
};
