import ResourceList from './Components/ResourceList/ResourceList';
import Login from './Components/Login/Login';
import { Routes, Route } from 'react-router-dom';

function App() {
  return (
    <div>
      <Routes>
        <Route path="/" element={<ResourceList />} />
        <Route path="/login" element={<Login />} />
      </Routes>

    </div>
  );
}

export default App;