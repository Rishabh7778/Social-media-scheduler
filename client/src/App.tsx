import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from './store/store';
import AuthPage from './pages/AuthPage';
import Calendar from './pages/Calender';

const App: React.FC = () => {
  // 1. URL se token pakadne ki Ninja Technique
  const urlParams = new URLSearchParams(window.location.search);
  const tokenFromUrl = urlParams.get('token');

  if (tokenFromUrl) {
    // Agar URL mein token aaya hai, toh use jeb (localStorage) mein daal lo
    localStorage.setItem('token', tokenFromUrl);
    // URL ko saaf kar do taaki ganda na dikhe
    window.history.replaceState(null, '', '/calendar');
  }

  // 2. Redux store se token nikal rahe hain (Sirf ek baar likhna hai)
  const { token } = useSelector((state: RootState) => state.auth);
  
  // 3. Check auth: Agar token Redux mein hai YA localStorage mein hai, toh user authenticated hai!
  const isAuthenticated = !!token || !!localStorage.getItem('token'); 

  return (
    <Router>
      <Routes>
        {/* Agar login hai toh seedha calendar bhejo */}
        <Route 
          path="/" 
          element={isAuthenticated ? <Navigate to="/calendar" /> : <AuthPage />} 
        />
        
        {/* Protected Route: Ab yeh Facebook se aane par tumhe bahar nahi nikalega */}
        <Route 
          path="/calendar" 
          element={isAuthenticated ? <Calendar /> : <Navigate to="/" />} 
        />
      </Routes>
    </Router>
  );
};

export default App;