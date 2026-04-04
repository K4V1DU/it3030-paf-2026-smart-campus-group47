import { Routes, Route } from "react-router-dom";
import ResourceList from './Components/ResourceList/ResourceList';
import MyBookings from './Components/Bookings/MyBookings';


function App() {
  return (
    <Routes>
      <Route path="/" element={<ResourceList />} />
      <Route path="/Booking" element={<MyBookings />} />
    </Routes>
  );
}

export default App;