
import axiosClient from "../lib/axiosClient";
import type { Level } from '../../models/Level';

export const LevelApi = {
  async getAll(): Promise<Level[]> {
    const res = await axiosClient.get("/levels");
    return res.data;
  },

  async getById(id: number): Promise<Level> {
    const res = await axiosClient.get(`/levels/${id}`);
    return res.data;
  },

  async create(level: Omit<Level, 'id'>): Promise<Level> {
    const res = await axiosClient.post("/levels", level);
    return res.data;
  },

  async update(id: number, level: Omit<Level, 'id'>): Promise<Level> {
    const res = await axiosClient.put(`/levels/${id}`, level);
    return res.data;
  },

  async delete(id: number): Promise<void> {
    await axiosClient.delete(`/levels/${id}`);  
  }
};