import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "donor" | "recipient" | "hospital";
    } & DefaultSession["user"];
  }

  interface User {
    role: "donor" | "recipient" | "hospital";
  }
}
