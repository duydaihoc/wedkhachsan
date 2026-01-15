import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

const Profile = () => {
  const { user, logout, fetchUserProfile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    fullName: '',
    phone: ''
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: ''
  })
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        email: user.email || '',
        fullName: user.fullName || '',
        phone: user.phone || ''
      })
    }
  }, [user])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      await api.put('/users/profile', formData)
      await fetchUserProfile()
      setSuccess('Cập nhật thông tin thành công')
    } catch (error) {
      setError(error.response?.data?.message || 'Không thể cập nhật thông tin')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')
    setPasswordLoading(true)

    if (!passwordData.currentPassword) {
      setPasswordError('Vui lòng nhập mật khẩu hiện tại')
      setPasswordLoading(false)
      return
    }

    if (!passwordData.newPassword || passwordData.newPassword.length < 6) {
      setPasswordError('Mật khẩu mới phải có ít nhất 6 ký tự')
      setPasswordLoading(false)
      return
    }

    try {
      await api.put('/users/profile', { 
        currentPassword: passwordData.currentPassword,
        password: passwordData.newPassword 
      })
      setPasswordSuccess('Đổi mật khẩu thành công')
      setPasswordData({ currentPassword: '', newPassword: '' })
    } catch (error) {
      setPasswordError(error.response?.data?.message || 'Không thể đổi mật khẩu')
    } finally {
      setPasswordLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      {/* Header */}
      <header className="bg-white dark:bg-background-dark border-b border-primary/10">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="text-primary">
              <svg className="size-8" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path d="M44 4H30.6666V17.3334H17.3334V30.6666H4V44H44V4Z" fill="currentColor"></path>
              </svg>
            </div>
            <h1 className="serif-heading text-xl font-bold uppercase tracking-widest">Aurelius Grand</h1>
          </Link>
          <div className="flex items-center gap-6">
            <Link to="/" className="text-xs font-bold uppercase tracking-widest hover:text-primary transition-colors">
              Trang Chủ
            </Link>
            {user?.isAdmin && (
              <Link to="/admin" className="text-xs font-bold uppercase tracking-widest hover:text-primary transition-colors">
                Admin
              </Link>
            )}
            <span className="text-xs font-bold uppercase tracking-widest text-charcoal/60 dark:text-white/60">
              {user?.username}
            </span>
            <button
              onClick={logout}
              className="text-xs font-bold uppercase tracking-widest hover:text-primary transition-colors"
            >
              Đăng Xuất
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h2 className="serif-heading text-4xl mb-2 text-charcoal dark:text-white">Thông Tin Cá Nhân</h2>
          <p className="text-charcoal/60 dark:text-white/60">Quản lý thông tin tài khoản của bạn</p>
        </div>

        <div className="bg-white dark:bg-charcoal rounded-xl shadow-luxury p-8 border border-primary/10">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded-lg mb-6">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-charcoal dark:text-white mb-2">
                Tên Đăng Nhập
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
                className="w-full px-4 py-3 border border-charcoal/20 dark:border-white/20 rounded-lg bg-background-light dark:bg-background-dark text-charcoal dark:text-white focus:ring-2 focus:ring-primary focus:border-primary transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-charcoal dark:text-white mb-2">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="w-full px-4 py-3 border border-charcoal/20 dark:border-white/20 rounded-lg bg-background-light dark:bg-background-dark text-charcoal dark:text-white focus:ring-2 focus:ring-primary focus:border-primary transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-charcoal dark:text-white mb-2">
                Họ Tên
              </label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full px-4 py-3 border border-charcoal/20 dark:border-white/20 rounded-lg bg-background-light dark:bg-background-dark text-charcoal dark:text-white focus:ring-2 focus:ring-primary focus:border-primary transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-charcoal dark:text-white mb-2">
                Số Điện Thoại
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-3 border border-charcoal/20 dark:border-white/20 rounded-lg bg-background-light dark:bg-background-dark text-charcoal dark:text-white focus:ring-2 focus:ring-primary focus:border-primary transition-all"
              />
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/90 text-white py-4 rounded-lg text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Đang cập nhật...' : 'Cập Nhật Thông Tin'}
              </button>
            </div>
          </form>
        </div>

        {/* Change Password Section */}
        <div className="bg-white dark:bg-charcoal rounded-xl shadow-luxury p-8 border border-primary/10 mt-8">
          <h3 className="serif-heading text-2xl mb-6 text-charcoal dark:text-white">Đổi Mật Khẩu</h3>
          
          {passwordError && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg mb-6">
              {passwordError}
            </div>
          )}

          {passwordSuccess && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded-lg mb-6">
              {passwordSuccess}
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-charcoal dark:text-white mb-2">
                Mật Khẩu Hiện Tại
              </label>
              <input
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                required
                className="w-full px-4 py-3 border border-charcoal/20 dark:border-white/20 rounded-lg bg-background-light dark:bg-background-dark text-charcoal dark:text-white focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                placeholder="Nhập mật khẩu hiện tại"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-charcoal dark:text-white mb-2">
                Mật Khẩu Mới
              </label>
              <input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                required
                minLength={6}
                className="w-full px-4 py-3 border border-charcoal/20 dark:border-white/20 rounded-lg bg-background-light dark:bg-background-dark text-charcoal dark:text-white focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
              />
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={passwordLoading}
                className="w-full bg-charcoal dark:bg-primary text-white dark:text-background-dark hover:opacity-90 py-4 rounded-lg text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {passwordLoading ? 'Đang đổi mật khẩu...' : 'Đổi Mật Khẩu'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Profile

