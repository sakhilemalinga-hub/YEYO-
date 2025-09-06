import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import './App.css';
import LandingPage from './components/LandingPage';
import InvestorRegistration from './components/InvestorRegistration';
import FounderRegistration from './components/FounderRegistration';
import Profile from './components/Profile';
import BookingPage from './components/BookingPage';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import { Toaster } from './components/ui/sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Auth context
export const AuthContext = React.createContext();

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check for stored token
        const token = localStorage.getItem('access_token');
        if (!token) {
          setUser(null);
          setLoading(false);
          return;
        }

        // Set default authorization header
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        // Try to get current user profile
        const response = await axios.get(`${API}/auth/profile`);
        setUser(response.data);
      } catch (error) {
        console.log('No active session or invalid token');
        // Clear invalid token
        localStorage.removeItem('access_token');
        delete axios.defaults.headers.common['Authorization'];
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API}/auth/login`, {
        email,
        password
      });
      
      const { user, access_token } = response.data;
      
      // Store token
      localStorage.setItem('access_token', access_token);
      
      // Set default authorization header
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      
      setUser(user);
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.detail || 'Login failed';
      return { success: false, error: message };
    }
  };

  const register = async (userData) => {
    try {
      const response = await axios.post(`${API}/auth/register`, userData);
      
      const { user, access_token } = response.data;
      
      // Store token
      localStorage.setItem('access_token', access_token);
      
      // Set default authorization header
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      
      setUser(user);
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.detail || 'Registration failed';
      return { success: false, error: message };
    }
  };

  const updateProfile = async (updateData) => {
    try {
      const response = await axios.put(`${API}/auth/profile`, updateData);
      setUser(response.data);
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.detail || 'Profile update failed';
      return { success: false, error: message };
    }
  };

  const logout = () => {
    // Clear token and user data
    localStorage.removeItem('access_token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      setUser, 
      login, 
      register, 
      updateProfile, 
      logout, 
      loading 
    }}>
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
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
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