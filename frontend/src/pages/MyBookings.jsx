import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import socket from '../services/socket'

const MyBookings = () => {
  const { user, logout } = useAuth()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [filterStatus, setFilterStatus] = useState('all')

  useEffect(() => {
    fetchBookings()
  }, [])

  // Lắng nghe thông báo real-time về cập nhật booking
  useEffect(() => {
    socket.on('booking-updated', (data) => {
      // Cập nhật booking trong danh sách
      setBookings((prev) =>
        prev.map((booking) =>
          booking._id === data.booking._id ? data.booking : booking
        )
      )
    })

    return () => {
      socket.off('booking-updated')
    }
  }, [])

  const fetchBookings = async () => {
    try {
      setLoading(true)
      const response = await api.get('/bookings/mybookings')
      setBookings(response.data)
    } catch (error) {
      console.error('Không thể tải lịch sử đặt phòng:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetails = (booking) => {
    setSelectedBooking(booking)
    setShowModal(true)
  }

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { text: 'Chờ Xác Nhận', color: 'bg-yellow-100 text-yellow-800' },
      confirmed: { text: 'Đã Xác Nhận', color: 'bg-blue-100 text-blue-800' },
      'checked-in': { text: 'Đã Nhận Phòng', color: 'bg-green-100 text-green-800' },
      'checked-out': { text: 'Đã Trả Phòng', color: 'bg-orange-100 text-orange-800' },
      completed: { text: 'Hoàn Tất', color: 'bg-gray-100 text-gray-800' },
      cancelled: { text: 'Đã Hủy', color: 'bg-red-100 text-red-800' }
    }
    const statusInfo = statusMap[status] || statusMap.pending
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
        {statusInfo.text}
      </span>
    )
  }

  const getPaymentStatusBadge = (paymentStatus) => {
    const statusMap = {
      pending: { text: 'Chưa Thanh Toán', color: 'bg-yellow-100 text-yellow-800' },
      partial: { text: 'Đã Đặt Cọc', color: 'bg-blue-100 text-blue-800' },
      paid: { text: 'Đã Thanh Toán', color: 'bg-green-100 text-green-800' }
    }
    const statusInfo = statusMap[paymentStatus] || statusMap.pending
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
        {statusInfo.text}
      </span>
    )
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  const filteredBookings = filterStatus === 'all' 
    ? bookings 
    : bookings.filter(booking => booking.status === filterStatus)

  if (loading) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-charcoal/60 dark:text-white/60">Đang tải lịch sử đặt phòng...</p>
        </div>
      </div>
    )
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

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Page Header */}
        <div className="mb-8">
          <h2 className="serif-heading text-4xl mb-2 text-charcoal dark:text-white">Lịch Sử Đặt Phòng</h2>
          <p className="text-charcoal/60 dark:text-white/60">Xem và quản lý các đặt phòng của bạn</p>
        </div>

        {/* Filter */}
        <div className="mb-6 flex gap-2 flex-wrap">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${
              filterStatus === 'all'
                ? 'bg-primary text-white shadow-lg shadow-primary/30'
                : 'bg-white dark:bg-charcoal border border-black/10 dark:border-white/10 text-charcoal dark:text-white hover:border-primary'
            }`}
          >
            Tất Cả
          </button>
          <button
            onClick={() => setFilterStatus('pending')}
            className={`px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${
              filterStatus === 'pending'
                ? 'bg-primary text-white shadow-lg shadow-primary/30'
                : 'bg-white dark:bg-charcoal border border-black/10 dark:border-white/10 text-charcoal dark:text-white hover:border-primary'
            }`}
          >
            Chờ Xác Nhận
          </button>
          <button
            onClick={() => setFilterStatus('confirmed')}
            className={`px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${
              filterStatus === 'confirmed'
                ? 'bg-primary text-white shadow-lg shadow-primary/30'
                : 'bg-white dark:bg-charcoal border border-black/10 dark:border-white/10 text-charcoal dark:text-white hover:border-primary'
            }`}
          >
            Đã Xác Nhận
          </button>
          <button
            onClick={() => setFilterStatus('checked-in')}
            className={`px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${
              filterStatus === 'checked-in'
                ? 'bg-primary text-white shadow-lg shadow-primary/30'
                : 'bg-white dark:bg-charcoal border border-black/10 dark:border-white/10 text-charcoal dark:text-white hover:border-primary'
            }`}
          >
            Đã Nhận Phòng
          </button>
          <button
            onClick={() => setFilterStatus('completed')}
            className={`px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${
              filterStatus === 'completed'
                ? 'bg-primary text-white shadow-lg shadow-primary/30'
                : 'bg-white dark:bg-charcoal border border-black/10 dark:border-white/10 text-charcoal dark:text-white hover:border-primary'
            }`}
          >
            Hoàn Tất
          </button>
        </div>

        {/* Bookings List */}
        {filteredBookings.length === 0 ? (
          <div className="bg-white dark:bg-charcoal rounded-xl shadow-luxury p-8 text-center border border-primary/10">
            <span className="material-symbols-outlined text-6xl text-charcoal/20 dark:text-white/20 mb-4">calendar_today</span>
            <p className="text-charcoal/60 dark:text-white/60 text-lg mb-4">Bạn chưa có đặt phòng nào</p>
            <Link
              to="/rooms"
              className="inline-block px-6 py-3 bg-primary text-white text-xs font-bold uppercase tracking-widest rounded-full hover:brightness-110 transition-all shadow-lg shadow-primary/20"
            >
              Đặt phòng ngay →
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredBookings.map((booking) => (
              <div
                key={booking._id}
                className="bg-white dark:bg-charcoal rounded-xl shadow-luxury hover:shadow-2xl transition-all border border-primary/10"
              >
                <div className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="serif-heading text-2xl text-charcoal dark:text-white">
                          {booking.room?.name || 'Phòng không xác định'}
                        </h3>
                        {getStatusBadge(booking.status)}
                        {getPaymentStatusBadge(booking.paymentStatus)}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-charcoal/60 dark:text-white/60">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-base text-primary">confirmation_number</span>
                          <span className="font-medium">Mã:</span>
                          <span className="font-mono font-bold text-charcoal dark:text-white">{booking.bookingCode}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-base text-primary">schedule</span>
                          <span className="font-medium">Loại:</span>
                          <span>
                            {booking.bookingType === 'hourly' && 'Theo Giờ'}
                            {booking.bookingType === 'overnight' && 'Qua Đêm'}
                            {booking.bookingType === 'daily' && 'Theo Ngày'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-base text-primary">login</span>
                          <span className="font-medium">Nhận:</span>
                          <span>{formatDate(booking.checkInDate)} lúc {booking.checkInTime}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-base text-primary">logout</span>
                          <span className="font-medium">Trả:</span>
                          <span>{formatDate(booking.checkOutDate)} lúc {booking.checkOutTime}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-base text-primary">payments</span>
                          <span className="font-medium">Tổng:</span>
                          <span className="text-primary font-bold text-base">
                            {formatCurrency(booking.totalPrice)}
                          </span>
                        </div>
                        {booking.remainingAmount > 0 && (
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-base text-red-500">priority_high</span>
                            <span className="font-medium">Còn lại:</span>
                            <span className="text-red-600 dark:text-red-400 font-bold">
                              {formatCurrency(booking.remainingAmount)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewDetails(booking)}
                        className="px-6 py-3 bg-primary text-white text-xs font-bold uppercase tracking-widest rounded-lg hover:brightness-110 transition-all shadow-lg shadow-primary/20"
                      >
                        Chi Tiết
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Detail Modal */}
        {showModal && selectedBooking && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">Chi Tiết Đặt Phòng</h2>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Thông Tin Phòng</h3>
                  <p className="text-gray-600">{selectedBooking.room?.name}</p>
                  {selectedBooking.room?.image && (
                    <img
                      src={`http://localhost:5000${selectedBooking.room.image}`}
                      alt={selectedBooking.room.name}
                      className="mt-2 rounded-lg w-full max-w-md"
                    />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Mã Đặt Phòng</h3>
                  <p className="font-mono text-lg">{selectedBooking.bookingCode}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Thời Gian</h3>
                  <div className="text-gray-600 space-y-1">
                    <p>
                      <span className="font-medium">Nhận phòng:</span>{' '}
                      {formatDate(selectedBooking.checkInDate)} lúc {selectedBooking.checkInTime}
                    </p>
                    <p>
                      <span className="font-medium">Trả phòng:</span>{' '}
                      {formatDate(selectedBooking.checkOutDate)} lúc {selectedBooking.checkOutTime}
                    </p>
                    {selectedBooking.bookingType === 'hourly' && (
                      <p>
                        <span className="font-medium">Số giờ:</span> {selectedBooking.hours} giờ
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Khách</h3>
                  <div className="text-gray-600">
                    <p>Người lớn: {selectedBooking.adults}</p>
                    {selectedBooking.children > 0 && <p>Trẻ em: {selectedBooking.children}</p>}
                  </div>
                </div>
                {selectedBooking.amenities && selectedBooking.amenities.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Tiện Ích</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedBooking.amenities.map((amenity) => (
                        <span
                          key={amenity._id}
                          className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                        >
                          {amenity.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {selectedBooking.services && selectedBooking.services.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Dịch Vụ</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedBooking.services.map((service) => (
                        <span
                          key={service._id}
                          className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                        >
                          {service.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Thanh Toán</h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span>Tiền phòng:</span>
                      <span>{formatCurrency(selectedBooking.roomPrice)}</span>
                    </div>
                    {selectedBooking.amenitiesPrice > 0 && (
                      <div className="flex justify-between">
                        <span>Tiện ích:</span>
                        <span>{formatCurrency(selectedBooking.amenitiesPrice)}</span>
                      </div>
                    )}
                    {selectedBooking.servicesPrice > 0 && (
                      <div className="flex justify-between">
                        <span>Dịch vụ:</span>
                        <span>{formatCurrency(selectedBooking.servicesPrice)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-lg border-t pt-2">
                      <span>Tổng cộng:</span>
                      <span className="text-primary">
                        {formatCurrency(selectedBooking.totalPrice)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Đã thanh toán:</span>
                      <span className="text-green-600">
                        {formatCurrency(selectedBooking.paidAmount)}
                      </span>
                    </div>
                    {selectedBooking.remainingAmount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span>Còn lại:</span>
                        <span className="text-red-600">
                          {formatCurrency(selectedBooking.remainingAmount)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Trạng Thái</h3>
                  <div className="flex gap-2">
                    {getStatusBadge(selectedBooking.status)}
                    {getPaymentStatusBadge(selectedBooking.paymentStatus)}
                  </div>
                </div>
              </div>
              <div className="p-6 border-t flex justify-end">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default MyBookings
