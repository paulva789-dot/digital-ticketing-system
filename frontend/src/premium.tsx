import { createContext, ReactNode, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "ticketing.premiumDemo";

interface PremiumContextValue {
  isPremium: boolean;
  setIsPremium: (value: boolean) => void;
}

const PremiumContext = createContext<PremiumContextValue | null>(null);

/**
 * Front-end preview of the premium tier. Real eligibility (front-row limits,
 * booking windows) is always enforced server-side against the signed-in
 * user's `isPremium` flag — this toggle only drives the UI for accounts that
 * aren't wired up to real Firebase sign-in yet.
 */
export function PremiumProvider({ children }: { children: ReactNode }) {
  const [isPremium, setIsPremiumState] = useState(() => localStorage.getItem(STORAGE_KEY) === "true");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(isPremium));
  }, [isPremium]);

  return (
    <PremiumContext.Provider value={{ isPremium, setIsPremium: setIsPremiumState }}>
      {children}
    </PremiumContext.Provider>
  );
}

export function usePremium() {
  const ctx = useContext(PremiumContext);
  if (!ctx) throw new Error("usePremium must be used within PremiumProvider");
  return ctx;
}
