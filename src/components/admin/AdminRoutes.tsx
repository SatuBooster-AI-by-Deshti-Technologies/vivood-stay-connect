import { Routes, Route } from "react-router-dom";
import { AdminDashboard } from "./AdminDashboard";
import { AdminCalendar } from "./AdminCalendar";
import { AdminBookings } from "./AdminBookings";
import { AdminAccommodations } from "./AdminAccommodations";
import { AdminClients } from "./AdminClients";
import { AdminWhatsApp } from "./AdminWhatsApp";
import { AdminInstagram } from "./AdminInstagram";
import { AdminChats } from "./AdminChats";
import { NewBooking } from "./NewBooking";
import { NewClient } from "./NewClient";

export function AdminRoutes() {
  return (
    <Routes>
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/admin/calendar" element={<AdminCalendar />} />
      <Route path="/admin/bookings" element={<AdminBookings />} />
      <Route path="/admin/bookings/new" element={<NewBooking />} />
      <Route path="/admin/accommodations" element={<AdminAccommodations />} />
      <Route path="/admin/clients" element={<AdminClients />} />
      <Route path="/admin/clients/new" element={<NewClient />} />
      <Route path="/admin/whatsapp" element={<AdminWhatsApp />} />
      <Route path="/admin/instagram" element={<AdminInstagram />} />
      <Route path="/admin/chats" element={<AdminChats />} />
    </Routes>
  );
}