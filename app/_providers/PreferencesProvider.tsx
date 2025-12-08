"use client";

import { createContext, useContext, ReactNode } from "react";
import { User } from "@/app/_types";

interface PreferencesContextType {
  particlesEnabled: boolean;
  wandCursorEnabled: boolean;
  user: Partial<User> | null;
  encryptionKey: string | null;
  customKeysPath?: string;
}

const PreferencesContext = createContext<PreferencesContextType>({
  particlesEnabled: true,
  wandCursorEnabled: true,
  user: null,
  encryptionKey: null,
  customKeysPath: undefined,
});

export function PreferencesProvider({
  children,
  preferences,
}: {
  children: ReactNode;
  preferences: PreferencesContextType;
}) {
  return (
    <PreferencesContext.Provider value={preferences}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  return useContext(PreferencesContext);
}
