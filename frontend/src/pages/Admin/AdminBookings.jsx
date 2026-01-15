import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'

const AdminBookings = () => {
  const { user, logout } = useAuth()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [filterStatus, setFilterStatus] = useState('all')

  useEffect(() => {
    fetchBookings()
  }, [])

  const fetchBookings = async () => {
    try {
      setLoading(true)
      const response = await api.get('/bookings/admin')
      setBookings(response.data)
    } catch (error) {
      setError('Không thể tải danh sách đặt phòng')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

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

  const getStatusInfo = (status) => {
    const statusMap = {
      'pending': { label: 'Chờ Xử Lý', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
      'confirmed': { label: 'Đã Xác Nhận', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
      'checked-in': { label: 'Đã Nhận Phòng', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' },
      'checked-out': { label: 'Đã Trả Phòng', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' },
      'completed': { label: 'Hoàn Tất', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
      'cancelled': { label: 'Đã Hủy', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' }
    }
    return statusMap[status] || statusMap['pending']
  }

  const getPaymentStatusInfo = (status) => {
    const statusMap = {
      'pending': { label: 'Chưa Thanh Toán', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400' },
      'partial': { label: 'Thanh Toán Một Phần', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
      'paid': { label: 'Đã Thanh Toán', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' }
    }
    return statusMap[status] || statusMap['pending']
  }

  const handleCheckIn = async (bookingId) => {
    try {
      await api.put(`/bookings/${bookingId}/status`, { status: 'checked-in' })
      setSuccess('Đã cập nhật trạng thái nhận phòng')
      fetchBookings()
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      setError(error.response?.data?.message || 'Không thể cập nhật trạng thái')
    }
  }

  const handleCheckOut = async (bookingId) => {
    try {
      await api.put(`/bookings/${bookingId}/status`, { status: 'checked-out' })
      setSuccess('Đã cập nhật trạng thái trả phòng')
      fetchBookings()
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      setError(error.response?.data?.message || 'Không thể cập nhật trạng thái')
    }
  }

  const handleConfirmPayment = async (bookingId, amount) => {
    try {
      await api.put(`/bookings/${bookingId}/payment`, { amount })
      setSuccess('Đã xác nhận thanh toán')
      fetchBookings()
      setShowModal(false)
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      setError(error.response?.data?.message || 'Không thể xác nhận thanh toán')
    }
  }

  const handleConfirmOnlinePayment = async (bookingId) => {
    try {
      await api.put(`/bookings/${bookingId}/online-payment`)
      setSuccess('Đã xác nhận thanh toán online')
      fetchBookings()
      setShowModal(false)
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      setError(error.response?.data?.message || 'Không thể xác nhận thanh toán online')
    }
  }

  const handleComplete = async (bookingId) => {
    try {
      await api.put(`/bookings/${bookingId}/status`, { status: 'completed' })
      setSuccess('Đã hoàn tất đặt phòng')
      fetchBookings()
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      setError(error.response?.data?.message || 'Không thể hoàn tất đặt phòng')
    }
  }

  const handleViewDetails = (booking) => {
    setSelectedBooking(booking)
    setShowModal(true)
  }

  const filteredBookings = filterStatus === 'all' 
    ? bookings 
    : bookings.filter(b => b.status === filterStatus)

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
            <h2 className="serif-heading text-4xl mb-2 text-charcoal dark:text-white">Quản Lý Đặt Phòng</h2>
            <p className="text-charcoal/60 dark:text-white/60">Quản lý tất cả các đặt phòng của khách sạn</p>
          </div>
        </div>

        {/* Filter */}
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
              filterStatus === 'all'
                ? 'bg-primary text-white'
                : 'bg-charcoal/10 dark:bg-white/10 text-charcoal dark:text-white hover:bg-primary/10'
            }`}
          >
            Tất Cả
          </button>
          <button
            onClick={() => setFilterStatus('pending')}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
              filterStatus === 'pending'
                ? 'bg-primary text-white'
                : 'bg-charcoal/10 dark:bg-white/10 text-charcoal dark:text-white hover:bg-primary/10'
            }`}
          >
            Chờ Xử Lý
          </button>
          <button
            onClick={() => setFilterStatus('confirmed')}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
              filterStatus === 'confirmed'
                ? 'bg-primary text-white'
                : 'bg-charcoal/10 dark:bg-white/10 text-charcoal dark:text-white hover:bg-primary/10'
            }`}
          >
            Đã Xác Nhận
          </button>
          <button
            onClick={() => setFilterStatus('checked-in')}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
              filterStatus === 'checked-in'
                ? 'bg-primary text-white'
                : 'bg-charcoal/10 dark:bg-white/10 text-charcoal dark:text-white hover:bg-primary/10'
            }`}
          >
            Đã Nhận Phòng
          </button>
          <button
            onClick={() => setFilterStatus('checked-out')}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
              filterStatus === 'checked-out'
                ? 'bg-primary text-white'
                : 'bg-charcoal/10 dark:bg-white/10 text-charcoal dark:text-white hover:bg-primary/10'
            }`}
          >
            Đã Trả Phòng
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
            <p className="text-charcoal/60 dark:text-white/60">Đang tải danh sách đặt phòng...</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-charcoal rounded-xl shadow-luxury border border-primary/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-primary/5 border-b border-primary/10">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-charcoal dark:text-white">Mã Đặt Phòng</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-charcoal dark:text-white">Khách Hàng</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-charcoal dark:text-white">Phòng</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-charcoal dark:text-white">Nhận Phòng</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-charcoal dark:text-white">Trả Phòng</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-charcoal dark:text-white">Tổng Tiền</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-charcoal dark:text-white">Trạng Thái</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-charcoal dark:text-white">Thanh Toán</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-charcoal dark:text-white">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary/10">
                  {filteredBookings.map((booking) => {
                    const statusInfo = getStatusInfo(booking.status)
                    const paymentInfo = getPaymentStatusInfo(booking.paymentStatus)
                    return (
                      <tr key={booking._id} className="hover:bg-primary/5 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-charcoal dark:text-white">
                          {booking.bookingCode}
                        </td>
                        <td className="px-6 py-4 text-sm text-charcoal dark:text-white">
                          {booking.user?.fullName || booking.user?.username || 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-sm text-charcoal dark:text-white">
                          Phòng {booking.room?.roomNumber || 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-sm text-charcoal dark:text-white">
                          {formatDate(booking.checkInDate)} {booking.checkInTime}
                        </td>
                        <td className="px-6 py-4 text-sm text-charcoal dark:text-white">
                          {formatDate(booking.checkOutDate)} {booking.checkOutTime}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-charcoal dark:text-white">
                          {formatPrice(booking.totalPrice)}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${paymentInfo.color}`}>
                            {paymentInfo.label}
                          </span>
                          {booking.paymentMethod === 'online' && booking.paymentStatus === 'partial' && (
                            <p className="text-xs text-charcoal/60 dark:text-white/60 mt-1">
                              Đã trả: {formatPrice(booking.paidAmount)}
                            </p>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleViewDetails(booking)}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                              Chi Tiết
                            </button>
                            {(booking.status === 'confirmed' || (booking.status === 'pending' && booking.paymentMethod === 'cash')) && (
                              <button
                                onClick={() => handleCheckIn(booking._id)}
                                className="text-green-600 hover:text-green-800 text-sm font-medium"
                              >
                                Nhận Phòng
                              </button>
                            )}
                            {booking.status === 'checked-in' && (
                              <button
                                onClick={() => handleCheckOut(booking._id)}
                                className="text-orange-600 hover:text-orange-800 text-sm font-medium"
                              >
                                Trả Phòng
                              </button>
                            )}
                            {booking.status === 'checked-out' && booking.remainingAmount > 0 && (
                              <button
                                onClick={() => {
                                  setSelectedBooking(booking)
                                  setShowModal(true)
                                }}
                                className="text-primary hover:text-primary/80 text-sm font-medium"
                              >
                                Thanh Toán
                              </button>
                            )}
                            {booking.paymentMethod === 'online' && booking.status === 'pending' && booking.paymentStatus === 'partial' && (
                              <button
                                onClick={() => handleConfirmOnlinePayment(booking._id)}
                                className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                              >
                                Xác Nhận Đã Nhận Tiền
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {filteredBookings.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-charcoal/60 dark:text-white/60">Chưa có đặt phòng nào</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Detail Modal */}
        {showModal && selectedBooking && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-charcoal rounded-xl shadow-luxury p-8 max-w-4xl w-full border border-primary/10 max-h-[90vh] overflow-y-auto">
              <h3 className="serif-heading text-2xl mb-6 text-charcoal dark:text-white">
                Chi Tiết Đặt Phòng
              </h3>
              
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-charcoal/60 dark:text-white/60 mb-1">Mã Đặt Phòng</p>
                  <p className="text-xl font-bold text-primary">{selectedBooking.bookingCode}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-charcoal/60 dark:text-white/60 mb-1">Khách Hàng</p>
                    <p className="font-medium">{selectedBooking.user?.fullName || selectedBooking.user?.username}</p>
                    <p className="text-sm text-charcoal/60 dark:text-white/60">{selectedBooking.user?.email}</p>
                    <p className="text-sm text-charcoal/60 dark:text-white/60">{selectedBooking.user?.phone}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-charcoal/60 dark:text-white/60 mb-1">Phòng</p>
                    <p className="font-medium">Phòng {selectedBooking.room?.roomNumber}</p>
                    <p className="text-sm text-charcoal/60 dark:text-white/60">{selectedBooking.room?.type?.name}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-charcoal/60 dark:text-white/60 mb-1">Nhận Phòng</p>
                    <p className="font-medium">{formatDate(selectedBooking.checkInDate)} lúc {selectedBooking.checkInTime}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-charcoal/60 dark:text-white/60 mb-1">Trả Phòng</p>
                    <p className="font-medium">{formatDate(selectedBooking.checkOutDate)} lúc {selectedBooking.checkOutTime}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-charcoal/60 dark:text-white/60 mb-1">Loại Thuê</p>
                  <p className="font-medium">
                    {selectedBooking.bookingType === 'hourly' ? 'Theo Giờ' : 
                     selectedBooking.bookingType === 'overnight' ? 'Qua Đêm' : 'Theo Ngày'}
                    {selectedBooking.bookingType === 'hourly' && ` (${selectedBooking.hours} giờ)`}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-charcoal/60 dark:text-white/60 mb-2">Thanh Toán</p>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Phương thức:</span>
                      <span className="font-medium">{selectedBooking.paymentMethod === 'cash' ? 'Tại Quầy' : 'Online'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tổng tiền:</span>
                      <span className="font-medium">{formatPrice(selectedBooking.totalPrice)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Đã thanh toán:</span>
                      <span className="font-medium text-green-600 dark:text-green-400">{formatPrice(selectedBooking.paidAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Còn lại:</span>
                      <span className="font-medium">{formatPrice(selectedBooking.remainingAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Trạng thái:</span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusInfo(selectedBooking.paymentStatus).color}`}>
                        {getPaymentStatusInfo(selectedBooking.paymentStatus).label}
                      </span>
                    </div>
                  </div>
                </div>

                {selectedBooking.amenities && selectedBooking.amenities.length > 0 && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-charcoal/60 dark:text-white/60 mb-2">Tiện Ích</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedBooking.amenities.map((amenity) => (
                        <span key={amenity._id || amenity} className="px-3 py-1 bg-primary/10 rounded-full text-sm">
                          {amenity.name || amenity}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedBooking.services && selectedBooking.services.length > 0 && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-charcoal/60 dark:text-white/60 mb-2">Dịch Vụ</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedBooking.services.map((service) => (
                        <span key={service._id || service} className="px-3 py-1 bg-primary/10 rounded-full text-sm">
                          {service.name || service}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Payment Actions */}
                {selectedBooking.status === 'checked-out' && selectedBooking.remainingAmount > 0 && (
                  <div className="pt-4 border-t border-primary/10">
                    <p className="text-sm font-bold mb-3">Xác Nhận Thanh Toán</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleConfirmPayment(selectedBooking._id, selectedBooking.remainingAmount)}
                        className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90"
                      >
                        Xác Nhận Thanh Toán {formatPrice(selectedBooking.remainingAmount)}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-4 mt-6 pt-6 border-t border-primary/10">
                <button
                  onClick={() => {
                    setShowModal(false)
                    setSelectedBooking(null)
                  }}
                  className="flex-1 bg-charcoal/10 hover:bg-charcoal/20 dark:bg-white/10 dark:hover:bg-white/20 text-charcoal dark:text-white py-3 rounded-lg text-xs font-bold uppercase tracking-widest transition-all"
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

export default AdminBookings
