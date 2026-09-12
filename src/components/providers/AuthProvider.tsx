"use client";

import { createContext, useContext } from "react";
import type { Session } from "next-auth";

const AuthContext = createContext<{ session: Session | null }>({ session: null });

export function AuthProvider({
  children,
  session,
}: {
  children: React.ReactNode;
  session: Session | null;
}) {
  return <AuthContext.Provider value={{ session }}>{children}</AuthContext.Provider>;
}

export function useAuthSession() {
  return useContext(AuthContext);
}

