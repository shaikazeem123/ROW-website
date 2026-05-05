import { createContext } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import type { UserRole, UserProfile } from '@/types/rbac';

export interface AuthContextType {
    isAuthenticated: boolean;
    user: User | null;
    session: Session | null;
    isLoading: boolean;
    logout: () => Promise<void>;
    role: UserRole;
    profile: UserProfile | null;
    refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
