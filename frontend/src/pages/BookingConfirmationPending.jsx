import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import socket from '../services/socket'
import BookingHeader from '../components/BookingHeader'
import ImageWithFallback from '../components/ImageWithFallback'

export default function BookingConfirmationPending() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { user } = useAuth()
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refundRequired, setRefundRequired] = useState(false)

  useEffect(() => {
    if (!id) {
      navigate('/')
      return
    }

    fetchBooking()

    // Lắng nghe cập nhật booking từ socket
    const handleBookingUpdate = (data) => {
      if (data.booking._id === id) {
        setBooking(data.booking)

        // Nếu booking bị hủy
        if (data.cancelled || data.booking.status === 'cancelled') {
          // Kiểm tra xem có cần hoàn tiền không
          if (data.refundRequired) {
            setRefundRequired(true)
          }
          // Không chuyển trang, chỉ cập nhật state để hiển thị thông báo hủy
          return
        }

        // Nếu admin đã xác nhận booking (bookingConfirmed = true), chuyển đến trang success
        if (data.booking.bookingConfirmed && data.booking.status === 'confirmed') {
          // Chuyển đến trang success ngay lập tức (dùng window.location.replace để tránh nháy)
          window.location.replace(`/booking/success/${id}`)
        }
      }
    }

    // Chỉ kết nối socket nếu có user (khách đã đăng nhập)
    if (user) {
      if (socket.connected) {
        socket.on('booking-updated', handleBookingUpdate)
      } else {
        socket.connect()
        socket.once('connect', () => {
          if (user?._id) {
            socket.emit('join-user-room', user._id)
          }
          socket.on('booking-updated', handleBookingUpdate)
        })
      }
    }

    return () => {
      if (user) {
        socket.off('booking-updated', handleBookingUpdate)
      }
    }
  }, [id, user, navigate])

  const fetchBooking = async () => {
    try {
      let response;
      if (user) {
        response = await api.get(`/bookings/${id}`)
      } else {
        // Dùng axios trực tiếp gọi API public cho khách vãng lai
        const API_URL = 'http://localhost:5000/api';
        const axiosLib = await import('axios');
        const axios = axiosLib.default;
        response = await axios.get(`${API_URL}/bookings/public/${id}`);
      }

      setBooking(response.data)

      // Kiểm tra trạng thái và chuyển trang nếu cần (chỉ khi reload trang)
      if (response.data.status === 'cancelled') {
        // Booking đã bị hủy, không chuyển trang, hiển thị thông báo hủy
        // Kiểm tra xem có cần hoàn tiền không (đã xác nhận thanh toán trước đó)
        // Booking đã confirmed trước đó và có paidAmount > 0 thì cần hoàn tiền
        if (response.data.paymentMethod === 'online' && response.data.paidAmount > 0) {
          setRefundRequired(true)
        }
        // Không return, để tiếp tục render trang với thông báo hủy
      } else if (response.data.status === 'payment-pending' ||
        (response.data.status === 'pending' && response.data.paymentMethod === 'online')) {
        navigate(`/booking/payment-pending/${id}`, { replace: true })
        return
      } else if (response.data.bookingConfirmed && response.data.status === 'confirmed') {
        // Booking đã được xác nhận (cho cả online và cash), chuyển đến trang success (hoàn tất)
        // Dùng window.location để tránh nháy trang
        window.location.replace(`/booking/success/${id}`)
        return
      } else if (['checked-in', 'completed'].includes(response.data.status)) {
        // Nếu đã check-in hoặc completed, cũng chuyển đến trang success
        window.location.replace(`/booking/success/${id}`)
        return
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


  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <BookingHeader currentStep={3} />

      <main className="flex-grow max-w-6xl mx-auto px-6 lg:px-12 py-12">
        <div className="text-center mb-16">
          <div className="relative inline-flex items-center justify-center size-20 mb-6">
            <div className="absolute inset-0 bg-primary/10 rounded-full animate-pulse"></div>
            <span className="material-symbols-outlined text-primary text-5xl relative z-10">admin_panel_settings</span>
          </div>
          {booking.status === 'cancelled' ? (
            <>
              <h1 className="text-5xl md:text-6xl font-display mb-4 text-red-600 dark:text-red-400 text-center">Booking Đã Bị Hủy</h1>
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 max-w-2xl mb-8 mx-auto">
                <div className="flex items-center gap-4">
                  <span className="material-symbols-outlined text-red-600 dark:text-red-400 text-4xl shrink-0">cancel</span>
                  <div className="flex-1">
                    <p className="text-lg font-bold text-red-800 dark:text-red-300 mb-2 leading-relaxed">
                      Admin đã hủy xác nhận đặt phòng của bạn
                    </p>
                    <p className="text-sm text-red-700 dark:text-red-400 opacity-90 leading-relaxed mb-3">
                      Booking của bạn đã bị hủy bởi quản trị viên. Nếu bạn có thắc mắc, vui lòng liên hệ với chúng tôi.
                    </p>
                    {/* Thông báo hoàn tiền cho booking online đã xác nhận thanh toán trước đó */}
                    {booking.paymentMethod === 'online' && booking.paidAmount > 0 && (
                      <div className="mt-4 pt-4 border-t border-red-200 dark:border-red-800">
                        <p className="text-sm font-medium text-red-800 dark:text-red-300 leading-relaxed">
                          {refundRequired
                            ? '💰 Nhân viên sẽ sớm liên hệ bạn để hoàn tiền lại cho bạn, cảm ơn bạn.'
                            : '💰 Nhân viên sẽ liên hệ với bạn để hoàn tiền cọc phòng, cảm ơn bạn.'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <h1 className="text-5xl md:text-6xl font-display mb-4">Đang Chờ Xác Nhận Booking</h1>
              <p className="text-lg opacity-60 italic mb-8">
                {booking.paymentMethod === 'online'
                  ? 'Thanh toán đã được xác nhận. Đang chờ admin xác nhận booking.'
                  : 'Đang chờ admin xác nhận booking. Bạn sẽ thanh toán khi nhận phòng.'}
              </p>
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
              <h3 className="text-2xl font-display mb-8">Tóm Tắt Đặt Phòng</h3>

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
                      <p className="font-medium">{booking.adults} người lớn{booking.children > 0 ? `, ${booking.children} trẻ em` : ''}</p>
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

                  {booking.paymentMethod === 'online' && (
                    <>
                      <div className="flex justify-between text-sm mt-2">
                        <span className="opacity-60">Đã thanh toán (Đặt cọc)</span>
                        <span className="font-medium text-green-600 dark:text-green-400">{formatPrice(booking.paidAmount)}</span>
                      </div>

                      {booking.remainingAmount > 0 && (
                        <div className="flex justify-between text-sm mt-2">
                          <span className="opacity-60">Còn lại</span>
                          <span className="font-medium">{formatPrice(booking.remainingAmount)}</span>
                        </div>
                      )}

                      <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-green-600 dark:text-green-400">check_circle</span>
                          <p className="text-sm text-green-800 dark:text-green-300 font-medium">
                            Thanh toán đã được xác nhận
                          </p>
                        </div>
                      </div>
                    </>
                  )}

                  {booking.paymentMethod === 'cash' && (
                    <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">info</span>
                        <p className="text-sm text-blue-800 dark:text-blue-300 font-medium">
                          Bạn sẽ thanh toán khi nhận phòng tại quầy lễ tân
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-8">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-8 border border-black/5 shadow-sm">
              <h3 className="text-2xl font-display mb-6">Các Bước Tiếp Theo</h3>

              <div className="space-y-6 mb-8">
                {booking.paymentMethod === 'online' && (
                  <div className="flex gap-4">
                    <div className="shrink-0 size-10 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                      <span className="material-symbols-outlined text-green-600 dark:text-green-400 text-xl">check_circle</span>
                    </div>
                    <div>
                      <h5 className="font-bold text-sm uppercase tracking-wide">Thanh Toán Đã Xác Nhận</h5>
                      <p className="text-sm opacity-70 leading-relaxed mt-1">
                        Đặt cọc của bạn đã được xác nhận thành công.
                      </p>
                    </div>
                  </div>
                )}

                {booking.paymentMethod === 'cash' && (
                  <div className="flex gap-4">
                    <div className="shrink-0 size-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="material-symbols-outlined text-primary text-xl">receipt</span>
                    </div>
                    <div>
                      <h5 className="font-bold text-sm uppercase tracking-wide">Đã Tạo Booking</h5>
                      <p className="text-sm opacity-70 leading-relaxed mt-1">
                        Booking của bạn đã được tạo thành công. Đang chờ admin xác nhận.
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex gap-4">
                  <div className="shrink-0 size-10 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-yellow-600 dark:text-yellow-400 text-xl animate-spin">sync</span>
                  </div>
                  <div>
                    <h5 className="font-bold text-sm uppercase tracking-wide">Đang Xác Nhận Booking</h5>
                    <p className="text-sm opacity-70 leading-relaxed mt-1">
                      Đội ngũ lễ tân đang kiểm tra tình trạng phòng và xác nhận booking của bạn. Quá trình này thường mất vài phút.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="shrink-0 size-10 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-gray-400 text-xl">key</span>
                  </div>
                  <div>
                    <h5 className="font-bold text-sm uppercase tracking-wide">Sẵn Sàng Nhận Phòng</h5>
                    <p className="text-sm opacity-70 leading-relaxed mt-1">
                      Sau khi được xác nhận, bạn sẽ nhận thông báo và có thể đến nhận phòng theo thời gian đã đặt.
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

                {user && (
                  <button
                    onClick={() => navigate('/my-bookings')}
                    className="w-full py-4 px-6 border border-primary text-primary font-bold uppercase tracking-widest text-xs rounded-lg hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-sm">book_online</span>
                    Xem Booking Của Tôi
                  </button>
                )}
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
