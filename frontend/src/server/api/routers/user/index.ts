import { createTRPCRouter } from "~/server/api/trpc";
import { getProfile, syncUser, completeOnboarding } from "./procedures";

export const userRouter = createTRPCRouter({
  getProfile,
  syncUser,
  completeOnboarding,
}); 