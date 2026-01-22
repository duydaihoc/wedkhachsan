import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import socket from '../services/socket'
import BookingHeader from '../components/BookingHeader'
import ImageWithFallback from '../components/ImageWithFallback'

export default function PaymentPending() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { user } = useAuth()
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }

    if (!id) {
      navigate('/')
      return
    }

    // Kết nối socket nếu chưa kết nối
    if (!socket.connected) {
      socket.connect()
    }
    
    // Join user room nếu chưa join
    if (user?._id) {
      socket.emit('join-user-room', user._id)
    }

    fetchBooking()

    // Lắng nghe cập nhật booking từ socket - chỉ cập nhật state, không tự động chuyển trang
    const handleBookingUpdate = (data) => {
      if (data.booking._id === id) {
        setBooking(data.booking)
      }
    }

    socket.on('booking-updated', handleBookingUpdate)

    return () => {
      socket.off('booking-updated', handleBookingUpdate)
    }
  }, [id, user])

  const fetchBooking = async () => {
    try {
      const response = await api.get(`/bookings/${id}`)
      setBooking(response.data)
      
      // Kiểm tra trạng thái và chuyển trang nếu cần (chỉ khi reload trang)
      if (response.data.status === 'cancelled') {
        // Booking đã bị hủy, không chuyển trang, hiển thị thông báo hủy
        return
      } else if (response.data.status === 'confirmed' && response.data.paymentMethod === 'online') {
        navigate(`/booking/confirmation-pending/${id}`, { replace: true })
      } else if (['checked-in', 'completed'].includes(response.data.status)) {
        navigate(`/booking/success/${id}`, { replace: true })
      }
    } catch (error) {
      console.error('Error fetching booking:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
        <p className="text-charcoal dark:text-white">Không tìm thấy thông tin đặt phòng</p>
      </div>
    )
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    })
  }

  const depositAmount = Math.round(booking.totalPrice * 0.3)

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <BookingHeader currentStep={2} />
      
      <main className="flex-grow max-w-6xl mx-auto px-6 lg:px-12 py-12">
        <div className="text-center mb-16">
          <div className="relative inline-flex items-center justify-center size-20 mb-6">
            <div className="absolute inset-0 bg-primary/10 rounded-full animate-pulse"></div>
            <span className="material-symbols-outlined text-primary text-5xl relative z-10">account_balance</span>
          </div>
          {booking.status === 'cancelled' ? (
            <>
              <h1 className="text-5xl md:text-6xl font-display mb-4 text-red-600 dark:text-red-400 text-center">Xác Nhận Thanh Toán Đã Bị Hủy</h1>
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 max-w-2xl mb-8 mx-auto">
                <div className="flex items-center gap-4">
                  <span className="material-symbols-outlined text-red-600 dark:text-red-400 text-4xl shrink-0">cancel</span>
                  <div className="flex-1">
                    <p className="text-lg font-bold text-red-800 dark:text-red-300 mb-2 leading-relaxed">
                      Xác nhận thanh toán đã bị hủy do lỗi ngân hàng hoặc vấn đề kỹ thuật
                    </p>
                    <p className="text-sm text-red-700 dark:text-red-400 opacity-90 leading-relaxed">
                      Chúng tôi xin lỗi vì sự bất tiện này. Vui lòng liên hệ với chúng tôi nếu bạn cần hỗ trợ.
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <h1 className="text-5xl md:text-6xl font-display mb-4">Đang Chờ Xác Nhận Thanh Toán</h1>
              <p className="text-lg opacity-60 italic mb-8">Chúng tôi đang xác minh giao dịch thanh toán của bạn.</p>
            </>
          )}
          <div className="inline-block px-8 py-4 bg-white dark:bg-black/20 border border-primary/20 rounded-xl shadow-sm">
            <span className="block text-[10px] uppercase tracking-widest font-bold opacity-50 mb-1">Mã Đặt Phòng</span>
            <span className="text-2xl font-display font-bold tracking-widest text-primary uppercase">
              {booking.bookingCode}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-7 space-y-8">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-8 border border-black/5 shadow-sm">
              <h3 className="text-2xl font-display mb-8">Thông Tin Thanh Toán</h3>
              
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row gap-8 pb-8 border-b border-black/5">
                  <div className="w-full md:w-48 h-32 rounded-lg overflow-hidden shrink-0">
                    <ImageWithFallback
                      src={(() => {
                        // Ưu tiên ảnh đại diện
                        if (booking.room?.image) {
                          return `http://localhost:5000${booking.room.image}`
                        }
                        // Nếu không có, lấy ảnh đầu tiên từ mảng images
                        if (booking.room?.images && booking.room.images.length > 0) {
                          const firstImage = booking.room.images[0]
                          // Nếu là object (định dạng mới), lấy url
                          if (typeof firstImage === 'object' && firstImage.url) {
                            return `http://localhost:5000${firstImage.url}`
                          }
                          // Nếu là string (định dạng cũ), dùng trực tiếp
                          if (typeof firstImage === 'string') {
                            return `http://localhost:5000${firstImage}`
                          }
                        }
                        // Nếu không có ảnh, dùng ảnh từ room type
                        if (booking.room?.type?.image) {
                          return `http://localhost:5000${booking.room.type.image}`
                        }
                        return null
                      })()}
                      alt={booking.room?.name || 'Room image'}
                      className="w-full h-full object-cover"
                      fallbackIcon="bed"
                    />
                  </div>
                  <div className="flex-grow">
                    <h4 className="text-xl font-display mb-2">
                      {booking.room?.name || 
                       booking.room?.type?.name || 
                       `Phòng ${booking.room?.roomNumber || 'N/A'}` || 
                       'Phòng không xác định'}
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="opacity-50 uppercase text-[10px] font-bold tracking-widest mb-1">Nhận Phòng</p>
                        <p className="font-medium">{formatDate(booking.checkInDate)} {booking.checkInTime}</p>
                      </div>
                      <div>
                        <p className="opacity-50 uppercase text-[10px] font-bold tracking-widest mb-1">Trả Phòng</p>
                        <p className="font-medium">{formatDate(booking.checkOutDate)} {booking.checkOutTime}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-bold uppercase tracking-widest mb-4 opacity-70">Chi Tiết Thanh Toán</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="opacity-60">Tổng giá trị booking</span>
                      <span className="font-medium">{formatPrice(booking.totalPrice)}</span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="opacity-60">Đặt cọc (30%)</span>
                      <span className="font-medium text-primary">{formatPrice(depositAmount)}</span>
                    </div>

                    <div className="h-px bg-black/5 dark:bg-white/5 my-4"></div>
                    
                    <div className="flex justify-between items-baseline">
                      <span className="text-lg font-display font-bold">Đã Thanh Toán</span>
                      <span className="text-3xl font-display font-bold text-primary">
                        {formatPrice(depositAmount)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between text-sm mt-2">
                      <span className="opacity-60">Còn lại</span>
                      <span className="font-medium">{formatPrice(booking.totalPrice - depositAmount)}</span>
                    </div>
                    
                    <p className="text-[10px] text-right opacity-40 italic mt-4">
                      Đang chờ admin xác nhận đã nhận tiền
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-8">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-8 border border-black/5 shadow-sm">
              <h3 className="text-2xl font-display mb-6">Quy Trình Xác Minh</h3>
              
              <div className="space-y-6 mb-8">
                <div className="flex gap-4">
                  <div className="shrink-0 size-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-xl">payment</span>
                  </div>
                  <div>
                    <h5 className="font-bold text-sm uppercase tracking-wide">Đã Thanh Toán</h5>
                    <p className="text-sm opacity-70 leading-relaxed mt-1">
                      Bạn đã hoàn tất thanh toán đặt cọc 30% qua phương thức online.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="shrink-0 size-10 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-yellow-600 dark:text-yellow-400 text-xl animate-spin">sync</span>
                  </div>
                  <div>
                    <h5 className="font-bold text-sm uppercase tracking-wide">Đang Xác Minh</h5>
                    <p className="text-sm opacity-70 leading-relaxed mt-1">
                      Đội ngũ lễ tân đang xác minh giao dịch thanh toán của bạn. Quá trình này thường mất 1-2 giờ làm việc.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="shrink-0 size-10 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-gray-400 text-xl">admin_panel_settings</span>
                  </div>
                  <div>
                    <h5 className="font-bold text-sm uppercase tracking-wide">Xác Nhận Booking</h5>
                    <p className="text-sm opacity-70 leading-relaxed mt-1">
                      Sau khi xác nhận thanh toán, admin sẽ xác nhận booking của bạn.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <button 
                  onClick={() => navigate('/')}
                  className="w-full py-4 px-6 bg-primary text-white font-bold uppercase tracking-widest text-xs rounded-lg hover:brightness-110 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">home</span>
                  Về Trang Chủ
                </button>
                
                <button 
                  onClick={() => navigate('/my-bookings')}
                  className="w-full py-4 px-6 border border-primary text-primary font-bold uppercase tracking-widest text-xs rounded-lg hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">book_online</span>
                  Xem Booking Của Tôi
                </button>
              </div>

              <div className="mt-8 pt-6 border-t border-black/5">
                <button
                  onClick={() => window.location.reload()}
                  className="w-full py-3 px-6 bg-primary/10 hover:bg-primary/20 text-primary font-bold uppercase tracking-widest text-xs rounded-lg transition-all flex items-center justify-center gap-2 mb-3"
                >
                  <span className="material-symbols-outlined text-sm">refresh</span>
                  Tải Lại Trang
                </button>
                <p className="text-[11px] opacity-40 leading-relaxed text-center uppercase tracking-widest font-bold">
                  Vui lòng tải lại trang để xem cập nhật mới nhất
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
