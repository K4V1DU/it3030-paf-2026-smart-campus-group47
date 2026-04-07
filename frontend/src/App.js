import { Routes, Route } from "react-router-dom";
import ResourceList from './Components/ResourceList/ResourceList';
import MyBookings from './Components/Bookings/MyBookings';
import BookingReviews from './Components/BookingReviews/BookingReviews'
import TicketList from './Components/TicketList/TicketList';
import ResourceManagement from './Components/ResourceManagement/ResourceManagement';






function App() {
  return (
    <Routes>
      <Route path="/" element={<ResourceList />} />
      <Route path="/ResourceList" element={<ResourceList />} />
      <Route path="/Booking" element={<MyBookings />} />
      <Route path="/BookingReviews" element={<BookingReviews />} />
      <Route path="/Ticket" element={<TicketList />} />
      <Route path="/ResourceManagement" element={<ResourceManagement />} />




    </Routes>
  );
}

export default App;