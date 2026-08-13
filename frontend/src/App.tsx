import { AnimatePresence } from "framer-motion";
import { Route, Routes, useLocation } from "react-router-dom";
import { Navbar } from "./components/Navbar";
import { PageTransition } from "./components/PageTransition";
import { AdminAnalytics } from "./pages/AdminAnalytics";
import { ApplySecurity } from "./pages/ApplySecurity";
import { Auth } from "./pages/Auth";
import { BookTicket } from "./pages/BookTicket";
import { Home } from "./pages/Home";
import { ManageServices } from "./pages/ManageServices";
import { MyTickets } from "./pages/MyTickets";
import { NotFound } from "./pages/NotFound";
import { StaffDashboard } from "./pages/StaffDashboard";
import { StaffLogin } from "./pages/StaffLogin";
import { TicketStatus } from "./pages/TicketStatus";

export default function App() {
  const location = useLocation();

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <Navbar />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<PageTransition><Home /></PageTransition>} />
          <Route path="/book/:serviceId" element={<PageTransition><BookTicket /></PageTransition>} />
          <Route path="/ticket/:id" element={<PageTransition><TicketStatus /></PageTransition>} />
          <Route path="/apply-security" element={<PageTransition><ApplySecurity /></PageTransition>} />
          <Route path="/sign-in" element={<PageTransition><Auth mode="signin" /></PageTransition>} />
          <Route path="/sign-up" element={<PageTransition><Auth mode="signup" /></PageTransition>} />
          <Route path="/my-tickets" element={<PageTransition><MyTickets /></PageTransition>} />
          <Route path="/staff/login" element={<PageTransition><StaffLogin /></PageTransition>} />
          <Route path="/staff/dashboard" element={<PageTransition><StaffDashboard /></PageTransition>} />
          <Route path="/staff/analytics" element={<PageTransition><AdminAnalytics /></PageTransition>} />
          <Route path="/staff/services" element={<PageTransition><ManageServices /></PageTransition>} />
          <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
        </Routes>
      </AnimatePresence>
    </div>
  );
}
