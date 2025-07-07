// infrastructure/api/LevelApi.ts
import axios from 'axios';
import type { Level } from '../../models/Level';

const API_URL = 'http://tu-api.com/api/levels';

export const LevelApi = {
  async getAll(): Promise<Level[]> {
    const res = await axios.get(API_URL);
    return res.data;
  },

  async getById(id: number): Promise<Level> {
    const res = await axios.get(`${API_URL}/${id}`);
    return res.data;
  },

  async create(level: Omit<Level, 'id'>): Promise<Level> {
    const res = await axios.post(API_URL, level);
    return res.data;
  },

  async update(id: number, level: Omit<Level, 'id'>): Promise<Level> {
    const res = await axios.put(`${API_URL}/${id}`, level);
    return res.data;
  },

  async delete(id: number): Promise<void> {
    await axios.delete(`${API_URL}/${id}`);
  }
};