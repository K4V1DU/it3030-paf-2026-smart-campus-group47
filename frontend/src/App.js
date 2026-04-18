import { Routes, Route } from 'react-router-dom';
import Login from './Components/Login/Login';
import Register from './Components/Register/Register';
import ResourceList from './Components/ResourceList/ResourceList';


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
      </Routes>

    </div>
  );
}

export default App;