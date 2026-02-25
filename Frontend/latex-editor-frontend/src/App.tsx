import { AuthProvider } from './context/useAuth';
import { Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Editor from './pages/Editor'; 

function App() {
  return (
    <AuthProvider>
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<Editor />} />
    </Routes>
    </AuthProvider>
  );
}

export default App;