import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'

const AdminRooms = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [rooms, setRooms] = useState([])
  const [categories, setCategories] = useState([])
  const [roomTypes, setRoomTypes] = useState([])
  const [amenities, setAmenities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [editingRoom, setEditingRoom] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false)
  const [uploadingImages, setUploadingImages] = useState(false)
  const [formData, setFormData] = useState({
    roomNumber: '',
    floor: '1',
    category: '',
    type: '',
    amenities: [],
    price: {
      firstHour: 0,
      nextHour: 0,
      overnight: 0,
      daily: 0
    },
    status: 'Available',
    note: '',
    image: '',      // Ảnh đại diện (1 ảnh)
    images: []      // Ảnh chi tiết (nhiều ảnh)
  })

  const statusOptions = [
    { value: 'Available', label: 'Trống', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
    { value: 'Occupied', label: 'Đang có khách', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
    { value: 'Dirty', label: 'Bẩn', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400' },
    { value: 'Maintenance', label: 'Bảo trì', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' }
  ]

  useEffect(() => {
    fetchRooms()
    fetchCategories()
    fetchRoomTypes()
    fetchAmenities()
  }, [])

  const fetchRooms = async () => {
    try {
      setLoading(true)
      const response = await api.get('/rooms')
      setRooms(response.data)
    } catch (error) {
      setError('Không thể tải danh sách phòng')
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

  const fetchRoomTypes = async () => {
    try {
      const response = await api.get('/roomtypes')
      setRoomTypes(response.data)
    } catch (error) {
      console.error('Không thể tải loại phòng:', error)
    }
  }

  const fetchAmenities = async () => {
    try {
      const response = await api.get('/amenities')
      setAmenities(response.data)
    } catch (error) {
      console.error('Không thể tải tiện ích:', error)
    }
  }

  const handleEdit = (room) => {
    setEditingRoom(room)
    
    // Chuyển đổi images từ định dạng cũ (string) sang định dạng mới (object)
    let convertedImages = []
    if (room.images && Array.isArray(room.images)) {
      convertedImages = room.images.map(img => {
        // Nếu là string (định dạng cũ), chuyển thành object
        if (typeof img === 'string') {
          return {
            url: img,
            category: 'other',
            label: ''
          }
        }
        // Nếu đã là object (định dạng mới), giữ nguyên
        return img
      })
    }
    
    setFormData({
      roomNumber: room.roomNumber || '',
      floor: room.floor || '1',
      category: room.category?._id || room.category || '',
      type: room.type?._id || room.type || '',
      amenities: room.amenities?.map(a => a._id || a) || [],
      price: {
        firstHour: room.price?.firstHour || 0,
        nextHour: room.price?.nextHour || 0,
        overnight: room.price?.overnight || 0,
        daily: room.price?.daily || 0
      },
      status: room.status || 'Available',
      note: room.note || '',
      image: room.image || '',
      images: convertedImages
    })
    setShowModal(true)
    setShowCreateModal(false)
  }

  const handleCreate = () => {
    setEditingRoom(null)
    setFormData({
      roomNumber: '',
      floor: '1',
      category: '',
      type: '',
      amenities: [],
      price: {
        firstHour: 0,
        nextHour: 0,
        overnight: 0,
        daily: 0
      },
      status: 'Available',
      note: '',
      image: '',
      images: []
    })
    setShowCreateModal(true)
    setShowModal(false)
  }

  const handleThumbnailUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    try {
      setUploadingThumbnail(true)
      setError('')
      
      if (!file.type.startsWith('image/')) {
        setError('Vui lòng chọn file ảnh')
        setUploadingThumbnail(false)
        return
      }

      if (file.size > 5 * 1024 * 1024) {
        setError('Kích thước file không được vượt quá 5MB')
        setUploadingThumbnail(false)
        return
      }

      // Upload ảnh đại diện
      const formDataUpload = new FormData()
      formDataUpload.append('image', file)

      const response = await api.post('/upload', formDataUpload, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      setFormData(prev => ({ ...prev, image: response.data.imagePath }))
      setSuccess('Upload ảnh đại diện thành công')
    } catch (error) {
      setError(error.response?.data?.message || 'Không thể upload ảnh đại diện')
    } finally {
      setUploadingThumbnail(false)
    }
  }

  const handleDetailImagesUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return

    // Lấy giá trị category và label từ form
    const categorySelect = document.getElementById('imageCategory')
    const labelInput = document.getElementById('imageLabel')
    const category = categorySelect?.value || 'other'
    const label = labelInput?.value || ''

    try {
      setUploadingImages(true)
      setError('')
      
      // Validate files
      for (const file of files) {
        if (!file.type.startsWith('image/')) {
          setError('Vui lòng chọn file ảnh')
          setUploadingImages(false)
          return
        }

        if (file.size > 5 * 1024 * 1024) {
          setError('Kích thước file không được vượt quá 5MB')
          setUploadingImages(false)
          return
        }
      }

      // Upload nhiều ảnh chi tiết cùng lúc
      const formDataUpload = new FormData()
      files.forEach(file => {
        formDataUpload.append('images', file)
      })

      const response = await api.post('/upload/multiple', formDataUpload, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      const uploadedImages = response.data.imagePaths || []
      
      // Chuyển đổi sang định dạng mới với category và label
      const newImages = uploadedImages.map(url => ({
        url,
        category,
        label
      }))
      
      setFormData(prev => ({ ...prev, images: [...prev.images, ...newImages] }))
      
      if (uploadedImages.length > 0) {
        setSuccess(`Upload ${uploadedImages.length} ảnh chi tiết thành công`)
        // Reset label sau khi upload
        if (labelInput) labelInput.value = ''
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Không thể upload ảnh chi tiết')
    } finally {
      setUploadingImages(false)
    }
  }

  const handleRemoveThumbnail = () => {
    setFormData(prev => ({ ...prev, image: '' }))
  }

  const handleRemoveImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }))
  }

  const handleToggleAmenity = (amenityId) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenityId)
        ? prev.amenities.filter(id => id !== amenityId)
        : [...prev.amenities, amenityId]
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!formData.roomNumber) {
      setError('Vui lòng nhập số phòng')
      return
    }

    if (!formData.category) {
      setError('Vui lòng chọn danh mục phòng')
      return
    }

    if (!formData.type) {
      setError('Vui lòng chọn loại phòng')
      return
    }

    try {
      if (editingRoom) {
        await api.put(`/rooms/${editingRoom._id}`, formData)
        setSuccess('Cập nhật phòng thành công')
      } else {
        await api.post('/rooms', formData)
        setSuccess('Tạo phòng thành công')
      }
      setShowModal(false)
      setShowCreateModal(false)
      fetchRooms()
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      setError(error.response?.data?.message || 'Không thể lưu phòng')
    }
  }

  const handleDelete = async (roomId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa phòng này?')) {
      try {
        await api.delete(`/rooms/${roomId}`)
        setSuccess('Xóa phòng thành công')
        fetchRooms()
        setTimeout(() => setSuccess(''), 3000)
      } catch (error) {
        setError(error.response?.data?.message || 'Không thể xóa phòng')
      }
    }
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price)
  }

  const getStatusInfo = (status) => {
    return statusOptions.find(s => s.value === status) || statusOptions[0]
  }

  const filteredRoomTypes = formData.category
    ? roomTypes.filter(rt => rt.category?._id === formData.category || rt.category === formData.category)
    : []

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
            <h2 className="serif-heading text-4xl mb-2 text-charcoal dark:text-white">Quản Lý Phòng</h2>
            <p className="text-charcoal/60 dark:text-white/60">Quản lý tất cả các phòng của khách sạn</p>
          </div>
          <button
            onClick={handleCreate}
            className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-lg text-xs font-bold uppercase tracking-widest transition-all"
          >
            + Thêm Phòng
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
            <p className="text-charcoal/60 dark:text-white/60">Đang tải danh sách phòng...</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-charcoal rounded-xl shadow-luxury border border-primary/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-primary/5 border-b border-primary/10">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-charcoal dark:text-white">Số Phòng</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-charcoal dark:text-white">Tầng</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-charcoal dark:text-white">Danh Mục</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-charcoal dark:text-white">Loại Phòng</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-charcoal dark:text-white">Giá/Đêm</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-charcoal dark:text-white">Trạng Thái</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-charcoal dark:text-white">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary/10">
                  {rooms.map((room) => {
                    const statusInfo = getStatusInfo(room.status)
                    return (
                      <tr key={room._id} className="hover:bg-primary/5 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-charcoal dark:text-white">
                          {room.roomNumber}
                        </td>
                        <td className="px-6 py-4 text-sm text-charcoal dark:text-white">
                          {room.floor}
                        </td>
                        <td className="px-6 py-4 text-sm text-charcoal dark:text-white">
                          {room.category?.name || 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-sm text-charcoal dark:text-white">
                          {room.type?.name || 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-sm text-charcoal dark:text-white">
                          {formatPrice(room.price?.daily || 0)}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => navigate(`/rooms/${room._id}`)}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                              Xem
                            </button>
                            <button
                              onClick={() => handleEdit(room)}
                              className="text-primary hover:text-primary/80 text-sm font-medium"
                            >
                              Sửa
                            </button>
                            <button
                              onClick={() => handleDelete(room._id)}
                              className="text-red-600 hover:text-red-800 text-sm font-medium"
                            >
                              Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {rooms.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-charcoal/60 dark:text-white/60">Chưa có phòng nào</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Create/Edit Modal */}
        {(showModal || showCreateModal) && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-charcoal rounded-xl shadow-luxury p-8 max-w-4xl w-full border border-primary/10 max-h-[90vh] overflow-y-auto">
              <h3 className="serif-heading text-2xl mb-6 text-charcoal dark:text-white">
                {editingRoom ? 'Chỉnh Sửa Phòng' : 'Thêm Phòng Mới'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-charcoal dark:text-white mb-2">
                      Số Phòng *
                    </label>
                    <input
                      type="text"
                      value={formData.roomNumber}
                      onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                      required
                      className="w-full px-4 py-3 border border-charcoal/20 dark:border-white/20 rounded-lg bg-background-light dark:bg-background-dark text-charcoal dark:text-white focus:ring-2 focus:ring-primary focus:border-primary"
                      placeholder="VD: 101, 102"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-charcoal dark:text-white mb-2">
                      Tầng *
                    </label>
                    <input
                      type="text"
                      value={formData.floor}
                      onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                      required
                      className="w-full px-4 py-3 border border-charcoal/20 dark:border-white/20 rounded-lg bg-background-light dark:bg-background-dark text-charcoal dark:text-white focus:ring-2 focus:ring-primary focus:border-primary"
                      placeholder="VD: Tầng 1, Lầu 2"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-charcoal dark:text-white mb-2">
                      Danh Mục Phòng *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => {
                        setFormData({ ...formData, category: e.target.value, type: '' })
                      }}
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
                      Loại Phòng *
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      required
                      disabled={!formData.category}
                      className="w-full px-4 py-3 border border-charcoal/20 dark:border-white/20 rounded-lg bg-background-light dark:bg-background-dark text-charcoal dark:text-white focus:ring-2 focus:ring-primary focus:border-primary disabled:opacity-50"
                    >
                      <option value="">Chọn loại phòng</option>
                      {filteredRoomTypes.map((roomType) => (
                        <option key={roomType._id} value={roomType._id}>
                          {roomType.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-charcoal dark:text-white mb-2">
                    Tiện Ích
                  </label>
                  <div className="max-h-48 overflow-y-auto border border-charcoal/20 dark:border-white/20 rounded-lg p-4">
                    {amenities.length === 0 ? (
                      <p className="text-sm text-charcoal/60 dark:text-white/60">Chưa có tiện ích nào</p>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {amenities.map((amenity) => (
                          <label key={amenity._id} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.amenities.includes(amenity._id)}
                              onChange={() => handleToggleAmenity(amenity._id)}
                              className="rounded border-charcoal/20 text-primary focus:ring-primary"
                            />
                            <span className="text-sm text-charcoal dark:text-white">{amenity.name}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-charcoal dark:text-white mb-4">
                    Bảng Giá (VND)
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-charcoal/60 dark:text-white/60 mb-2">Giá Giờ Đầu</label>
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        value={formData.price.firstHour}
                        onChange={(e) => setFormData({
                          ...formData,
                          price: { ...formData.price, firstHour: parseFloat(e.target.value) || 0 }
                        })}
                        className="w-full px-4 py-3 border border-charcoal/20 dark:border-white/20 rounded-lg bg-background-light dark:bg-background-dark text-charcoal dark:text-white focus:ring-2 focus:ring-primary focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-charcoal/60 dark:text-white/60 mb-2">Giá Giờ Tiếp Theo</label>
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        value={formData.price.nextHour}
                        onChange={(e) => setFormData({
                          ...formData,
                          price: { ...formData.price, nextHour: parseFloat(e.target.value) || 0 }
                        })}
                        className="w-full px-4 py-3 border border-charcoal/20 dark:border-white/20 rounded-lg bg-background-light dark:bg-background-dark text-charcoal dark:text-white focus:ring-2 focus:ring-primary focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-charcoal/60 dark:text-white/60 mb-2">Giá Qua Đêm</label>
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        value={formData.price.overnight}
                        onChange={(e) => setFormData({
                          ...formData,
                          price: { ...formData.price, overnight: parseFloat(e.target.value) || 0 }
                        })}
                        className="w-full px-4 py-3 border border-charcoal/20 dark:border-white/20 rounded-lg bg-background-light dark:bg-background-dark text-charcoal dark:text-white focus:ring-2 focus:ring-primary focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-charcoal/60 dark:text-white/60 mb-2">Giá Theo Ngày</label>
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        value={formData.price.daily}
                        onChange={(e) => setFormData({
                          ...formData,
                          price: { ...formData.price, daily: parseFloat(e.target.value) || 0 }
                        })}
                        className="w-full px-4 py-3 border border-charcoal/20 dark:border-white/20 rounded-lg bg-background-light dark:bg-background-dark text-charcoal dark:text-white focus:ring-2 focus:ring-primary focus:border-primary"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-charcoal dark:text-white mb-2">
                    Trạng Thái *
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    required
                    className="w-full px-4 py-3 border border-charcoal/20 dark:border-white/20 rounded-lg bg-background-light dark:bg-background-dark text-charcoal dark:text-white focus:ring-2 focus:ring-primary focus:border-primary"
                  >
                    {statusOptions.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-charcoal dark:text-white mb-2">
                    Ghi Chú
                  </label>
                  <textarea
                    value={formData.note}
                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                    rows="3"
                    className="w-full px-4 py-3 border border-charcoal/20 dark:border-white/20 rounded-lg bg-background-light dark:bg-background-dark text-charcoal dark:text-white focus:ring-2 focus:ring-primary focus:border-primary"
                    placeholder="VD: Máy lạnh hơi ồn, Cửa sổ kẹt..."
                  />
                </div>

                {/* Ảnh Đại Diện */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-charcoal dark:text-white mb-2">
                    Ảnh Đại Diện <span className="text-charcoal/40 dark:text-white/40 font-normal">(Tùy chọn)</span>
                  </label>
                  {formData.image && (
                    <div className="mb-4">
                      <div className="relative inline-block">
                        <img 
                          src={`http://localhost:5000${formData.image}`} 
                          alt="Ảnh đại diện" 
                          className="w-48 h-48 object-cover rounded-lg border border-primary/10"
                        />
                        <button
                          type="button"
                          onClick={handleRemoveThumbnail}
                          className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 transition-colors"
                          title="Xóa ảnh đại diện"
                        >
                          <span className="material-symbols-outlined text-xs">close</span>
                        </button>
                      </div>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailUpload}
                    disabled={uploadingThumbnail}
                    className="w-full px-4 py-3 border border-charcoal/20 dark:border-white/20 rounded-lg bg-background-light dark:bg-background-dark text-charcoal dark:text-white focus:ring-2 focus:ring-primary focus:border-primary disabled:opacity-50"
                  />
                  {uploadingThumbnail && (
                    <p className="text-sm text-charcoal/60 dark:text-white/60 mt-2">Đang upload ảnh đại diện...</p>
                  )}
                  <p className="text-xs text-charcoal/60 dark:text-white/60 mt-1">Ảnh này sẽ hiển thị trong danh sách phòng và card phòng</p>
                </div>

                {/* Ảnh Chi Tiết */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-charcoal dark:text-white mb-4">
                    Ảnh Chi Tiết <span className="text-charcoal/40 dark:text-white/40 font-normal">(Tùy chọn)</span>
                  </label>
                  
                  {/* Danh sách ảnh theo từng khu vực */}
                  {formData.images.length > 0 && (
                    <div className="space-y-6 mb-6">
                      {/* Phòng khách */}
                      {formData.images.filter(img => img.category === 'living_room').length > 0 && (
                        <div>
                          <h4 className="text-sm font-bold text-primary mb-3 flex items-center gap-2">
                            <span className="material-symbols-outlined text-base">living</span>
                            Phòng Khách ({formData.images.filter(img => img.category === 'living_room').length} ảnh)
                          </h4>
                          <div className="grid grid-cols-3 gap-3">
                            {formData.images.map((image, index) => 
                              image.category === 'living_room' && (
                                <div key={index} className="relative group">
                                  <img 
                                    src={`http://localhost:5000${image.url}`} 
                                    alt={image.label || 'Phòng khách'} 
                                    className="w-full h-32 object-cover rounded-lg border border-primary/10"
                                  />
                                  {image.label && (
                                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs px-2 py-1 rounded-b-lg">
                                      {image.label}
                                    </div>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveImage(index)}
                                    className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 transition-colors opacity-0 group-hover:opacity-100"
                                    title="Xóa ảnh"
                                  >
                                    <span className="material-symbols-outlined text-xs">close</span>
                                  </button>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}

                      {/* Phòng ngủ */}
                      {formData.images.filter(img => img.category === 'bedroom').length > 0 && (
                        <div>
                          <h4 className="text-sm font-bold text-primary mb-3 flex items-center gap-2">
                            <span className="material-symbols-outlined text-base">bed</span>
                            Phòng Ngủ ({formData.images.filter(img => img.category === 'bedroom').length} ảnh)
                          </h4>
                          <div className="grid grid-cols-3 gap-3">
                            {formData.images.map((image, index) => 
                              image.category === 'bedroom' && (
                                <div key={index} className="relative group">
                                  <img 
                                    src={`http://localhost:5000${image.url}`} 
                                    alt={image.label || 'Phòng ngủ'} 
                                    className="w-full h-32 object-cover rounded-lg border border-primary/10"
                                  />
                                  {image.label && (
                                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs px-2 py-1 rounded-b-lg">
                                      {image.label}
                                    </div>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveImage(index)}
                                    className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 transition-colors opacity-0 group-hover:opacity-100"
                                    title="Xóa ảnh"
                                  >
                                    <span className="material-symbols-outlined text-xs">close</span>
                                  </button>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}

                      {/* Phòng tắm */}
                      {formData.images.filter(img => img.category === 'bathroom').length > 0 && (
                        <div>
                          <h4 className="text-sm font-bold text-primary mb-3 flex items-center gap-2">
                            <span className="material-symbols-outlined text-base">bathtub</span>
                            Phòng Tắm ({formData.images.filter(img => img.category === 'bathroom').length} ảnh)
                          </h4>
                          <div className="grid grid-cols-3 gap-3">
                            {formData.images.map((image, index) => 
                              image.category === 'bathroom' && (
                                <div key={index} className="relative group">
                                  <img 
                                    src={`http://localhost:5000${image.url}`} 
                                    alt={image.label || 'Phòng tắm'} 
                                    className="w-full h-32 object-cover rounded-lg border border-primary/10"
                                  />
                                  {image.label && (
                                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs px-2 py-1 rounded-b-lg">
                                      {image.label}
                                    </div>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveImage(index)}
                                    className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 transition-colors opacity-0 group-hover:opacity-100"
                                    title="Xóa ảnh"
                                  >
                                    <span className="material-symbols-outlined text-xs">close</span>
                                  </button>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}

                      {/* Khu vực khác */}
                      {formData.images.filter(img => img.category === 'other').length > 0 && (
                        <div>
                          <h4 className="text-sm font-bold text-primary mb-3 flex items-center gap-2">
                            <span className="material-symbols-outlined text-base">image</span>
                            Khu Vực Khác ({formData.images.filter(img => img.category === 'other').length} ảnh)
                          </h4>
                          <div className="grid grid-cols-3 gap-3">
                            {formData.images.map((image, index) => 
                              image.category === 'other' && (
                                <div key={index} className="relative group">
                                  <img 
                                    src={`http://localhost:5000${image.url}`} 
                                    alt={image.label || 'Khu vực khác'} 
                                    className="w-full h-32 object-cover rounded-lg border border-primary/10"
                                  />
                                  {image.label && (
                                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs px-2 py-1 rounded-b-lg">
                                      {image.label}
                                    </div>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveImage(index)}
                                    className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 transition-colors opacity-0 group-hover:opacity-100"
                                    title="Xóa ảnh"
                                  >
                                    <span className="material-symbols-outlined text-xs">close</span>
                                  </button>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Form thêm ảnh chi tiết */}
                  <div className="bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-lg p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-charcoal dark:text-white mb-2">
                          Khu Vực *
                        </label>
                        <select
                          id="imageCategory"
                          className="w-full px-3 py-2 border border-charcoal/20 dark:border-white/20 rounded-lg bg-background-light dark:bg-background-dark text-charcoal dark:text-white focus:ring-2 focus:ring-primary focus:border-primary text-sm"
                          defaultValue="other"
                        >
                          <option value="living_room">Phòng Khách</option>
                          <option value="bedroom">Phòng Ngủ</option>
                          <option value="bathroom">Phòng Tắm</option>
                          <option value="other">Khu Vực Khác</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-charcoal dark:text-white mb-2">
                          Nhãn Mô Tả
                        </label>
                        <input
                          type="text"
                          id="imageLabel"
                          placeholder="VD: Góc nhìn ra ban công"
                          className="w-full px-3 py-2 border border-charcoal/20 dark:border-white/20 rounded-lg bg-background-light dark:bg-background-dark text-charcoal dark:text-white focus:ring-2 focus:ring-primary focus:border-primary text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleDetailImagesUpload}
                        disabled={uploadingImages}
                        className="w-full px-4 py-3 border border-charcoal/20 dark:border-white/20 rounded-lg bg-background-light dark:bg-background-dark text-charcoal dark:text-white focus:ring-2 focus:ring-primary focus:border-primary disabled:opacity-50"
                      />
                      {uploadingImages && (
                        <p className="text-sm text-charcoal/60 dark:text-white/60 mt-2">Đang upload ảnh chi tiết...</p>
                      )}
                      <p className="text-xs text-charcoal/60 dark:text-white/60 mt-2">
                        Chọn khu vực và nhãn mô tả trước khi upload ảnh. Có thể upload nhiều ảnh cùng lúc với cùng khu vực và nhãn.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-primary hover:bg-primary/90 text-white py-3 rounded-lg text-xs font-bold uppercase tracking-widest transition-all"
                  >
                    {editingRoom ? 'Cập Nhật' : 'Tạo Mới'}
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

export default AdminRooms

