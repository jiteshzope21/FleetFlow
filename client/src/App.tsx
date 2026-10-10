import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext.js';
import { ThemeProvider } from './contexts/ThemeContext.js';
import { AuthLayout } from './components/layout/AuthLayout.js';
import { AppLayout } from './components/layout/AppLayout.js';
import { ProtectedRoute } from './routes/ProtectedRoute.js';

// Feature Pages
import { LoginPage } from './features/auth/LoginPage.js';
import { RegisterCompanyPage } from './features/auth/RegisterCompanyPage.js';
import { ForgotPasswordPage } from './features/auth/ForgotPasswordPage.js';
import { ResetPasswordPage } from './features/auth/ResetPasswordPage.js';
import { DashboardPage } from './features/dashboard/DashboardPage.js';
import { CompanyProfilePage } from './features/company/CompanyProfilePage.js';
import { UserListPage } from './features/users/UserListPage.js';
import { UserProfilePage } from './features/settings/UserProfilePage.js';

// Status Pages
import { UnauthorizedPage } from './pages/UnauthorizedPage.js';
import { NotFoundPage } from './pages/NotFoundPage.js';

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Authentication Routes */}
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterCompanyPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
            </Route>

            {/* Protected Workspace Routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/users" element={<UserListPage />} />
                <Route path="/company/profile" element={<CompanyProfilePage />} />
                <Route path="/settings/account" element={<UserProfilePage />} />
              </Route>
            </Route>

            {/* Error and Fallback Routes */}
            <Route path="/unauthorized" element={<UnauthorizedPage />} />
            <Route path="/404" element={<NotFoundPage />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
