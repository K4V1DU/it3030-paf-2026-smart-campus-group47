import { Routes, Route } from "react-router-dom";
import ResourceList from './Components/ResourceList/ResourceList';
import MyBookings from './Components/Bookings/MyBookings';
import IncidentList from './Components/IncidentsList/IncidentList'



function App() {
  return (
    <Routes>
      <Route path="/" element={<ResourceList />} />
      <Route path="/Booking" element={<MyBookings />} />
      <Route path="/Incident" element={<IncidentList />} />

    </Routes>
  );
}

export default App;