import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import BookingHeader from '../components/BookingHeader'

const GuestBookingInfo = () => {
    const navigate = useNavigate()
    const { user } = useAuth()
    const [bookingData, setBookingData] = useState(null)
    const [guestInfo, setGuestInfo] = useState({
        fullName: '',
        phone: '',
        email: ''
    })
    const [error, setError] = useState('')

    useEffect(() => {
        // Nếu user đã đăng nhập, chuyển thẳng đến trang xác nhận
        if (user) {
            navigate('/booking/confirm')
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
    }, [user, navigate])

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setGuestInfo(prev => ({
            ...prev,
            [name]: value
        }))
        setError('')
    }

    const handleContinue = (e) => {
        e.preventDefault()

        // Validate
        if (!guestInfo.fullName.trim()) {
            setError('Vui lòng nhập họ và tên')
            return
        }

        if (!guestInfo.phone.trim()) {
            setError('Vui lòng nhập số điện thoại')
            return
        }

        // Validate phone number (simple check)
        const phoneRegex = /^[0-9]{10,11}$/
        if (!phoneRegex.test(guestInfo.phone.replace(/\s/g, ''))) {
            setError('Số điện thoại không hợp lệ (10-11 số)')
            return
        }

        // Validate email if provided
        if (guestInfo.email && guestInfo.email.trim()) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            if (!emailRegex.test(guestInfo.email)) {
                setError('Email không hợp lệ')
                return
            }
        }

        // Lưu thông tin khách vào sessionStorage
        const currentBooking = JSON.parse(sessionStorage.getItem('pendingBooking'))
        sessionStorage.setItem('pendingBooking', JSON.stringify({
            ...currentBooking,
            guestInfo
        }))

        // Chuyển thẳng đến trang chọn phương thức thanh toán (bỏ qua trang confirm)
        navigate('/booking/payment-method')
    }

    if (!bookingData) {
        return (
            <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
                    <p className="mt-4 text-sm uppercase tracking-widest opacity-60">Đang tải...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark text-[#161513] dark:text-white transition-colors duration-300">
            {/* Header */}
            <BookingHeader currentStep={0} />

            <main className="max-w-4xl mx-auto px-6 lg:px-12 py-12">
                {/* Page Title */}
                <div className="mb-12 text-center">
                    <h1 className="text-4xl lg:text-5xl font-display mb-4">Thông Tin Khách Hàng</h1>
                    <p className="text-sm opacity-60 italic font-display">
                        Vui lòng nhập thông tin của bạn để tiếp tục đặt phòng
                    </p>
                </div>

                {/* Info Card */}
                <div className="bg-white dark:bg-background-dark border border-black/10 dark:border-white/10 rounded-2xl shadow-xl shadow-black/5 p-8 lg:p-12">
                    {/* Icon */}
                    <div className="flex justify-center mb-8">
                        <div className="size-20 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="material-symbols-outlined text-primary text-4xl">person</span>
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleContinue} className="space-y-6">
                        {/* Full Name */}
                        <div>
                            <label htmlFor="fullName" className="block text-[10px] uppercase font-bold tracking-widest mb-2 opacity-60">
                                Họ và Tên <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                id="fullName"
                                name="fullName"
                                value={guestInfo.fullName}
                                onChange={handleInputChange}
                                className="w-full bg-white dark:bg-background-dark border border-black/10 dark:border-white/10 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm outline-none"
                                placeholder="Nguyễn Văn A"
                                required
                            />
                        </div>

                        {/* Phone */}
                        <div>
                            <label htmlFor="phone" className="block text-[10px] uppercase font-bold tracking-widest mb-2 opacity-60">
                                Số Điện Thoại <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="tel"
                                id="phone"
                                name="phone"
                                value={guestInfo.phone}
                                onChange={handleInputChange}
                                className="w-full bg-white dark:bg-background-dark border border-black/10 dark:border-white/10 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm outline-none"
                                placeholder="0912 345 678"
                                required
                            />
                        </div>

                        {/* Email (Optional) */}
                        <div>
                            <label htmlFor="email" className="block text-[10px] uppercase font-bold tracking-widest mb-2 opacity-60">
                                Email (Không bắt buộc)
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={guestInfo.email}
                                onChange={handleInputChange}
                                className="w-full bg-white dark:bg-background-dark border border-black/10 dark:border-white/10 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm outline-none"
                                placeholder="email@example.com"
                            />
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        {/* Info Box */}
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 px-4 py-3 rounded-lg text-sm">
                            <div className="flex items-start gap-2">
                                <span className="material-symbols-outlined text-lg mt-0.5">info</span>
                                <div>
                                    <p className="font-medium mb-1">Lưu ý:</p>
                                    <ul className="list-disc list-inside space-y-1 text-xs opacity-80">
                                        <li>Thông tin của bạn sẽ được sử dụng để xác nhận đặt phòng</li>
                                        <li>Vui lòng cung cấp số điện thoại chính xác để chúng tôi có thể liên hệ</li>
                                        <li>Bạn chỉ có thể thanh toán bằng tiền mặt tại quầy</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 pt-6">
                            <button
                                type="button"
                                onClick={() => navigate(-1)}
                                className="flex-1 py-4 border border-black/10 dark:border-white/10 rounded-lg hover:border-primary hover:text-primary transition-all text-sm uppercase tracking-[0.2em] font-bold"
                            >
                                Quay Lại
                            </button>
                            <button
                                type="submit"
                                className="flex-1 py-4 bg-primary text-white font-bold uppercase tracking-[0.2em] rounded-lg hover:brightness-105 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 text-sm"
                            >
                                Tiếp Tục
                                <span className="material-symbols-outlined text-sm">arrow_forward</span>
                            </button>
                        </div>
                    </form>
                </div>

                {/* Login Option */}
                <div className="mt-8 text-center">
                    <p className="text-sm opacity-60 mb-3">Bạn đã có tài khoản?</p>
                    <Link
                        to="/login"
                        state={{ from: window.location.pathname }}
                        className="text-primary hover:text-primary/80 font-medium text-sm underline"
                    >
                        Đăng nhập để đặt phòng nhanh hơn
                    </Link>
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
                            123 Đường Biển<br />
                            Thành Phố Đà Nẵng<br />
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

export default GuestBookingInfo
