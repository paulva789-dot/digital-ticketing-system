import { Link } from "react-router-dom";

export function Navbar() {
  return (
    <nav className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
      <Link to="/" className="font-semibold text-slate-900">
        Digital Ticketing
      </Link>
      <div className="flex gap-4 text-sm text-slate-600">
        <Link to="/" className="hover:text-slate-900">
          Book a ticket
        </Link>
        <Link to="/staff/login" className="hover:text-slate-900">
          Staff login
        </Link>
      </div>
    </nav>
  );
}
