import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

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
        if (user) {
            navigate('/booking/confirm')
            return
        }
        const pendingBooking = sessionStorage.getItem('pendingBooking')
        if (!pendingBooking) {
            navigate('/')
            return
        }
        const data = JSON.parse(pendingBooking)
        // Normalize rentalType from bookingType if needed
        if (!data.rentalType && data.bookingType) {
            data.rentalType = data.bookingType
        }
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

        if (!guestInfo.fullName.trim()) { setError('Vui lòng nhập họ và tên'); return }
        if (!guestInfo.phone.trim()) { setError('Vui lòng nhập số điện thoại'); return }
        const phoneRegex = /^[0-9]{10,11}$/
        if (!phoneRegex.test(guestInfo.phone.replace(/\s/g, ''))) { setError('Số điện thoại không hợp lệ (10-11 số)'); return }
        if (guestInfo.email && guestInfo.email.trim()) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            if (!emailRegex.test(guestInfo.email)) { setError('Email không hợp lệ'); return }
        }

        const currentBooking = JSON.parse(sessionStorage.getItem('pendingBooking'))
        sessionStorage.setItem('pendingBooking', JSON.stringify({
            ...currentBooking,
            guestInfo
        }))

        navigate('/booking/payment-method')
    }

    const formatDate = (dateString) => {
        if (!dateString) return ''
        return new Date(dateString).toLocaleDateString('vi-VN')
    }

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)
    }

    if (!bookingData) {
        return (
            <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em]"></div>
                    <p className="mt-4 text-sm uppercase tracking-widest opacity-60 dark:text-white">Đang tải...</p>
                </div>
            </div>
        )
    }

    const getImageUrl = (path) => {
        if (!path) return 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?q=80&w=2698&auto=format&fit=crop'
        const urlStr = typeof path === 'object' ? path.url : path
        if (!urlStr) return 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?q=80&w=2698&auto=format&fit=crop'
        if (urlStr.startsWith('http')) return urlStr
        return `http://localhost:5000${urlStr.startsWith('/') ? '' : '/'}${urlStr}`
    }

    const roomImage = getImageUrl(bookingData.room?.images?.[0])

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark text-[#161513] dark:text-white transition-colors duration-300 font-sans">
            {/* ... */}

            {/* Header */}
            <header className="sticky top-0 z-50 bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-md border-b border-black/5 dark:border-white/5">
                <div className="max-w-7xl mx-auto px-6 lg:px-12 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link to="/" className="flex items-center gap-3">
                            <div className="size-6 text-primary">
                                <svg fill="currentColor" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                                    <path clipRule="evenodd" d="M24 4H6V17.3333V30.6667H24V44H42V30.6667V17.3333H24V44Z" fillRule="evenodd"></path>
                                </svg>
                            </div>
                            <h2 className="text-xl font-bold tracking-widest uppercase font-display">Aurelius Grand</h2>
                        </Link>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 lg:px-12 py-12">
                <div className="flex flex-col lg:flex-row gap-16">
                    {/* Left Column: Form */}
                    <div className="w-full lg:w-2/3">
                        <div className="mb-12">
                            <h1 className="text-5xl lg:text-6xl font-display mb-6 leading-[1.1]">Thông Tin Đặt Phòng</h1>
                            <p className="text-lg text-[#7f786c] dark:text-gray-400 font-display italic max-w-2xl">
                                Hoàn tất thông tin cá nhân của bạn để đảm bảo kỳ nghỉ trọn vẹn tại thiên đường nghỉ dưỡng.
                            </p>
                        </div>

                        <form onSubmit={handleContinue} className="space-y-16">
                            {/* Section 01: Guest Details */}
                            <section>
                                <div className="flex items-center gap-4 mb-8">
                                    <span className="text-sm font-bold tracking-tighter text-primary/40 border-b border-primary/20 pb-1">01</span>
                                    <h3 className="text-xs uppercase font-bold tracking-[0.2em] text-[#161513] dark:text-white">Thông Tin Khách Hàng</h3>
                                </div>
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="block text-[10px] uppercase font-bold tracking-widest opacity-60">Họ và Tên <span className="text-red-500">*</span></label>
                                            <input
                                                className="w-full p-4 border border-black/10 dark:border-white/10 rounded-lg bg-transparent focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                                placeholder="VD: Nguyen Van A"
                                                required
                                                type="text"
                                                name="fullName"
                                                value={guestInfo.fullName}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-[10px] uppercase font-bold tracking-widest opacity-60">Số Điện Thoại <span className="text-red-500">*</span></label>
                                            <input
                                                className="w-full p-4 border border-black/10 dark:border-white/10 rounded-lg bg-transparent focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                                placeholder="VD: 0912345678"
                                                required
                                                type="tel"
                                                name="phone"
                                                value={guestInfo.phone}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-[10px] uppercase font-bold tracking-widest opacity-60">Email (Không bắt buộc)</label>
                                        <input
                                            className="w-full p-4 border border-black/10 dark:border-white/10 rounded-lg bg-transparent focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                            placeholder="guest@example.com"
                                            type="email"
                                            name="email"
                                            value={guestInfo.email}
                                            onChange={handleInputChange}
                                        />
                                    </div>

                                    {error && (
                                        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
                                            {error}
                                        </div>
                                    )}
                                </div>
                            </section>

                            {/* Section 02: Stay Details (Read Only) */}
                            {/* Section 02: Stay Details (Read Only) */}
                            <section>
                                <div className="flex items-center gap-4 mb-8">
                                    <span className="text-sm font-bold tracking-tighter text-primary/40 border-b border-primary/20 pb-1">02</span>
                                    <h3 className="text-xs uppercase font-bold tracking-[0.2em] text-[#161513] dark:text-white">Chi Tiết Kỳ Nghỉ</h3>
                                </div>
                                <div className="space-y-6 opacity-70 pointer-events-none grayscale-[0.5]">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="block text-[10px] uppercase font-bold tracking-widest opacity-60">Nhận Phòng</label>
                                            <input className="w-full p-4 border border-black/10 dark:border-white/10 rounded-lg bg-transparent font-medium" type="text"
                                                value={(() => {
                                                    const date = bookingData.checkInDate ? new Date(bookingData.checkInDate).toLocaleDateString('vi-VN') : ''
                                                    const time = bookingData.rentalType === 'hourly' ? bookingData.startTime : bookingData.checkInTime
                                                    return time ? `${time} - ${date}` : date
                                                })()}
                                                readOnly
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-[10px] uppercase font-bold tracking-widest opacity-60">Trả Phòng</label>
                                            <input className="w-full p-4 border border-black/10 dark:border-white/10 rounded-lg bg-transparent font-medium" type="text"
                                                value={(() => {
                                                    const date = bookingData.checkOutDate ? new Date(bookingData.checkOutDate).toLocaleDateString('vi-VN') : ''
                                                    const time = bookingData.rentalType === 'hourly' ? bookingData.endTime : bookingData.checkOutTime
                                                    return time ? `${time} - ${date}` : date
                                                })()}
                                                readOnly
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="block text-[10px] uppercase font-bold tracking-widest opacity-60">Số Lượng Khách</label>
                                            <input className="w-full p-4 border border-black/10 dark:border-white/10 rounded-lg bg-transparent font-medium" type="text"
                                                value={`${bookingData.guests?.adults || 1} Người lớn, ${bookingData.guests?.children || 0} Trẻ em`}
                                                readOnly
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-[10px] uppercase font-bold tracking-widest opacity-60">Loại Phòng</label>
                                            <input className="w-full p-4 border border-black/10 dark:border-white/10 rounded-lg bg-transparent font-medium" type="text" value={bookingData.room?.name || 'Phòng Cao Cấp'} readOnly />
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <div className="pt-8">
                                <button type="submit" className="w-full py-5 bg-primary text-white font-bold uppercase tracking-[0.3em] rounded-lg hover:brightness-105 transition-all shadow-xl shadow-primary/20">
                                    Tiếp Tục Thanh Toán
                                </button>
                                <p className="text-center mt-6 text-xs text-primary/80 hover:underline cursor-pointer" onClick={() => navigate(-1)}>
                                    Quay lại chọn phòng
                                </p>
                            </div>
                        </form>
                    </div>

                    {/* Right Column: Widget */}
                    <div className="w-full lg:w-1/3">
                        <div className="sticky top-24 p-8 bg-white dark:bg-background-dark border border-black/10 dark:border-white/10 rounded-2xl shadow-2xl shadow-black/5">
                            <h3 className="text-xl font-display font-bold mb-6 pb-4 border-b border-black/5 dark:border-white/5 uppercase tracking-widest text-primary">Tóm Tắt Đặt Phòng</h3>

                            <div className="space-y-6">
                                <div className="relative group h-48 rounded-xl overflow-hidden mb-6">
                                    <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110" style={{ backgroundImage: `url('${roomImage}')` }}></div>
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                    <div className="absolute bottom-4 left-4">
                                        <p className="text-[10px] font-bold text-white/80 uppercase tracking-widest">Loại phòng đã chọn</p>
                                        <p className="text-white font-display text-lg shadow-black/50 drop-shadow-md">{bookingData.room?.name}</p>
                                    </div>
                                </div>

                                <div className="space-y-4 text-sm">
                                    <div className="flex justify-between items-center pb-2 border-b border-black/5 dark:border-white/5">
                                        <span className="opacity-60">Kiểu thuê</span>
                                        <span className="font-bold text-primary uppercase text-xs tracking-wider border border-primary/20 px-2 py-1 rounded">
                                            {bookingData.rentalType === 'hourly' ? 'Theo Giờ' :
                                                bookingData.rentalType === 'overnight' ? 'Qua Đêm' : 'Theo Ngày'}
                                        </span>
                                    </div>

                                    <div className="flex justify-between items-center pb-2 border-b border-black/5 dark:border-white/5">
                                        <span className="opacity-60">Đơn giá</span>
                                        <span className="font-medium">
                                            {bookingData.rentalType === 'hourly' ? formatPrice(bookingData.room?.price?.firstHour || bookingData.room?.priceHourly || 0) + ' / giờ' :
                                                bookingData.rentalType === 'overnight' ? formatPrice(bookingData.room?.price?.overnight || bookingData.room?.priceOvernight || 0) + ' / đêm' :
                                                    formatPrice(bookingData.room?.price?.daily || bookingData.room?.pricePerNight || 0) + ' / ngày'}
                                        </span>
                                    </div>

                                    <div className="pt-4 flex justify-between items-end">
                                        <div>
                                            <h4 className="text-[10px] uppercase font-bold tracking-widest opacity-40 mb-1">Tổng cộng</h4>
                                            <p className="text-3xl font-display text-primary">{formatPrice(bookingData.totalPrice)}</p>
                                        </div>
                                        <span className="text-[10px] font-bold opacity-40 uppercase mb-2">VND</span>
                                    </div>
                                </div>

                                <div className="p-4 bg-primary/5 rounded-xl border border-primary/10 mt-6">
                                    {bookingData.room?.amenities?.length > 0 ? (
                                        <div className="flex items-start gap-3">
                                            <span className="material-symbols-outlined text-primary text-xl">room_service</span>
                                            <div className="w-full">
                                                <h4 className="text-[10px] uppercase font-bold tracking-widest text-primary mb-2">Tiện nghi phòng</h4>
                                                <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                                                    {bookingData.room.amenities.slice(0, 6).map((item, idx) => {
                                                        const name = typeof item === 'object' ? item.name : item
                                                        return (
                                                            <div key={idx} className="flex items-center gap-1.5 overflow-hidden">
                                                                <span className="size-1 bg-primary rounded-full shrink-0"></span>
                                                                <span className="text-[10px] opacity-70 truncate" title={name}>{name}</span>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-start gap-3">
                                            <span className="material-symbols-outlined text-primary text-xl">verified_user</span>
                                            <div>
                                                <h4 className="text-[10px] uppercase font-bold tracking-widest text-primary mb-1">Dịch vụ tiêu chuẩn</h4>
                                                <p className="text-xs opacity-70 leading-relaxed">Wifi miễn phí, Điều hòa, Nước nóng lạnh, Dọn phòng hàng ngày.</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Selected Services / Amenities (Extras) */}
                                {(bookingData.services?.length > 0 || bookingData.amenities?.length > 0) && (
                                    <div className="p-4 bg-white dark:bg-background-dark/50 rounded-xl border border-black/10 dark:border-white/10 mt-4">
                                        <div className="flex items-start gap-3">
                                            <span className="material-symbols-outlined text-primary text-xl">add_shopping_cart</span>
                                            <div className="w-full">
                                                <h4 className="text-[10px] uppercase font-bold tracking-widest text-[#161513] dark:text-white mb-2">Dịch vụ đã chọn</h4>
                                                <div className="space-y-2">
                                                    {[...(bookingData.amenities || []), ...(bookingData.services || [])].map((item, idx) => {
                                                        const name = typeof item === 'object' ? item.name : item
                                                        const price = typeof item === 'object' ? item.price : 0
                                                        return (
                                                            <div key={idx} className="flex justify-between items-center text-xs opacity-70">
                                                                <span className="truncate pr-2">{name}</span>
                                                                <span className="font-medium whitespace-nowrap">
                                                                    {price ? formatPrice(price) : 'Miễn phí'}
                                                                </span>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="mt-8 pt-6 border-t border-black/5 dark:border-white/5">
                                <p className="text-[10px] text-center opacity-40 uppercase tracking-widest leading-relaxed">
                                    Thanh toán an toàn tại quầy <br />
                                    Hủy phòng miễn phí trước 24h.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

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
                        <h4 className="text-xs font-bold uppercase tracking-widest mb-6 text-primary">Liên Hệ</h4>
                        <p className="text-sm opacity-70">hotline: 1900 1234</p>
                    </div>
                </div>
                <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-black/5 dark:border-white/5 text-center px-4">
                    <p className="text-[10px] uppercase tracking-[0.2em] opacity-40 font-bold">© 2026 Aurelius Grand Hotel.</p>
                </div>
            </footer>
        </div>
    )
}

export default GuestBookingInfo
