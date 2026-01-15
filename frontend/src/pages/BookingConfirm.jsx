import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import BookingHeader from '../components/BookingHeader'

const BookingConfirm = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [bookingData, setBookingData] = useState(null)
  const [room, setRoom] = useState(null)
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [guestInfo, setGuestInfo] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    specialRequests: ''
  })

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }

    // Lấy dữ liệu booking từ sessionStorage
    const pendingBooking = sessionStorage.getItem('pendingBooking')
    if (!pendingBooking) {
      navigate('/')
      return
    }

    const data = JSON.parse(pendingBooking)
    setBookingData(data)

    // Fetch thông tin phòng và services
    fetchRoom(data.room)
    fetchServices(data.services || [])
  }, [])

  const fetchRoom = async (roomId) => {
    try {
      const response = await api.get(`/rooms/${roomId}`)
      setRoom(response.data)
    } catch (error) {
      setError('Không thể tải thông tin phòng')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const fetchServices = async (serviceIds) => {
    if (serviceIds.length === 0) return
    
    try {
      const response = await api.get('/services')
      const selectedServices = response.data.filter(s => serviceIds.includes(s._id))
      setServices(selectedServices)
    } catch (error) {
      console.error('Không thể tải thông tin dịch vụ:', error)
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
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const calculateNights = () => {
    if (bookingData?.bookingType === 'hourly') {
      return bookingData.hours || 0
    }
    const checkIn = new Date(bookingData?.checkInDate)
    const checkOut = new Date(bookingData?.checkOutDate)
    const diffTime = Math.abs(checkOut - checkIn)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setGuestInfo(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleContinue = () => {
    // Lưu thông tin khách vào sessionStorage
    const currentBooking = JSON.parse(sessionStorage.getItem('pendingBooking'))
    sessionStorage.setItem('pendingBooking', JSON.stringify({
      ...currentBooking,
      guestInfo
    }))
    navigate('/booking/payment-method')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-4 text-sm uppercase tracking-widest opacity-60">Đang tải...</p>
        </div>
      </div>
    )
  }

  if (error || !bookingData || !room) {
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

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark text-[#161513] dark:text-white transition-colors duration-300">
      {/* Header */}
      <BookingHeader currentStep={1} />

      <main className="max-w-7xl mx-auto px-6 lg:px-12 py-12">
        {/* Page Title */}
        <div className="mb-12">
          <h1 className="text-4xl lg:text-5xl font-display mb-2">Xác Nhận Đặt Phòng</h1>
          <p className="text-sm opacity-60 italic font-display">Vui lòng kiểm tra thông tin trước khi thanh toán.</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-12">
          {/* Left Column */}
          <div className="w-full lg:w-2/3 space-y-12">
            {/* Guest Information */}
            <section>
              <div className="flex items-center gap-3 mb-8">
                <span className="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">01</span>
                <h3 className="text-2xl font-display">Thông Tin Khách Hàng</h3>
              </div>
              <form className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-1">
                  <label htmlFor="fullName" className="block text-[10px] uppercase font-bold tracking-widest mb-2 opacity-60">
                    Họ và Tên
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={guestInfo.fullName}
                    onChange={handleInputChange}
                    className="w-full bg-white dark:bg-background-dark border border-black/10 dark:border-white/10 rounded-lg px-4 py-3 focus:ring-1 focus:ring-primary focus:border-primary transition-all text-sm outline-none"
                    placeholder="Nguyễn Văn A"
                  />
                </div>
                <div className="col-span-1">
                  <label htmlFor="email" className="block text-[10px] uppercase font-bold tracking-widest mb-2 opacity-60">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={guestInfo.email}
                    onChange={handleInputChange}
                    className="w-full bg-white dark:bg-background-dark border border-black/10 dark:border-white/10 rounded-lg px-4 py-3 focus:ring-1 focus:ring-primary focus:border-primary transition-all text-sm outline-none"
                    placeholder="email@example.com"
                  />
                </div>
                <div className="col-span-1">
                  <label htmlFor="phone" className="block text-[10px] uppercase font-bold tracking-widest mb-2 opacity-60">
                    Số Điện Thoại
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={guestInfo.phone}
                    onChange={handleInputChange}
                    className="w-full bg-white dark:bg-background-dark border border-black/10 dark:border-white/10 rounded-lg px-4 py-3 focus:ring-1 focus:ring-primary focus:border-primary transition-all text-sm outline-none"
                    placeholder="0912 345 678"
                  />
                </div>
                <div className="col-span-2">
                  <label htmlFor="specialRequests" className="block text-[10px] uppercase font-bold tracking-widest mb-2 opacity-60">
                    Yêu Cầu Đặc Biệt
                  </label>
                  <textarea
                    id="specialRequests"
                    name="specialRequests"
                    value={guestInfo.specialRequests}
                    onChange={handleInputChange}
                    rows="4"
                    className="w-full bg-white dark:bg-background-dark border border-black/10 dark:border-white/10 rounded-lg px-4 py-3 focus:ring-1 focus:ring-primary focus:border-primary transition-all text-sm outline-none resize-none"
                    placeholder="Cho chúng tôi biết nếu bạn có yêu cầu đặc biệt về phòng hoặc dịch vụ..."
                  ></textarea>
                </div>
              </form>
            </section>

            {/* Booking Summary */}
            <section>
              <div className="flex items-center gap-3 mb-8">
                <span className="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">02</span>
                <h3 className="text-2xl font-display">Chi Tiết Đặt Phòng</h3>
              </div>
              <div className="bg-white dark:bg-background-dark border border-black/5 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm flex flex-col md:flex-row">
                {/* Room Image */}
                <div className="w-full md:w-1/3 h-48 md:h-auto overflow-hidden">
                  <div 
                    className="w-full h-full bg-cover bg-center"
                    style={{
                      backgroundImage: room.images && room.images[0] 
                        ? `url(${room.images[0]})` 
                        : 'url(https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800)'
                    }}
                  ></div>
                </div>
                
                {/* Room Details */}
                <div className="p-8 flex-1 flex flex-col justify-center">
                  <h4 className="text-xl font-display mb-4">
                    Phòng {room.roomNumber} - {room.type?.name || 'N/A'}
                  </h4>
                  <div className="grid grid-cols-2 gap-y-4">
                    <div>
                      <label className="block text-[10px] uppercase font-bold tracking-widest mb-1 opacity-60">Nhận Phòng</label>
                      <p className="text-sm font-medium">
                        {formatDate(bookingData.checkInDate)}
                      </p>
                      <p className="text-xs opacity-60">{bookingData.checkInTime}</p>
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold tracking-widest mb-1 opacity-60">Trả Phòng</label>
                      <p className="text-sm font-medium">
                        {formatDate(bookingData.checkOutDate)}
                      </p>
                      <p className="text-xs opacity-60">{bookingData.checkOutTime}</p>
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold tracking-widest mb-1 opacity-60">Khách</label>
                      <p className="text-sm font-medium">
                        {bookingData.adults} Người lớn
                        {bookingData.children > 0 && `, ${bookingData.children} Trẻ em`}
                      </p>
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold tracking-widest mb-1 opacity-60">
                        {bookingData.bookingType === 'hourly' ? 'Số Giờ' : 'Số Đêm'}
                      </label>
                      <p className="text-sm font-medium">
                        {calculateNights()} {bookingData.bookingType === 'hourly' ? 'giờ' : 'đêm'}
                      </p>
                    </div>
                  </div>

                  {/* Additional Services */}
                  {services.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-black/5 dark:border-white/5">
                      <label className="block text-[10px] uppercase font-bold tracking-widest mb-3 opacity-60">Dịch Vụ Đã Chọn</label>
                      <div className="flex flex-wrap gap-2">
                        {services.map((service) => (
                          <span key={service._id} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
                            {service.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>

          {/* Right Column - Price Summary */}
          <div className="w-full lg:w-1/3">
            <div className="sticky top-32 p-8 bg-white dark:bg-background-dark border border-black/10 dark:border-white/10 rounded-2xl shadow-xl shadow-black/5">
              <h3 className="text-xl font-display mb-6 pb-4 border-b border-black/5 dark:border-white/5">Tổng Chi Phí</h3>
              
              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center text-sm">
                  <span className="opacity-60">Giá Phòng</span>
                  <span className="font-medium">{formatPrice(bookingData.roomPrice)}</span>
                </div>
                
                {bookingData.amenitiesPrice > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="opacity-60">Tiện Ích</span>
                    <span className="font-medium">{formatPrice(bookingData.amenitiesPrice)}</span>
                  </div>
                )}
                
                {bookingData.servicesPrice > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="opacity-60">Dịch Vụ</span>
                    <span className="font-medium">{formatPrice(bookingData.servicesPrice)}</span>
                  </div>
                )}
                
                <div className="pt-6 border-t border-black/5 dark:border-white/5">
                  <div className="flex justify-between items-baseline">
                    <span className="text-lg font-display">Tổng Cộng</span>
                    <div className="text-right">
                      <span className="text-3xl font-display font-bold text-primary block">
                        {formatPrice(bookingData.totalPrice)}
                      </span>
                      <span className="text-[10px] uppercase tracking-widest opacity-40">Đã bao gồm thuế</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <button
                  onClick={handleContinue}
                  className="w-full py-4 bg-primary text-white font-bold uppercase tracking-[0.2em] rounded-lg hover:brightness-105 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 text-sm"
                >
                  Tiếp Tục Thanh Toán
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
                
                <Link
                  to={`/rooms/${room._id}`}
                  className="block w-full py-3 text-center border border-black/10 dark:border-white/10 rounded-lg hover:border-primary hover:text-primary transition-all text-sm uppercase tracking-[0.2em] font-bold"
                >
                  Quay Lại
                </Link>
                
                <div className="flex items-center justify-center gap-2 opacity-40 mt-4">
                  <span className="material-symbols-outlined text-sm">lock</span>
                  <p className="text-[10px] uppercase tracking-widest font-bold">Thanh Toán Bảo Mật</p>
                </div>
              </div>

              <div className="mt-8 p-4 bg-background-light dark:bg-white/5 rounded-lg border border-black/5 dark:border-white/5">
                <h5 className="text-[10px] uppercase tracking-widest font-bold mb-2">Chính Sách Hủy</h5>
                <p className="text-xs opacity-60 leading-relaxed italic">
                  Miễn phí hủy phòng trước 24 giờ. Sau thời gian này sẽ tính phí 50% tổng giá trị đặt phòng.
                </p>
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
              "Nơi sang trọng hòa quyện với sự thoải mái, mang đến trải nghiệm nghỉ dưỡng đẳng cấp."
            </p>
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest mb-6">Liên Hệ</h4>
            <ul className="space-y-4 text-sm opacity-70">
              <li><Link to="/contact" className="hover:text-primary transition-colors">Liên Hệ</Link></li>
              <li><Link to="/faq" className="hover:text-primary transition-colors">FAQ</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest mb-6">Địa Chỉ</h4>
            <p className="text-sm opacity-70 leading-relaxed">
              123 Đường Biển<br/>
              Thành Phố Đà Nẵng<br/>
              Việt Nam
            </p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-black/5 dark:border-white/5 text-center text-[10px] uppercase tracking-[0.2em] opacity-40 font-bold">
          <p>© 2026 Aurelius Grand Hotel. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

export default BookingConfirm
