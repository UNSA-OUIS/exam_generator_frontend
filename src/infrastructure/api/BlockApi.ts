import axiosClient from "../lib/axiosClient";
import type { Block } from "../../models/Block";

export const getBlocks = async (): Promise<Block[]> => {
  const response = await axiosClient.get("/blocks");
  return response.data;
};

export const createBlock = async (block: Partial<Block>): Promise<Block> => {
  const response = await axiosClient.post("/blocks", block);
  return response.data;
};

export const updateBlock = async (
  id: number,
  block: Partial<Block>
): Promise<Block> => {
  const response = await axiosClient.patch(`/blocks/${id}`, block);
  return response.data;
};

export const deleteBlock = async (id: number): Promise<void> => {
  await axiosClient.delete(`/blocks/${id}`);
};

export const getBlock = async (id: number): Promise<Block> => {
  const response = await axiosClient.get(`/blocks/${id}`);
  return response.data;
};
