import { api } from "~/trpc/react";
export const useUser = () => {
  const { data: dbUser } = api.user.getProfile.useQuery();
  return { ...dbUser, id: dbUser?.id };
};
