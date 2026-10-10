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

// Phase 2 Operational Feature Pages
import { VehicleListPage } from './features/vehicles/VehicleListPage.js';
import { DriverListPage } from './features/drivers/DriverListPage.js';
import { CustomerListPage } from './features/customers/CustomerListPage.js';
import { MaintenanceListPage } from './features/maintenance/MaintenanceListPage.js';
import { FuelListPage } from './features/fuel/FuelListPage.js';
import { ExpenseListPage } from './features/expenses/ExpenseListPage.js';

// Phase 3 & 4 Transport Operations & AI Intelligence
import { ShipmentListPage } from './features/shipments/ShipmentListPage.js';
import { TripListPage } from './features/trips/TripListPage.js';
import { AIInsightsPage } from './features/ai/AIInsightsPage.js';
import { ReportsPage } from './features/reports/ReportsPage.js';

// Status Pages
import { UnauthorizedPage } from './pages/UnauthorizedPage.js';
import { NotFoundPage } from './pages/NotFoundPage.js';

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
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
                <Route path="/dashboard" element={<Navigate to="/" replace />} />
                <Route path="/vehicles" element={<VehicleListPage />} />
                <Route path="/drivers" element={<DriverListPage />} />
                <Route path="/customers" element={<CustomerListPage />} />
                <Route path="/maintenance" element={<MaintenanceListPage />} />
                <Route path="/fuel" element={<FuelListPage />} />
                <Route path="/expenses" element={<ExpenseListPage />} />

                {/* Phase 3 & 4 Routes */}
                <Route path="/shipments" element={<ShipmentListPage />} />
                <Route path="/trips" element={<TripListPage />} />
                <Route path="/ai-insights" element={<AIInsightsPage />} />
                <Route path="/reports" element={<ReportsPage />} />

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
