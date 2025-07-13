import { useUser as useClerkUser } from "@clerk/clerk-react";
export const useUser = () => {
  const clerkuser = useClerkUser();
  return { ...clerkuser, id: clerkuser.user?.externalId };
};
