import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import BookingHeader from '../components/BookingHeader'

const OnlinePayment = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [bookingId, setBookingId] = useState(null)
  const [booking, setBooking] = useState(null)
  const [cardNumber, setCardNumber] = useState('')
  const [cardName, setCardName] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [cvv, setCvv] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }

    const id = sessionStorage.getItem('bookingId')
    if (!id) {
      navigate('/')
      return
    }

    setBookingId(id)
    fetchBooking(id)
  }, [])

  const fetchBooking = async (id) => {
    try {
      const response = await api.get(`/bookings/${id}`)
      setBooking(response.data)
    } catch (error) {
      setError('Không thể tải thông tin đặt phòng')
      console.error(error)
    }
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price)
  }

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    const matches = v.match(/\d{4,16}/g)
    const match = (matches && matches[0]) || ''
    const parts = []
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4))
    }
    if (parts.length) {
      return parts.join(' ')
    } else {
      return v
    }
  }

  const formatExpiryDate = (value) => {
    const v = value.replace(/\D/g, '')
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4)
    }
    return v
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Validate
    if (cardNumber.replace(/\s/g, '').length < 16) {
      setError('Vui lòng nhập đầy đủ số thẻ')
      setLoading(false)
      return
    }

    if (cardName.length < 3) {
      setError('Vui lòng nhập tên chủ thẻ')
      setLoading(false)
      return
    }

    if (expiryDate.length < 5) {
      setError('Vui lòng nhập ngày hết hạn')
      setLoading(false)
      return
    }

    if (cvv.length < 3) {
      setError('Vui lòng nhập CVV')
      setLoading(false)
      return
    }

    try {
      // Giả lập thanh toán online (trong thực tế sẽ gọi API thanh toán)
      // Sau khi thanh toán thành công, xác nhận với backend
      await api.put(`/bookings/${bookingId}/user-confirm-payment`)
      
      // Sau khi xác nhận thành công, chuyển đến trang đợi xác nhận thanh toán
      sessionStorage.removeItem('bookingId')
      navigate(`/booking/payment-pending/${bookingId}`)
    } catch (error) {
      console.error('Lỗi xác nhận thanh toán:', error)
      setError(error.response?.data?.message || 'Không thể xác nhận thanh toán')
      setLoading(false)
    }
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center">
        <p className="text-charcoal/60 dark:text-white/60">Đang tải...</p>
      </div>
    )
  }

  const depositAmount = Math.round(booking.totalPrice * 0.3)

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark text-[#161513] dark:text-white transition-colors duration-300">
      {/* Header */}
      <BookingHeader currentStep={2} />

      <main className="max-w-4xl mx-auto px-6 lg:px-12 py-12">
        {/* Page Title */}
        <div className="mb-12">
          <h1 className="text-4xl lg:text-5xl font-display mb-2">Thanh Toán Online</h1>
          <p className="text-sm opacity-60 italic font-display">Vui lòng nhập thông tin thẻ để hoàn tất đặt cọc.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left - Payment Form */}
          <div className="lg:col-span-2">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}

            {/* Payment Form */}
            <form onSubmit={handleSubmit} className="bg-white dark:bg-background-dark rounded-2xl shadow-xl shadow-black/5 p-8 border border-black/10 dark:border-white/10 space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <span className="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                  <span className="material-symbols-outlined text-base">credit_card</span>
                </span>
                <h3 className="text-2xl font-display">Thông Tin Thẻ</h3>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold tracking-widest mb-2 opacity-60">
                  Số Thẻ
                </label>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                  placeholder="1234 5678 9012 3456"
                  maxLength={19}
                  className="w-full bg-white dark:bg-background-dark border border-black/10 dark:border-white/10 rounded-lg px-4 py-3 focus:ring-1 focus:ring-primary focus:border-primary transition-all text-sm outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold tracking-widest mb-2 opacity-60">
                  Tên Chủ Thẻ
                </label>
                <input
                  type="text"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value.toUpperCase())}
                  placeholder="NGUYEN VAN A"
                  className="w-full bg-white dark:bg-background-dark border border-black/10 dark:border-white/10 rounded-lg px-4 py-3 focus:ring-1 focus:ring-primary focus:border-primary transition-all text-sm outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-widest mb-2 opacity-60">
                    Ngày Hết Hạn
                  </label>
                  <input
                    type="text"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(formatExpiryDate(e.target.value))}
                    placeholder="MM/YY"
                    maxLength={5}
                    className="w-full bg-white dark:bg-background-dark border border-black/10 dark:border-white/10 rounded-lg px-4 py-3 focus:ring-1 focus:ring-primary focus:border-primary transition-all text-sm outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-widest mb-2 opacity-60">
                    CVV
                  </label>
                  <input
                    type="text"
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 3))}
                    placeholder="123"
                    maxLength={3}
                    className="w-full bg-white dark:bg-background-dark border border-black/10 dark:border-white/10 rounded-lg px-4 py-3 focus:ring-1 focus:ring-primary focus:border-primary transition-all text-sm outline-none"
                    required
                  />
                </div>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4 rounded-lg">
                <div className="flex gap-3">
                  <span className="material-symbols-outlined text-yellow-600 dark:text-yellow-400 text-xl flex-shrink-0">info</span>
                  <p className="text-sm text-yellow-800 dark:text-yellow-300 leading-relaxed">
                    Đây là trang thanh toán giả lập. Không có giao dịch thực tế nào được thực hiện. Bạn có thể nhập bất kỳ số thẻ nào để tiếp tục.
                  </p>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-primary text-white font-bold uppercase tracking-[0.2em] rounded-lg hover:brightness-105 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
              >
                {loading ? (
                  <>
                    <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"></div>
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    Thanh Toán {formatPrice(depositAmount)}
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-2 opacity-40 mt-4">
                <span className="material-symbols-outlined text-sm">lock</span>
                <p className="text-[10px] uppercase tracking-widest font-bold">Thanh Toán Bảo Mật SSL 256-bit</p>
              </div>
            </form>
          </div>

          {/* Right - Payment Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-32 bg-white dark:bg-background-dark rounded-2xl shadow-xl shadow-black/5 py-10 px-8 lg:py-14 lg:px-12 border border-black/10 dark:border-white/10 overflow-hidden w-full min-w-[380px] lg:min-w-[520px] max-w-[600px]">
              <h3 className="text-xl font-display mb-8 pb-6 border-b border-black/5 dark:border-white/5">Chi Tiết Thanh Toán</h3>
              
              <div className="space-y-8 mb-10">
                <div className="flex justify-between items-start text-sm gap-10">
                  <span className="opacity-60 flex-shrink-0 leading-relaxed">Tổng giá trị booking</span>
                  <span className="font-medium text-right whitespace-nowrap">{formatPrice(booking.totalPrice)}</span>
                </div>
                
                <div className="flex justify-between items-start text-sm gap-10">
                  <span className="opacity-60 flex-shrink-0 leading-relaxed">Đặt cọc (30%)</span>
                  <span className="font-medium text-primary text-right whitespace-nowrap">{formatPrice(depositAmount)}</span>
                </div>

                <div className="pt-8 border-t border-black/5 dark:border-white/5">
                  <div className="flex justify-between items-baseline mb-6 gap-10">
                    <span className="text-lg lg:text-xl font-display flex-shrink-0">Thanh Toán Ngay</span>
                    <div className="text-right">
                      <span className="text-3xl lg:text-4xl font-display font-bold text-primary block whitespace-nowrap">
                        {formatPrice(depositAmount)}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs opacity-60 leading-relaxed">
                    Số tiền còn lại: <span className="whitespace-nowrap font-medium">{formatPrice(booking.totalPrice - depositAmount)}</span> sẽ thanh toán khi nhận phòng
                  </p>
                </div>
              </div>

              <div className="bg-background-light dark:bg-white/5 rounded-lg p-5 border border-black/5 dark:border-white/5 mt-8">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-primary text-xl flex-shrink-0">verified</span>
                  <div>
                    <h5 className="text-[10px] uppercase tracking-widest font-bold mb-2">Đảm Bảo An Toàn</h5>
                    <p className="text-xs opacity-60 leading-relaxed">
                      Thông tin thẻ của bạn được mã hóa và bảo mật tuyệt đối. Chúng tôi không lưu trữ thông tin thẻ.
                    </p>
                  </div>
                </div>
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

export default OnlinePayment
