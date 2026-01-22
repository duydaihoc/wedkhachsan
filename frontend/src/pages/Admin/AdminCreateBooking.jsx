import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'

const AdminCreateBooking = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [rooms, setRooms] = useState([])
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [roomBookings, setRoomBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchUsers, setSearchUsers] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUser, setSelectedUser] = useState(null)
  const [isGuest, setIsGuest] = useState(false)
  const [guestInfo, setGuestInfo] = useState({
    fullName: '',
    phone: '',
    email: ''
  })

  // Booking states
  const [bookingType, setBookingType] = useState('daily')
  const [checkIn, setCheckIn] = useState(new Date().toISOString().split('T')[0])
  const [checkInTime, setCheckInTime] = useState('15:00')
  const [checkOut, setCheckOut] = useState(new Date(Date.now() + 86400000).toISOString().split('T')[0])
  const [checkOutTime, setCheckOutTime] = useState('12:00')
  const [hours, setHours] = useState(1)
  const [selectedAmenities, setSelectedAmenities] = useState([])
  const [selectedServices, setSelectedServices] = useState([])
  const [adults, setAdults] = useState(1)
  const [children, setChildren] = useState(0)
  const [services, setServices] = useState([])

  useEffect(() => {
    fetchRooms()
    fetchServices()
  }, [])

  useEffect(() => {
    if (selectedRoom) {
      fetchRoomBookings(selectedRoom._id)
      
      // Tự động set số khách theo loại phòng
      if (selectedRoom.type) {
        if (selectedRoom.type.maxAdults) {
          setAdults(selectedRoom.type.maxAdults)
        }
        if (selectedRoom.type.maxChildren !== undefined) {
          setChildren(selectedRoom.type.maxChildren || 0)
        }
      }
    }
  }, [selectedRoom, checkIn, checkOut])

  // Tự động tính check-out cho hourly
  useEffect(() => {
    if (bookingType === 'hourly' && checkIn && checkInTime && hours) {
      const [hoursStr, minutesStr] = checkInTime.split(':')
      const checkInHours = parseInt(hoursStr, 10)
      const checkInMinutes = parseInt(minutesStr, 10)
      
      // Tạo Date ở local timezone để tránh timezone issues
      const [year, month, day] = checkIn.split('-').map(Number)
      const checkInDateTime = new Date(year, month - 1, day, checkInHours, checkInMinutes, 0, 0)
      
      const checkOutDateTime = new Date(checkInDateTime)
      checkOutDateTime.setHours(checkOutDateTime.getHours() + hours)
      
      // Format lại thành YYYY-MM-DD (local timezone)
      const checkOutYear = checkOutDateTime.getFullYear()
      const checkOutMonth = String(checkOutDateTime.getMonth() + 1).padStart(2, '0')
      const checkOutDay = String(checkOutDateTime.getDate()).padStart(2, '0')
      setCheckOut(`${checkOutYear}-${checkOutMonth}-${checkOutDay}`)
      
      const checkOutHours = checkOutDateTime.getHours().toString().padStart(2, '0')
      const checkOutMinutes = checkOutDateTime.getMinutes().toString().padStart(2, '0')
      setCheckOutTime(`${checkOutHours}:${checkOutMinutes}`)
    }
  }, [bookingType, checkIn, checkInTime, hours])

  // Tự động set check-out cho overnight
  useEffect(() => {
    if (bookingType === 'overnight' && checkIn) {
      // Tạo Date ở local timezone để tránh timezone issues
      const [year, month, day] = checkIn.split('-').map(Number)
      const checkInDate = new Date(year, month - 1, day)
      const nextDay = new Date(checkInDate)
      nextDay.setDate(nextDay.getDate() + 1)
      // Format lại thành YYYY-MM-DD (local timezone)
      const nextYear = nextDay.getFullYear()
      const nextMonth = String(nextDay.getMonth() + 1).padStart(2, '0')
      const nextDayStr = String(nextDay.getDate()).padStart(2, '0')
      setCheckOut(`${nextYear}-${nextMonth}-${nextDayStr}`)
      setCheckOutTime('12:00')
    }
  }, [bookingType, checkIn])

  const fetchRooms = async () => {
    try {
      setLoading(true)
      const response = await api.get('/rooms')
      setRooms(response.data)
    } catch (error) {
      console.error('Không thể tải danh sách phòng:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchServices = async () => {
    try {
      const response = await api.get('/services')
      const availableServices = response.data.filter(service => service.isAvailable)
      setServices(availableServices)
    } catch (error) {
      console.error('Không thể tải danh sách dịch vụ:', error)
    }
  }

  const fetchRoomBookings = async (roomId) => {
    try {
      const startDate = new Date(checkIn)
      startDate.setDate(startDate.getDate() - 7) // 7 ngày trước
      const endDate = new Date(checkOut)
      endDate.setDate(endDate.getDate() + 7) // 7 ngày sau

      const response = await api.get(`/bookings/admin/room-bookings`, {
        params: {
          roomId,
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0]
        }
      })
      setRoomBookings(response.data)
    } catch (error) {
      console.error('Không thể tải lịch đặt phòng:', error)
    }
  }

  const searchUser = async (query) => {
    if (query.length < 2) {
      setSearchUsers([])
      return
    }
    try {
      const response = await api.get('/users', {
        params: { search: query }
      })
      setSearchUsers(response.data || [])
    } catch (error) {
      console.error('Không thể tìm kiếm user:', error)
      setSearchUsers([])
    }
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price)
  }

  const calculateRoomPrice = () => {
    if (!selectedRoom?.price) return 0

    switch (bookingType) {
      case 'hourly':
        if (hours <= 1) {
          return selectedRoom.price.firstHour || 0
        } else {
          return (selectedRoom.price.firstHour || 0) + ((hours - 1) * (selectedRoom.price.nextHour || 0))
        }
      case 'overnight':
        return selectedRoom.price.overnight || 0
      case 'daily':
        const checkInDate = new Date(checkIn)
        const checkOutDate = new Date(checkOut)
        const diffTime = checkOutDate - checkInDate
        const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        return (selectedRoom.price.daily || 0) * (nights > 0 ? nights : 1)
      default:
        return selectedRoom.price.daily || 0
    }
  }

  const calculateAmenitiesPrice = () => {
    if (!selectedRoom?.amenities || selectedAmenities.length === 0) return 0
    
    return selectedAmenities.reduce((total, amenityId) => {
      const amenity = selectedRoom.amenities.find(a => (a._id || a) === amenityId)
      if (amenity && amenity.price) {
        if (bookingType === 'hourly' && amenity.price) {
          return total + (amenity.price * hours)
        }
        return total + (amenity.price || 0)
      }
      return total
    }, 0)
  }

  const calculateServicesPrice = () => {
    if (selectedServices.length === 0) return 0
    
    return selectedServices.reduce((total, serviceId) => {
      const service = services.find(s => s._id === serviceId)
      if (service && service.price) {
        return total + (service.price || 0)
      }
      return total
    }, 0)
  }

  const calculateTotal = () => {
    const roomPrice = calculateRoomPrice()
    const amenitiesPrice = calculateAmenitiesPrice()
    const servicesPrice = calculateServicesPrice()
    return roomPrice + amenitiesPrice + servicesPrice
  }

  const toggleAmenity = (amenityId) => {
    setSelectedAmenities(prev => {
      if (prev.includes(amenityId)) {
        return prev.filter(id => id !== amenityId)
      } else {
        return [...prev, amenityId]
      }
    })
  }

  const toggleService = (serviceId) => {
    setSelectedServices(prev => {
      if (prev.includes(serviceId)) {
        return prev.filter(id => id !== serviceId)
      } else {
        return [...prev, serviceId]
      }
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validation
    if (!selectedRoom) {
      alert('Vui lòng chọn phòng')
      return
    }

    if (!isGuest && !selectedUser) {
      alert('Vui lòng chọn người dùng hoặc nhập thông tin khách vãng lai')
      return
    }

    if (isGuest && (!guestInfo.fullName || !guestInfo.phone)) {
      alert('Vui lòng nhập đầy đủ thông tin khách vãng lai')
      return
    }

    // Tính checkOutDate và checkOutTime
    let finalCheckOutDate = checkOut
    let finalCheckOutTime = checkOutTime
    
    if (bookingType === 'overnight') {
      // Tạo Date ở local timezone để tránh timezone issues
      const [year, month, day] = checkIn.split('-').map(Number)
      const checkInDate = new Date(year, month - 1, day)
      const nextDay = new Date(checkInDate)
      nextDay.setDate(nextDay.getDate() + 1)
      // Format lại thành YYYY-MM-DD (local timezone)
      const nextYear = nextDay.getFullYear()
      const nextMonth = String(nextDay.getMonth() + 1).padStart(2, '0')
      const nextDayStr = String(nextDay.getDate()).padStart(2, '0')
      finalCheckOutDate = `${nextYear}-${nextMonth}-${nextDayStr}`
      finalCheckOutTime = '12:00'
    } else if (bookingType === 'hourly') {
      if (checkIn && checkInTime && hours) {
        try {
          const [hoursStr, minutesStr] = checkInTime.split(':')
          const checkInHours = parseInt(hoursStr, 10)
          const checkInMinutes = parseInt(minutesStr, 10)
          
          // Tạo Date ở local timezone để tránh timezone issues
          const [year, month, day] = checkIn.split('-').map(Number)
          const checkInDateTime = new Date(year, month - 1, day, checkInHours, checkInMinutes, 0, 0)
          
          const checkOutDateTime = new Date(checkInDateTime)
          checkOutDateTime.setHours(checkOutDateTime.getHours() + hours)
          
          // Format lại thành YYYY-MM-DD (local timezone)
          const checkOutYear = checkOutDateTime.getFullYear()
          const checkOutMonth = String(checkOutDateTime.getMonth() + 1).padStart(2, '0')
          const checkOutDay = String(checkOutDateTime.getDate()).padStart(2, '0')
          finalCheckOutDate = `${checkOutYear}-${checkOutMonth}-${checkOutDay}`
          
          const checkOutHours = checkOutDateTime.getHours().toString().padStart(2, '0')
          const checkOutMinutes = checkOutDateTime.getMinutes().toString().padStart(2, '0')
          finalCheckOutTime = `${checkOutHours}:${checkOutMinutes}`
        } catch (error) {
          console.error('Error calculating checkout time:', error)
        }
      }
    }

    const bookingData = {
      userId: isGuest ? null : selectedUser?._id,
      guestInfo: isGuest ? guestInfo : null,
      room: selectedRoom._id,
      bookingType,
      checkInDate: checkIn,
      checkInTime,
      checkOutDate: finalCheckOutDate,
      checkOutTime: finalCheckOutTime,
      hours: bookingType === 'hourly' ? hours : 1,
      adults,
      children,
      amenities: selectedAmenities,
      services: bookingType === 'hourly' ? [] : selectedServices,
      roomPrice: calculateRoomPrice(),
      amenitiesPrice: calculateAmenitiesPrice(),
      servicesPrice: calculateServicesPrice(),
      totalPrice: calculateTotal()
    }

    try {
      const response = await api.post('/bookings/admin/create', bookingData)
      alert('Đặt phòng thành công!')
      navigate('/admin/bookings')
    } catch (error) {
      alert(error.response?.data?.message || 'Không thể tạo đặt phòng')
      console.error(error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link to="/admin" className="text-primary hover:text-primary/80 mb-4 inline-block">
            ← Quay lại Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Đặt Phòng Cho Khách</h1>
          <p className="mt-2 text-gray-600">Tạo đặt phòng cho người dùng hoặc khách vãng lai</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* User Selection */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Thông Tin Khách</h2>
            
            <div className="mb-4">
              <label className="flex items-center gap-2 mb-2">
                <input
                  type="radio"
                  checked={!isGuest}
                  onChange={() => {
                    setIsGuest(false)
                    setSelectedUser(null)
                    setGuestInfo({ fullName: '', phone: '', email: '' })
                  }}
                />
                <span>Người dùng đã đăng ký</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={isGuest}
                  onChange={() => {
                    setIsGuest(true)
                    setSelectedUser(null)
                    setSearchQuery('')
                  }}
                />
                <span>Khách vãng lai</span>
              </label>
            </div>

            {!isGuest ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tìm kiếm người dùng
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    searchUser(e.target.value)
                  }}
                  placeholder="Nhập tên, email hoặc số điện thoại..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                />
                {searchUsers.length > 0 && (
                  <div className="mt-2 border border-gray-200 rounded-lg max-h-48 overflow-y-auto">
                    {searchUsers.map((u) => (
                      <div
                        key={u._id}
                        onClick={() => {
                          setSelectedUser(u)
                          setSearchQuery(`${u.fullName || u.username} (${u.email})`)
                          setSearchUsers([])
                        }}
                        className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                      >
                        <p className="font-medium">{u.fullName || u.username}</p>
                        <p className="text-sm text-gray-600">{u.email}</p>
                        {u.phone && <p className="text-sm text-gray-600">{u.phone}</p>}
                      </div>
                    ))}
                  </div>
                )}
                {selectedUser && (
                  <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm font-medium text-green-800">
                      Đã chọn: {selectedUser.fullName || selectedUser.username} ({selectedUser.email})
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Họ và Tên <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={guestInfo.fullName}
                    onChange={(e) => setGuestInfo({ ...guestInfo, fullName: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Số Điện Thoại <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={guestInfo.phone}
                    onChange={(e) => setGuestInfo({ ...guestInfo, phone: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email (Tùy chọn)
                  </label>
                  <input
                    type="email"
                    value={guestInfo.email}
                    onChange={(e) => setGuestInfo({ ...guestInfo, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Room Selection */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Chọn Phòng</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rooms.map((room) => (
                <div
                  key={room._id}
                  onClick={() => setSelectedRoom(room)}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedRoom?._id === room._id
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">Phòng {room.roomNumber}</h3>
                    <span className={`px-2 py-1 rounded text-xs ${
                      room.status === 'Available' ? 'bg-green-100 text-green-800' :
                      room.status === 'Occupied' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {room.status === 'Available' ? 'Trống' :
                       room.status === 'Occupied' ? 'Đã Thuê' : 'Bẩn'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{room.type?.name || 'N/A'}</p>
                  <p className="text-sm text-gray-600">{room.category?.name || 'N/A'}</p>
                </div>
              ))}
            </div>
            {selectedRoom && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-medium text-blue-800">
                  Đã chọn: Phòng {selectedRoom.roomNumber} - {selectedRoom.type?.name}
                </p>
              </div>
            )}
          </div>

          {/* Booking Details - Tương tự RoomDetail */}
          {selectedRoom && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Chi Tiết Đặt Phòng</h2>
              
              {/* Booking Type */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Loại Thuê</label>
                <select
                  value={bookingType}
                  onChange={(e) => {
                    setBookingType(e.target.value)
                    if (e.target.value === 'hourly') {
                      setHours(1)
                      setSelectedServices([])
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                >
                  <option value="hourly">Theo Giờ</option>
                  <option value="overnight">Qua Đêm</option>
                  <option value="daily">Theo Ngày</option>
                </select>
              </div>

              {/* Date/Time Selection - Tương tự RoomDetail */}
              {bookingType === 'hourly' && (
                <div className="space-y-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ngày Nhận Phòng</label>
                    <input
                      type="date"
                      value={checkIn}
                      onChange={(e) => setCheckIn(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Giờ Nhận Phòng</label>
                    <input
                      type="time"
                      value={checkInTime}
                      onChange={(e) => setCheckInTime(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Số Giờ</label>
                    <input
                      type="number"
                      min="1"
                      max="24"
                      value={hours}
                      onChange={(e) => setHours(parseInt(e.target.value) || 1)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                    />
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">
                      <strong>Ngày & Giờ Trả Phòng:</strong>{' '}
                      {(() => {
                        if (!checkIn || !checkInTime || !hours) return 'Vui lòng chọn đầy đủ thông tin'
                        try {
                          const [hoursStr, minutesStr] = checkInTime.split(':')
                          const checkInHours = parseInt(hoursStr, 10)
                          const checkInMinutes = parseInt(minutesStr, 10)
                          
                          const checkInDateTime = new Date(checkIn)
                          checkInDateTime.setHours(checkInHours, checkInMinutes, 0, 0)
                          
                          const checkOutDateTime = new Date(checkInDateTime)
                          checkOutDateTime.setHours(checkOutDateTime.getHours() + hours)
                          
                          const checkOutHours = checkOutDateTime.getHours().toString().padStart(2, '0')
                          const checkOutMinutes = checkOutDateTime.getMinutes().toString().padStart(2, '0')
                          
                          return `${checkOutDateTime.toLocaleDateString('vi-VN')} lúc ${checkOutHours}:${checkOutMinutes}`
                        } catch (error) {
                          return 'Lỗi tính toán'
                        }
                      })()}
                    </p>
                  </div>
                </div>
              )}

              {bookingType === 'overnight' && (
                <div className="space-y-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ngày Nhận Phòng</label>
                    <input
                      type="date"
                      value={checkIn}
                      onChange={(e) => setCheckIn(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Giờ Nhận Phòng</label>
                    <input
                      type="time"
                      value={checkInTime}
                      onChange={(e) => setCheckInTime(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                    />
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">
                      <strong>Ngày Trả Phòng:</strong>{' '}
                      {(() => {
                        const checkInDate = new Date(checkIn)
                        const nextDay = new Date(checkInDate)
                        nextDay.setDate(nextDay.getDate() + 1)
                        return nextDay.toLocaleDateString('vi-VN') + ' lúc 12:00'
                      })()}
                    </p>
                  </div>
                </div>
              )}

              {bookingType === 'daily' && (
                <div className="space-y-4 mb-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Ngày Nhận</label>
                      <input
                        type="date"
                        value={checkIn}
                        onChange={(e) => setCheckIn(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Ngày Trả</label>
                      <input
                        type="date"
                        value={checkOut}
                        onChange={(e) => setCheckOut(e.target.value)}
                        min={checkIn || new Date().toISOString().split('T')[0]}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Giờ Nhận</label>
                      <input
                        type="time"
                        value={checkInTime}
                        onChange={(e) => setCheckInTime(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Giờ Trả</label>
                      <input
                        type="time"
                        value={checkOutTime}
                        onChange={(e) => setCheckOutTime(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Guests */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số Người Lớn
                  {selectedRoom?.type?.maxAdults && (
                    <span className="text-xs text-gray-500 ml-2">(Tối đa: {selectedRoom.type.maxAdults})</span>
                  )}
                </label>
                <input
                  type="number"
                  min="1"
                  max={selectedRoom?.type?.maxAdults || 10}
                  value={adults}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 1
                    const max = selectedRoom?.type?.maxAdults || 10
                    setAdults(Math.min(value, max))
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số Trẻ Em
                  {selectedRoom?.type?.maxChildren !== undefined && (
                    <span className="text-xs text-gray-500 ml-2">(Tối đa: {selectedRoom.type.maxChildren})</span>
                  )}
                </label>
                <input
                  type="number"
                  min="0"
                  max={selectedRoom?.type?.maxChildren || 5}
                  value={children}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 0
                    const max = selectedRoom?.type?.maxChildren || 5
                    setChildren(Math.min(value, max))
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                />
              </div>

              {/* Amenities */}
              {selectedRoom.amenities && selectedRoom.amenities.length > 0 && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tiện Ích (Có Phí)</label>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {selectedRoom.amenities
                      .filter(amenity => amenity.price && amenity.price > 0)
                      .map((amenity) => {
                        const amenityId = amenity._id || amenity
                        const isSelected = selectedAmenities.includes(amenityId)
                        return (
                          <div
                            key={amenityId}
                            onClick={() => toggleAmenity(amenityId)}
                            className={`p-3 border rounded-lg cursor-pointer ${
                              isSelected ? 'border-primary bg-primary/5' : 'border-gray-200'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span>{amenity.name}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-sm">{formatPrice(amenity.price)}</span>
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => {}}
                                  className="w-4 h-4"
                                />
                              </div>
                            </div>
                          </div>
                        )
                      })}
                  </div>
                </div>
              )}

              {/* Services */}
              {(bookingType === 'daily' || bookingType === 'overnight') && services.length > 0 && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Dịch Vụ</label>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {services.map((service) => {
                      const isSelected = selectedServices.includes(service._id)
                      return (
                        <div
                          key={service._id}
                          onClick={() => toggleService(service._id)}
                          className={`p-3 border rounded-lg cursor-pointer ${
                            isSelected ? 'border-primary bg-primary/5' : 'border-gray-200'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span>{service.name}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm">{formatPrice(service.price)}</span>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {}}
                                className="w-4 h-4"
                              />
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Price Summary */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Tiền phòng:</span>
                    <span>{formatPrice(calculateRoomPrice())}</span>
                  </div>
                  {calculateAmenitiesPrice() > 0 && (
                    <div className="flex justify-between">
                      <span>Tiện ích:</span>
                      <span>{formatPrice(calculateAmenitiesPrice())}</span>
                    </div>
                  )}
                  {calculateServicesPrice() > 0 && (
                    <div className="flex justify-between">
                      <span>Dịch vụ:</span>
                      <span>{formatPrice(calculateServicesPrice())}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Tổng cộng:</span>
                    <span className="text-primary">{formatPrice(calculateTotal())}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={!selectedRoom || (!isGuest && !selectedUser) || (isGuest && !guestInfo.fullName)}
              className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
            >
              Tạo Đặt Phòng
            </button>
            <Link
              to="/admin/bookings"
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
            >
              Hủy
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AdminCreateBooking
