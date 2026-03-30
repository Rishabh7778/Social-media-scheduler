import React from 'react';
import { Toaster } from 'react-hot-toast';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from './store/store';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import Calendar from './pages/Calender';
import Settings from './pages/Settings';
import Overview from './pages/Overview';
import ShowPosts from './pages/ShowPosts';

// 🚨 1. Naya Component: Ye Security Guard ka kaam karega
const ProtectedRoute = () => {
  const { token } = useSelector((state: RootState) => state.auth);
  const isAuthenticated = !!token || !!localStorage.getItem('token');

  // Agar user ke paas token nahi hai, toh usey wapas login page ("/") par phek do
  // Agar token hai, toh Outlet render karo (yaani uske andar ke components)
  return isAuthenticated ? <Outlet /> : <Navigate to="/" replace />;
};

const App: React.FC = () => {
  // Social Login Token logic (Facebook / LinkedIn se wapas aane par)
  const urlParams = new URLSearchParams(window.location.search);
  const tokenFromUrl = urlParams.get('token');
  
  if (tokenFromUrl) {
    localStorage.setItem('token', tokenFromUrl);
    window.history.replaceState(null, '', '/dashboard');
  }

  const { token } = useSelector((state: RootState) => state.auth);
  const isAuthenticated = !!token || !!localStorage.getItem('token');

  return (
    <div>
      <Toaster position="top-right" reverseOrder={false} />
    
    <Router>
      <Routes>
        {/* PUBLIC ROUTE: Sirf unke liye jo login nahi hain */}
        <Route
          path="/"
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <AuthPage />}
        />

        {/* 🚨 2. SECURE ROUTES: ProtectedRoute ke andar Dashboard pack kar diya */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />}>
            <Route index element={<Overview />} />
            <Route path="schedule" element={<Calendar />} />
            <Route path="posts" element={<ShowPosts />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Route>
        
        {/* Fallback Route: Agar koi ajeeb URL dale toh usey wapas bhej do */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
    </div>
  );
};

export default App;