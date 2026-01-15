import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'

const AdminRoomTypes = () => {
  const { user, logout } = useAuth()
  const [roomTypes, setRoomTypes] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [editingRoomType, setEditingRoomType] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [formData, setFormData] = useState({
    category: '',
    name: '',
    description: '',
    maxAdults: 2,
    maxChildren: 1
  })

  useEffect(() => {
    fetchRoomTypes()
    fetchCategories()
  }, [])

  const fetchRoomTypes = async () => {
    try {
      setLoading(true)
      const response = await api.get('/roomtypes')
      setRoomTypes(response.data)
    } catch (error) {
      setError('Không thể tải danh sách loại phòng')
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await api.get('/roomcategories')
      setCategories(response.data)
    } catch (error) {
      console.error('Không thể tải danh mục phòng:', error)
    }
  }

  const handleEdit = (roomType) => {
    setEditingRoomType(roomType)
    setFormData({
      category: roomType.category?._id || roomType.category || '',
      name: roomType.name || '',
      description: roomType.description || '',
      maxAdults: roomType.maxAdults || 2,
      maxChildren: roomType.maxChildren || 1
    })
    setShowModal(true)
    setShowCreateModal(false)
  }

  const handleCreate = () => {
    setEditingRoomType(null)
    setFormData({
      category: '',
      name: '',
      description: '',
      maxAdults: 2,
      maxChildren: 1
    })
    setShowCreateModal(true)
    setShowModal(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!formData.category) {
      setError('Vui lòng chọn danh mục phòng')
      return
    }

    if (!formData.name) {
      setError('Vui lòng nhập tên loại phòng')
      return
    }

    try {
      if (editingRoomType) {
        await api.put(`/roomtypes/${editingRoomType._id}`, formData)
        setSuccess('Cập nhật loại phòng thành công')
      } else {
        await api.post('/roomtypes', formData)
        setSuccess('Tạo loại phòng thành công')
      }
      setShowModal(false)
      setShowCreateModal(false)
      fetchRoomTypes()
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      setError(error.response?.data?.message || 'Không thể lưu loại phòng')
    }
  }

  const handleDelete = async (roomTypeId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa loại phòng này?')) {
      try {
        await api.delete(`/roomtypes/${roomTypeId}`)
        setSuccess('Xóa loại phòng thành công')
        fetchRoomTypes()
        setTimeout(() => setSuccess(''), 3000)
      } catch (error) {
        setError(error.response?.data?.message || 'Không thể xóa loại phòng')
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
            <h2 className="serif-heading text-4xl mb-2 text-charcoal dark:text-white">Quản Lý Loại Phòng</h2>
            <p className="text-charcoal/60 dark:text-white/60">Quản lý các loại phòng trong từng danh mục</p>
          </div>
          <button
            onClick={handleCreate}
            className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-lg text-xs font-bold uppercase tracking-widest transition-all"
          >
            + Thêm Loại Phòng
          </button>
        </div>

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

        {loading ? (
          <div className="text-center py-12">
            <p className="text-charcoal/60 dark:text-white/60">Đang tải loại phòng...</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-charcoal rounded-xl shadow-luxury border border-primary/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-primary/5 border-b border-primary/10">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-charcoal dark:text-white">Danh Mục</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-charcoal dark:text-white">Tên Loại Phòng</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-charcoal dark:text-white">Mô Tả</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-charcoal dark:text-white">Người Lớn</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-charcoal dark:text-white">Trẻ Em</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-charcoal dark:text-white">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary/10">
                  {roomTypes.map((roomType) => (
                    <tr key={roomType._id} className="hover:bg-primary/5 transition-colors">
                      <td className="px-6 py-4 text-sm text-charcoal dark:text-white">
                        {roomType.category?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-charcoal dark:text-white font-medium">
                        {roomType.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-charcoal/60 dark:text-white/60">
                        {roomType.description || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-charcoal dark:text-white">
                        {roomType.maxAdults || 2}
                      </td>
                      <td className="px-6 py-4 text-sm text-charcoal dark:text-white">
                        {roomType.maxChildren || 1}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(roomType)}
                            className="text-primary hover:text-primary/80 text-sm font-medium"
                          >
                            Sửa
                          </button>
                          <button
                            onClick={() => handleDelete(roomType._id)}
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
              {roomTypes.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-charcoal/60 dark:text-white/60">Chưa có loại phòng nào</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Create/Edit Modal */}
        {(showModal || showCreateModal) && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-charcoal rounded-xl shadow-luxury p-8 max-w-2xl w-full border border-primary/10 max-h-[90vh] overflow-y-auto">
              <h3 className="serif-heading text-2xl mb-6 text-charcoal dark:text-white">
                {editingRoomType ? 'Chỉnh Sửa Loại Phòng' : 'Thêm Loại Phòng Mới'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-charcoal dark:text-white mb-2">
                    Danh Mục Phòng *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    required
                    className="w-full px-4 py-3 border border-charcoal/20 dark:border-white/20 rounded-lg bg-background-light dark:bg-background-dark text-charcoal dark:text-white focus:ring-2 focus:ring-primary focus:border-primary"
                  >
                    <option value="">Chọn danh mục phòng</option>
                    {categories.map((category) => (
                      <option key={category._id} value={category._id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-charcoal dark:text-white mb-2">
                    Tên Loại Phòng *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full px-4 py-3 border border-charcoal/20 dark:border-white/20 rounded-lg bg-background-light dark:bg-background-dark text-charcoal dark:text-white focus:ring-2 focus:ring-primary focus:border-primary"
                    placeholder="VD: VIP 1 Giường, Giường Đôi, Suite Hoàng Gia"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-charcoal dark:text-white mb-2">
                    Mô Tả
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows="4"
                    className="w-full px-4 py-3 border border-charcoal/20 dark:border-white/20 rounded-lg bg-background-light dark:bg-background-dark text-charcoal dark:text-white focus:ring-2 focus:ring-primary focus:border-primary"
                    placeholder="Mô tả về loại phòng này..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-charcoal dark:text-white mb-2">
                      Số Người Lớn Tối Đa
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.maxAdults}
                      onChange={(e) => setFormData({ ...formData, maxAdults: parseInt(e.target.value) || 2 })}
                      className="w-full px-4 py-3 border border-charcoal/20 dark:border-white/20 rounded-lg bg-background-light dark:bg-background-dark text-charcoal dark:text-white focus:ring-2 focus:ring-primary focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-charcoal dark:text-white mb-2">
                      Số Trẻ Em Tối Đa
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.maxChildren}
                      onChange={(e) => setFormData({ ...formData, maxChildren: parseInt(e.target.value) || 1 })}
                      className="w-full px-4 py-3 border border-charcoal/20 dark:border-white/20 rounded-lg bg-background-light dark:bg-background-dark text-charcoal dark:text-white focus:ring-2 focus:ring-primary focus:border-primary"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-primary hover:bg-primary/90 text-white py-3 rounded-lg text-xs font-bold uppercase tracking-widest transition-all"
                  >
                    {editingRoomType ? 'Cập Nhật' : 'Tạo Mới'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false)
                      setShowCreateModal(false)
                    }}
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

export default AdminRoomTypes

