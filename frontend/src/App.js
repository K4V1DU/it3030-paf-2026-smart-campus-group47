import { Routes, Route } from "react-router-dom";
import ResourceList from './Components/ResourceList/ResourceList';
import MyBookings from './Components/Bookings/MyBookings';
import BookingReviews from './Components/BookingReviews/BookingReviews'
import TicketList from './Components/TicketList/TicketList';
import ResourceManagement from './Components/ResourceManagement/ResourceManagement';




import TicketRaise from './Components/TicketRaise/Ticketraise';
import TicketDetails from './Components/TicketDetails/TicketDetails';
import AdminTicketDashboard from './Components/AdminTicketDashboard/AdminTicketDashboard'


function App() {
  return (
    <Routes>
      <Route path="/" element={<ResourceList />} />
      <Route path="/ResourceList" element={<ResourceList />} />
      <Route path="/Booking" element={<MyBookings />} />
      <Route path="/BookingReviews" element={<BookingReviews />} />
      <Route path="/Ticket" element={<TicketList />} />
      <Route path="/ResourceManagement" element={<ResourceManagement />} />

      <Route path="/AddTicket" element={<TicketRaise />} />
      <Route path="/Ticket/:id" element={<TicketDetails />} />
      <Route path="/Admin/Tickets" element={<AdminTicketDashboard />} />



    </Routes>
  );
}

export default App;