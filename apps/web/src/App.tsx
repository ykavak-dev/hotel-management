import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { MainLayout } from './components/layout/MainLayout';
import { HotelAdminLayout } from './components/layout/HotelAdminLayout';
import { AdminLayout } from './components/layout/AdminLayout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { ProfilePage } from './pages/user/ProfilePage';
import { UnauthorizedPage } from './pages/error/UnauthorizedPage';
import Home from './pages/Home';

function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Toaster position="top-right" richColors />
      <Routes>
        {/* Public routes with MainLayout */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
        </Route>

        {/* Protected user routes */}
        <Route
          element={
            <ProtectedRoute allowedRoles={['customer', 'hotel_owner', 'admin']}>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/profile" element={<ProfilePage />} />
        </Route>

        {/* Hotel Admin routes */}
        <Route
          element={
            <ProtectedRoute allowedRoles={['hotel_owner']}>
              <HotelAdminLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/admin/hotels" element={<div>Hotel Dashboard</div>} />
          <Route path="/admin/hotels/rooms" element={<div>Rooms</div>} />
          <Route path="/admin/hotels/bookings" element={<div>Bookings</div>} />
          <Route path="/admin/hotels/profile" element={<ProfilePage />} />
        </Route>

        {/* Global Admin routes */}
        <Route
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/admin" element={<div>Admin Dashboard</div>} />
          <Route path="/admin/users" element={<div>Users</div>} />
          <Route path="/admin/hotels" element={<div>Hotels</div>} />
          <Route path="/admin/reviews" element={<div>Reviews</div>} />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;