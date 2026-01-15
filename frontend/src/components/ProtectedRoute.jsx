import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
        <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-charcoal dark:text-white">Đang tải...</div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (adminOnly && !user.isAdmin) {
    return <Navigate to="/" replace />
  }

  return children
}

export default ProtectedRoute

