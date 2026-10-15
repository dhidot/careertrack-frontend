
"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  getSession,
  type SessionResult,
  type SessionUser,
} from "../lib/session-client";

type AuthStatus =
  | "loading"
  | "authenticated"
  | "unauthenticated"
  | "forbidden"
  | "unavailable";

type AuthContextValue = {
  status: AuthStatus;
  user: SessionUser | null;
  refreshSession: () => Promise<SessionResult>;
};

const AuthContext = createContext<AuthContextValue | null>(
  null
);

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [status, setStatus] =
    useState<AuthStatus>("loading");

  const [user, setUser] =
    useState<SessionUser | null>(null);

  const applySession = useCallback(
    (result: SessionResult) => {
      setStatus(result.status);

      if (result.status === "authenticated") {
        setUser(result.user);
      } else {
        setUser(null);
      }
    },
    []
  );

  const refreshSession = useCallback(async () => {
    const result = await getSession();
    applySession(result);
    return result;
  }, [applySession]);

  useEffect(() => {
    let active = true;

    void getSession().then((result) => {
      if (active) {
        applySession(result);
      }
    });

    return () => {
      active = false;
    };
  }, [applySession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      refreshSession,
    }),
    [status, user, refreshSession]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}
