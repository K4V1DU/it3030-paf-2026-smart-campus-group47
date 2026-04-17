import { Routes, Route } from 'react-router-dom';
import ResourceList from './Components/ResourceList/ResourceList';
import Login from './Components/Login/Login';
import Register from './Components/Register/Register';

function App() {
  return (
    <div>
      <Routes>
        <Route path="/" element={<ResourceList />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>

    </div>
  );
}

export default App;