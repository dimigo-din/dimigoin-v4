import { getInstance } from "./client.ts";

const client = getInstance();

export type User = {
  id: string;
  email: string;
  name: string;
  permission: string;
};

export const searchUser = async (name: string): Promise<User[]> => {
  return (await client.get("/manage/user/search?name=" + name)).data;
};
