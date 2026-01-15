import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'

const AdminUsers = () => {
  const { user, logout } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingUser, setEditingUser] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    fullName: '',
    phone: '',
    isActive: true,
    isAdmin: false
  })

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await api.get('/users')
      setUsers(response.data)
    } catch (error) {
      setError('Không thể tải danh sách người dùng')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (user) => {
    setEditingUser(user)
    setFormData({
      username: user.username || '',
      email: user.email || '',
      fullName: user.fullName || '',
      phone: user.phone || '',
      isActive: user.isActive !== undefined ? user.isActive : true,
      isAdmin: user.isAdmin || false
    })
    setShowEditModal(true)
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    try {
      await api.put(`/users/${editingUser._id}`, formData)
      setShowEditModal(false)
      fetchUsers()
      setError('')
    } catch (error) {
      setError(error.response?.data?.message || 'Không thể cập nhật người dùng')
    }
  }

  const handleDelete = async (userId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa người dùng này?')) {
      try {
        await api.delete(`/users/${userId}`)
        fetchUsers()
      } catch (error) {
        setError('Không thể xóa người dùng')
      }
    }
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      {/* Header */}
      <header className="bg-white dark:bg-background-dark border-b border-primary/10">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="text-primary">
              <svg className="size-8" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path d="M44 4H30.6666V17.3334H17.3334V30.6666H4V44H44V4Z" fill="currentColor"></path>
              </svg>
            </div>
            <h1 className="serif-heading text-xl font-bold uppercase tracking-widest">Aurelius Grand Admin</h1>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/admin" className="text-xs font-bold uppercase tracking-widest hover:text-primary transition-colors">
              Bảng Điều Khiển
            </Link>
            <Link to="/" className="text-xs font-bold uppercase tracking-widest hover:text-primary transition-colors">
              Trang Chủ
            </Link>
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
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="serif-heading text-4xl mb-2 text-charcoal dark:text-white">Quản Lý Người Dùng</h2>
            <p className="text-charcoal/60 dark:text-white/60">Quản lý tất cả tài khoản người dùng</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <p className="text-charcoal/60 dark:text-white/60">Đang tải người dùng...</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-charcoal rounded-xl shadow-luxury border border-primary/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-primary/5 border-b border-primary/10">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-charcoal dark:text-white">Tên Đăng Nhập</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-charcoal dark:text-white">Email</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-charcoal dark:text-white">Họ Tên</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-charcoal dark:text-white">Số Điện Thoại</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-charcoal dark:text-white">Trạng Thái</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-charcoal dark:text-white">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary/10">
                  {users.map((user) => (
                    <tr key={user._id} className="hover:bg-primary/5 transition-colors">
                      <td className="px-6 py-4 text-sm text-charcoal dark:text-white">{user.username}</td>
                      <td className="px-6 py-4 text-sm text-charcoal dark:text-white">{user.email}</td>
                      <td className="px-6 py-4 text-sm text-charcoal dark:text-white">{user.fullName || '-'}</td>
                      <td className="px-6 py-4 text-sm text-charcoal dark:text-white">{user.phone || '-'}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.isActive 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {user.isActive ? 'Hoạt Động' : 'Không Hoạt Động'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(user)}
                            className="text-primary hover:text-primary/80 text-sm font-medium"
                          >
                            Sửa
                          </button>
                          <button
                            onClick={() => handleDelete(user._id)}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                          >
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-charcoal rounded-xl shadow-luxury p-8 max-w-md w-full border border-primary/10">
              <h3 className="serif-heading text-2xl mb-6 text-charcoal dark:text-white">Chỉnh Sửa Người Dùng</h3>
              <form onSubmit={handleUpdate} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-charcoal dark:text-white mb-2">
                    Tên Đăng Nhập
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    required
                    className="w-full px-4 py-3 border border-charcoal/20 dark:border-white/20 rounded-lg bg-background-light dark:bg-background-dark text-charcoal dark:text-white focus:ring-2 focus:ring-primary focus:border-primary"
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
                    className="w-full px-4 py-3 border border-charcoal/20 dark:border-white/20 rounded-lg bg-background-light dark:bg-background-dark text-charcoal dark:text-white focus:ring-2 focus:ring-primary focus:border-primary"
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
                    className="w-full px-4 py-3 border border-charcoal/20 dark:border-white/20 rounded-lg bg-background-light dark:bg-background-dark text-charcoal dark:text-white focus:ring-2 focus:ring-primary focus:border-primary"
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
                    className="w-full px-4 py-3 border border-charcoal/20 dark:border-white/20 rounded-lg bg-background-light dark:bg-background-dark text-charcoal dark:text-white focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="rounded border-charcoal/20 text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-charcoal dark:text-white">Hoạt Động</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.isAdmin}
                      onChange={(e) => setFormData({ ...formData, isAdmin: e.target.checked })}
                      className="rounded border-charcoal/20 text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-charcoal dark:text-white">Admin</span>
                  </label>
                </div>
                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-primary hover:bg-primary/90 text-white py-3 rounded-lg text-xs font-bold uppercase tracking-widest transition-all"
                  >
                    Cập Nhật
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 bg-charcoal/10 hover:bg-charcoal/20 dark:bg-white/10 dark:hover:bg-white/20 text-charcoal dark:text-white py-3 rounded-lg text-xs font-bold uppercase tracking-widest transition-all"
                  >
                    Hủy
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminUsers

