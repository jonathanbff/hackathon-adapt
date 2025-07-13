import { useUser as useClerkUser } from "@clerk/nextjs";
export const useUser = () => {
  const clerkuser = useClerkUser();
  return { ...clerkuser, id: clerkuser.user?.externalId };
};
