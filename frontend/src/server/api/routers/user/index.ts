import { createTRPCRouter } from "~/server/api/trpc";
import { getProfile, getAllUsers } from "./procedures";

export const userRouter = createTRPCRouter({
  getProfile,
  getAllUsers,
}); 