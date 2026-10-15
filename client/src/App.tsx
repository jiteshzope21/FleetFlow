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
import { CompanySubscriptionPage } from './features/company/CompanySubscriptionPage.js';
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
import { InvoiceListPage } from './features/invoices/InvoiceListPage.js';
import { SupportTicketsPage } from './features/support/SupportTicketsPage.js';

// Super Admin Portal Feature Pages
import { AdminLoginPage } from './features/admin/AdminLoginPage.js';
import { SuperAdminLayout } from './features/admin/SuperAdminLayout.js';
import { AdminOverviewPage } from './features/admin/AdminOverviewPage.js';
import { AdminCompaniesPage } from './features/admin/AdminCompaniesPage.js';
import { AdminUsersPage } from './features/admin/AdminUsersPage.js';
import { AdminPlansPage } from './features/admin/AdminPlansPage.js';
import { AdminSubscriptionsPage } from './features/admin/AdminSubscriptionsPage.js';
import { AdminAnalyticsPage } from './features/admin/AdminAnalyticsPage.js';
import { AdminAIMonitoringPage } from './features/admin/AdminAIMonitoringPage.js';
import { AdminSupportPage } from './features/admin/AdminSupportPage.js';
import { AdminAnnouncementsPage } from './features/admin/AdminAnnouncementsPage.js';
import { AdminAuditLogsPage } from './features/admin/AdminAuditLogsPage.js';
import { AdminHealthPage } from './features/admin/AdminHealthPage.js';
import { AdminSettingsPage } from './features/admin/AdminSettingsPage.js';

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

            {/* Dedicated Super Admin Login Entry Point */}
            <Route path="/admin/login" element={<AdminLoginPage />} />

            {/* Protected Workspace Tenant Routes */}
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

                {/* Operations & Finance */}
                <Route path="/shipments" element={<ShipmentListPage />} />
                <Route path="/trips" element={<TripListPage />} />
                <Route path="/invoices" element={<InvoiceListPage />} />
                <Route path="/support" element={<SupportTicketsPage />} />

                {/* Intelligence & Analytics */}
                <Route path="/ai-insights" element={<AIInsightsPage />} />
                <Route path="/reports" element={<ReportsPage />} />

                <Route path="/users" element={<UserListPage />} />
                <Route path="/company/profile" element={<CompanyProfilePage />} />
                <Route path="/company/subscription" element={<CompanySubscriptionPage />} />
                <Route path="/subscription" element={<Navigate to="/company/subscription" replace />} />
                <Route path="/subscriptions" element={<Navigate to="/company/subscription" replace />} />
                <Route path="/settings/account" element={<UserProfilePage />} />
              </Route>
            </Route>

            {/* Protected Super Admin Platform Administration Routes */}
            <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']} />}>
              <Route path="/admin" element={<SuperAdminLayout />}>
                <Route index element={<AdminOverviewPage />} />
                <Route path="companies" element={<AdminCompaniesPage />} />
                <Route path="users" element={<AdminUsersPage />} />
                <Route path="plans" element={<AdminPlansPage />} />
                <Route path="subscriptions" element={<AdminSubscriptionsPage />} />
                <Route path="analytics" element={<AdminAnalyticsPage />} />
                <Route path="ai-monitoring" element={<AdminAIMonitoringPage />} />
                <Route path="support" element={<AdminSupportPage />} />
                <Route path="announcements" element={<AdminAnnouncementsPage />} />
                <Route path="audit-logs" element={<AdminAuditLogsPage />} />
                <Route path="health" element={<AdminHealthPage />} />
                <Route path="settings" element={<AdminSettingsPage />} />
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
