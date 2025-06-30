import { LevelApi } from '../../infrastructure/api/LevelApi';
import type { Level } from '../../models/Level';

export const CreateLevel = async (level: Omit<Level, 'id'>) => {
  return await LevelApi.create(level);
};