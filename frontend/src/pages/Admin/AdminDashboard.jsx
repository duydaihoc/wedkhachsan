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
  const [availableRooms, setAvailableRooms] = useState([])
  const [showChangeRoomModal, setShowChangeRoomModal] = useState(false)
  const [selectedNewRoom, setSelectedNewRoom] = useState('')
  const [selectedBookingForChange, setSelectedBookingForChange] = useState(null)
  const [checkingIn, setCheckingIn] = useState(null)
  const [checkInError, setCheckInError] = useState('')
  const [checkInSuccess, setCheckInSuccess] = useState('')
  const [showCheckInConfirmModal, setShowCheckInConfirmModal] = useState(false)
  const [pendingCheckIn, setPendingCheckIn] = useState(null)
  const [earlierBookingInfo, setEarlierBookingInfo] = useState(null)
  const [showRoomOccupiedModal, setShowRoomOccupiedModal] = useState(false)
  const [roomOccupiedError, setRoomOccupiedError] = useState(null)

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

  const handleCheckIn = async (bookingId, e, force = false) => {
    e?.stopPropagation() // Ngăn click event bubble lên div cha
    if (!bookingId) return

    try {
      setCheckingIn(bookingId)
      setCheckInError('')
      setCheckInSuccess('')

      await api.put(`/bookings/${bookingId}/status`, {
        status: 'checked-in',
        force: force
      })

      setCheckInSuccess('Đã nhận phòng thành công')
      fetchData() // Refresh data

      setTimeout(() => {
        setCheckInSuccess('')
      }, 3000)
    } catch (error) {
      // Xử lý trường hợp có booking sớm hơn (409 Conflict)
      if (error.response?.status === 409 && error.response?.data?.requiresConfirmation) {
        setEarlierBookingInfo(error.response.data.earlierBooking)
        setPendingCheckIn({
          bookingId,
          currentBooking: error.response.data.currentBooking
        })
        setShowCheckInConfirmModal(true)
        setCheckingIn(null)
        return
      }

      // Xử lý trường hợp phòng đã được thuê (400 Bad Request)
      if (error.response?.status === 400) {
        const errorMessage = error.response?.data?.message || 'Không thể nhận phòng'
        // Kiểm tra xem có phải lỗi phòng đã được thuê không
        if (errorMessage.includes('đang được sử dụng') ||
          errorMessage.includes('đã được thuê') ||
          errorMessage.includes('đang được sử dụng bởi booking')) {
          setRoomOccupiedError({
            message: errorMessage,
            bookingId: bookingId
          })
          setShowRoomOccupiedModal(true)
          setCheckingIn(null)
          return
        }
      }

      setCheckInError(error.response?.data?.message || 'Không thể nhận phòng')
      setTimeout(() => {
        setCheckInError('')
      }, 5000)
    } finally {
      if (!showCheckInConfirmModal && !showRoomOccupiedModal) {
        setCheckingIn(null)
      }
    }
  }

  const handleConfirmEarlyCheckIn = async () => {
    if (!pendingCheckIn) return

    try {
      setCheckingIn(pendingCheckIn.bookingId)
      setShowCheckInConfirmModal(false)

      await api.put(`/bookings/${pendingCheckIn.bookingId}/status`, {
        status: 'checked-in',
        force: true // Force check-in sau khi admin xác nhận
      })

      setCheckInSuccess('Đã nhận phòng thành công')
      fetchData() // Refresh data

      setTimeout(() => {
        setCheckInSuccess('')
      }, 3000)
    } catch (error) {
      setCheckInError(error.response?.data?.message || 'Không thể nhận phòng')
      setTimeout(() => {
        setCheckInError('')
      }, 5000)
    } finally {
      setCheckingIn(null)
      setPendingCheckIn(null)
      setEarlierBookingInfo(null)
    }
  }

  const handleCancelEarlyCheckIn = () => {
    setShowCheckInConfirmModal(false)
    setPendingCheckIn(null)
    setEarlierBookingInfo(null)
    setCheckingIn(null)
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

  const handleChangeRoomClick = async (booking) => {
    try {
      // Fetch available rooms (đã được tối ưu)
      const response = await api.get(`/bookings/${booking._id}/available-rooms`)
      setAvailableRooms(response.data)
      setSelectedBookingForChange(booking)
      setShowChangeRoomModal(true)
    } catch (error) {
      console.error('Không thể tải danh sách phòng:', error)
      alert('Không thể tải danh sách phòng')
    }
  }

  const handleChangeRoom = async () => {
    if (!selectedNewRoom || !selectedBookingForChange) return

    try {
      setUpdatingStatus(true)
      const response = await api.put(`/bookings/${selectedBookingForChange._id}/change-room`, {
        newRoomId: selectedNewRoom
      })

      // Kiểm tra xem có hoàn tiền không
      if (response.data.refundInfo) {
        alert(`Đã đổi phòng thành công!\n\n${response.data.refundInfo.message}`)
      } else {
        alert('Đã đổi phòng thành công!')
      }

      // Refresh data
      await fetchData()

      // Close modal
      setShowChangeRoomModal(false)
      setShowModal(false)
      setSelectedNewRoom('')
      setSelectedBookingForChange(null)
    } catch (error) {
      console.error('Lỗi đổi phòng:', error)
      alert(error.response?.data?.message || 'Không thể đổi phòng')
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


  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price)
  }

  const printInvoice = (booking) => {
    const invoiceWindow = window.open('', '_blank')
    const invoiceHTML = generateInvoiceHTML(booking)
    invoiceWindow.document.write(invoiceHTML)
    invoiceWindow.document.close()
    setTimeout(() => {
      invoiceWindow.print()
    }, 250)
  }

  // Payment Modal States
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedBookingForPayment, setSelectedBookingForPayment] = useState(null)
  const [paymentAmount, setPaymentAmount] = useState(0)
  const [paymentMethodDetail, setPaymentMethodDetail] = useState('cash')

  const openPaymentModal = (booking) => {
    setSelectedBookingForPayment(booking)
    setPaymentAmount(booking.remainingAmount !== undefined ? booking.remainingAmount : booking.totalPrice)
    setPaymentMethodDetail('cash')
    setShowPaymentModal(true)
  }

  const handlePaymentSubmit = async () => {
    if (!selectedBookingForPayment) return
    try {
      setCheckingIn(selectedBookingForPayment._id)

      const response = await api.put(`/bookings/${selectedBookingForPayment._id}/payment`, {
        amount: paymentAmount,
        paymentMethodDetail: paymentMethodDetail
      })

      const updatedBooking = response.data

      setCheckInSuccess('Thanh toán thành công')
      setShowPaymentModal(false)

      // In hóa đơn sau khi thanh toán xong
      setTimeout(() => {
        printInvoice(updatedBooking || selectedBookingForPayment)
      }, 500)

      fetchData()

      setTimeout(() => setCheckInSuccess(''), 3000)
    } catch (error) {
      alert(error.response?.data?.message || 'Lỗi thanh toán')
    } finally {
      setCheckingIn(null)
    }
  }

  const handlePayment = (bookingId, e) => {
    e?.stopPropagation()
    const booking = bookings.find(b => b._id === bookingId)
    if (booking) openPaymentModal(booking)
  }

  const handleCheckOut = async (bookingId, e) => {
    e?.stopPropagation()
    if (!bookingId) return

    if (!window.confirm('Xác nhận trả phòng và in hóa đơn?')) return

    try {
      setCheckingIn(bookingId)
      // Lấy thông tin booking trước khi cập nhật
      const bookingToCheckOut = bookings.find(b => b._id === bookingId)

      await api.put(`/bookings/${bookingId}/status`, {
        status: 'checked-out'
      })

      setCheckInSuccess('Đã trả phòng thành công')

      // In hóa đơn
      setTimeout(() => {
        printInvoice(bookingToCheckOut)
      }, 500)

      fetchData() // Refresh data

      setTimeout(() => {
        setCheckInSuccess('')
      }, 3000)
    } catch (error) {
      setCheckInError(error.response?.data?.message || 'Không thể trả phòng')
      setTimeout(() => {
        setCheckInError('')
      }, 5000)
    } finally {
      setCheckingIn(null)
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

      {/* Payment Modal */}
      {showPaymentModal && selectedBookingForPayment && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 text-charcoal dark:text-white">
          <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 border border-primary/20">
            <div className="p-6 border-b border-black/5 dark:border-white/5 bg-primary/5">
              <h3 className="text-xl font-bold font-serif text-primary">Thanh Toán</h3>
              <p className="text-sm opacity-60">Mã: {selectedBookingForPayment.bookingCode}</p>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest opacity-60 mb-2">Số tiền thanh toán</label>
                <div className="flex items-center bg-background-light dark:bg-white/5 rounded-lg px-4 border border-black/10 dark:border-white/10">
                  <span className="text-base font-bold mr-2 text-primary">₫</span>
                  <input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(Number(e.target.value))}
                    className="w-full py-3 bg-transparent outline-none font-bold text-lg text-charcoal dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest opacity-60 mb-2">Phương thức</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setPaymentMethodDetail('cash')}
                    className={`py-3 rounded-lg text-xs font-bold uppercase tracking-wider border transition-all ${paymentMethodDetail === 'cash'
                      ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                      : 'bg-transparent border-black/10 dark:border-white/10 hover:border-primary/50 text-charcoal/60 dark:text-white/60'
                      }`}
                  >
                    Tiền Mặt
                  </button>
                  <button
                    onClick={() => setPaymentMethodDetail('transfer')}
                    className={`py-3 rounded-lg text-xs font-bold uppercase tracking-wider border transition-all ${paymentMethodDetail === 'transfer'
                      ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                      : 'bg-transparent border-black/10 dark:border-white/10 hover:border-primary/50 text-charcoal/60 dark:text-white/60'
                      }`}
                  >
                    CK
                  </button>
                  <button
                    onClick={() => setPaymentMethodDetail('card')}
                    className={`py-3 rounded-lg text-xs font-bold uppercase tracking-wider border transition-all ${paymentMethodDetail === 'card'
                      ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                      : 'bg-transparent border-black/10 dark:border-white/10 hover:border-primary/50 text-charcoal/60 dark:text-white/60'
                      }`}
                  >
                    Thẻ
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-black/5 dark:border-white/5 flex gap-3 bg-background-light/50 dark:bg-white/5">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 py-3 bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl font-bold uppercase tracking-wider text-xs hover:bg-gray-50 dark:hover:bg-white/10 transition-colors text-charcoal dark:text-white"
              >
                Hủy
              </button>
              <button
                onClick={handlePaymentSubmit}
                className="flex-1 py-3 bg-primary text-white rounded-xl font-bold uppercase tracking-wider text-xs shadow-lg shadow-primary/20 hover:brightness-110 transition-all flex items-center justify-center gap-2"
                disabled={checkingIn === selectedBookingForPayment._id}
              >
                {checkingIn === selectedBookingForPayment._id ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <span className="material-symbols-outlined text-sm">check</span>
                )}
                Xác Nhận
              </button>
            </div>
          </div>
        </div>
      )}

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
              className={`px-6 py-3 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${showRoomGrid
                ? 'bg-primary text-white shadow-lg'
                : 'bg-white dark:bg-charcoal border border-primary/20 text-charcoal dark:text-white hover:border-primary'
                }`}
            >
              <span className="material-symbols-outlined text-sm align-middle mr-2">grid_view</span>
              Sơ Đồ Phòng
            </button>
            <button
              onClick={() => setShowRoomGrid(false)}
              className={`px-6 py-3 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${!showRoomGrid
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
          /* Room Status Grid với danh sách booking kế tiếp */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Sơ đồ phòng - 2 cột */}
            <div className="lg:col-span-2">
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
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
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
            </div>

            {/* Danh sách booking kế tiếp - 1 cột */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-charcoal rounded-xl shadow-luxury border border-primary/10 p-6 sticky top-24">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="serif-heading text-xl font-bold text-charcoal dark:text-white">
                    Booking Kế Tiếp
                  </h3>
                  <span className="material-symbols-outlined text-primary">schedule</span>
                </div>

                {(() => {
                  // Lấy các booking sẽ nhận phòng (loại bỏ đã hoàn thành và đã trả phòng)
                  const now = new Date()
                  const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000)

                  const upcomingBookings = bookings
                    .filter(booking => {
                      // Loại bỏ các booking đã hoàn thành hoặc đã trả phòng (checked-out)
                      // User yêu cầu: Trả phòng là ẩn luôn
                      if (['completed', 'checked-out', 'cancelled'].includes(booking.status)) {
                        return false
                      }

                      if (!booking.checkInDate) return false

                      // Logic hiển thị:
                      // 1. Checked-in: Đang ở
                      // 2. Checked-out + Unpaid: Chờ thanh toán
                      // 3. Confirmed / Payment-pending: Sắp tới
                      // 4. LOẠI BỎ 'pending' (Chưa xác nhận) theo yêu cầu
                      return (
                        booking.status === 'checked-in' ||
                        (booking.status === 'checked-out' && booking.paymentStatus !== 'paid') ||
                        ['confirmed', 'payment-pending'].includes(booking.status)
                      )
                    })
                    .sort((a, b) => {
                      const dateA = new Date(`${new Date(a.checkInDate).toISOString().split('T')[0]}T${a.checkInTime || '00:00'}`)
                      const dateB = new Date(`${new Date(b.checkInDate).toISOString().split('T')[0]}T${b.checkInTime || '00:00'}`)
                      return dateA - dateB
                    })
                    .slice(0, 100) // Tăng giới hạn hiển thị để không bị sót

                  if (upcomingBookings.length === 0) {
                    return (
                      <div className="text-center py-8">
                        <span className="material-symbols-outlined text-4xl text-charcoal/20 dark:text-white/20 mb-2">event_busy</span>
                        <p className="text-sm text-charcoal/60 dark:text-white/60">Không có booking sắp tới</p>
                      </div>
                    )
                  }

                  return (
                    <div className="space-y-3 max-h-[calc(100vh-250px)] overflow-y-auto">
                      {upcomingBookings.map((booking) => {
                        const checkInDate = new Date(booking.checkInDate)
                        const checkInDateTime = new Date(`${checkInDate.toISOString().split('T')[0]}T${booking.checkInTime || '00:00'}`)
                        const isToday = checkInDate.toDateString() === now.toDateString()
                        const isSoon = checkInDateTime <= new Date(now.getTime() + 2 * 60 * 60 * 1000) // Trong 2 giờ tới

                        const getStatusBadge = (status) => {
                          if (status === 'checked-in') return { text: 'Đã Nhận', color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' }
                          if (status === 'confirmed') return { text: 'Đã Xác Nhận', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' }
                          if (status === 'pending') return { text: 'Chờ Xác Nhận', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' }
                          if (status === 'payment-pending') return { text: 'Chờ Thanh Toán', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400' }
                          return { text: status, color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400' }
                        }

                        const statusBadge = getStatusBadge(booking.status)

                        return (
                          <div
                            key={booking._id}
                            className={`p-4 rounded-lg border transition-all hover:shadow-md cursor-pointer ${isSoon
                              ? 'bg-primary/5 border-primary/30 dark:bg-primary/10'
                              : 'bg-background-light dark:bg-background-dark border-charcoal/10 dark:border-white/10'
                              }`}
                            onClick={() => {
                              setSelectedRoom(booking.room)
                              setShowModal(true)
                            }}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-sm font-bold text-charcoal dark:text-white">
                                    Phòng {booking.room?.roomNumber || 'N/A'}
                                  </span>
                                  {isSoon && (
                                    <span className="material-symbols-outlined text-primary text-sm animate-pulse">schedule</span>
                                  )}
                                </div>
                                <p className="text-xs text-charcoal/60 dark:text-white/60 mb-2">
                                  {booking.user?.fullName || booking.user?.username || 'Khách'}
                                </p>
                              </div>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusBadge.color}`}>
                                {statusBadge.text}
                              </span>
                            </div>

                            <div className="space-y-1 text-xs">
                              <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary text-sm">login</span>
                                <span className="text-charcoal dark:text-white">
                                  <span className="font-medium">
                                    {isToday ? 'Hôm nay' : new Date(booking.checkInDate).toLocaleDateString('vi-VN', {
                                      day: '2-digit',
                                      month: '2-digit',
                                      year: 'numeric'
                                    })}
                                  </span>
                                  {' '}
                                  <span className="text-charcoal/60 dark:text-white/60">{booking.checkInTime}</span>
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary text-sm">logout</span>
                                <span className="text-charcoal dark:text-white">
                                  <span className="font-medium">
                                    {new Date(booking.checkOutDate).toLocaleDateString('vi-VN', {
                                      day: '2-digit',
                                      month: '2-digit',
                                      year: 'numeric'
                                    })}
                                  </span>
                                  {' '}
                                  <span className="text-charcoal/60 dark:text-white/60">{booking.checkOutTime}</span>
                                </span>
                              </div>
                              {booking.bookingCode && (
                                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-charcoal/5 dark:border-white/5">
                                  <span className="material-symbols-outlined text-primary text-sm">confirmation_number</span>
                                  <span className="font-mono text-[10px] text-charcoal/60 dark:text-white/60">
                                    {booking.bookingCode}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Actions: Nhận Phòng / Trả Phòng / Thanh Toán */}
                            {(() => {
                              // Logic Check-in:
                              const canCheckIn = (booking.status === 'confirmed' || booking.status === 'pending') &&
                                (booking.paymentMethod === 'cash' ||
                                  (booking.paymentMethod === 'online' && booking.bookingConfirmed))

                              // Logic Check-out:
                              const canCheckOut = booking.status === 'checked-in'

                              // Logic Payment:
                              const canPayment = booking.status === 'checked-out' && booking.paymentStatus !== 'paid'

                              if (!canCheckIn && !canCheckOut && !canPayment) return null

                              return (
                                <div className="mt-3 pt-3 border-t border-charcoal/10 dark:border-white/10">
                                  {checkInError && checkingIn === booking._id && (
                                    <p className="text-xs text-red-600 dark:text-red-400 mb-2">{checkInError}</p>
                                  )}
                                  {checkInSuccess && checkingIn === booking._id && (
                                    <p className="text-xs text-green-600 dark:text-green-400 mb-2">{checkInSuccess}</p>
                                  )}

                                  {canCheckIn && (
                                    <button
                                      onClick={(e) => handleCheckIn(booking._id, e)}
                                      disabled={checkingIn === booking._id}
                                      className="w-full py-2 px-3 bg-primary hover:bg-primary/90 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                      {checkingIn === booking._id ? (
                                        <>
                                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                          <span>Đang xử lý...</span>
                                        </>
                                      ) : (
                                        <>
                                          <span className="material-symbols-outlined text-sm">login</span>
                                          <span>Nhận Phòng</span>
                                        </>
                                      )}
                                    </button>
                                  )}

                                  {canCheckOut && (
                                    <button
                                      onClick={(e) => handleCheckOut(booking._id, e)}
                                      disabled={checkingIn === booking._id}
                                      className="w-full py-2 px-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                      {checkingIn === booking._id ? (
                                        <>
                                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                          <span>Đang xử lý...</span>
                                        </>
                                      ) : (
                                        <>
                                          <span className="material-symbols-outlined text-sm">logout</span>
                                          <span>Trả Phòng</span>
                                        </>
                                      )}
                                    </button>
                                  )}

                                  {canPayment && (
                                    <button
                                      onClick={(e) => handlePayment(booking._id, e)}
                                      disabled={checkingIn === booking._id}
                                      className="w-full py-2 px-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                      {checkingIn === booking._id ? (
                                        <>
                                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                          <span>Đang xử lý...</span>
                                        </>
                                      ) : (
                                        <>
                                          <span className="material-symbols-outlined text-sm">payments</span>
                                          <span>Thanh Toán</span>
                                        </>
                                      )}
                                    </button>
                                  )}
                                </div>
                              )
                            })()}
                          </div>
                        )
                      })}
                    </div>
                  )
                })()}
              </div>
            </div>
          </div>
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
                        className={`py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${selectedRoom.status === 'Available'
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
                        className={`py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${selectedRoom.status === 'Dirty'
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
                        className={`py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${selectedRoom.status === 'Maintenance'
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

                  {/* Change Room Button - Only show for Available rooms */}
                  {selectedRoom.status === 'Available' && (() => {
                    // Tìm booking của phòng này
                    const roomBooking = bookings.find(b =>
                      (b.room?._id === selectedRoom._id || b.room === selectedRoom._id) &&
                      ['confirmed', 'checked-in'].includes(b.status)
                    )

                    if (roomBooking) {
                      return (
                        <div className="mt-4 pt-4 border-t border-primary/10">
                          <button
                            onClick={() => handleChangeRoomClick(roomBooking)}
                            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                          >
                            <span className="material-symbols-outlined text-sm">swap_horiz</span>
                            Đổi Phòng Cho Booking Này
                          </button>
                        </div>
                      )
                    }
                    return null
                  })()}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Change Room Modal */}
      {showChangeRoomModal && selectedBookingForChange && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-charcoal rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-primary/10 flex justify-between items-center">
              <div>
                <h4 className="font-bold text-xl text-charcoal dark:text-white mb-1">
                  Đổi Phòng
                </h4>
                <p className="text-xs text-charcoal/60 dark:text-white/60">
                  Booking: {selectedBookingForChange.bookingCode}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowChangeRoomModal(false)
                  setSelectedNewRoom('')
                  setSelectedBookingForChange(null)
                }}
                className="size-8 rounded-full hover:bg-charcoal/10 dark:hover:bg-white/10 flex items-center justify-center transition-colors"
              >
                <span className="material-symbols-outlined text-charcoal/60 dark:text-white/60">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-300 flex items-start gap-2">
                  <span className="material-symbols-outlined text-base">info</span>
                  <span>
                    <strong>Phòng hiện tại:</strong> Phòng {selectedRoom?.roomNumber}<br />
                    <strong>Khách:</strong> {selectedBookingForChange.user?.fullName || selectedBookingForChange.user?.username}
                  </span>
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-xs font-bold uppercase tracking-widest text-charcoal/60 dark:text-white/60 mb-2">
                  Chọn Phòng Mới
                </label>
                <select
                  value={selectedNewRoom}
                  onChange={(e) => setSelectedNewRoom(e.target.value)}
                  className="w-full px-4 py-3 border border-charcoal/20 dark:border-white/20 rounded-lg bg-background-light dark:bg-background-dark text-charcoal dark:text-white focus:ring-2 focus:ring-primary focus:border-primary"
                  disabled={updatingStatus}
                >
                  <option value="">-- Chọn phòng (đã được tối ưu) --</option>
                  {availableRooms.map((room, index) => (
                    <option key={room._id} value={room._id}>
                      {index === 0 && '⭐ '}
                      Phòng {room.roomNumber} - {room.type?.name} - {room.category?.name} - {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(room.estimatedPrice || room.price?.daily || 0)}
                      {room.status === 'Available' ? ' (Sẵn sàng)' : ' (Cần dọn)'}
                    </option>
                  ))}
                </select>
                {availableRooms.length === 0 && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                    Không có phòng trống nào khả dụng
                  </p>
                )}
              </div>

              {selectedNewRoom && (
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                  <p className="text-sm text-amber-800 dark:text-amber-300 flex items-start gap-2">
                    <span className="material-symbols-outlined text-base">warning</span>
                    <span>
                      Giá phòng và tổng tiền sẽ được tính lại tự động dựa trên giá phòng mới.
                      Số tiền còn lại cũng sẽ được cập nhật.
                    </span>
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-primary/10 flex gap-3">
              <button
                onClick={() => {
                  setShowChangeRoomModal(false)
                  setSelectedNewRoom('')
                  setSelectedBookingForChange(null)
                }}
                disabled={updatingStatus}
                className="flex-1 bg-charcoal/10 hover:bg-charcoal/20 dark:bg-white/10 dark:hover:bg-white/20 text-charcoal dark:text-white py-3 rounded-lg text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={handleChangeRoom}
                disabled={!selectedNewRoom || updatingStatus}
                className="flex-1 bg-primary hover:bg-primary/90 text-white py-3 rounded-lg text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updatingStatus ? 'Đang Xử Lý...' : 'Xác Nhận Đổi Phòng'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Xác Nhận Check-in Sớm */}
      {showCheckInConfirmModal && earlierBookingInfo && pendingCheckIn && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-charcoal rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-primary/10">
              <div className="flex items-center gap-3 mb-2">
                <div className="size-12 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center">
                  <span className="material-symbols-outlined text-yellow-600 dark:text-yellow-400 text-2xl">warning</span>
                </div>
                <div>
                  <h4 className="font-bold text-xl text-charcoal dark:text-white">
                    Cảnh Báo
                  </h4>
                  <p className="text-xs text-charcoal/60 dark:text-white/60">
                    Có booking sớm hơn chưa nhận phòng
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <p className="text-sm text-yellow-800 dark:text-yellow-300 mb-3">
                  Có một booking khác ở cùng phòng với thời gian check-in <strong>sớm hơn</strong> nhưng <strong>chưa nhận phòng</strong>:
                </p>

                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-yellow-600 dark:text-yellow-400 text-sm mt-0.5">confirmation_number</span>
                    <div>
                      <span className="font-medium text-charcoal dark:text-white">Mã Booking:</span>
                      <span className="ml-2 font-mono text-yellow-800 dark:text-yellow-300">{earlierBookingInfo.bookingCode}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-yellow-600 dark:text-yellow-400 text-sm mt-0.5">person</span>
                    <div>
                      <span className="font-medium text-charcoal dark:text-white">Khách hàng:</span>
                      <span className="ml-2 text-yellow-800 dark:text-yellow-300">{earlierBookingInfo.guestName}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-yellow-600 dark:text-yellow-400 text-sm mt-0.5">schedule</span>
                    <div>
                      <span className="font-medium text-charcoal dark:text-white">Check-in:</span>
                      <span className="ml-2 text-yellow-800 dark:text-yellow-300">{earlierBookingInfo.checkInDisplay}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 mt-3 pt-3 border-t border-yellow-200 dark:border-yellow-800">
                    <span className="material-symbols-outlined text-primary text-sm mt-0.5">login</span>
                    <div>
                      <span className="font-medium text-charcoal dark:text-white">Booking hiện tại check-in:</span>
                      <span className="ml-2 text-primary font-medium">{pendingCheckIn.currentBooking.checkInDisplay}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  <strong>Bạn có muốn cho booking này nhận phòng sớm không?</strong>
                  <br />
                  <span className="text-xs mt-1 block">Booking sớm hơn vẫn chưa nhận phòng, bạn có thể cho booking này nhận phòng trước.</span>
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-primary/10 flex gap-3">
              <button
                onClick={handleCancelEarlyCheckIn}
                disabled={checkingIn === pendingCheckIn?.bookingId}
                className="flex-1 bg-charcoal/10 hover:bg-charcoal/20 dark:bg-white/10 dark:hover:bg-white/20 text-charcoal dark:text-white py-3 rounded-lg text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmEarlyCheckIn}
                disabled={checkingIn === pendingCheckIn?.bookingId}
                className="flex-1 bg-primary hover:bg-primary/90 text-white py-3 rounded-lg text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {checkingIn === pendingCheckIn?.bookingId ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Đang xử lý...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-sm">check_circle</span>
                    <span>Xác Nhận Nhận Phòng</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cảnh Báo Phòng Đã Được Thuê */}
      {showRoomOccupiedModal && roomOccupiedError && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-charcoal rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-primary/10">
              <div className="flex items-center gap-3 mb-2">
                <div className="size-12 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                  <span className="material-symbols-outlined text-red-600 dark:text-red-400 text-2xl">error</span>
                </div>
                <div>
                  <h4 className="font-bold text-xl text-charcoal dark:text-white">
                    Phòng Đã Được Thuê
                  </h4>
                  <p className="text-xs text-charcoal/60 dark:text-white/60">
                    Không thể nhận phòng
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-800 dark:text-red-300">
                  {roomOccupiedError.message}
                </p>
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  <strong>Lưu ý:</strong> Vui lòng đợi khách hàng hiện tại trả phòng (check-out) trước khi cho booking khác nhận phòng.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-primary/10 flex justify-end">
              <button
                onClick={() => {
                  setShowRoomOccupiedModal(false)
                  setRoomOccupiedError(null)
                  setCheckingIn(null)
                }}
                className="px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg text-xs font-bold uppercase tracking-widest transition-all"
              >
                Đã Hiểu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const generateInvoiceHTML = (booking) => {
  const totalNights = Math.ceil((new Date(booking.checkOutDate) - new Date(booking.checkInDate)) / (1000 * 60 * 60 * 24)) || 1

  // Format helpers for independent function
  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price)
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Hóa Đơn - ${booking.bookingCode}</title>
        <style>
          @media print {
            @page { margin: 1cm; }
            body { margin: 0; }
          }
          body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            text-align: center;
            border-bottom: 3px solid #bea06a;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 32px;
            font-weight: bold;
            color: #bea06a;
            margin-bottom: 5px;
          }
          .subtitle {
            font-size: 14px;
            color: #666;
          }
          .invoice-title {
            font-size: 24px;
            font-weight: bold;
            margin: 20px 0;
          }
          .info-section {
            margin-bottom: 30px;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #eee;
          }
          .label {
            font-weight: bold;
            color: #666;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          th {
            background-color: #bea06a;
            color: white;
            padding: 12px;
            text-align: left;
          }
          td {
            padding: 10px 12px;
            border-bottom: 1px solid #eee;
          }
          .total-row {
            font-weight: bold;
            font-size: 18px;
            background-color: #f9f9f9;
          }
          .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 12px;
            color: #666;
            border-top: 2px solid #eee;
            padding-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">AURELIUS GRAND</div>
          <div class="subtitle">Luxury Hotel & Resort</div>
        </div>
        
        <div class="invoice-title">HÓA ĐƠN THANH TOÁN</div>
        
        <div class="info-section">
          <div class="info-row">
            <span class="label">Mã đặt phòng:</span>
            <span>${booking.bookingCode}</span>
          </div>
          <div class="info-row">
            <span class="label">Ngày in:</span>
            <span>${new Date().toLocaleString('vi-VN')}</span>
          </div>
          <div class="info-row">
            <span class="label">Khách hàng:</span>
            <span>${booking.user?.fullName || booking.user?.username || 'Khách vãng lai'}</span>
          </div>
          <div class="info-row">
            <span class="label">Số điện thoại:</span>
            <span>${booking.user?.phone || 'N/A'}</span>
          </div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Mô tả</th>
              <th style="text-align: center;">Số lượng</th>
              <th style="text-align: right;">Đơn giá</th>
              <th style="text-align: right;">Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <strong>Phòng ${booking.room?.roomNumber}</strong><br>
                <small>${booking.room?.type?.name || ''}</small><br>
                <small>Nhận: ${formatDate(booking.checkInDate)} ${booking.checkInTime}</small><br>
                <small>Trả: ${formatDate(booking.checkOutDate)} ${booking.checkOutTime}</small>
              </td>
              <td style="text-align: center;">${totalNights} ${booking.bookingType === 'hourly' ? 'giờ' : 'đêm'}</td>
              <td style="text-align: right;">${formatPrice(booking.roomPrice)}</td>
              <td style="text-align: right;">${formatPrice(booking.roomPrice)}</td>
            </tr>
            ${booking.amenitiesPrice > 0 ? `
            <tr>
              <td>Tiện ích</td>
              <td style="text-align: center;">-</td>
              <td style="text-align: right;">-</td>
              <td style="text-align: right;">${formatPrice(booking.amenitiesPrice)}</td>
            </tr>
            ` : ''}
            ${booking.servicesPrice > 0 ? `
            <tr>
              <td>Dịch vụ</td>
              <td style="text-align: center;">-</td>
              <td style="text-align: right;">-</td>
              <td style="text-align: right;">${formatPrice(booking.servicesPrice)}</td>
            </tr>
            ` : ''}
            <tr class="total-row">
              <td colspan="3" style="text-align: right;">Tổng cộng:</td>
              <td style="text-align: right;">${formatPrice(booking.totalPrice)}</td>
            </tr>
          </tbody>
        </table>
        
        <div class="footer">
          <p><strong>Cảm ơn quý khách đã sử dụng dịch vụ của chúng tôi!</strong></p>
          <p>Aurelius Grand Hotel | Hotline: 1900-xxxx | Email: info@aureliusgrand.com</p>
        </div>
      </body>
      </html>
    `
}

export default AdminDashboard

