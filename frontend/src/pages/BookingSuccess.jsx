import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import BookingHeader from '../components/BookingHeader'

const BookingSuccess = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }

    fetchBooking()
  }, [id])

  const fetchBooking = async () => {
    try {
      const response = await api.get(`/bookings/${id}`)
      setBooking(response.data)
    } catch (error) {
      setError('Không thể tải thông tin đặt phòng')
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
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatDateShort = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const calculateNights = () => {
    if (!booking?.checkInDate || !booking?.checkOutDate) return 0
    const checkIn = new Date(booking.checkInDate)
    const checkOut = new Date(booking.checkOutDate)
    const diffTime = checkOut - checkIn
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays > 0 ? diffDays : 1
  }

  const getRoomImage = () => {
    if (booking?.room?.image) {
      return `http://localhost:5000${booking.room.image}`
    }
    if (booking?.room?.images && booking.room.images.length > 0) {
      return `http://localhost:5000${booking.room.images[0]}`
    }
    if (booking?.room?.type?.image) {
      return `http://localhost:5000${booking.room.type.image}`
    }
    return 'https://via.placeholder.com/400x300?text=Room+Image'
  }

  const handleDownloadReceipt = () => {
    // TODO: Implement download receipt functionality
    alert('Tính năng tải hóa đơn sẽ được cập nhật sớm')
  }

  const handleAddToCalendar = () => {
    // Create calendar event
    const checkIn = new Date(`${booking.checkInDate}T${booking.checkInTime}`)
    const checkOut = new Date(`${booking.checkOutDate}T${booking.checkOutTime}`)
    
    const startDate = checkIn.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
    const endDate = checkOut.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
    
    const title = encodeURIComponent(`Đặt phòng ${booking.room?.roomNumber || ''} - Aurelius Grand`)
    const details = encodeURIComponent(
      `Mã đặt phòng: ${booking.bookingCode}\n` +
      `Phòng: ${booking.room?.roomNumber || 'N/A'}\n` +
      `Loại: ${booking.room?.type?.name || 'N/A'}`
    )
    const location = encodeURIComponent('Aurelius Grand Hotel')
    
    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDate}/${endDate}&details=${details}&location=${location}`
    
    window.open(googleCalendarUrl, '_blank')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-charcoal/60 dark:text-white/60">Đang tải...</p>
        </div>
      </div>
    )
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
            {error || 'Không tìm thấy thông tin đặt phòng'}
          </div>
          <div className="mt-6">
            <Link to="/" className="text-primary hover:text-primary/80">
              ← Quay về trang chủ
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const nights = calculateNights()
  const roomName = booking.room?.type?.name || `Phòng ${booking.room?.roomNumber || 'N/A'}`

  return (
    <div className="bg-background-light dark:bg-background-dark text-[#161513] dark:text-white transition-colors duration-300 min-h-screen flex flex-col">
      {/* Header */}
      <BookingHeader currentStep={3} />

      <main className="flex-grow max-w-6xl mx-auto px-6 lg:px-12 py-12">
        {/* Confirmation Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center size-16 bg-primary/10 rounded-full mb-6">
            <span className="material-symbols-outlined text-primary text-4xl">check_circle</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-display mb-4">Đặt phòng của bạn đã được xác nhận!</h1>
          <p className="text-lg opacity-60 italic mb-8">Chúng tôi rất vui được chào đón bạn tại Aurelius Grand.</p>
          <div className="inline-block px-8 py-4 bg-white dark:bg-black/20 border border-primary/20 rounded-xl shadow-sm">
            <span className="block text-[10px] uppercase tracking-widest font-bold opacity-50 mb-1">Mã Đặt Phòng</span>
            <span className="text-2xl font-display font-bold tracking-widest text-primary uppercase">{booking.bookingCode}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Left Column - Stay Summary */}
          <div className="lg:col-span-7 space-y-8">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-8 border border-black/5 shadow-sm" style={{
              backgroundImage: 'radial-gradient(circle at top right, rgba(190, 160, 106, 0.05), transparent)'
            }}>
              <h3 className="text-2xl font-display mb-8">Tóm Tắt Đặt Phòng</h3>
              
              {/* Room Info */}
              <div className="flex flex-col md:flex-row gap-8 pb-8 border-b border-black/5">
                <div className="w-full md:w-48 h-32 rounded-lg overflow-hidden shrink-0">
                  <img 
                    alt={roomName} 
                    className="w-full h-full object-cover" 
                    src={getRoomImage()}
                  />
                </div>
                <div className="flex-grow">
                  <h4 className="text-xl font-display mb-2">{roomName}</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="opacity-50 uppercase text-[10px] font-bold tracking-widest mb-1">Nhận Phòng</p>
                      <p className="font-medium">{formatDateShort(booking.checkInDate)}</p>
                      <p className="text-xs opacity-60">{booking.checkInTime}</p>
                    </div>
                    <div>
                      <p className="opacity-50 uppercase text-[10px] font-bold tracking-widest mb-1">Trả Phòng</p>
                      <p className="font-medium">{formatDateShort(booking.checkOutDate)}</p>
                      <p className="text-xs opacity-60">{booking.checkOutTime}</p>
                    </div>
                    <div>
                      <p className="opacity-50 uppercase text-[10px] font-bold tracking-widest mb-1">Khách</p>
                      <p className="font-medium">
                        {booking.adults} {booking.adults === 1 ? 'Người lớn' : 'Người lớn'}
                        {booking.children > 0 && `, ${booking.children} Trẻ em`}
                      </p>
                    </div>
                    <div>
                      <p className="opacity-50 uppercase text-[10px] font-bold tracking-widest mb-1">Thời Gian</p>
                      <p className="font-medium">
                        {booking.bookingType === 'hourly' 
                          ? `${booking.hours} Giờ`
                          : booking.bookingType === 'overnight'
                          ? 'Qua Đêm'
                          : `${nights} ${nights === 1 ? 'Đêm' : 'Đêm'}`
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="mt-8">
                <h4 className="text-sm font-bold uppercase tracking-widest mb-4 opacity-70">Chi Tiết Thanh Toán</h4>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="opacity-60">
                      {booking.bookingType === 'hourly' 
                        ? `Tiền phòng (${booking.hours} giờ)`
                        : booking.bookingType === 'overnight'
                        ? 'Qua đêm'
                        : `Tiền phòng x ${nights} ${nights === 1 ? 'đêm' : 'đêm'}`
                      }
                    </span>
                    <span className="font-medium">{formatPrice(booking.roomPrice)}</span>
                  </div>
                  
                  {booking.amenitiesPrice > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="opacity-60">Tiện ích</span>
                      <span className="font-medium">{formatPrice(booking.amenitiesPrice)}</span>
                    </div>
                  )}
                  
                  {booking.servicesPrice > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="opacity-60">Dịch vụ</span>
                      <span className="font-medium">{formatPrice(booking.servicesPrice)}</span>
                    </div>
                  )}
                  
                  {booking.paymentMethod === 'online' && booking.paidAmount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="opacity-60">Đã thanh toán (Đặt cọc)</span>
                      <span className="font-medium text-green-600 dark:text-green-400">{formatPrice(booking.paidAmount)}</span>
                    </div>
                  )}
                  
                  {booking.paymentMethod === 'online' && booking.remainingAmount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="opacity-60">Còn lại</span>
                      <span className="font-medium">{formatPrice(booking.remainingAmount)}</span>
                    </div>
                  )}
                  
                  <div className="h-px bg-black/5 dark:bg-white/5 my-4"></div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-lg font-display font-bold">Tổng Cộng</span>
                    <span className="text-3xl font-display font-bold text-primary">{formatPrice(booking.totalPrice)}</span>
                  </div>
                  {booking.paymentMethod === 'cash' ? (
                    <p className="text-[10px] text-right opacity-40 italic">Thanh toán tại quầy khi nhận phòng</p>
                  ) : (
                    <p className="text-[10px] text-right opacity-40 italic">
                      {booking.paymentStatus === 'partial' 
                        ? `Đã thanh toán ${formatPrice(booking.paidAmount)} (30% đặt cọc)`
                        : 'Đã thanh toán đầy đủ'
                      }
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - What's Next */}
          <div className="lg:col-span-5 space-y-8">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-8 border border-black/5 shadow-sm">
              <h3 className="text-2xl font-display mb-6">Bước Tiếp Theo?</h3>
              
              <div className="space-y-6 mb-8">
                {/* Check-In Instructions */}
                <div className="flex gap-4">
                  <div className="shrink-0 size-10 bg-primary/5 rounded-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary">key</span>
                  </div>
                  <div>
                    <h5 className="font-bold text-sm uppercase tracking-wide">Hướng Dẫn Nhận Phòng</h5>
                    <p className="text-sm opacity-70 leading-relaxed mt-1">
                      {booking.paymentMethod === 'cash' 
                        ? `Nhận phòng sau ${booking.checkInTime}. Vui lòng mang theo CMND/CCCD và mã đặt phòng ${booking.bookingCode} đến quầy lễ tân để thanh toán và nhận phòng.`
                        : `Nhận phòng sau ${booking.checkInTime}. Vui lòng mang theo CMND/CCCD và mã đặt phòng ${booking.bookingCode} đến quầy lễ tân. ${booking.paymentStatus === 'partial' ? 'Bạn cần thanh toán số tiền còn lại khi nhận phòng.' : ''}`
                      }
                    </p>
                  </div>
                </div>

                {/* Location */}
                <div className="flex gap-4">
                  <div className="shrink-0 size-10 bg-primary/5 rounded-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary">location_on</span>
                  </div>
                  <div className="w-full">
                    <h5 className="font-bold text-sm uppercase tracking-wide">Địa Chỉ</h5>
                    <p className="text-sm opacity-70 leading-relaxed mt-1 mb-3">
                      123 Đường Biển, Thành Phố, Việt Nam
                    </p>
                    <div className="aspect-video w-full rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800 grayscale border border-black/5">
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-4xl opacity-30">map</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 gap-4">
                <button
                  onClick={handleDownloadReceipt}
                  className="w-full py-4 px-6 border border-primary text-primary font-bold uppercase tracking-widest text-xs rounded-lg hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">download</span>
                  Tải Hóa Đơn
                </button>
                <button
                  onClick={handleAddToCalendar}
                  className="w-full py-4 px-6 bg-primary text-white font-bold uppercase tracking-widest text-xs rounded-lg hover:brightness-110 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">calendar_add_on</span>
                  Thêm Vào Lịch
                </button>
              </div>

              {/* Help Section */}
              <div className="mt-8 pt-6 border-t border-black/5 flex items-center justify-between">
                <span className="text-xs font-bold opacity-40 uppercase tracking-widest">Cần hỗ trợ?</span>
                <a className="text-xs font-bold text-primary underline underline-offset-4 uppercase tracking-widest" href="tel:+84123456789">
                  Liên Hệ Lễ Tân
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-24 bg-white dark:bg-background-dark border-t border-black/5 dark:border-white/5 py-16 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="size-5 text-primary">
                <svg fill="currentColor" viewBox="0 0 48 48">
                  <path d="M24 4H6V17.3333V30.6667H24V44H42V30.6667V17.3333H24V4Z"></path>
                </svg>
              </div>
              <h2 className="text-lg font-bold tracking-widest uppercase font-display">Aurelius Grand</h2>
            </div>
            <p className="text-sm opacity-60 leading-relaxed max-w-sm mb-6 font-display italic">
              "Định nghĩa lại bản chất của cuộc sống ven biển thông qua kiến trúc thanh lịch và sự hiếu khách tinh tế."
            </p>
            <div className="flex gap-4">
              <a className="p-2 border border-black/10 dark:border-white/10 rounded-full hover:border-primary hover:text-primary transition-colors" href="#">
                <span className="material-symbols-outlined text-sm">public</span>
              </a>
              <a className="p-2 border border-black/10 dark:border-white/10 rounded-full hover:border-primary hover:text-primary transition-colors" href="#">
                <span className="material-symbols-outlined text-sm">photo_camera</span>
              </a>
            </div>
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest mb-6">Liên Hệ</h4>
            <ul className="space-y-4 text-sm opacity-70">
              <li><a className="hover:text-primary" href="#">Liên Hệ Chúng Tôi</a></li>
              <li><a className="hover:text-primary" href="#">Câu Hỏi Thường Gặp</a></li>
              <li><a className="hover:text-primary" href="#">Báo Chí</a></li>
              <li><a className="hover:text-primary" href="#">Bền Vững</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest mb-6">Địa Chỉ</h4>
            <p className="text-sm opacity-70 leading-relaxed">
              123 Đường Biển,<br/>
              Thành Phố, Việt Nam<br/>
            </p>
            <a className="text-xs font-bold text-primary mt-4 inline-block underline underline-offset-4" href="#">
              Xem Bản Đồ
            </a>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-black/5 dark:border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] uppercase tracking-[0.2em] opacity-40 font-bold">
          <p>© 2024 Aurelius Grand. Bảo lưu mọi quyền.</p>
          <div className="flex gap-8">
            <a href="#">Chính Sách Bảo Mật</a>
            <a href="#">Điều Khoản Dịch Vụ</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default BookingSuccess
