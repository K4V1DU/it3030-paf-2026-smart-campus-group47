import { Routes, Route } from "react-router-dom";
import ResourceList from './Components/ResourceList/ResourceList';
import MyBookings from './Components/Bookings/MyBookings';
import IncidentList from './Components/IncidentsList/IncidentList'
import BookingReviews from './Components/BookingReviews/BookingReviews'


function App() {
  return (
    <Routes>
      <Route path="/" element={<ResourceList />} />
      <Route path="/Booking" element={<MyBookings />} />
      <Route path="/Incident" element={<IncidentList />} />
      <Route path="/BookingReviews" element={<BookingReviews />} />
    </Routes>
  );
}

export default App;