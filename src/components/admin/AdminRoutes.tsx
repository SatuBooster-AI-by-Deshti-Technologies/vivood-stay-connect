import { Routes, Route } from "react-router-dom";
import { AdminDashboard } from "./AdminDashboard";
import { AdminCalendar } from "./AdminCalendar";
import { AdminBookings } from "./AdminBookings";
import { AdminAccommodations } from "./AdminAccommodations";
import { AdminClients } from "./AdminClients";
import { NewBooking } from "./NewBooking";
import { NewClient } from "./NewClient";

export function AdminRoutes() {
  return (
    <Routes>
      <Route index element={<AdminDashboard />} />
      <Route path="calendar" element={<AdminCalendar />} />
      <Route path="bookings" element={<AdminBookings />} />
      <Route path="bookings/new" element={<NewBooking />} />
      <Route path="accommodations" element={<AdminAccommodations />} />
      <Route path="clients" element={<AdminClients />} />
      <Route path="clients/new" element={<NewClient />} />
    </Routes>
  );
}