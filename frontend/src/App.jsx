import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Home from './pages/Home'
import Rooms from './pages/Rooms'
import Login from './pages/Login'
import Register from './pages/Register'
import Profile from './pages/Profile'
import AdminDashboard from './pages/Admin/AdminDashboard'
import AdminUsers from './pages/Admin/AdminUsers'
import AdminProfile from './pages/Admin/AdminProfile'
import AdminRoomCategories from './pages/Admin/AdminRoomCategories'
import AdminRoomTypes from './pages/Admin/AdminRoomTypes'
import AdminRooms from './pages/Admin/AdminRooms'
import AdminAmenities from './pages/Admin/AdminAmenities'
import AdminServices from './pages/Admin/AdminServices'
import AdminBookings from './pages/Admin/AdminBookings'
import AdminCreateBooking from './pages/Admin/AdminCreateBooking'
import RoomDetail from './pages/RoomDetail'
import BookingConfirm from './pages/BookingConfirm'
import PaymentMethod from './pages/PaymentMethod'
import OnlinePayment from './pages/OnlinePayment'
import BookingSuccess from './pages/BookingSuccess'
import MyBookings from './pages/MyBookings'
import ProtectedRoute from './components/ProtectedRoute'
import NotificationToast from './components/NotificationToast'

function App() {
  return (
    <AuthProvider>
      <NotificationToast />
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/rooms" element={<Rooms />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/my-bookings" 
            element={
              <ProtectedRoute>
                <MyBookings />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute adminOnly>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/users" 
            element={
              <ProtectedRoute adminOnly>
                <AdminUsers />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/profile" 
            element={
              <ProtectedRoute adminOnly>
                <AdminProfile />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/roomcategories" 
            element={
              <ProtectedRoute adminOnly>
                <AdminRoomCategories />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/roomtypes" 
            element={
              <ProtectedRoute adminOnly>
                <AdminRoomTypes />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/amenities" 
            element={
              <ProtectedRoute adminOnly>
                <AdminAmenities />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/services" 
            element={
              <ProtectedRoute adminOnly>
                <AdminServices />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/rooms" 
            element={
              <ProtectedRoute adminOnly>
                <AdminRooms />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/bookings" 
            element={
              <ProtectedRoute adminOnly>
                <AdminBookings />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/bookings/create" 
            element={
              <ProtectedRoute adminOnly>
                <AdminCreateBooking />
              </ProtectedRoute>
            } 
          />
          <Route path="/rooms/:id" element={<RoomDetail />} />
          <Route 
            path="/booking/confirm" 
            element={
              <ProtectedRoute>
                <BookingConfirm />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/booking/payment-method" 
            element={
              <ProtectedRoute>
                <PaymentMethod />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/booking/online-payment" 
            element={
              <ProtectedRoute>
                <OnlinePayment />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/booking/success/:id" 
            element={
              <ProtectedRoute>
                <BookingSuccess />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App

