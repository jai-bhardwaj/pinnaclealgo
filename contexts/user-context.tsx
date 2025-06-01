"use client";

import { createContext, useContext, ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import type { ExtendedUser } from '@/types';

interface UserContextValue {
    user: ExtendedUser | null;
    isLoading: boolean;
}

const UserContext = createContext<UserContextValue | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
    const { data: session, status } = useSession();
    
    // Type-safe user extraction using proper NextAuth types
    const user: ExtendedUser | null = session?.user ? {
        id: session.user.id,
        email: session.user.email || '',
        username: session.user.username,
        role: session.user.role,
        name: session.user.name || undefined,
    } : null;

    return (
        <UserContext.Provider value={{
            user,
            isLoading: status === 'loading'
        }}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
} 