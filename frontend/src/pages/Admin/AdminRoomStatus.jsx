import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'

const AdminRoomStatus = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [rooms, setRooms] = useState([])
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [showModal, setShowModal] = useState(false)

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
      // Chỉ lấy booking đang active (Confirmed hoặc CheckedIn)
      const activeBookings = bookingsRes.data.filter(b => 
        b.status === 'Confirmed' || b.status === 'CheckedIn'
      )
      setBookings(activeBookings)
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
    return bookings.find(b => 
      (b.room._id === roomId || b.room === roomId) && 
      (b.status === 'Confirmed' || b.status === 'CheckedIn')
    )
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
      <header className="bg-white dark:bg-background-dark border-b border-primary/10 sticky top-0 z-40">
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
        <div className="mb-8">
          <h2 className="serif-heading text-4xl mb-2 text-charcoal dark:text-white">Sơ Đồ Phòng</h2>
          <p className="text-charcoal/60 dark:text-white/60 italic">Tổng quan trực quan về tình trạng phòng theo tầng</p>
        </div>

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
                        <p className={`text-[10px] font-bold ${statusInfo.textColor} uppercase tracking-tight`}>
                          {statusInfo.label}
                        </p>
                        {booking && (
                          <p className={`text-[10px] ${statusInfo.textColor} mt-1`}>
                            Ra: {formatDateTime(booking.checkOutDate, booking.checkOutTime)}
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
              </section>
            ))}
          </div>
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
                  if (!booking) return <p className="text-sm text-charcoal/60 dark:text-white/60">Không tìm thấy thông tin booking</p>
                  
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

export default AdminRoomStatus
