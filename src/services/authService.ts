const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://zlotgghqdfrbxeuinjjy.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpsb3RnZ2hxZGZyYnhldWluamp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE4MDQzMTUsImV4cCI6MjEwNzM4MDMxNX0.-5C5gZzyi595pPdR6SB7eWb2lcchAz2qmXWnNHWaRBg';

const STORAGE_KEYS = {
  USER: 'zuu_ai_auth_user',
  TOKEN: 'zuu_ai_auth_token'
};

export interface AuthUser {
  id: string;
  email: string;
  createdAt?: string;
}

type AuthListener = (user: AuthUser | null) => void;

export class AuthService {
  private static listeners: Set<AuthListener> = new Set();

  static getUser(): AuthUser | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.USER);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  static getToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.TOKEN);
  }

  static subscribe(listener: AuthListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private static notify(user: AuthUser | null) {
    this.listeners.forEach((cb) => cb(user));
  }

  static async signUp(email: string, password: string): Promise<{ user: AuthUser; message?: string }> {
    if (!email || !password) throw new Error('Email and password are required');
    if (password.length < 6) throw new Error('Password must be at least 6 characters');

    const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error_description || data.msg || data.message || 'Signup failed');
    }

    const authUser: AuthUser = {
      id: data.user?.id || data.id || crypto.randomUUID(),
      email: data.user?.email || email,
      createdAt: data.user?.created_at || new Date().toISOString()
    };

    if (data.access_token) {
      localStorage.setItem(STORAGE_KEYS.TOKEN, data.access_token);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(authUser));
      this.notify(authUser);
    }

    return { user: authUser, message: data.access_token ? undefined : 'Please check your email to confirm your account' };
  }

  static async signIn(email: string, password: string): Promise<AuthUser> {
    if (!email || !password) throw new Error('Email and password are required');

    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error_description || data.msg || data.message || 'Invalid email or password');
    }

    const authUser: AuthUser = {
      id: data.user?.id || crypto.randomUUID(),
      email: data.user?.email || email,
      createdAt: data.user?.created_at || new Date().toISOString()
    };

    localStorage.setItem(STORAGE_KEYS.TOKEN, data.access_token);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(authUser));
    this.notify(authUser);
    return authUser;
  }

  static signOut(): void {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
    this.notify(null);
  }
}
