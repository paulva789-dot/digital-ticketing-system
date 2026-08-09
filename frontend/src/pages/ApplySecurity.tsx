import { motion } from "framer-motion";
import { FormEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../api/client";

export function ApplySecurity() {
  const { t } = useTranslation();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [experience, setExperience] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reply, setReply] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await api.post<{ reply: string }>("/api/security-applications", {
        fullName,
        email,
        phone,
        experience: experience || undefined,
        message: message || undefined,
      });
      setReply(res.reply);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  if (reply) {
    return (
      <div className="max-w-md mx-auto py-16 px-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="themed-surface border themed-border rounded-xl p-8"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.15, type: "spring", stiffness: 300 }}
            className="text-3xl mb-3"
          >
            ✅
          </motion.div>
          <h1 className="text-xl font-bold mb-2">{reply}</h1>
          <p className="themed-muted text-sm">{t("security.confirmationSub")}</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto py-12 px-6">
      <h1 className="text-2xl font-bold mb-2">{t("security.title")}</h1>
      <p className="themed-muted mb-8 text-sm">{t("security.subtitle")}</p>
      <form onSubmit={handleSubmit} className="grid gap-4">
        <label className="grid gap-1">
          <span className="text-sm themed-muted">{t("security.fullName")}</span>
          <input
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="themed-surface border themed-border rounded-md px-3 py-2"
          />
        </label>
        <label className="grid gap-1">
          <span className="text-sm themed-muted">{t("security.email")}</span>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="themed-surface border themed-border rounded-md px-3 py-2"
          />
        </label>
        <label className="grid gap-1">
          <span className="text-sm themed-muted">{t("security.phone")}</span>
          <input
            required
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="themed-surface border themed-border rounded-md px-3 py-2"
          />
        </label>
        <label className="grid gap-1">
          <span className="text-sm themed-muted">{t("security.experience")}</span>
          <textarea
            value={experience}
            onChange={(e) => setExperience(e.target.value)}
            rows={3}
            className="themed-surface border themed-border rounded-md px-3 py-2"
          />
        </label>
        <label className="grid gap-1">
          <span className="text-sm themed-muted">{t("security.message")}</span>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            className="themed-surface border themed-border rounded-md px-3 py-2"
          />
        </label>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="themed-accent rounded-md py-2 font-medium disabled:opacity-50"
        >
          {submitting ? t("security.submitting") : t("security.submit")}
        </button>
      </form>
    </div>
  );
}
