
import { Routes, Route } from 'react-router-dom';
import Login from './Components/Login/Login';
import Register from './Components/Register/Register';
import ResourceList from './Components/ResourceList/ResourceList';
import MyBookings from './Components/Bookings/MyBookings';
import BookingReviews from './Components/BookingReviews/BookingReviews'
import TicketList from './Components/TicketList/TicketList';
import ResourceManagement from './Components/ResourceManagement/ResourceManagement';




import TicketRaise from './Components/TicketRaise/Ticketraise';
import TicketDetails from './Components/TicketDetails/TicketDetails';
import TicketReview from './Components/TicketReview/TicketReview';


import AdminTicketDashboard from './Components/AdminTicketDashboard/AdminTicketDashboard'
import AdminTicketDetails from './Components/AdminTicketDetails/AdminTicketDetails'




function App() {
  return (
    <div>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/home"                 element={<ResourceList />} />
        <Route path="/admin/dashboard"      element={<ResourceList />} />
        <Route path="/manager/dashboard"    element={<ResourceList />} />
        <Route path="/technician/dashboard" element={<ResourceList />} />
        <Route path="/ResourceList" element={<ResourceList />} />
      
      
      <Route path="/Booking" element={<MyBookings />} />
      <Route path="/BookingReviews" element={<BookingReviews />} />
      <Route path="/Ticket" element={<TicketList />} />
      <Route path="/ResourceManagement" element={<ResourceManagement />} />

      <Route path="/AddTicket" element={<TicketRaise />} />
      <Route path="/Ticket/:id" element={<TicketDetails />} />
      <Route path="/Admin/Tickets" element={<AdminTicketDashboard />} />
      <Route path="/Admin/Tickets/:id" element={<AdminTicketDetails />} />
      <Route path="/TicketReview" element={<TicketReview />} />






    </Routes>
  );
}

export default App;