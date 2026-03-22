import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type Profile = Tables<"profiles">;
type AppRole = "admin" | "master" | "normal";

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isAdmin: boolean;
  userRole: AppRole | null;
  canEditMetas: boolean;
  /** true se o usuário tem permissão de operar o almoxarifado (admin, master ou módulo habilitado) */
  canAlmoxarifado: boolean;
  /** mapa key→enabled dos módulos carregados para este usuário */
  enabledModules: Record<string, boolean>;
  loading: boolean;
  refreshAuth: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function loadAuthState(session: Session | null) {
  const user = session?.user ?? null;

  if (!user) {
    return {
      user: null,
      session,
      profile: null,
      isAdmin: false,
      userRole: null as AppRole | null,
      canEditMetas: false,
    };
  }

  const [{ data: profile }, { data: roleData }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", user.id).maybeSingle(),
  ]);

  const userRole = (roleData?.role as AppRole) ?? null;
  const isAdmin = userRole === "admin";
  const canEditMetas = userRole === "admin" || userRole === "master";

  return {
    user,
    session,
    profile: profile ?? null,
    isAdmin,
    userRole,
    canEditMetas,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userRole, setUserRole] = useState<AppRole | null>(null);
  const [canEditMetas, setCanEditMetas] = useState(false);
  const [enabledModules, setEnabledModules] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  const applyState = (authState: Awaited<ReturnType<typeof loadAuthState>>) => {
    setSession(authState.session);
    setUser(authState.user);
    setProfile(authState.profile);
    setIsAdmin(authState.isAdmin);
    setUserRole(authState.userRole);
    setCanEditMetas(authState.canEditMetas);
    setLoading(false);
  };

  const applyFallback = (s: Session | null) => {
    setSession(s);
    setUser(s?.user ?? null);
    setProfile(null);
    setIsAdmin(false);
    setUserRole(null);
    setCanEditMetas(false);
    setLoading(false);
  };

  const refreshAuth = async () => {
    setLoading(true);
    const { data } = await supabase.auth.getSession();
    applyState(await loadAuthState(data.session));
  };

  // Carrega módulos habilitados para o usuário autenticado
  const loadEnabledModules = useCallback(async (uid: string | undefined) => {
    if (!uid) { setEnabledModules({}); return; }
    const [{ data: globalData }, { data: userPerms }] = await Promise.all([
      supabase.from("app_modules").select("key, enabled"),
      supabase.from("user_module_permissions").select("module_key, enabled").eq("user_id", uid),
    ]);
    const map: Record<string, boolean> = {};
    for (const row of globalData ?? []) map[row.key] = !!row.enabled;
    for (const row of userPerms ?? []) {
      if (map[row.module_key] !== false) map[row.module_key] = !!row.enabled;
    }
    setEnabledModules(map);
  }, []);

  useEffect(() => {
    let mounted = true;

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      loadAuthState(nextSession)
        .then((s) => {
          if (mounted) {
            applyState(s);
            loadEnabledModules(s.user?.id);
          }
        })
        .catch(() => { if (mounted) applyFallback(nextSession); });
    });

    supabase.auth.getSession().then(({ data }) => {
      loadAuthState(data.session)
        .then((s) => {
          if (mounted) {
            applyState(s);
            loadEnabledModules(s.user?.id);
          }
        })
        .catch(() => { if (mounted) applyFallback(data.session); });
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [loadEnabledModules]);

  const canAlmoxarifado = useMemo(() => {
    if (isAdmin || canEditMetas) return true;
    return enabledModules["almoxarifado"] === true;
  }, [isAdmin, canEditMetas, enabledModules]);

  const value = useMemo(
    () => ({
      user,
      session,
      profile,
      isAdmin,
      userRole,
      canEditMetas,
      canAlmoxarifado,
      enabledModules,
      loading,
      refreshAuth,
      signOut: async () => {
        await supabase.auth.signOut();
      },
    }),
    [user, session, profile, isAdmin, userRole, canEditMetas, canAlmoxarifado, enabledModules, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
