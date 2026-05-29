"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { supabase } from "../supabase/client";

const AuthContext = createContext({
  user: null,
  session: null,
  loading: true,
  initialized: false,
});

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      try {
        console.debug("AuthProvider: loadSession start");
        const {
          data: { session: currentSession },
        } = await supabase.auth.getSession();

        if (!mounted) return;
        setSession(currentSession);
        setUser(currentSession?.user || null);
        setLoading(false);
        setInitialized(true);
        // expose a short debug snapshot for the browser console
        try {
          window.__EVENTLAYER_AUTH = {
            loadedAt: Date.now(),
            hasSession: !!currentSession,
            userId: currentSession?.user?.id || null,
            email: currentSession?.user?.email || null,
          };
          console.debug("AuthProvider: session loaded", window.__EVENTLAYER_AUTH);
        } catch (e) {}
      } catch (err) {
        console.debug("AuthProvider: loadSession error", err && err.message);
        if (!mounted) return;
        setSession(null);
        setUser(null);
        setLoading(false);
        setInitialized(true);
      }
    }

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      console.debug("AuthProvider: onAuthStateChange", event, !!nextSession);
      setSession(nextSession);
      setUser(nextSession?.user || null);
      setLoading(false);
      setInitialized(true);
      try {
        if (window && window.__EVENTLAYER_AUTH) {
          window.__EVENTLAYER_AUTH.lastEvent = event;
          window.__EVENTLAYER_AUTH.hasSession = !!nextSession;
        }
      } catch (e) {}
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const value = useMemo(
    () => ({ user, session, loading, initialized }),
    [user, session, loading, initialized],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useUser() {
  return useContext(AuthContext);
}
