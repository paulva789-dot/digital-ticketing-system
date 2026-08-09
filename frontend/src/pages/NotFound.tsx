import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export function NotFound() {
  return (
    <div className="max-w-md mx-auto py-24 px-6 text-center grid gap-4">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-6xl font-bold themed-muted"
      >
        404
      </motion.div>
      <p className="themed-muted">This page doesn't exist.</p>
      <Link to="/" className="themed-accent rounded-md py-2 font-medium">
        Back home
      </Link>
    </div>
  );
}
