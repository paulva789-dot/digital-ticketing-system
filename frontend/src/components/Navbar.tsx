import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth";
import { usePremium } from "../premium";
import { Theme, useTheme } from "../theme";

const THEME_LABELS: Record<Theme, string> = { light: "☀️ Light", dark: "🌙 Dark", event: "🎉 Event" };
const LANGUAGES: { code: string; label: string }[] = [
  { code: "en", label: "EN" },
  { code: "fr", label: "FR" },
];

export function Navbar() {
  const { t, i18n } = useTranslation();
  const { theme, cycleTheme } = useTheme();
  const { isPremium, setIsPremium } = usePremium();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="themed-surface border-b themed-border px-6 py-4 flex items-center justify-between flex-wrap gap-3">
      <Link to="/" className="font-semibold">
        {t("nav.brand")}
      </Link>
      <div className="flex items-center gap-4 text-sm themed-muted flex-wrap">
        <Link to="/" className="hover:opacity-80">
          {t("nav.book")}
        </Link>
        <Link to="/apply-security" className="hover:opacity-80">
          {t("nav.applySecurity")}
        </Link>
        {user ? (
          <>
            <Link to="/my-tickets" className="hover:opacity-80">
              {t("nav.myTickets")}
            </Link>
            <button
              type="button"
              onClick={async () => {
                await signOut();
                navigate("/");
              }}
              className="hover:opacity-80"
            >
              {t("nav.signOut")}
            </button>
          </>
        ) : (
          <Link to="/sign-in" className="hover:opacity-80">
            {t("nav.signIn")}
          </Link>
        )}
        <Link to="/staff/login" className="hover:opacity-80">
          {t("nav.staffLogin")}
        </Link>

        <div className="flex rounded-full border themed-border overflow-hidden text-xs font-semibold">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => i18n.changeLanguage(lang.code)}
              className={`px-2 py-1 ${i18n.resolvedLanguage === lang.code ? "themed-accent" : ""}`}
            >
              {lang.label}
            </button>
          ))}
        </div>

        <motion.button
          type="button"
          onClick={() => setIsPremium(!isPremium)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          animate={isPremium ? { scale: [1, 1.12, 1] } : { scale: 1 }}
          transition={{ duration: 0.35 }}
          className={`rounded-full px-3 py-1 text-xs font-semibold border themed-border ${
            isPremium ? "themed-accent" : ""
          }`}
          title="Demo toggle simulating a premium subscription"
        >
          {isPremium ? `★ ${t("nav.premium")}` : t("nav.goPremium")}
        </motion.button>
        <motion.button
          type="button"
          onClick={cycleTheme}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.9, rotate: 15 }}
          className="rounded-full px-3 py-1 text-xs font-semibold border themed-border overflow-hidden"
          title="Switch theme"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={theme}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="inline-block"
            >
              {THEME_LABELS[theme]}
            </motion.span>
          </AnimatePresence>
        </motion.button>
      </div>
    </nav>
  );
}
