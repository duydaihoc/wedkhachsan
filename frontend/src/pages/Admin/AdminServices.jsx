import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'

const AdminServices = () => {
  const { user, logout } = useAuth()
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [editingService, setEditingService] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    price: 0,
    unit: 'lần',
    type: 'food',
    description: '',
    image: '',
    isAvailable: true
  })

  const serviceTypes = [
    { value: 'food', label: 'Ăn Uống' },
    { value: 'laundry', label: 'Giặt Là' },
    { value: 'cleaning', label: 'Dọn Dẹp' },
    { value: 'transport', label: 'Xe Đưa Đón' },
    { value: 'other', label: 'Khác' }
  ]

  useEffect(() => {
    fetchServices()
  }, [])

  const fetchServices = async () => {
    try {
      setLoading(true)
      const response = await api.get('/services')
      setServices(response.data)
    } catch (error) {
      setError('Không thể tải danh sách dịch vụ')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (service) => {
    setEditingService(service)
    setFormData({
      name: service.name || '',
      price: service.price || 0,
      unit: service.unit || 'lần',
      type: service.type || 'food',
      description: service.description || '',
      image: service.image || '',
      isAvailable: service.isAvailable !== undefined ? service.isAvailable : true
    })
    setShowModal(true)
    setShowCreateModal(false)
  }

  const handleCreate = () => {
    setEditingService(null)
    setFormData({
      name: '',
      price: 0,
      unit: 'lần',
      type: 'food',
      description: '',
      image: '',
      isAvailable: true
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
      const formDataUpload = new FormData()
      formDataUpload.append('image', file)

      const response = await api.post('/upload', formDataUpload, {
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

    if (!formData.name) {
      setError('Vui lòng nhập tên dịch vụ')
      return
    }

    if (formData.price < 0) {
      setError('Giá không được âm')
      return
    }

    if (!formData.unit) {
      setError('Vui lòng nhập đơn vị tính')
      return
    }

    try {
      if (editingService) {
        await api.put(`/services/${editingService._id}`, formData)
        setSuccess('Cập nhật dịch vụ thành công')
      } else {
        await api.post('/services', formData)
        setSuccess('Tạo dịch vụ thành công')
      }
      setShowModal(false)
      setShowCreateModal(false)
      fetchServices()
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      setError(error.response?.data?.message || 'Không thể lưu dịch vụ')
    }
  }

  const handleDelete = async (serviceId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa dịch vụ này?')) {
      try {
        await api.delete(`/services/${serviceId}`)
        setSuccess('Xóa dịch vụ thành công')
        fetchServices()
        setTimeout(() => setSuccess(''), 3000)
      } catch (error) {
        setError(error.response?.data?.message || 'Không thể xóa dịch vụ')
      }
    }
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price)
  }

  const getTypeLabel = (type) => {
    const typeObj = serviceTypes.find(t => t.value === type)
    return typeObj ? typeObj.label : type
  }

  const getTypeColor = (type) => {
    const colors = {
      food: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      laundry: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      cleaning: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      transport: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      other: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    }
    return colors[type] || colors.other
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
            <h2 className="serif-heading text-4xl mb-2 text-charcoal dark:text-white">Quản Lý Dịch Vụ</h2>
            <p className="text-charcoal/60 dark:text-white/60">Quản lý các dịch vụ của khách sạn</p>
          </div>
          <button
            onClick={handleCreate}
            className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-lg text-xs font-bold uppercase tracking-widest transition-all"
          >
            + Thêm Dịch Vụ
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
            <p className="text-charcoal/60 dark:text-white/60">Đang tải dịch vụ...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <div key={service._id} className="bg-white dark:bg-charcoal rounded-xl shadow-luxury border border-primary/10 overflow-hidden group hover:shadow-xl transition-shadow">
                <div className="relative aspect-video overflow-hidden bg-charcoal/5">
                  {service.image ? (
                    <>
                      <img 
                        src={`http://localhost:5000${service.image}`} 
                        alt={service.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none"></div>
                    </>
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-charcoal/10 flex items-center justify-center">
                      <span className="material-symbols-outlined text-6xl text-primary/30">room_service</span>
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="serif-heading text-xl text-charcoal dark:text-white flex-1">{service.name}</h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      service.isAvailable 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {service.isAvailable ? 'Có Sẵn' : 'Không Có Sẵn'}
                    </span>
                  </div>
                  <div className="mb-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(service.type)}`}>
                      {getTypeLabel(service.type)}
                    </span>
                  </div>
                  {service.description && (
                    <p className="text-sm text-charcoal/60 dark:text-white/60 mb-4 line-clamp-2">
                      {service.description}
                    </p>
                  )}
                  <div className="mb-4">
                    <p className="text-lg font-bold text-primary">
                      {formatPrice(service.price)} / {service.unit}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(service)}
                      className="flex-1 bg-primary/10 hover:bg-primary/20 text-primary py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDelete(service._id)}
                      className="flex-1 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {services.length === 0 && (
              <div className="col-span-full text-center py-12">
                <p className="text-charcoal/60 dark:text-white/60">Chưa có dịch vụ nào</p>
              </div>
            )}
          </div>
        )}

        {/* Create/Edit Modal */}
        {(showModal || showCreateModal) && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-charcoal rounded-xl shadow-luxury p-8 max-w-2xl w-full border border-primary/10 max-h-[90vh] overflow-y-auto">
              <h3 className="serif-heading text-2xl mb-6 text-charcoal dark:text-white">
                {editingService ? 'Chỉnh Sửa Dịch Vụ' : 'Thêm Dịch Vụ Mới'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-charcoal dark:text-white mb-2">
                    Tên Dịch Vụ *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full px-4 py-3 border border-charcoal/20 dark:border-white/20 rounded-lg bg-background-light dark:bg-background-dark text-charcoal dark:text-white focus:ring-2 focus:ring-primary focus:border-primary"
                    placeholder="VD: Buffet Sáng, Giặt ủi thường"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-charcoal dark:text-white mb-2">
                      Giá (VND) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                      required
                      className="w-full px-4 py-3 border border-charcoal/20 dark:border-white/20 rounded-lg bg-background-light dark:bg-background-dark text-charcoal dark:text-white focus:ring-2 focus:ring-primary focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-charcoal dark:text-white mb-2">
                      Đơn Vị Tính *
                    </label>
                    <input
                      type="text"
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      required
                      className="w-full px-4 py-3 border border-charcoal/20 dark:border-white/20 rounded-lg bg-background-light dark:bg-background-dark text-charcoal dark:text-white focus:ring-2 focus:ring-primary focus:border-primary"
                      placeholder="VD: suất, kg, lần"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-charcoal dark:text-white mb-2">
                    Loại Dịch Vụ *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    required
                    className="w-full px-4 py-3 border border-charcoal/20 dark:border-white/20 rounded-lg bg-background-light dark:bg-background-dark text-charcoal dark:text-white focus:ring-2 focus:ring-primary focus:border-primary"
                  >
                    {serviceTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
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
                    placeholder="Mô tả chi tiết về dịch vụ..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-charcoal dark:text-white mb-2">
                    Hình Ảnh <span className="text-charcoal/40 dark:text-white/40 font-normal">(Tùy chọn)</span>
                  </label>
                  {formData.image && (
                    <div className="mb-4 relative">
                      <img 
                        src={`http://localhost:5000${formData.image}`} 
                        alt="Preview" 
                        className="w-full h-48 object-cover rounded-lg border border-primary/10"
                      />
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, image: '' })}
                        className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 transition-colors"
                        title="Xóa ảnh"
                      >
                        <span className="material-symbols-outlined text-sm">close</span>
                      </button>
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
                  <p className="text-xs text-charcoal/60 dark:text-white/60 mt-2">
                    Bạn có thể tạo dịch vụ mà không cần ảnh. Ảnh là tùy chọn.
                  </p>
                </div>

                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.isAvailable}
                      onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                      className="rounded border-charcoal/20 text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-charcoal dark:text-white">Dịch vụ có sẵn</span>
                  </label>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-primary hover:bg-primary/90 text-white py-3 rounded-lg text-xs font-bold uppercase tracking-widest transition-all"
                  >
                    {editingService ? 'Cập Nhật' : 'Tạo Mới'}
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

export default AdminServices

