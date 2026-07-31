import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

export interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
  provider: "email" | "google";
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock authentication service - replace with your actual auth service
class AuthService {
  private static STORAGE_KEY = "auth_user";

  static getStoredUser(): User | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  static storeUser(user: User): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
  }

  static removeUser(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  static async signIn(email: string, password: string): Promise<User> {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Mock validation
    if (email === "demo@aicharya.com" && password === "demo123") {
      const user: User = {
        id: "1",
        email,
        name: "Demo User",
        provider: "email",
      };
      this.storeUser(user);
      return user;
    }

    throw new Error("Invalid email or password");
  }

  static async signUp(
    email: string,
    password: string,
    name: string,
  ): Promise<User> {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Mock user creation
    const user: User = {
      id: Date.now().toString(),
      email,
      name,
      provider: "email",
    };

    this.storeUser(user);
    return user;
  }

  static async signInWithGoogle(): Promise<User> {
    // In a real app, this would integrate with Google OAuth
    // For demo purposes, we'll simulate it
    return new Promise((resolve, reject) => {
      // Simulate Google OAuth popup
      const confirmed = window.confirm(
        "Demo: This would open Google OAuth popup. Continue with demo Google user?",
      );

      if (confirmed) {
        setTimeout(() => {
          const user: User = {
            id: "google_" + Date.now(),
            email: "demo.google@aicharya.com",
            name: "Google Demo User",
            picture:
              "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
            provider: "google",
          };
          this.storeUser(user);
          resolve(user);
        }, 1500);
      } else {
        reject(new Error("Google sign-in cancelled"));
      }
    });
  }

  static async signOut(): Promise<void> {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));
    this.removeUser();
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored user on mount
    const storedUser = AuthService.getStoredUser();
    setUser(storedUser);
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const user = await AuthService.signIn(email, password);
      setUser(user);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    setLoading(true);
    try {
      const user = await AuthService.signUp(email, password, name);
      setUser(user);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const user = await AuthService.signInWithGoogle();
      setUser(user);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await AuthService.signOut();
      setUser(null);
    } catch (error) {
      console.error("Sign out error:", error);
    } finally {
      setLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
