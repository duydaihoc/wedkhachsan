import { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'
import socket from '../services/socket'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      fetchUserProfile()
    } else {
      setLoading(false)
    }

    // Kết nối Socket.IO khi component mount
    socket.connect()

    // Cleanup khi component unmount
    return () => {
      socket.disconnect()
    }
  }, [])

  // Kết nối socket khi user đăng nhập
  useEffect(() => {
    if (user) {
      // Join vào room của user để nhận notifications
      socket.emit('join-user-room', user._id)
      
      // Nếu là admin, join vào admin room
      if (user.isAdmin) {
        socket.emit('join-admin-room')
      }
    } else {
      // Disconnect khi logout
      socket.disconnect()
    }
  }, [user])

  const fetchUserProfile = async () => {
    try {
      const response = await api.get('/users/profile')
      setUser(response.data)
      return response.data
    } catch (error) {
      localStorage.removeItem('token')
      setUser(null)
      return null
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    try {
      const response = await api.post('/users/auth', { email, password })
      if (response.data && response.data.token) {
        localStorage.setItem('token', response.data.token)
        // Fetch user profile in background, don't wait for it
        fetchUserProfile().catch(() => {
          // Silently handle error, user data will be fetched on next page load
        })
        // Return immediately with response data
        return { success: true, data: response.data }
      } else {
        return { 
          success: false, 
          message: 'Invalid response from server' 
        }
      }
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Đăng nhập thất bại' 
      }
    }
  }

  const register = async (username, email, password) => {
    try {
      const response = await api.post('/users', { username, email, password })
      if (response.data && response.data.token) {
        localStorage.setItem('token', response.data.token)
        // Fetch user profile in background, don't wait for it
        fetchUserProfile().catch(() => {
          // Silently handle error, user data will be fetched on next page load
        })
        // Return immediately with response data
        return { success: true, data: response.data }
      } else {
        return { 
          success: false, 
          message: 'Invalid response from server' 
        }
      }
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Đăng ký thất bại' 
      }
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
  }

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    fetchUserProfile
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

