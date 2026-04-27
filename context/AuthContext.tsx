"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";
import type { BlogOSUser } from "@/types";

interface AuthContextValue {
  firebaseUser: User | null;
  user: BlogOSUser | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  firebaseUser: null,
  user: null,
  loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [user, setUser] = useState<BlogOSUser | null>(null);
  const [loading, setLoading] = useState(true);

  /* Listen to Firebase Auth state */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (fbUser) => {
      setFirebaseUser(fbUser);
      if (!fbUser) {
        setUser(null);
        setLoading(false);
      }
    });
    return unsub;
  }, []);

  /* When Firebase user changes, subscribe to their Firestore doc (realtime) */
  useEffect(() => {
    if (!firebaseUser) return;

    const unsub = onSnapshot(
      doc(db, "users", firebaseUser.uid),
      (snap) => {
        if (snap.exists()) {
          setUser(snap.data() as BlogOSUser);
        }
        setLoading(false);
      },
      () => {
        // Firestore read error — stop loading
        setLoading(false);
      }
    );
    return unsub;
  }, [firebaseUser]);

  return (
    <AuthContext.Provider value={{ firebaseUser, user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuthContext = () => useContext(AuthContext);
