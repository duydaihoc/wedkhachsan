import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import api from '../services/api'
import ImageWithFallback from '../components/ImageWithFallback'

export default function BookingPending() {
  const navigate = useNavigate()
  const location = useLocation()
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const bookingId = location.state?.bookingId

  useEffect(() => {
    if (!bookingId) {
      navigate('/')
      return
    }

    const fetchBooking = async () => {
      try {
        const response = await api.get(`/bookings/${bookingId}`)
        setBooking(response.data)
      } catch (error) {
        console.error('Error fetching booking:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchBooking()
  }, [bookingId, navigate])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Không tìm thấy thông tin đặt phòng</p>
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

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <main className="flex-grow max-w-6xl mx-auto px-6 lg:px-12 py-12">
        <div className="text-center mb-16">
          <div className="relative inline-flex items-center justify-center size-20 mb-6">
            <div className="absolute inset-0 bg-primary/10 rounded-full animate-pulse"></div>
            <span className="material-symbols-outlined text-primary text-5xl relative z-10">schedule</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-display mb-4">Đã Nhận Booking - Đang Chờ Xác Nhận</h1>
          <p className="text-lg opacity-60 italic mb-8">Chúng tôi đang xử lý thông tin đặt phòng của bạn.</p>
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
              <h3 className="text-2xl font-display mb-8">Tóm Tắt Đặt Phòng Chờ Xác Nhận</h3>
              
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
                    <div>
                      <p className="opacity-50 uppercase text-[10px] font-bold tracking-widest mb-1">Khách</p>
                      <p className="font-medium">{booking.numberOfGuests} người</p>
                    </div>
                    <div>
                      <p className="opacity-50 uppercase text-[10px] font-bold tracking-widest mb-1">Loại Đặt</p>
                      <p className="font-medium">
                        {booking.bookingType === 'hourly' ? 'Theo giờ' : 
                         booking.bookingType === 'overnight' ? 'Qua đêm' : 'Theo ngày'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <h4 className="text-sm font-bold uppercase tracking-widest mb-4 opacity-70">Chi Tiết Thanh Toán</h4>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="opacity-60">Tiền phòng</span>
                    <span className="font-medium">{formatPrice(booking.roomPrice)}</span>
                  </div>
                  
                  {booking.amenities?.length > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="opacity-60">Tiện nghi</span>
                      <span className="font-medium">{formatPrice(booking.amenitiesPrice)}</span>
                    </div>
                  )}
                  
                  {booking.services?.length > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="opacity-60">Dịch vụ</span>
                      <span className="font-medium">{formatPrice(booking.servicesPrice)}</span>
                    </div>
                  )}

                  <div className="h-px bg-black/5 dark:bg-white/5 my-4"></div>
                  
                  <div className="flex justify-between items-baseline">
                    <span className="text-lg font-display font-bold">Tổng Tiền</span>
                    <span className="text-3xl font-display font-bold text-primary">
                      {formatPrice(booking.totalPrice)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between text-sm mt-2">
                    <span className="opacity-60">Phương thức thanh toán</span>
                    <span className="font-medium">
                      {booking.paymentMethod === 'online' ? 'Chuyển khoản' : 'Tiền mặt'}
                    </span>
                  </div>
                  
                  <p className="text-[10px] text-right opacity-40 italic mt-4">
                    Đang chờ xác nhận thanh toán
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-8">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-8 border border-black/5 shadow-sm">
              <h3 className="text-2xl font-display mb-6">Các Bước Xác Minh</h3>
              
              <div className="space-y-6 mb-8">
                <div className="flex gap-4">
                  <div className="shrink-0 size-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-xl">account_balance</span>
                  </div>
                  <div>
                    <h5 className="font-bold text-sm uppercase tracking-wide">Xác Minh Thanh Toán</h5>
                    <p className="text-sm opacity-70 leading-relaxed mt-1">
                      Chúng tôi đang xác minh {booking.paymentMethod === 'online' ? 'chuyển khoản ngân hàng' : 'phương thức thanh toán'} của bạn. 
                      Quá trình này thường mất 1-2 giờ làm việc.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="shrink-0 size-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-xl">admin_panel_settings</span>
                  </div>
                  <div>
                    <h5 className="font-bold text-sm uppercase tracking-wide">Duyệt Quản Trị</h5>
                    <p className="text-sm opacity-70 leading-relaxed mt-1">
                      Đội ngũ lễ tân đang kiểm tra tình trạng phòng và các yêu cầu đặc biệt để đảm bảo trải nghiệm tốt nhất.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="shrink-0 size-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-xl">mail</span>
                  </div>
                  <div>
                    <h5 className="font-bold text-sm uppercase tracking-wide">Xác Nhận Cuối Cùng</h5>
                    <p className="text-sm opacity-70 leading-relaxed mt-1">
                      Sau khi được duyệt, bạn sẽ nhận email xác nhận cuối cùng với thông tin chi tiết về việc nhận phòng.
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
                <p className="text-[11px] opacity-40 leading-relaxed text-center uppercase tracking-widest font-bold">
                  Vui lòng giữ mã đặt phòng để tra cứu
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
