import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import BookingHeader from '../components/BookingHeader'

const PaymentMethod = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [bookingData, setBookingData] = useState(null)
  const [selectedMethod, setSelectedMethod] = useState('cash')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }

    const pendingBooking = sessionStorage.getItem('pendingBooking')
    if (!pendingBooking) {
      navigate('/')
      return
    }

    setBookingData(JSON.parse(pendingBooking))
  }, [])

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price)
  }

  const handleSubmit = async () => {
    if (!bookingData) return

    setLoading(true)
    setError('')

    try {
      // Tạo booking với payment method
      const bookingPayload = {
        ...bookingData,
        paymentMethod: selectedMethod
      }

      const response = await api.post('/bookings', bookingPayload)

      // Xóa pending booking
      sessionStorage.removeItem('pendingBooking')

      if (selectedMethod === 'online') {
        // Chuyển đến trang thanh toán online
        sessionStorage.setItem('bookingId', response.data._id)
        navigate('/booking/online-payment')
      } else {
        // Thanh toán tại quầy: hiển thị mã booking
        navigate(`/booking/success/${response.data._id}`)
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Không thể tạo đặt phòng')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  if (!bookingData) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center">
        <p className="text-charcoal/60 dark:text-white/60">Đang tải...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark text-[#161513] dark:text-white transition-colors duration-300">
      {/* Header */}
      <BookingHeader currentStep={2} />

      <main className="max-w-4xl mx-auto px-6 lg:px-12 py-12">
        {/* Page Title */}
        <div className="mb-12">
          <h1 className="text-4xl lg:text-5xl font-display mb-2">Chọn Phương Thức Thanh Toán</h1>
          <p className="text-sm opacity-60 italic font-display">Vui lòng chọn phương thức thanh toán phù hợp với bạn.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg">
            {error}
          </div>
        )}

        {/* Payment Methods */}
        <div className="space-y-6 mb-8">
          {/* Cash Payment */}
          <div
            onClick={() => setSelectedMethod('cash')}
            className={`p-8 bg-white dark:bg-background-dark rounded-2xl border-2 cursor-pointer transition-all shadow-sm hover:shadow-lg ${
              selectedMethod === 'cash'
                ? 'border-primary bg-primary/5 dark:bg-primary/10'
                : 'border-black/5 dark:border-white/5 hover:border-primary/30'
            }`}
          >
            <div className="flex items-start gap-6">
              <div className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                selectedMethod === 'cash'
                  ? 'border-primary'
                  : 'border-black/20 dark:border-white/20'
              }`}>
                {selectedMethod === 'cash' && (
                  <div className="w-3 h-3 rounded-full bg-primary"></div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-2xl font-display">Thanh Toán Tại Quầy</h3>
                  <span className="material-symbols-outlined text-2xl text-primary">payments</span>
                </div>
                <p className="text-sm opacity-60 leading-relaxed">
                  Thanh toán trực tiếp khi nhận phòng. Bạn sẽ nhận mã đặt phòng ngay sau khi xác nhận. 
                  Phương thức này phù hợp nếu bạn muốn thanh toán bằng tiền mặt hoặc thẻ tại khách sạn.
                </p>
              </div>
            </div>
          </div>

          {/* Online Payment */}
          <div
            onClick={() => setSelectedMethod('online')}
            className={`p-8 bg-white dark:bg-background-dark rounded-2xl border-2 cursor-pointer transition-all shadow-sm hover:shadow-lg ${
              selectedMethod === 'online'
                ? 'border-primary bg-primary/5 dark:bg-primary/10'
                : 'border-black/5 dark:border-white/5 hover:border-primary/30'
            }`}
          >
            <div className="flex items-start gap-6">
              <div className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                selectedMethod === 'online'
                  ? 'border-primary'
                  : 'border-black/20 dark:border-white/20'
              }`}>
                {selectedMethod === 'online' && (
                  <div className="w-3 h-3 rounded-full bg-primary"></div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-2xl font-display">Thanh Toán Online</h3>
                  <span className="material-symbols-outlined text-2xl text-primary">credit_card</span>
                </div>
                <p className="text-sm opacity-60 leading-relaxed mb-4">
                  Đặt cọc 30% trực tuyến để đảm bảo đặt phòng. Thanh toán số tiền còn lại khi nhận phòng.
                  Phương thức này giúp bạn giữ chỗ an toàn và linh hoạt.
                </p>
                <div className="bg-primary/10 dark:bg-primary/20 px-4 py-3 rounded-lg inline-block">
                  <p className="text-[10px] uppercase tracking-widest font-bold opacity-60 mb-1">Số tiền đặt cọc</p>
                  <p className="text-xl font-display font-bold text-primary">
                    {formatPrice(Math.round(bookingData.totalPrice * 0.3))}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Price Summary */}
        <div className="bg-white dark:bg-background-dark rounded-2xl shadow-xl shadow-black/5 p-8 border border-black/10 dark:border-white/10 mb-8">
          <h3 className="text-xl font-display mb-6 pb-4 border-b border-black/5 dark:border-white/5">Tổng Thanh Toán</h3>
          
          <div className="flex justify-between items-baseline mb-6">
            <span className="text-lg font-display">Tổng Cộng</span>
            <div className="text-right">
              <span className="text-3xl font-display font-bold text-primary block">
                {formatPrice(bookingData.totalPrice)}
              </span>
              <span className="text-[10px] uppercase tracking-widest opacity-40">Đã bao gồm thuế</span>
            </div>
          </div>

          {selectedMethod === 'online' && (
            <div className="pt-6 border-t border-black/5 dark:border-white/5 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="opacity-60">Đặt cọc ngay (30%)</span>
                <span className="font-medium">{formatPrice(Math.round(bookingData.totalPrice * 0.3))}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="opacity-60">Thanh toán khi nhận phòng (70%)</span>
                <span className="font-medium">{formatPrice(Math.round(bookingData.totalPrice * 0.7))}</span>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            to="/booking/confirm"
            className="flex-1 py-4 border border-black/10 dark:border-white/10 text-center font-bold uppercase tracking-[0.2em] rounded-lg hover:border-primary hover:text-primary transition-all text-sm"
          >
            Quay Lại
          </Link>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-4 bg-primary text-white font-bold uppercase tracking-[0.2em] rounded-lg hover:brightness-105 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
          >
            {loading ? (
              <>
                <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"></div>
                Đang xử lý...
              </>
            ) : (
              <>
                Xác Nhận Đặt Phòng
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </>
            )}
          </button>
        </div>

        {/* Security Badge */}
        <div className="flex items-center justify-center gap-2 opacity-40 mt-6">
          <span className="material-symbols-outlined text-sm">lock</span>
          <p className="text-[10px] uppercase tracking-widest font-bold">Thanh Toán Bảo Mật SSL</p>
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

export default PaymentMethod
