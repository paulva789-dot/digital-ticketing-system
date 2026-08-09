import { FormEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth";

export function Auth({ mode }: { mode: "signin" | "signup" }) {
  const { t } = useTranslation();
  const { signIn, signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const isSignUp = mode === "signup";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      if (isSignUp) await signUp(email, password);
      else await signIn(email, password);
      navigate("/my-tickets");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-sm mx-auto py-12 px-6">
      <h1 className="text-2xl font-bold mb-6">{isSignUp ? t("auth.signUpTitle") : t("auth.signInTitle")}</h1>
      <form onSubmit={handleSubmit} className="grid gap-4">
        <input
          type="email"
          required
          placeholder={t("auth.email")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="themed-surface border themed-border rounded-md px-3 py-2"
        />
        <input
          type="password"
          required
          minLength={6}
          placeholder={t("auth.password")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="themed-surface border themed-border rounded-md px-3 py-2"
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="themed-accent rounded-md py-2 font-medium disabled:opacity-50"
        >
          {isSignUp ? t("auth.signUp") : t("auth.signIn")}
        </button>
      </form>
      <p className="themed-muted text-sm mt-4 text-center">
        {isSignUp ? (
          <>
            {t("auth.haveAccount")}{" "}
            <Link to="/sign-in" className="underline">
              {t("auth.signIn")}
            </Link>
          </>
        ) : (
          <>
            {t("auth.noAccount")}{" "}
            <Link to="/sign-up" className="underline">
              {t("auth.signUp")}
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
