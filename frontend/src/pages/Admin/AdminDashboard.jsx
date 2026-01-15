import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useState, useEffect } from 'react'
import api from '../../services/api'

const AdminDashboard = () => {
  const { user, logout } = useAuth()
  const [rooms, setRooms] = useState([])
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [showRoomGrid, setShowRoomGrid] = useState(true)
  const [updatingStatus, setUpdatingStatus] = useState(false)

  useEffect(() => {
    fetchData()
    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [roomsRes, bookingsRes] = await Promise.all([
        api.get('/rooms'),
        api.get('/bookings/admin')
      ])
      setRooms(roomsRes.data)
      // Lấy tất cả booking active (bỏ filter để debug)
      console.log('All bookings:', bookingsRes.data)
      setBookings(bookingsRes.data)
    } catch (error) {
      console.error('Không thể tải dữ liệu:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusInfo = (status) => {
    const statusMap = {
      'Available': {
        label: 'Trống',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-100',
        textColor: 'text-green-600',
        iconColor: 'text-green-500',
        icon: 'check_circle'
      },
      'Occupied': {
        label: 'Có Khách',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-100',
        textColor: 'text-blue-600',
        iconColor: 'text-blue-500',
        icon: 'person'
      },
      'Dirty': {
        label: 'Đang Dọn',
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-100',
        textColor: 'text-amber-600',
        iconColor: 'text-amber-500',
        icon: 'cleaning_services'
      },
      'Maintenance': {
        label: 'Bảo Trì',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-100',
        textColor: 'text-red-600',
        iconColor: 'text-red-500',
        icon: 'handyman'
      }
    }
    return statusMap[status] || statusMap['Available']
  }

  const getRoomBooking = (roomId) => {
    const booking = bookings.find(b => {
      const bookingRoomId = b.room?._id || b.room
      const match = bookingRoomId === roomId
      const statusMatch = ['Confirmed', 'CheckedIn', 'confirmed', 'checked-in'].includes(b.status)
      return match && statusMatch
    })
    return booking
  }
  const handleStatusChange = async (newStatus) => {
    if (!selectedRoom) return
    
    try {
      setUpdatingStatus(true)
      await api.put(`/rooms/${selectedRoom._id}`, {
        ...selectedRoom,
        status: newStatus
      })
      
      // Cập nhật local state
      setRooms(rooms.map(r => 
        r._id === selectedRoom._id ? { ...r, status: newStatus } : r
      ))
      setSelectedRoom({ ...selectedRoom, status: newStatus })
      
      // Hiển thị thông báo thành công
      alert('Đã cập nhật trạng thái phòng thành công!')
    } catch (error) {
      console.error('Lỗi cập nhật trạng thái:', error)
      alert('Không thể cập nhật trạng thái phòng')
    } finally {
      setUpdatingStatus(false)
    }
  }

  const groupRoomsByFloor = () => {
    const filtered = rooms.filter(room => 
      room.roomNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.floor.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const grouped = {}
    filtered.forEach(room => {
      if (!grouped[room.floor]) {
        grouped[room.floor] = []
      }
      grouped[room.floor].push(room)
    })

    // Sắp xếp tầng
    return Object.keys(grouped).sort((a, b) => {
      const numA = parseInt(a)
      const numB = parseInt(b)
      if (!isNaN(numA) && !isNaN(numB)) return numB - numA // Giảm dần
      return b.localeCompare(a)
    }).map(floor => ({
      floor,
      rooms: grouped[floor].sort((a, b) => a.roomNumber.localeCompare(b.roomNumber))
    }))
  }

  const handleRoomClick = (room) => {
    setSelectedRoom(room)
    setShowModal(true)
  }

  const formatDateTime = (date, time) => {
    if (!date) return 'N/A'
    const dateObj = new Date(date)
    const formattedDate = dateObj.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
    return time ? `${formattedDate} ${time}` : formattedDate
  }

  const getStatusCounts = () => {
    const counts = {
      Available: 0,
      Occupied: 0,
      Dirty: 0,
      Maintenance: 0
    }
    rooms.forEach(room => {
      counts[room.status] = (counts[room.status] || 0) + 1
    })
    return counts
  }

  const statusCounts = getStatusCounts()
  const floorGroups = groupRoomsByFloor()

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
        {/* Toggle Buttons */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="serif-heading text-4xl mb-2 text-charcoal dark:text-white">Bảng Điều Khiển Admin</h2>
            <p className="text-charcoal/60 dark:text-white/60">Chào mừng trở lại, {user?.username}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowRoomGrid(true)}
              className={`px-6 py-3 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                showRoomGrid
                  ? 'bg-primary text-white shadow-lg'
                  : 'bg-white dark:bg-charcoal border border-primary/20 text-charcoal dark:text-white hover:border-primary'
              }`}
            >
              <span className="material-symbols-outlined text-sm align-middle mr-2">grid_view</span>
              Sơ Đồ Phòng
            </button>
            <button
              onClick={() => setShowRoomGrid(false)}
              className={`px-6 py-3 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                !showRoomGrid
                  ? 'bg-primary text-white shadow-lg'
                  : 'bg-white dark:bg-charcoal border border-primary/20 text-charcoal dark:text-white hover:border-primary'
              }`}
            >
              <span className="material-symbols-outlined text-sm align-middle mr-2">dashboard</span>
              Quản Lý
            </button>
          </div>
        </div>

        {showRoomGrid ? (
          /* Room Status Grid */
          <>
            {/* Legend & Search */}
            <div className="bg-white dark:bg-charcoal rounded-xl shadow-luxury border border-primary/10 p-6 mb-8">
              <div className="flex flex-wrap items-center justify-between gap-4">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-charcoal/40 dark:text-white/40">
                    search
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm kiếm phòng..."
                    className="w-full pl-10 pr-4 py-2.5 border border-charcoal/20 dark:border-white/20 rounded-lg bg-background-light dark:bg-background-dark text-charcoal dark:text-white focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>

                {/* Legend */}
                <div className="flex flex-wrap items-center gap-6">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-green-100 border border-green-200"></div>
                    <span className="text-xs font-bold uppercase tracking-wider text-charcoal/60 dark:text-white/60">
                      Trống ({statusCounts.Available})
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-blue-100 border border-blue-200"></div>
                    <span className="text-xs font-bold uppercase tracking-wider text-charcoal/60 dark:text-white/60">
                      Có Khách ({statusCounts.Occupied})
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-amber-100 border border-amber-200"></div>
                    <span className="text-xs font-bold uppercase tracking-wider text-charcoal/60 dark:text-white/60">
                      Đang Dọn ({statusCounts.Dirty})
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-red-100 border border-red-200"></div>
                    <span className="text-xs font-bold uppercase tracking-wider text-charcoal/60 dark:text-white/60">
                      Bảo Trì ({statusCounts.Maintenance})
                    </span>
                  </div>
                </div>

                {/* Refresh */}
                <button
                  onClick={fetchData}
                  className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                  title="Làm mới"
                >
                  <span className="material-symbols-outlined">refresh</span>
                </button>
              </div>
            </div>

            {/* Room Grid by Floor */}
            {loading ? (
              <div className="text-center py-20">
                <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
                <p className="mt-4 text-charcoal/60 dark:text-white/60">Đang tải...</p>
              </div>
            ) : (
              <div className="space-y-10">
                {floorGroups.map(({ floor, rooms: floorRooms }) => (
                  <section key={floor}>
                    <div className="flex items-center gap-4 mb-4">
                      <h3 className="serif-heading text-xl font-bold text-charcoal dark:text-white">
                        {floor}
                      </h3>
                      <div className="h-px flex-1 bg-black/5 dark:bg-white/5"></div>
                      <span className="text-xs text-charcoal/40 dark:text-white/40">
                        {floorRooms.length} phòng
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                      {floorRooms.map((room) => {
                        const statusInfo = getStatusInfo(room.status)
                        const booking = getRoomBooking(room._id)
                        
                        return (
                          <div
                            key={room._id}
                            onClick={() => handleRoomClick(room)}
                            className={`${statusInfo.bgColor} border ${statusInfo.borderColor} p-4 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5`}
                          >
                            <div className="flex justify-between items-start mb-1">
                              <span className="text-sm font-bold text-charcoal dark:text-white">
                                {room.roomNumber}
                              </span>
                              <span className={`material-symbols-outlined ${statusInfo.iconColor} text-sm`}>
                                {statusInfo.icon}
                              </span>
                            </div>
                            <p className={`text-[10px] font-bold ${statusInfo.textColor} uppercase tracking-tight mb-1`}>
                              {statusInfo.label}
                            </p>
                            {booking && (
                              <div className={`text-[9px] ${statusInfo.textColor} space-y-0.5 mt-2 pt-2 border-t ${statusInfo.borderColor}`}>
                                <div className="flex items-center gap-1">
                                  <span className="material-symbols-outlined text-[10px]">login</span>
                                  <span className="font-medium">Nhận: {formatDateTime(booking.checkInDate, booking.checkInTime)}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="material-symbols-outlined text-[10px]">logout</span>
                                  <span className="font-medium">Trả: {formatDateTime(booking.checkOutDate, booking.checkOutTime)}</span>
                                </div>
                                {booking.user && (
                                  <div className="flex items-center gap-1 mt-1">
                                    <span className="material-symbols-outlined text-[10px]">person</span>
                                    <span className="truncate">{booking.user.fullName || booking.user.username}</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </>
        ) : (
          /* Management Dashboard */
          <>
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white dark:bg-charcoal rounded-xl shadow-luxury p-6 border border-primary/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-charcoal/60 dark:text-white/60">Tổng Người Dùng</h3>
              <span className="material-symbols-outlined text-primary text-2xl">people</span>
            </div>
            <p className="serif-heading text-3xl text-charcoal dark:text-white">-</p>
            <p className="text-xs text-charcoal/40 dark:text-white/40 mt-2">Xem tất cả người dùng</p>
          </div>

          <div className="bg-white dark:bg-charcoal rounded-xl shadow-luxury p-6 border border-primary/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-charcoal/60 dark:text-white/60">Người Dùng Hoạt Động</h3>
              <span className="material-symbols-outlined text-primary text-2xl">check_circle</span>
            </div>
            <p className="serif-heading text-3xl text-charcoal dark:text-white">-</p>
            <p className="text-xs text-charcoal/40 dark:text-white/40 mt-2">Đang hoạt động</p>
          </div>

          <div className="bg-white dark:bg-charcoal rounded-xl shadow-luxury p-6 border border-primary/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-charcoal/60 dark:text-white/60">Người Dùng Admin</h3>
              <span className="material-symbols-outlined text-primary text-2xl">admin_panel_settings</span>
            </div>
            <p className="serif-heading text-3xl text-charcoal dark:text-white">-</p>
            <p className="text-xs text-charcoal/40 dark:text-white/40 mt-2">Quản trị viên</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            to="/admin/users"
            className="bg-white dark:bg-charcoal rounded-xl shadow-luxury p-8 border border-primary/10 hover:border-primary transition-all group"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary/20 transition-colors">
                <span className="material-symbols-outlined text-3xl">people</span>
              </div>
              <div>
                <h3 className="serif-heading text-2xl mb-2 text-charcoal dark:text-white group-hover:text-primary transition-colors">
                  Quản Lý Người Dùng
                </h3>
                <p className="text-charcoal/60 dark:text-white/60 text-sm">
                  Xem, chỉnh sửa và xóa tài khoản người dùng
                </p>
              </div>
            </div>
          </Link>

          <Link
            to="/admin/roomcategories"
            className="bg-white dark:bg-charcoal rounded-xl shadow-luxury p-8 border border-primary/10 hover:border-primary transition-all group"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary/20 transition-colors">
                <span className="material-symbols-outlined text-3xl">category</span>
              </div>
              <div>
                <h3 className="serif-heading text-2xl mb-2 text-charcoal dark:text-white group-hover:text-primary transition-colors">
                  Quản Lý Danh Mục Phòng
                </h3>
                <p className="text-charcoal/60 dark:text-white/60 text-sm">
                  Quản lý các danh mục phòng của khách sạn
                </p>
              </div>
            </div>
          </Link>

          <Link
            to="/admin/roomtypes"
            className="bg-white dark:bg-charcoal rounded-xl shadow-luxury p-8 border border-primary/10 hover:border-primary transition-all group"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary/20 transition-colors">
                <span className="material-symbols-outlined text-3xl">bed</span>
              </div>
              <div>
                <h3 className="serif-heading text-2xl mb-2 text-charcoal dark:text-white group-hover:text-primary transition-colors">
                  Quản Lý Loại Phòng
                </h3>
                <p className="text-charcoal/60 dark:text-white/60 text-sm">
                  Quản lý các loại phòng trong từng danh mục
                </p>
              </div>
            </div>
          </Link>

          <Link
            to="/admin/rooms"
            className="bg-white dark:bg-charcoal rounded-xl shadow-luxury p-8 border border-primary/10 hover:border-primary transition-all group"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary/20 transition-colors">
                <span className="material-symbols-outlined text-3xl">door_front</span>
              </div>
              <div>
                <h3 className="serif-heading text-2xl mb-2 text-charcoal dark:text-white group-hover:text-primary transition-colors">
                  Quản Lý Phòng
                </h3>
                <p className="text-charcoal/60 dark:text-white/60 text-sm">
                  Quản lý tất cả các phòng của khách sạn
                </p>
              </div>
            </div>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <Link
            to="/admin/amenities"
            className="bg-white dark:bg-charcoal rounded-xl shadow-luxury p-8 border border-primary/10 hover:border-primary transition-all group"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary/20 transition-colors">
                <span className="material-symbols-outlined text-3xl">room_service</span>
              </div>
              <div>
                <h3 className="serif-heading text-2xl mb-2 text-charcoal dark:text-white group-hover:text-primary transition-colors">
                  Quản Lý Tiện Ích
                </h3>
                <p className="text-charcoal/60 dark:text-white/60 text-sm">
                  Quản lý các tiện ích của khách sạn
                </p>
              </div>
            </div>
          </Link>

          <Link
            to="/admin/services"
            className="bg-white dark:bg-charcoal rounded-xl shadow-luxury p-8 border border-primary/10 hover:border-primary transition-all group"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary/20 transition-colors">
                <span className="material-symbols-outlined text-3xl">restaurant</span>
              </div>
              <div>
                <h3 className="serif-heading text-2xl mb-2 text-charcoal dark:text-white group-hover:text-primary transition-colors">
                  Quản Lý Dịch Vụ
                </h3>
                <p className="text-charcoal/60 dark:text-white/60 text-sm">
                  Quản lý các dịch vụ của khách sạn
                </p>
              </div>
            </div>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <Link
            to="/admin/bookings"
            className="bg-white dark:bg-charcoal rounded-xl shadow-luxury p-8 border border-primary/10 hover:border-primary transition-all group"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary/20 transition-colors">
                <span className="material-symbols-outlined text-3xl">event_note</span>
              </div>
              <div>
                <h3 className="serif-heading text-2xl mb-2 text-charcoal dark:text-white group-hover:text-primary transition-colors">
                  Quản Lý Đặt Phòng
                </h3>
                <p className="text-charcoal/60 dark:text-white/60 text-sm">
                  Quản lý tất cả các đặt phòng của khách sạn
                </p>
              </div>
            </div>
          </Link>

          <Link
            to="/admin/bookings/create"
            className="bg-white dark:bg-charcoal rounded-xl shadow-luxury p-8 border border-primary/10 hover:border-primary transition-all group"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary/20 transition-colors">
                <span className="material-symbols-outlined text-3xl">add_circle</span>
              </div>
              <div>
                <h3 className="serif-heading text-2xl mb-2 text-charcoal dark:text-white group-hover:text-primary transition-colors">
                  Tạo Đặt Phòng
                </h3>
                <p className="text-charcoal/60 dark:text-white/60 text-sm">
                  Đặt phòng cho người dùng hoặc khách vãng lai
                </p>
              </div>
            </div>
          </Link>

          <Link
            to="/admin/profile"
            className="bg-white dark:bg-charcoal rounded-xl shadow-luxury p-8 border border-primary/10 hover:border-primary transition-all group"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary/20 transition-colors">
                <span className="material-symbols-outlined text-3xl">person</span>
              </div>
              <div>
                <h3 className="serif-heading text-2xl mb-2 text-charcoal dark:text-white group-hover:text-primary transition-colors">
                  Thông Tin Cá Nhân
                </h3>
                <p className="text-charcoal/60 dark:text-white/60 text-sm">
                  Cập nhật thông tin cá nhân của bạn
                </p>
              </div>
            </div>
          </Link>
        </div>
          </>
        )}
      </div>

      {/* Room Detail Modal */}
      {showModal && selectedRoom && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-charcoal w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-primary/10 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className={`size-12 ${getStatusInfo(selectedRoom.status).bgColor} rounded-lg flex items-center justify-center font-bold text-lg`}>
                  {selectedRoom.roomNumber}
                </div>
                <div>
                  <h4 className="font-bold text-charcoal dark:text-white">
                    {getStatusInfo(selectedRoom.status).label}
                  </h4>
                  <p className="text-xs text-charcoal/60 dark:text-white/60">
                    {selectedRoom.type?.name} • {selectedRoom.floor}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="size-8 rounded-full hover:bg-charcoal/10 dark:hover:bg-white/10 flex items-center justify-center transition-colors"
              >
                <span className="material-symbols-outlined text-charcoal/60 dark:text-white/60">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {selectedRoom.status === 'Occupied' ? (
                // Phòng có khách - hiển thị thông tin booking
                (() => {
                  const booking = getRoomBooking(selectedRoom._id)
                  if (!booking) {
                    return (
                      <div className="text-center py-8">
                        <span className="material-symbols-outlined text-4xl text-charcoal/20 dark:text-white/20 mb-3">info</span>
                        <p className="text-sm text-charcoal/60 dark:text-white/60 mb-4">
                          Không tìm thấy thông tin booking cho phòng này
                        </p>
                        <Link
                          to="/admin/bookings"
                          className="inline-block bg-primary text-white py-2 px-6 rounded-lg text-xs font-bold uppercase tracking-widest hover:brightness-110 transition-all"
                        >
                          Xem Tất Cả Bookings
                        </Link>
                      </div>
                    )
                  }
                  
                  return (
                    <div className="space-y-4">
                      {/* Guest Info */}
                      {booking.user && (
                        <div className="flex items-center gap-4">
                          <div className="size-12 rounded-full bg-charcoal/10 dark:bg-white/10 flex items-center justify-center">
                            <span className="material-symbols-outlined text-primary text-2xl">person</span>
                          </div>
                          <div>
                            <p className="text-sm font-bold text-charcoal dark:text-white">
                              {booking.user.fullName || booking.user.username}
                            </p>
                            <p className="text-xs text-charcoal/60 dark:text-white/60">
                              {booking.user.email}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Check-in/out Times */}
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-primary/10">
                        <div>
                          <p className="text-[10px] text-charcoal/40 dark:text-white/40 font-bold uppercase mb-1">
                            Nhận Phòng
                          </p>
                          <p className="text-sm font-medium text-charcoal dark:text-white">
                            {formatDateTime(booking.checkInDate, booking.checkInTime)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-charcoal/40 dark:text-white/40 font-bold uppercase mb-1">
                            Trả Phòng
                          </p>
                          <p className="text-sm font-medium text-blue-600">
                            {formatDateTime(booking.checkOutDate, booking.checkOutTime)}
                          </p>
                        </div>
                      </div>

                      {/* Booking Type & Guests */}
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-primary/10">
                        <div>
                          <p className="text-[10px] text-charcoal/40 dark:text-white/40 font-bold uppercase mb-1">
                            Loại Đặt
                          </p>
                          <p className="text-sm font-medium text-charcoal dark:text-white">
                            {booking.bookingType === 'daily' ? 'Theo ngày' : 
                             booking.bookingType === 'hourly' ? 'Theo giờ' : 
                             'Qua đêm'}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-charcoal/40 dark:text-white/40 font-bold uppercase mb-1">
                            Số Khách
                          </p>
                          <p className="text-sm font-medium text-charcoal dark:text-white">
                            {booking.adults} người lớn, {booking.children} trẻ em
                          </p>
                        </div>
                      </div>

                      {/* Total Price */}
                      <div className="pt-4 border-t border-primary/10">
                        <p className="text-[10px] text-charcoal/40 dark:text-white/40 font-bold uppercase mb-1">
                          Tổng Tiền
                        </p>
                        <p className="text-xl font-bold text-primary">
                          {new Intl.NumberFormat('vi-VN', {
                            style: 'currency',
                            currency: 'VND'
                          }).format(booking.totalPrice || 0)}
                        </p>
                      </div>

                      <div className="mt-6 flex gap-3">
                        <Link
                          to={`/admin/bookings`}
                          className="flex-1 bg-primary text-white py-3 rounded-lg text-xs font-bold uppercase tracking-widest text-center hover:brightness-110 transition-all"
                        >
                          Xem Chi Tiết Booking
                        </Link>
                      </div>
                    </div>
                  )
                })()
              ) : (
                // Phòng trống hoặc status khác - hiển thị thông tin phòng & nút đặt
                <div className="space-y-4">
                  {/* Room Status Management */}
                  <div className="bg-primary/5 dark:bg-primary/10 p-4 rounded-lg">
                    <p className="text-[10px] text-charcoal/40 dark:text-white/40 font-bold uppercase mb-3">
                      Thay Đổi Trạng Thái Phòng
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => handleStatusChange('Available')}
                        disabled={updatingStatus || selectedRoom.status === 'Available'}
                        className={`py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                          selectedRoom.status === 'Available'
                            ? 'bg-green-100 text-green-800 border-2 border-green-500'
                            : 'bg-white dark:bg-charcoal border border-green-200 text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        <span className="material-symbols-outlined text-sm block mb-1">check_circle</span>
                        Trống
                      </button>
                      <button
                        onClick={() => handleStatusChange('Dirty')}
                        disabled={updatingStatus || selectedRoom.status === 'Dirty'}
                        className={`py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                          selectedRoom.status === 'Dirty'
                            ? 'bg-amber-100 text-amber-800 border-2 border-amber-500'
                            : 'bg-white dark:bg-charcoal border border-amber-200 text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        <span className="material-symbols-outlined text-sm block mb-1">cleaning_services</span>
                        Dọn
                      </button>
                      <button
                        onClick={() => handleStatusChange('Maintenance')}
                        disabled={updatingStatus || selectedRoom.status === 'Maintenance'}
                        className={`py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                          selectedRoom.status === 'Maintenance'
                            ? 'bg-red-100 text-red-800 border-2 border-red-500'
                            : 'bg-white dark:bg-charcoal border border-red-200 text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        <span className="material-symbols-outlined text-sm block mb-1">build</span>
                        Bảo Trì
                      </button>
                    </div>
                  </div>

                  {/* Room Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] text-charcoal/40 dark:text-white/40 font-bold uppercase mb-1">
                        Loại Phòng
                      </p>
                      <p className="text-sm font-medium text-charcoal dark:text-white">
                        {selectedRoom.type?.name || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-charcoal/40 dark:text-white/40 font-bold uppercase mb-1">
                        Danh Mục
                      </p>
                      <p className="text-sm font-medium text-charcoal dark:text-white">
                        {selectedRoom.category?.name || 'N/A'}
                      </p>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="pt-4 border-t border-primary/10">
                    <p className="text-[10px] text-charcoal/40 dark:text-white/40 font-bold uppercase mb-1">
                      Giá Theo Ngày
                    </p>
                    <p className="text-xl font-bold text-primary">
                      {new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND'
                      }).format(selectedRoom.price?.daily || 0)}
                    </p>
                  </div>

                  {/* Amenities */}
                  {selectedRoom.amenities && selectedRoom.amenities.length > 0 && (
                    <div className="pt-4 border-t border-primary/10">
                      <p className="text-[10px] text-charcoal/40 dark:text-white/40 font-bold uppercase mb-2">
                        Tiện Ích
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {selectedRoom.amenities.slice(0, 6).map((amenity, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 rounded-full text-xs text-charcoal dark:text-white"
                          >
                            {typeof amenity === 'string' ? amenity : amenity.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  {selectedRoom.status === 'Available' && (
                    <div className="mt-6 flex gap-3">
                      <Link
                        to="/admin/bookings/create"
                        state={{ selectedRoom }}
                        className="flex-1 bg-primary text-white py-3 rounded-lg text-xs font-bold uppercase tracking-widest text-center hover:brightness-110 transition-all"
                      >
                        Đặt Phòng Này
                      </Link>
                      <Link
                        to={`/rooms/${selectedRoom._id}`}
                        className="px-4 py-3 border border-primary/20 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-primary/10 transition-colors"
                      >
                        Xem Chi Tiết
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminDashboard

