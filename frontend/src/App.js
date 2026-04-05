import { Routes, Route } from "react-router-dom";
import ResourceList from './Components/ResourceList/ResourceList';
import MyBookings from './Components/Bookings/MyBookings';
import TicketList from './Components/TicketList/TicketList';


function App() {
  return (
    <Routes>
      <Route path="/" element={<ResourceList />} />
      <Route path="/Booking" element={<MyBookings />} />
      <Route path="/Ticket" element={<TicketList />} />

    </Routes>
  );
}

export default App;