import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface AuthState {
  isAuthenticated: boolean;
  username: string | null;
  token: string | null;
}

interface AuthContextType extends AuthState {
  login: (username: string, password: string) => Promise<string | null>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_KEY = 'gas_auth';

function loadSession(): AuthState {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { token: string; username: string };
      if (parsed.token && parsed.username) {
        return { isAuthenticated: true, token: parsed.token, username: parsed.username };
      }
    }
  } catch {
    // ignore
  }
  return { isAuthenticated: false, token: null, username: null };
}

function saveSession(token: string, username: string) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({ token, username }));
}

function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(loadSession);

  const login = useCallback(async (username: string, password: string): Promise<string | null> => {
    try {
      const res = await fetch('/api/gas/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { message?: string };
        return body.message ?? 'Login failed';
      }
      const data = (await res.json()) as { token: string; username: string };
      saveSession(data.token, data.username);
      setState({ isAuthenticated: true, token: data.token, username: data.username });
      return null; // no error
    } catch {
      return 'Network error';
    }
  }, []);

  const logout = useCallback(() => {
    if (state.token) {
      void fetch('/api/gas/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${state.token}` },
      });
    }
    clearSession();
    setState({ isAuthenticated: false, token: null, username: null });
  }, [state.token]);

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
