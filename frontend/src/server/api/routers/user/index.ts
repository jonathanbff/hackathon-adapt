import { createTRPCRouter } from "~/server/api/trpc";
import { getProfile } from "./procedures";

export const userRouter = createTRPCRouter({
  getProfile,
}); 