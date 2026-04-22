"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { AuthApi, UsersApi } from "./api/endpoints";
import { AUTH_TOKEN_KEY, AUTH_USER_KEY } from "./api/config";
import { onAuthChange } from "./api/client";
import type {
  AuthResponseDto,
  LoginRequestDto,
  RegisterRequestDto,
  UserDto,
} from "./api/types";

const PUBLIC_ROUTES = new Set(["/login", "/register"]);

export interface AuthSession {
  token: string;
  userId: number;
  email: string;
  expiresAt: string;
}

interface AuthContextValue {
  session: AuthSession | null;
  user: UserDto | null;
  initializing: boolean;
  login: (input: LoginRequestDto) => Promise<void>;
  register: (input: RegisterRequestDto) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(AUTH_TOKEN_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
}

function writeStoredSession(session: AuthSession | null) {
  if (typeof window === "undefined") return;
  try {
    if (session)
      window.localStorage.setItem(AUTH_TOKEN_KEY, JSON.stringify(session));
    else window.localStorage.removeItem(AUTH_TOKEN_KEY);
  } catch {}
}

function readStoredUser(): UserDto | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(AUTH_USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as UserDto;
  } catch {
    return null;
  }
}

function writeStoredUser(user: UserDto | null) {
  if (typeof window === "undefined") return;
  try {
    if (user) window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    else window.localStorage.removeItem(AUTH_USER_KEY);
  } catch {}
}

function sessionFromAuth(resp: AuthResponseDto): AuthSession {
  return {
    token: resp.token,
    userId: resp.userId,
    email: resp.email,
    expiresAt: resp.expiresAt,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [user, setUser] = useState<UserDto | null>(null);
  const [initializing, setInitializing] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const stored = readStoredSession();
    const storedUser = readStoredUser();
    if (stored) {
      const expired =
        stored.expiresAt && new Date(stored.expiresAt).getTime() < Date.now();
      if (!expired) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSession(stored);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setUser(storedUser);
      } else {
        writeStoredSession(null);
        writeStoredUser(null);
      }
    }
    setInitializing(false);
  }, []);

  useEffect(() => {
    return onAuthChange((authed) => {
      if (!authed) {
        setSession(null);
        setUser(null);
        writeStoredSession(null);
        writeStoredUser(null);
      }
    });
  }, []);

  useEffect(() => {
    if (initializing) return;
    const isPublic = PUBLIC_ROUTES.has(pathname ?? "");
    if (!session && !isPublic) {
      const redirect = encodeURIComponent(pathname ?? "/");
      router.replace(`/login?next=${redirect}`);
    } else if (session && isPublic) {
      router.replace("/");
    }
  }, [session, pathname, initializing, router]);

  const login = useCallback(async (input: LoginRequestDto) => {
    const resp = await AuthApi.login(input);
    const s = sessionFromAuth(resp);
    writeStoredSession(s);
    setSession(s);
    try {
      const profile = await UsersApi.get(resp.userId);
      writeStoredUser(profile);
      setUser(profile);
    } catch {
      // profile fetch is best-effort; keep session even if it fails
    }
  }, []);

  const register = useCallback(async (input: RegisterRequestDto) => {
    const resp = await AuthApi.register(input);
    const s = sessionFromAuth(resp);
    writeStoredSession(s);
    setSession(s);
    try {
      const profile = await UsersApi.get(resp.userId);
      writeStoredUser(profile);
      setUser(profile);
    } catch {}
  }, []);

  const logout = useCallback(() => {
    writeStoredSession(null);
    writeStoredUser(null);
    setSession(null);
    setUser(null);
    router.replace("/login");
  }, [router]);

  const refreshUser = useCallback(async () => {
    if (!session) return;
    try {
      const profile = await UsersApi.get(session.userId);
      writeStoredUser(profile);
      setUser(profile);
    } catch {}
  }, [session]);

  const value = useMemo<AuthContextValue>(
    () => ({ session, user, initializing, login, register, logout, refreshUser }),
    [session, user, initializing, login, register, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

export { PUBLIC_ROUTES };
