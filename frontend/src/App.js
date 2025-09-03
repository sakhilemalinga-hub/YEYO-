import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import './App.css';
import LandingPage from './components/LandingPage';
import InvestorRegistration from './components/InvestorRegistration';
import FounderRegistration from './components/FounderRegistration';
import Profile from './components/Profile';
import BookingPage from './components/BookingPage';
import { Toaster } from './components/ui/sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Auth context
export const AuthContext = React.createContext();

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check for session_id in URL fragment (from OAuth redirect)
        const hash = location.hash;
        if (hash.includes('session_id=')) {
          const sessionId = hash.split('session_id=')[1].split('&')[0];
          
          // Call backend to create session
          await axios.post(`${API}/auth/session`, { session_id: sessionId }, {
            withCredentials: true
          });
          
          // Clean up URL
          navigate(location.pathname, { replace: true });
        }
        
        // Try to get current user profile
        const response = await axios.get(`${API}/auth/profile`, {
          withCredentials: true
        });
        setUser(response.data);
      } catch (error) {
        console.log('No active session');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [location, navigate]);

  const login = () => {
    const redirectUrl = encodeURIComponent(window.location.origin + '/profile');
    window.location.href = `https://auth.emergentagent.com/?redirect=${redirectUrl}`;
  };

  const logout = () => {
    setUser(null);
    // Clear cookie by making request to logout endpoint (if implemented)
    document.cookie = 'session_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/register/investor" element={<InvestorRegistration />} />
            <Route path="/register/founder" element={<FounderRegistration />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/book-call" element={<BookingPage />} />
          </Routes>
          <Toaster />
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;