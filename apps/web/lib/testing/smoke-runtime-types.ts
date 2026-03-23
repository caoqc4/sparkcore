export type SmokeConfig = {
  secret: string;
  email: string;
  password: string;
  serviceRoleKey: string;
  url: string;
  anonKey: string;
};

export type SmokeUser = {
  id: string;
  email: string;
  workspaceId: string;
};
