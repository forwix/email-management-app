import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// ここは実在するパスに合わせる（.jsx を明記）
import LoginPage from './pages/auth/LoginPage.jsx';
import RegisterPage from './pages/auth/RegisterPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';

// あとで作るページは一旦コメントアウト
// import EmailsPage from './pages/EmailsPage';
// import EmailDetailPage from './pages/EmailDetailPage';
// import ComposeEmailPage from './pages/ComposeEmailPage';
// import SettingsPage from './pages/SettingsPage';

import LoadingSpinner from './components/LoadingSpinner.jsx';
import Layout from './components/Layout.jsx';

// 認証コンテキストを使っていない場合は仮のフックにしておく
// 本物があるなら import { useAuth } from './contexts/AuthContext';
const useAuth = () => ({ isAuthenticated: false, loading: false });

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  return isAuthenticated ? children : <Navigate to="/login" />;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  return isAuthenticated ? <Navigate to="/dashboard" /> : children;
};

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }/>
          <Route path="/register" element={
            <PublicRoute>
              <RegisterPage />
            </PublicRoute>
          }/>

          {/* Protected routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <Layout>
                <Routes>
                  <Route path="/dashboard" element={<DashboardPage />} />
                  {/* あとで追加
                  <Route path="/emails" element={<EmailsPage />} />
                  <Route path="/emails/:id" element={<EmailDetailPage />} />
                  <Route path="/compose" element={<ComposeEmailPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  */}
                  <Route path="/" element={<Navigate to="/dashboard" />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          }/>
        </Routes>
      </BrowserRouter>
    </div>
  );
}
