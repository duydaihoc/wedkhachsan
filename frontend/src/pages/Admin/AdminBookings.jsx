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
  const [availableRooms, setAvailableRooms] = useState([])
  const [showChangeRoomModal, setShowChangeRoomModal] = useState(false)
  const [selectedNewRoom, setSelectedNewRoom] = useState('')
  const [paymentMethodDetail, setPaymentMethodDetail] = useState('cash')
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [bookingForPayment, setBookingForPayment] = useState(null)

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
      'payment-pending': { label: 'Chờ Thanh Toán Online', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' },
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

  const handleConfirmBooking = async (bookingId) => {
    try {
      await api.put(`/bookings/${bookingId}/status`, { status: 'confirmed' })
      setSuccess('Đã xác nhận đặt phòng')
      fetchBookings()
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      setError(error.response?.data?.message || 'Không thể xác nhận đặt phòng')
    }
  }

  const handleCheckOut = async (bookingId) => {
    try {
      // Lấy thông tin booking trước khi cập nhật
      const bookingToCheckOut = bookings.find(b => b._id === bookingId)
      
      const response = await api.put(`/bookings/${bookingId}/status`, { status: 'checked-out' })
      const updatedBooking = response.data
      
      setSuccess('Đã cập nhật trạng thái trả phòng')
      
      // Nếu booking đã thanh toán đủ (paymentStatus = 'paid'), xuất hóa đơn
      if (bookingToCheckOut?.paymentStatus === 'paid') {
        setTimeout(() => {
          printInvoice(updatedBooking)
        }, 500)
      }
      
      fetchBookings()
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      setError(error.response?.data?.message || 'Không thể cập nhật trạng thái')
    }
  }

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy booking này? Khách hàng sẽ nhận được thông báo.')) {
      return
    }
    
    try {
      await api.put(`/bookings/${bookingId}/cancel`)
      setSuccess('Đã hủy booking thành công')
      fetchBookings()
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      setError(error.response?.data?.message || 'Không thể hủy booking')
    }
  }

  const handleCancelCheckIn = async (bookingId) => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy nhận phòng? Booking sẽ chuyển về trạng thái đã xác nhận.')) {
      return
    }
    
    try {
      // Chuyển từ checked-in về confirmed
      await api.put(`/bookings/${bookingId}/status`, { status: 'confirmed' })
      setSuccess('Đã hủy nhận phòng thành công')
      fetchBookings()
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      setError(error.response?.data?.message || 'Không thể hủy nhận phòng')
    }
  }

  const handleCancelCheckInAndEndBooking = async (bookingId) => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy nhận phòng và kết thúc booking này? Booking sẽ bị hủy hoàn toàn và khách hàng sẽ nhận được thông báo.')) {
      return
    }
    
    try {
      // Hủy booking (chuyển từ checked-in về cancelled)
      await api.put(`/bookings/${bookingId}/cancel`)
      setSuccess('Đã hủy nhận phòng và kết thúc booking thành công')
      fetchBookings()
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      setError(error.response?.data?.message || 'Không thể hủy nhận phòng và kết thúc booking')
    }
  }

  const handleCancelPaymentConfirmation = async (bookingId) => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy xác nhận thanh toán? Booking sẽ bị hủy và khách hàng sẽ nhận được thông báo về lỗi ngân hàng hoặc vấn đề kỹ thuật.')) {
      return
    }
    
    try {
      // Hủy booking (sẽ được backend xử lý như hủy xác nhận thanh toán)
      await api.put(`/bookings/${bookingId}/cancel`)
      setSuccess('Đã hủy xác nhận thanh toán thành công')
      fetchBookings()
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      setError(error.response?.data?.message || 'Không thể hủy xác nhận thanh toán')
    }
  }

  const handleCancelBookingConfirmation = async (bookingId) => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy xác nhận booking? Booking sẽ bị hủy và nhân viên sẽ liên hệ với khách hàng để hoàn tiền lại.')) {
      return
    }
    
    try {
      // Hủy booking (đã xác nhận thanh toán, chưa xác nhận booking)
      await api.put(`/bookings/${bookingId}/cancel`)
      setSuccess('Đã hủy xác nhận booking thành công')
      fetchBookings()
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      setError(error.response?.data?.message || 'Không thể hủy xác nhận booking')
    }
  }

  const handleConfirmPayment = async () => {
    if (!bookingForPayment) return
    
    try {
      await api.put(`/bookings/${bookingForPayment._id}/payment`, { 
        amount: bookingForPayment.remainingAmount,
        paymentMethodDetail 
      })
      
      // In hóa đơn
      printInvoice(bookingForPayment)
      
      setSuccess('Đã xác nhận thanh toán và in hóa đơn')
      fetchBookings()
      setShowPaymentModal(false)
      setBookingForPayment(null)
      setPaymentMethodDetail('cash')
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      setError(error.response?.data?.message || 'Không thể xác nhận thanh toán')
    }
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

  const generateInvoiceHTML = (booking) => {
    const totalNights = Math.ceil((new Date(booking.checkOutDate) - new Date(booking.checkInDate)) / (1000 * 60 * 60 * 24))
    
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
          .payment-method {
            display: inline-block;
            padding: 5px 15px;
            background-color: #e8f5e9;
            color: #2e7d32;
            border-radius: 20px;
            font-weight: bold;
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
            <span>${booking.user?.fullName || booking.user?.username}</span>
          </div>
          <div class="info-row">
            <span class="label">Email:</span>
            <span>${booking.user?.email || 'N/A'}</span>
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
              <td style="text-align: center;">${totalNights} đêm</td>
              <td style="text-align: right;">${formatPrice(booking.roomPrice / totalNights)}</td>
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
            ${booking.paidAmount > 0 ? `
            <tr>
              <td colspan="3" style="text-align: right; color: #4caf50;">Đã thanh toán:</td>
              <td style="text-align: right; color: #4caf50;">${formatPrice(booking.paidAmount)}</td>
            </tr>
            ` : ''}
            ${booking.refundAmount > 0 ? `
            <tr>
              <td colspan="3" style="text-align: right; color: #ff9800;">Số tiền hoàn lại:</td>
              <td style="text-align: right; color: #ff9800;">${formatPrice(booking.refundAmount)}</td>
            </tr>
            ` : ''}
          </tbody>
        </table>
        
        <div class="info-section">
          <div class="info-row">
            <span class="label">Phương thức thanh toán:</span>
            <span class="payment-method">
              ${paymentMethodDetail === 'cash' ? '💵 Tiền Mặt' : '📱 Chuyển Khoản QR'}
            </span>
          </div>
          <div class="info-row">
            <span class="label">Trạng thái:</span>
            <span style="color: #4caf50; font-weight: bold;">Đã Thanh Toán</span>
          </div>
        </div>
        
        <div class="footer">
          <p><strong>Cảm ơn quý khách đã sử dụng dịch vụ của chúng tôi!</strong></p>
          <p>Aurelius Grand Hotel | Hotline: 1900-xxxx | Email: info@aureliusgrand.com</p>
        </div>
      </body>
      </html>
    `
  }

  const fetchAvailableRooms = async (booking) => {
    try {
      // Gọi API mới để lấy danh sách phòng tối ưu
      const response = await api.get(`/bookings/${booking._id}/available-rooms`)
      setAvailableRooms(response.data)
    } catch (error) {
      console.error('Không thể tải danh sách phòng:', error)
      setError('Không thể tải danh sách phòng có thể đổi')
    }
  }

  const handleChangeRoom = async () => {
    if (!selectedNewRoom || !selectedBooking) return
    
    try {
      await api.put(`/bookings/${selectedBooking._id}/change-room`, {
        newRoomId: selectedNewRoom
      })
      setSuccess('Đã đổi phòng thành công')
      fetchBookings()
      setShowChangeRoomModal(false)
      setShowModal(false)
      setSelectedNewRoom('')
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      setError(error.response?.data?.message || 'Không thể đổi phòng')
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
                          <div className="flex items-center gap-2 flex-wrap">
                            <button
                              onClick={() => handleViewDetails(booking)}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                              Chi Tiết
                            </button>
                            
                            {/* THAO TÁC CHO BOOKING ĐÃ CHECKED-IN */}
                            {booking.status === 'checked-in' && (
                              <>
                                <button
                                  onClick={() => handleCheckOut(booking._id)}
                                  className="text-orange-600 hover:text-orange-800 text-sm font-medium"
                                >
                                  Trả Phòng
                                </button>
                                <button
                                  onClick={() => handleCancelCheckIn(booking._id)}
                                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                >
                                  Hủy Nhận Phòng
                                </button>
                                <button
                                  onClick={() => handleCancelCheckInAndEndBooking(booking._id)}
                                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                                >
                                  Hủy Nhận Phòng và Kết Thúc
                                </button>
                              </>
                            )}
                            
                            {/* THAO TÁC CHO BOOKING CHƯA CHECKED-IN */}
                            {booking.status !== 'checked-in' && booking.status !== 'checked-out' && booking.status !== 'completed' && booking.status !== 'cancelled' && (
                              <>
                                {/* Bước 1: Xác Nhận Đã Nhận Tiền - Hiển thị trước Xác Nhận Booking */}
                                {booking.paymentMethod === 'online' && booking.status === 'pending' && booking.paymentStatus === 'partial' && (
                                  <>
                                    <button
                                      onClick={() => handleConfirmOnlinePayment(booking._id)}
                                      className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                                    >
                                      Xác Nhận Đã Nhận Tiền
                                    </button>
                                    <button
                                      onClick={() => handleCancelPaymentConfirmation(booking._id)}
                                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                                    >
                                      Hủy Xác Nhận Tiền
                                    </button>
                                  </>
                                )}
                                {/* Bước 2: Xác Nhận Booking - Sau khi đã xác nhận thanh toán online, chưa xác nhận booking */}
                                {booking.status === 'confirmed' && booking.paymentMethod === 'online' && !booking.bookingConfirmed && (
                                  <>
                                    <button
                                      onClick={() => handleConfirmBooking(booking._id)}
                                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                    >
                                      Xác Nhận Booking
                                    </button>
                                    <button
                                      onClick={() => handleCancelBookingConfirmation(booking._id)}
                                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                                    >
                                      Hủy Xác Nhận Booking
                                    </button>
                                  </>
                                )}
                                {/* Bước 3: Nhận Phòng - Sau khi đã xác nhận booking (online) */}
                                {booking.status === 'confirmed' && booking.paymentMethod === 'online' && booking.bookingConfirmed && (
                                  <>
                                    <button
                                      onClick={() => handleCheckIn(booking._id)}
                                      className="text-green-600 hover:text-green-800 text-sm font-medium"
                                    >
                                      Nhận Phòng
                                    </button>
                                    <button
                                      onClick={() => handleCancelCheckInAndEndBooking(booking._id)}
                                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                                    >
                                      Hủy Nhận Phòng và Kết Thúc
                                    </button>
                                  </>
                                )}
                                {/* Xác Nhận Booking - Cho booking thanh toán tại quầy (status = pending) */}
                                {booking.status === 'pending' && booking.paymentMethod === 'cash' && (
                                  <button
                                    onClick={() => handleConfirmBooking(booking._id)}
                                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                  >
                                    Xác Nhận Booking
                                  </button>
                                )}
                                {/* Nhận Phòng - Cho booking đã confirmed (thanh toán tại quầy) */}
                                {booking.status === 'confirmed' && booking.paymentMethod === 'cash' && (
                                  <>
                                    <button
                                      onClick={() => handleCheckIn(booking._id)}
                                      className="text-green-600 hover:text-green-800 text-sm font-medium"
                                    >
                                      Nhận Phòng
                                    </button>
                                    <button
                                      onClick={() => handleCancelCheckInAndEndBooking(booking._id)}
                                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                                    >
                                      Hủy Nhận Phòng và Kết Thúc
                                    </button>
                                  </>
                                )}
                                {/* Hủy Booking - Chỉ cho các booking chưa confirmed và không phải đang chờ xác nhận thanh toán */}
                                {booking.status !== 'confirmed' && 
                                 !(booking.paymentMethod === 'online' && booking.status === 'pending' && booking.paymentStatus === 'partial') && (
                                  <button
                                    onClick={() => handleCancelBooking(booking._id)}
                                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                                  >
                                    Hủy Booking
                                  </button>
                                )}
                              </>
                            )}
                            
                            {/* THAO TÁC CHO BOOKING ĐÃ CHECKED-OUT */}
                            {booking.status === 'checked-out' && booking.remainingAmount > 0 && (
                              <button
                                onClick={() => {
                                  setBookingForPayment(booking)
                                  setShowPaymentModal(true)
                                }}
                                className="text-primary hover:text-primary/80 text-sm font-medium"
                              >
                                Thanh Toán
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
                    {selectedBooking.paymentMethodDetail && selectedBooking.paymentMethodDetail !== 'pending' && (
                      <div className="flex justify-between">
                        <span>Chi tiết thanh toán:</span>
                        <span className="font-medium">
                          {selectedBooking.paymentMethodDetail === 'cash' ? '💵 Tiền Mặt' : '📱 QR Code'}
                        </span>
                      </div>
                    )}
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
                    {selectedBooking.refundAmount > 0 && (
                      <div className="flex justify-between">
                        <span>Số tiền hoàn lại:</span>
                        <span className="font-medium text-orange-600 dark:text-orange-400">{formatPrice(selectedBooking.refundAmount)}</span>
                      </div>
                    )}
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

                {/* Change Room Button */}
                {['confirmed', 'checked-in'].includes(selectedBooking.status) && (
                  <div className="pt-4 border-t border-primary/10">
                    <button
                      onClick={() => {
                        fetchAvailableRooms(selectedBooking)
                        setShowChangeRoomModal(true)
                      }}
                      className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold uppercase tracking-widest transition-all"
                    >
                      <span className="material-symbols-outlined text-sm align-middle mr-2">swap_horiz</span>
                      Đổi Phòng
                    </button>
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

        {/* Change Room Modal */}
        {showChangeRoomModal && selectedBooking && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-charcoal rounded-xl shadow-luxury p-8 max-w-2xl w-full border border-primary/10">
              <h3 className="serif-heading text-2xl mb-6 text-charcoal dark:text-white">
                Đổi Phòng
              </h3>
              
              <div className="mb-6">
                <p className="text-sm text-charcoal/60 dark:text-white/60 mb-4">
                  Phòng hiện tại: <span className="font-bold text-charcoal dark:text-white">Phòng {selectedBooking.room?.roomNumber}</span>
                </p>
                
                <label className="block text-xs font-bold uppercase tracking-widest text-charcoal/60 dark:text-white/60 mb-2">
                  Chọn Phòng Mới
                </label>
                <select
                  value={selectedNewRoom}
                  onChange={(e) => setSelectedNewRoom(e.target.value)}
                  className="w-full px-4 py-3 border border-charcoal/20 dark:border-white/20 rounded-lg bg-background-light dark:bg-background-dark text-charcoal dark:text-white focus:ring-2 focus:ring-primary focus:border-primary"
                >
                  <option value="">-- Chọn phòng (đã được tối ưu) --</option>
                  {availableRooms.map((room, index) => (
                    <option key={room._id} value={room._id}>
                      {index === 0 && '⭐ '}
                      Phòng {room.roomNumber} - {room.type?.name} - {room.category?.name} - {formatPrice(room.estimatedPrice || room.price?.daily || 0)}
                      {room.status === 'Available' ? ' (Sẵn sàng)' : ' (Cần dọn)'}
                    </option>
                  ))}
                </select>
                
                {selectedNewRoom && (
                  <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-sm text-blue-800 dark:text-blue-300">
                      <span className="material-symbols-outlined text-sm align-middle mr-1">info</span>
                      Giá phòng sẽ được cập nhật tự động. Số tiền còn lại sẽ thay đổi theo giá phòng mới.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setShowChangeRoomModal(false)
                    setSelectedNewRoom('')
                  }}
                  className="flex-1 bg-charcoal/10 hover:bg-charcoal/20 dark:bg-white/10 dark:hover:bg-white/20 text-charcoal dark:text-white py-3 rounded-lg text-xs font-bold uppercase tracking-widest transition-all"
                >
                  Hủy
                </button>
                <button
                  onClick={handleChangeRoom}
                  disabled={!selectedNewRoom}
                  className="flex-1 bg-primary hover:bg-primary/90 text-white py-3 rounded-lg text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Xác Nhận Đổi Phòng
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Payment Modal */}
        {showPaymentModal && bookingForPayment && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="bg-white dark:bg-charcoal w-full max-w-5xl rounded-2xl overflow-hidden shadow-2xl flex flex-col lg:flex-row border border-primary/10">
              {/* Left Side - Booking Summary */}
              <div className="w-full lg:w-2/5 p-8 lg:p-12 bg-[#fcfaf7] dark:bg-[#25221d] border-r border-primary/10">
                <h2 className="serif-heading text-3xl mb-8 text-primary">Tóm tắt đặt phòng</h2>
                <div className="space-y-8">
                  <div>
                    <h3 className="text-[11px] uppercase tracking-[0.2em] font-bold text-primary/60 mb-2">Loại phòng</h3>
                    <p className="text-xl font-display font-medium leading-tight">
                      {bookingForPayment.room?.type?.name || 'N/A'}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-8">
                    <div>
                      <h3 className="text-[11px] uppercase tracking-[0.2em] font-bold text-primary/60 mb-2">Ngày lưu trú</h3>
                      <p className="text-sm font-medium">
                        {formatDate(bookingForPayment.checkInDate)} - {formatDate(bookingForPayment.checkOutDate)}
                      </p>
                      <p className="text-xs opacity-50 mt-1 italic">
                        ({Math.ceil((new Date(bookingForPayment.checkOutDate) - new Date(bookingForPayment.checkInDate)) / (1000 * 60 * 60 * 24))} đêm)
                      </p>
                    </div>
                    <div>
                      <h3 className="text-[11px] uppercase tracking-[0.2em] font-bold text-primary/60 mb-2">Số khách</h3>
                      <p className="text-sm font-medium">
                        {bookingForPayment.adults} Người lớn{bookingForPayment.children > 0 ? `, ${bookingForPayment.children} Trẻ em` : ''}
                      </p>
                    </div>
                  </div>
                  {bookingForPayment.room?.images && bookingForPayment.room.images.length > 0 && (
                    <div className="rounded-xl overflow-hidden aspect-video relative">
                      <img
                        alt="Room"
                        className="absolute inset-0 w-full h-full object-cover"
                        src={`http://localhost:5000${typeof bookingForPayment.room.images[0] === 'string' ? bookingForPayment.room.images[0] : bookingForPayment.room.images[0].url}`}
                      />
                    </div>
                  )}
                  <div className="pt-6 border-t border-primary/10">
                    <div className="flex items-center gap-3 text-sm opacity-60 italic">
                      <span className="material-symbols-outlined text-primary">verified_user</span>
                      <span>Đảm bảo giá tốt nhất & Bảo mật 100%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side - Payment Form */}
              <div className="w-full lg:w-3/5 p-8 lg:p-12 flex flex-col">
                <div className="flex justify-between items-start mb-10">
                  <h2 className="serif-heading text-3xl text-charcoal dark:text-white">Xác nhận thanh toán</h2>
                  <button 
                    onClick={() => {
                      setShowPaymentModal(false)
                      setBookingForPayment(null)
                      setPaymentMethodDetail('cash')
                    }}
                    className="text-charcoal/30 dark:text-white/30 hover:text-primary transition-colors"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>

                <div className="flex-grow flex flex-col">
                  <div className="mb-10">
                    <h4 className="text-[11px] uppercase tracking-[0.2em] font-bold mb-5 text-charcoal/60 dark:text-white/60">
                      Chọn phương thức thanh toán
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <label className={`relative flex flex-col p-5 border-2 rounded-xl cursor-pointer hover:border-primary transition-all group ${
                        paymentMethodDetail === 'cash' 
                          ? 'border-primary bg-primary/5' 
                          : 'border-primary/20'
                      }`}>
                        <div className="flex items-center justify-between mb-3">
                          <span className="material-symbols-outlined text-primary text-3xl">payments</span>
                          <input
                            checked={paymentMethodDetail === 'cash'}
                            onChange={() => setPaymentMethodDetail('cash')}
                            className="text-primary focus:ring-primary h-5 w-5 border-charcoal/20"
                            type="radio"
                            name="payment"
                          />
                        </div>
                        <span className="text-sm font-bold uppercase tracking-wide text-charcoal dark:text-white">Tiền mặt tại quầy</span>
                        <span className="text-[10px] text-charcoal/60 dark:text-white/60 mt-1">Thanh toán khi nhận phòng</span>
                      </label>
                      
                      <label className={`relative flex flex-col p-5 border-2 rounded-xl cursor-pointer hover:border-primary transition-all group ${
                        paymentMethodDetail === 'qr' 
                          ? 'border-primary bg-primary/5' 
                          : 'border-primary/20'
                      }`}>
                        <div className="flex items-center justify-between mb-3">
                          <span className="material-symbols-outlined text-primary text-3xl">account_balance</span>
                          <input
                            checked={paymentMethodDetail === 'qr'}
                            onChange={() => setPaymentMethodDetail('qr')}
                            className="text-primary focus:ring-primary h-5 w-5 border-charcoal/20"
                            type="radio"
                            name="payment"
                          />
                        </div>
                        <span className="text-sm font-bold uppercase tracking-wide text-charcoal dark:text-white">Chuyển khoản</span>
                        <span className="text-[10px] text-charcoal/60 dark:text-white/60 mt-1">Quét mã QR/Chuyển khoản nhanh</span>
                      </label>
                    </div>
                  </div>

                  {/* QR Code Display */}
                  {paymentMethodDetail === 'qr' && (
                    <div className="mb-8 p-6 bg-primary/5 rounded-xl border border-primary/20">
                      <h4 className="text-sm font-bold uppercase tracking-widest text-center mb-4 text-charcoal dark:text-white">
                        Quét mã QR để thanh toán
                      </h4>
                      <div className="flex justify-center mb-4">
                        <div className="bg-white p-4 rounded-lg">
                          <img 
                            src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=AURELIUS_GRAND_HOTEL_BOOKING_${bookingForPayment.bookingCode}_AMOUNT_${bookingForPayment.remainingAmount}"
                            alt="QR Code"
                            className="w-48 h-48"
                          />
                        </div>
                      </div>
                      <div className="text-center text-sm text-charcoal/60 dark:text-white/60">
                        <p className="font-medium">Ngân hàng: <span className="text-charcoal dark:text-white">Vietcombank</span></p>
                        <p className="font-medium">STK: <span className="text-charcoal dark:text-white">1234567890</span></p>
                        <p className="font-medium">Chủ TK: <span className="text-charcoal dark:text-white">AURELIUS GRAND HOTEL</span></p>
                        <p className="mt-2 text-xs italic">Nội dung: {bookingForPayment.bookingCode}</p>
                      </div>
                    </div>
                  )}

                  {/* Price Summary */}
                  <div className="bg-[#fcfaf7] dark:bg-[#25221d]/50 rounded-xl p-6 border border-primary/10 mb-8">
                    <h4 className="text-[11px] uppercase tracking-[0.2em] font-bold mb-4 text-charcoal/60 dark:text-white/60">
                      Chi tiết bảng tính
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-charcoal/60 dark:text-white/60">Giá phòng</span>
                        <span className="font-medium text-charcoal dark:text-white">{formatPrice(bookingForPayment.roomPrice)}</span>
                      </div>
                      {bookingForPayment.amenitiesPrice > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-charcoal/60 dark:text-white/60">Tiện ích</span>
                          <span className="font-medium text-charcoal dark:text-white">{formatPrice(bookingForPayment.amenitiesPrice)}</span>
                        </div>
                      )}
                      {bookingForPayment.servicesPrice > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-charcoal/60 dark:text-white/60">Dịch vụ</span>
                          <span className="font-medium text-charcoal dark:text-white">{formatPrice(bookingForPayment.servicesPrice)}</span>
                        </div>
                      )}
                      {bookingForPayment.paidAmount > 0 && (
                        <div className="flex justify-between text-sm pb-4 border-b border-primary/10">
                          <span className="text-charcoal/60 dark:text-white/60">Đã thanh toán</span>
                          <span className="font-medium text-green-600 dark:text-green-400">-{formatPrice(bookingForPayment.paidAmount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-baseline pt-2">
                        <span className="text-xs font-bold uppercase tracking-widest text-charcoal dark:text-white">Còn lại</span>
                        <span className="text-3xl font-display font-bold text-primary">{formatPrice(bookingForPayment.remainingAmount)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-auto space-y-4">
                    <button
                      onClick={handleConfirmPayment}
                      className="w-full py-5 bg-primary text-white font-bold uppercase tracking-[0.25em] text-sm rounded-lg hover:brightness-105 hover:scale-[1.01] transition-all shadow-xl shadow-primary/30"
                    >
                      XÁC NHẬN THANH TOÁN
                    </button>
                    <div className="flex justify-center">
                      <button
                        onClick={() => {
                          setShowPaymentModal(false)
                          setBookingForPayment(null)
                          setPaymentMethodDetail('cash')
                        }}
                        className="text-[11px] uppercase tracking-[0.2em] font-bold text-charcoal/40 dark:text-white/40 hover:text-primary transition-all"
                      >
                        Hủy bỏ và quay lại
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminBookings
