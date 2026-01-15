import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'

const AdminRoomCategories = () => {
  const { user, logout } = useAuth()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [editingCategory, setEditingCategory] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: '',
    isActive: true
  })

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const response = await api.get('/roomcategories')
      setCategories(response.data)
    } catch (error) {
      setError('Không thể tải danh sách danh mục phòng')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name || '',
      description: category.description || '',
      image: category.image || '',
      isActive: category.isActive !== undefined ? category.isActive : true
    })
    setShowModal(true)
    setShowCreateModal(false)
  }

  const handleCreate = () => {
    setEditingCategory(null)
    setFormData({
      name: '',
      description: '',
      image: '',
      isActive: true
    })
    setShowCreateModal(true)
    setShowModal(false)
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Vui lòng chọn file ảnh')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Kích thước file không được vượt quá 5MB')
      return
    }

    try {
      setUploadingImage(true)
      setError('')
      const formData = new FormData()
      formData.append('image', file)

      const response = await api.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      setFormData(prev => ({ ...prev, image: response.data.imagePath }))
      setSuccess('Upload hình ảnh thành công')
    } catch (error) {
      setError(error.response?.data?.message || 'Không thể upload hình ảnh')
    } finally {
      setUploadingImage(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    try {
      if (editingCategory) {
        await api.put(`/roomcategories/${editingCategory._id}`, formData)
        setSuccess('Cập nhật danh mục phòng thành công')
      } else {
        await api.post('/roomcategories', formData)
        setSuccess('Tạo danh mục phòng thành công')
      }
      setShowModal(false)
      setShowCreateModal(false)
      fetchCategories()
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      setError(error.response?.data?.message || 'Không thể lưu danh mục phòng')
    }
  }

  const handleDelete = async (categoryId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa danh mục phòng này?')) {
      try {
        await api.delete(`/roomcategories/${categoryId}`)
        setSuccess('Xóa danh mục phòng thành công')
        fetchCategories()
        setTimeout(() => setSuccess(''), 3000)
      } catch (error) {
        setError(error.response?.data?.message || 'Không thể xóa danh mục phòng')
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
            <h2 className="serif-heading text-4xl mb-2 text-charcoal dark:text-white">Quản Lý Danh Mục Phòng</h2>
            <p className="text-charcoal/60 dark:text-white/60">Quản lý các danh mục phòng của khách sạn</p>
          </div>
          <button
            onClick={handleCreate}
            className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-lg text-xs font-bold uppercase tracking-widest transition-all"
          >
            + Thêm Danh Mục
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
            <p className="text-charcoal/60 dark:text-white/60">Đang tải danh mục phòng...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category) => (
              <div key={category._id} className="bg-white dark:bg-charcoal rounded-xl shadow-luxury border border-primary/10 overflow-hidden">
                {category.image && (
                  <div className="aspect-video bg-cover bg-center" style={{ backgroundImage: `url(http://localhost:5000${category.image})` }}>
                  </div>
                )}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="serif-heading text-xl text-charcoal dark:text-white">{category.name}</h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      category.isActive 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {category.isActive ? 'Hiển Thị' : 'Ẩn'}
                    </span>
                  </div>
                  {category.description && (
                    <p className="text-sm text-charcoal/60 dark:text-white/60 mb-4 line-clamp-2">
                      {category.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(category)}
                      className="flex-1 bg-primary/10 hover:bg-primary/20 text-primary py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDelete(category._id)}
                      className="flex-1 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {categories.length === 0 && (
              <div className="col-span-full text-center py-12">
                <p className="text-charcoal/60 dark:text-white/60">Chưa có danh mục phòng nào</p>
              </div>
            )}
          </div>
        )}

        {/* Create/Edit Modal */}
        {(showModal || showCreateModal) && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-charcoal rounded-xl shadow-luxury p-8 max-w-2xl w-full border border-primary/10 max-h-[90vh] overflow-y-auto">
              <h3 className="serif-heading text-2xl mb-6 text-charcoal dark:text-white">
                {editingCategory ? 'Chỉnh Sửa Danh Mục Phòng' : 'Thêm Danh Mục Phòng Mới'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-charcoal dark:text-white mb-2">
                    Tên Danh Mục *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full px-4 py-3 border border-charcoal/20 dark:border-white/20 rounded-lg bg-background-light dark:bg-background-dark text-charcoal dark:text-white focus:ring-2 focus:ring-primary focus:border-primary"
                    placeholder="VD: Hạng Sang (Luxury)"
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
                    placeholder="Mô tả về danh mục phòng này..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-charcoal dark:text-white mb-2">
                    Hình Ảnh
                  </label>
                  {formData.image && (
                    <div className="mb-4">
                      <img 
                        src={`http://localhost:5000${formData.image}`} 
                        alt="Preview" 
                        className="w-full h-48 object-cover rounded-lg border border-primary/10"
                      />
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                    className="w-full px-4 py-3 border border-charcoal/20 dark:border-white/20 rounded-lg bg-background-light dark:bg-background-dark text-charcoal dark:text-white focus:ring-2 focus:ring-primary focus:border-primary disabled:opacity-50"
                  />
                  {uploadingImage && (
                    <p className="text-sm text-charcoal/60 dark:text-white/60 mt-2">Đang upload...</p>
                  )}
                </div>

                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="rounded border-charcoal/20 text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-charcoal dark:text-white">Hiển thị danh mục này</span>
                  </label>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-primary hover:bg-primary/90 text-white py-3 rounded-lg text-xs font-bold uppercase tracking-widest transition-all"
                  >
                    {editingCategory ? 'Cập Nhật' : 'Tạo Mới'}
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

export default AdminRoomCategories

