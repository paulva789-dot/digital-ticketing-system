import { Route, Routes } from "react-router-dom";
import { Navbar } from "./components/Navbar";
import { AdminAnalytics } from "./pages/AdminAnalytics";
import { BookTicket } from "./pages/BookTicket";
import { Home } from "./pages/Home";
import { StaffDashboard } from "./pages/StaffDashboard";
import { StaffLogin } from "./pages/StaffLogin";
import { TicketStatus } from "./pages/TicketStatus";

export default function App() {
  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/book/:serviceId" element={<BookTicket />} />
        <Route path="/ticket/:id" element={<TicketStatus />} />
        <Route path="/staff/login" element={<StaffLogin />} />
        <Route path="/staff/dashboard" element={<StaffDashboard />} />
        <Route path="/staff/analytics" element={<AdminAnalytics />} />
      </Routes>
    </div>
  );
}
