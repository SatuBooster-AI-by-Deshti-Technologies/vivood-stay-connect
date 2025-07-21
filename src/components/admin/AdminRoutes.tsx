import { Routes, Route } from "react-router-dom";
import { AdminDashboard } from "./AdminDashboard";
import { AdminCalendar } from "./AdminCalendar";
import { AdminBookings } from "./AdminBookings";
import { AdminAccommodations } from "./AdminAccommodations";
import { AdminClients } from "./AdminClients";
import { NewBooking } from "./NewBooking";
import { NewClient } from "./NewClient";
import { EditClient } from "./EditClient";
import { EditClient } from "./EditClient";
import { AdminAccounting } from "./AdminAccounting";
import { AdminAudit } from "./AdminAudit";

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
      <Route path="clients/edit/:id" element={<EditClient />} />
      <Route path="accounting" element={<AdminAccounting />} />
      <Route path="audit" element={<AdminAudit />} />
    </Routes>
  );
}