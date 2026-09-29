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
  DEFAULT_NOTIFICATIONS,
  DEMO_REQUESTS,
  type NotificationItem,
  type PartRequest,
} from "@/data/content";

export const DEMO_EMAIL = "client@rousseaudistribution.ma";
export const DEMO_PASSWORD = "Rousseau2026!";

export type Profile = { name: string; email: string; company: string };

const DEFAULT_PROFILE: Profile = {
  name: "Client Démonstration",
  email: DEMO_EMAIL,
  company: "Rousseau Distribution",
};

const K = {
  session: "rd_session",
  profile: "rd_profile",
  theme: "rd_theme",
  notifsEnabled: "rd_notifs_enabled",
  notifications: "rd_notifications",
  favorites: "rd_favorites",
  requests: "rd_requests",
};

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore quota errors in the demo */
  }
}

type Store = {
  ready: boolean;
  authed: boolean;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  profile: Profile;
  saveProfile: (p: Partial<Profile>) => void;
  theme: "light" | "dark";
  setTheme: (t: "light" | "dark") => void;
  notifsEnabled: boolean;
  setNotifsEnabled: (v: boolean) => void;
  notifications: NotificationItem[];
  unread: number;
  markRead: (id: string) => void;
  markAllRead: () => void;
  favorites: string[];
  toggleFavorite: (id: string) => boolean;
  requests: PartRequest[];
  addRequest: (r: PartRequest) => void;
};

const AppStore = createContext<Store | null>(null);

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  const [theme, setThemeState] = useState<"light" | "dark">("light");
  const [notifsEnabled, setNotifsEnabledState] = useState(true);
  const [notifications, setNotifications] = useState<NotificationItem[]>(DEFAULT_NOTIFICATIONS);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [requests, setRequests] = useState<PartRequest[]>(DEMO_REQUESTS);

  useEffect(() => {
    setAuthed(read<boolean>(K.session, false));
    setProfile(read<Profile>(K.profile, DEFAULT_PROFILE));
    const t = read<"light" | "dark">(K.theme, "light");
    setThemeState(t);
    document.documentElement.classList.toggle("dark", t === "dark");
    setNotifsEnabledState(read<boolean>(K.notifsEnabled, true));
    setNotifications(read<NotificationItem[]>(K.notifications, DEFAULT_NOTIFICATIONS));
    setFavorites(read<string[]>(K.favorites, []));
    setRequests(read<PartRequest[]>(K.requests, DEMO_REQUESTS));
    setReady(true);
  }, []);

  const login = useCallback((email: string, password: string) => {
    const ok = email.trim().toLowerCase() === DEMO_EMAIL && password === DEMO_PASSWORD;
    if (ok) {
      setAuthed(true);
      write(K.session, true);
    }
    return ok;
  }, []);

  const logout = useCallback(() => {
    setAuthed(false);
    write(K.session, false);
  }, []);

  const saveProfile = useCallback((p: Partial<Profile>) => {
    setProfile((prev) => {
      const next = { ...prev, ...p };
      write(K.profile, next);
      return next;
    });
  }, []);

  const setTheme = useCallback((t: "light" | "dark") => {
    setThemeState(t);
    write(K.theme, t);
    document.documentElement.classList.toggle("dark", t === "dark");
  }, []);

  const setNotifsEnabled = useCallback((v: boolean) => {
    setNotifsEnabledState(v);
    write(K.notifsEnabled, v);
  }, []);

  const markRead = useCallback((id: string) => {
    setNotifications((prev) => {
      const next = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
      write(K.notifications, next);
      return next;
    });
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => {
      const next = prev.map((n) => ({ ...n, read: true }));
      write(K.notifications, next);
      return next;
    });
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    let added = false;
    setFavorites((prev) => {
      added = !prev.includes(id);
      const next = added ? [...prev, id] : prev.filter((f) => f !== id);
      write(K.favorites, next);
      return next;
    });
    return added;
  }, []);

  const addRequest = useCallback((r: PartRequest) => {
    setRequests((prev) => {
      const next = [r, ...prev];
      write(K.requests, next);
      return next;
    });
  }, []);

  const unread = notifications.filter((n) => !n.read).length;

  const value = useMemo<Store>(
    () => ({
      ready,
      authed,
      login,
      logout,
      profile,
      saveProfile,
      theme,
      setTheme,
      notifsEnabled,
      setNotifsEnabled,
      notifications,
      unread,
      markRead,
      markAllRead,
      favorites,
      toggleFavorite,
      requests,
      addRequest,
    }),
    [
      ready,
      authed,
      login,
      logout,
      profile,
      saveProfile,
      theme,
      setTheme,
      notifsEnabled,
      setNotifsEnabled,
      notifications,
      unread,
      markRead,
      markAllRead,
      favorites,
      toggleFavorite,
      requests,
      addRequest,
    ],
  );

  return <AppStore.Provider value={value}>{children}</AppStore.Provider>;
}

export function useApp() {
  const ctx = useContext(AppStore);
  if (!ctx) throw new Error("useApp must be used inside AppStoreProvider");
  return ctx;
}
