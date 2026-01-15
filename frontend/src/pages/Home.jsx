import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

const Home = () => {
  const { user, logout } = useAuth()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [roomCategories, setRoomCategories] = useState([])
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [roomTypes, setRoomTypes] = useState([])
  const [loadingRoomTypes, setLoadingRoomTypes] = useState(true)
  const [rooms, setRooms] = useState([])
  const [loadingRooms, setLoadingRooms] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('all')

  useEffect(() => {
    fetchRoomCategories()
    fetchRoomTypes()
    fetchRooms()
  }, [])

  const fetchRoomCategories = async () => {
    try {
      setLoadingCategories(true)
      const response = await api.get('/roomcategories')
      // Chỉ hiển thị các categories đang active
      const activeCategories = response.data.filter(cat => cat.isActive)
      setRoomCategories(activeCategories)
    } catch (error) {
      console.error('Không thể tải danh mục phòng:', error)
    } finally {
      setLoadingCategories(false)
    }
  }

  const fetchRoomTypes = async () => {
    try {
      setLoadingRoomTypes(true)
      const response = await api.get('/roomtypes')
      setRoomTypes(response.data)
    } catch (error) {
      console.error('Không thể tải loại phòng:', error)
    } finally {
      setLoadingRoomTypes(false)
    }
  }

  const fetchRooms = async () => {
    try {
      setLoadingRooms(true)
      const response = await api.get('/rooms')
      // Chỉ hiển thị các phòng Available
      const availableRooms = response.data.filter(room => room.status === 'Available')
      setRooms(availableRooms)
    } catch (error) {
      console.error('Không thể tải danh sách phòng:', error)
    } finally {
      setLoadingRooms(false)
    }
  }

  const handleCategoryClick = (categoryId) => {
    setSelectedCategory(categoryId)
  }

  const getFilteredRooms = () => {
    if (selectedCategory === 'all') {
      return rooms
    }
    return rooms.filter(room => 
      room.category?._id === selectedCategory || room.category === selectedCategory
    )
  }

  const filteredRooms = getFilteredRooms()

  return (
    <div className="bg-background-light dark:bg-background-dark font-display text-charcoal dark:text-white antialiased">
      {/* Navigation */}
      <header className="fixed top-0 w-full z-50 glass-nav border-b border-primary/10">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="text-primary">
              <svg className="size-8" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path d="M44 4H30.6666V17.3334H17.3334V30.6666H4V44H44V4Z" fill="currentColor"></path>
              </svg>
            </div>
            <h1 className="serif-heading text-xl font-bold uppercase tracking-widest">Aurelius Grand</h1>
          </div>
          <nav className="hidden md:flex items-center gap-10">
            <Link to="/rooms" className="text-xs font-bold uppercase tracking-widest hover:text-primary transition-colors">Phòng</Link>
            <a className="text-xs font-bold uppercase tracking-widest hover:text-primary transition-colors" href="#dining">Nhà Hàng</a>
            <a className="text-xs font-bold uppercase tracking-widest hover:text-primary transition-colors" href="#wellness">Spa</a>
            <a className="text-xs font-bold uppercase tracking-widest hover:text-primary transition-colors" href="#experiences">Trải Nghiệm</a>
          </nav>
          <div className="flex items-center gap-6">
            {user ? (
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-4">
                  {user.isAdmin && (
                    <Link to="/admin" className="text-xs font-bold uppercase tracking-widest hover:text-primary transition-colors">
                      Admin
                    </Link>
                  )}
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest hover:text-primary transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">account_circle</span>
                    <span>{user.username}</span>
                    <span className="material-symbols-outlined text-sm">arrow_drop_down</span>
                  </button>
                </div>
                {showUserMenu && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setShowUserMenu(false)}
                    ></div>
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-charcoal rounded-lg shadow-luxury border border-primary/10 py-2 z-50">
                    <div className="px-4 py-2 border-b border-primary/10">
                      <p className="text-xs font-bold uppercase tracking-widest text-charcoal dark:text-white">{user.fullName || user.username}</p>
                      <p className="text-xs text-charcoal/60 dark:text-white/60 mt-1">{user.email}</p>
                    </div>
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-xs font-bold uppercase tracking-widest text-charcoal dark:text-white hover:bg-primary/10 transition-colors"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <span className="material-symbols-outlined text-sm align-middle mr-2">person</span>
                      Thông Tin Cá Nhân
                    </Link>
                    <Link
                      to="/my-bookings"
                      className="block px-4 py-2 text-xs font-bold uppercase tracking-widest text-charcoal dark:text-white hover:bg-primary/10 transition-colors"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <span className="material-symbols-outlined text-sm align-middle mr-2">calendar_today</span>
                      Lịch Sử Đặt Phòng
                    </Link>
                    {user.isAdmin && (
                      <Link
                        to="/admin"
                        className="block px-4 py-2 text-xs font-bold uppercase tracking-widest text-charcoal dark:text-white hover:bg-primary/10 transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <span className="material-symbols-outlined text-sm align-middle mr-2">admin_panel_settings</span>
                        Bảng Điều Khiển
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        logout()
                        setShowUserMenu(false)
                      }}
                      className="w-full text-left px-4 py-2 text-xs font-bold uppercase tracking-widest text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm align-middle mr-2">logout</span>
                      Đăng Xuất
                    </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <>
                <Link to="/login" className="text-xs font-bold uppercase tracking-widest hover:text-primary transition-colors">
                  Đăng Nhập
                </Link>
                <Link to="/register" className="bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-lg text-xs font-bold uppercase tracking-widest transition-all">
                  Đặt Phòng
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative h-screen w-full flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{backgroundImage: "linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.5)), url('https://lh3.googleusercontent.com/aida-public/AB6AXuAzUQsCo8Xks3GsUXrJmKtdCZOLfBNuQqcZnDtIl5o0HWiUD42vcUbXrJVhjSXIHAJuavGEIkkQWCtQCxiJ0Rwu9nTDU7ISU04dVix7ZgZIthxObOdAKe-FZqQsZ6JHRQQgqbBwg8RkhZSe3B-_68BXFixESyXBFzvJ_41jaLHdAaEiyWoCQ5oToTgdb51T8HvjubLaZEXgh6vAoNI5gvb1gNLpARKNKD38N69RK2fdQvEJTGByaPrab9Avo5PGcG3743wFZic3H7uA')"}}>
        </div>
        <div className="relative z-10 text-center px-4 max-w-4xl">
          <h2 className="text-white text-sm font-bold uppercase tracking-[0.4em] mb-6 opacity-90">Biểu Tượng Của Sự Hiếu Khách</h2>
          <h1 className="serif-heading text-5xl md:text-7xl text-white font-medium leading-tight mb-8">
            Nơi Di Sản Gặp Gỡ <br/> Vẻ Đẹp Hiện Đại
          </h1>
          <p className="text-white/80 text-lg md:text-xl max-w-2xl mx-auto font-light leading-relaxed">
            Trải nghiệm sự sang trọng vượt thời gian và dịch vụ tùy chỉnh tại trung tâm của thành phố sôi động nhất thế giới.
          </p>
        </div>
        {/* Floating Booking Bar */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-full max-w-5xl px-6 z-20">
          <div className="bg-white dark:bg-background-dark p-2 rounded-xl booking-bar-shadow flex flex-col md:flex-row items-stretch md:items-center gap-2">
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-primary/10">
              <div className="px-6 py-4 flex flex-col">
                <span className="text-[10px] uppercase font-bold tracking-widest text-primary mb-1">Nhận Phòng</span>
                <input className="border-0 p-0 focus:ring-0 text-charcoal dark:text-white bg-transparent text-sm placeholder:text-charcoal/40 font-medium" placeholder="Chọn ngày" type="text" defaultValue="24 Tháng 10, 2024"/>
              </div>
              <div className="px-6 py-4 flex flex-col">
                <span className="text-[10px] uppercase font-bold tracking-widest text-primary mb-1">Trả Phòng</span>
                <input className="border-0 p-0 focus:ring-0 text-charcoal dark:text-white bg-transparent text-sm placeholder:text-charcoal/40 font-medium" placeholder="Chọn ngày" type="text" defaultValue="28 Tháng 10, 2024"/>
              </div>
              <div className="px-6 py-4 flex flex-col">
                <span className="text-[10px] uppercase font-bold tracking-widest text-primary mb-1">Khách</span>
                <select className="border-0 p-0 focus:ring-0 text-charcoal dark:text-white bg-transparent text-sm font-medium appearance-none cursor-pointer">
                  <option>2 Người lớn, 0 Trẻ em</option>
                  <option>1 Người lớn</option>
                  <option>2 Người lớn, 1 Trẻ em</option>
                </select>
              </div>
            </div>
            <button className="bg-charcoal dark:bg-primary text-white dark:text-background-dark px-10 py-5 rounded-lg text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-all flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-lg">search</span>
              Kiểm Tra Phòng Trống
            </button>
          </div>
        </div>
      </section>

      {/* Spacer for Booking Bar */}
      <div className="h-32"></div>

      {/* Intro Text */}
      <section className="max-w-7xl mx-auto px-6 py-24 text-center">
        <div className="max-w-2xl mx-auto">
          <span className="text-primary material-symbols-outlined text-4xl mb-6">diamond</span>
          <h2 className="serif-heading text-3xl md:text-4xl mb-8">Tạo Nên Những Khoảnh Khắc Khó Quên</h2>
          <p className="text-charcoal/70 dark:text-white/70 leading-relaxed text-lg italic serif-heading">
            "Triết lý của chúng tôi rất đơn giản: sự hiếu khách là một nghệ thuật. Từ hương thơm của hoa mẫu đơn tươi trong sảnh đến sự chính xác im lặng của dịch vụ quản gia 24 giờ, mọi chi tiết đều được sắp xếp đến mức hoàn hảo."
          </p>
        </div>
      </section>

      {/* Amenities Grid */}
      <section className="bg-charcoal text-white py-24 mt-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h3 className="text-primary text-xs font-bold uppercase tracking-[0.4em] mb-4">Trải Nghiệm Được Chọn Lọc</h3>
            <h2 className="serif-heading text-4xl md:text-5xl">Sang Trọng Trong Mọi Chi Tiết</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
            <div className="flex flex-col items-center">
              <div className="size-16 rounded-full border border-primary/30 flex items-center justify-center text-primary mb-6">
                <span className="material-symbols-outlined text-3xl">restaurant</span>
              </div>
              <h4 className="serif-heading text-lg mb-2">Nhà Hàng Michelin</h4>
              <p className="text-white/50 text-xs uppercase tracking-widest">Ẩm Thực Tinh Tế</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="size-16 rounded-full border border-primary/30 flex items-center justify-center text-primary mb-6">
                <span className="material-symbols-outlined text-3xl">spa</span>
              </div>
              <h4 className="serif-heading text-lg mb-2">Spa Toàn Diện</h4>
              <p className="text-white/50 text-xs uppercase tracking-widest">Nơi Nghỉ Dưỡng Yên Bình</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="size-16 rounded-full border border-primary/30 flex items-center justify-center text-primary mb-6">
                <span className="material-symbols-outlined text-3xl">concierge</span>
              </div>
              <h4 className="serif-heading text-lg mb-2">Dịch Vụ Tùy Chỉnh</h4>
              <p className="text-white/50 text-xs uppercase tracking-widest">Quản Gia 24 Giờ</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="size-16 rounded-full border border-primary/30 flex items-center justify-center text-primary mb-6">
                <span className="material-symbols-outlined text-3xl">pool</span>
              </div>
              <h4 className="serif-heading text-lg mb-2">Hồ Bơi Vô Cực</h4>
              <p className="text-white/50 text-xs uppercase tracking-widest">Tầm Nhìn Skyline</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-7xl mx-auto px-6 py-32 overflow-hidden">
        <div className="relative flex flex-col items-center text-center">
          <span className="text-primary/20 serif-heading text-[200px] absolute -top-24 left-1/2 -translate-x-1/2 select-none">"</span>
          <div className="relative z-10 max-w-3xl">
            <p className="serif-heading text-2xl md:text-4xl leading-relaxed mb-12">
              "Từ khoảnh khắc chúng tôi đến, sự chú ý đến từng chi tiết là vô song. Aurelius Grand không chỉ là một khách sạn; đó là cảm giác trở về nhà trong một cung điện mà bạn chưa bao giờ biết mình sở hữu."
            </p>
            <div className="flex flex-col items-center gap-4">
              <div className="size-16 rounded-full bg-cover bg-center ring-4 ring-primary/20" style={{backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuB-HCsEEZOd6UVl1YR_YOPxE5JT36mQ5kHTj9OurThD1ct0q9K8np5khjlXecDA7p39osFBrAynlaSXnhOIAshixMzp4tdo2MqdG8dVO0_k0lW-UmDSALozFl-5YpPhhFieV0dGdNDaW1JqHU_ZO1oxztbgAKBTSUQ3neMfUq9JYVLFYQOgEDzzr3-dqlmb1wCbEjJSwtDRC8issC7RlfnB4rr0Exb38784NFQ0sT7PRjDbuYMRe0Jm0cJ5QppS-lHcHx6-f9QC_1o2')"}}></div>
              <div>
                <h5 className="font-bold uppercase tracking-widest text-xs">Eleanor Vanderbilt</h5>
                <p className="text-charcoal/40 text-[10px] uppercase tracking-widest mt-1">Du Khách Toàn Cầu & Nhà Từ Thiện</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Map/Location Teaser */}
      <section className="grid grid-cols-1 md:grid-cols-2 bg-background-light dark:bg-background-dark border-t border-primary/10">
        <div className="p-12 md:p-24 flex flex-col justify-center">
          <h3 className="text-primary text-xs font-bold uppercase tracking-[0.4em] mb-6">Vị Trí Đắc Địa</h3>
          <h2 className="serif-heading text-4xl mb-8">Trung Tâm Thành Phố</h2>
          <p className="text-charcoal/60 dark:text-white/60 text-lg leading-relaxed mb-10">
            Tọa lạc tại khu phố lịch sử danh giá, Aurelius Grand chỉ cách Nhà hát Hoàng gia, Phòng trưng bày Quốc gia và các cửa hàng thời trang sang trọng nhất thành phố vài bước chân.
          </p>
          <div className="flex items-start gap-4 mb-6">
            <span className="material-symbols-outlined text-primary">location_on</span>
            <div>
              <p className="font-bold text-sm">Khách Sạn Aurelius Grand</p>
              <p className="text-charcoal/50 text-sm">122 Đại Lộ Di Sản, Quận Sang Trọng</p>
            </div>
          </div>
          <button className="w-fit border border-charcoal/20 dark:border-white/20 px-10 py-4 rounded-lg text-xs font-bold uppercase tracking-widest hover:border-primary hover:text-primary transition-all">
            Xem Chỉ Đường
          </button>
        </div>
        <div className="h-[400px] md:h-auto bg-cover bg-center grayscale contrast-125 opacity-80" style={{backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCJZFBx_95gDoq4-5FI3rga3LRer54AvWveGEzhEsRAmBoRgKofi7lvp6Lg5-EejU818k4UYeU0xkZVb74on9nXjv11gP-X2RHIMP3W34TgbxwWSpd1IXTZpjQmQsXkeMz007tzIv-UAvOpDwQYocNe_BoB9H1oa7VlzxaB7Iu-BIfn6eDmIiAD6y05ZMDYj38n29W4cxr2zbF-nySMvRHpKF9NuZnJqVNhA3DoQqIp0zevdRuFw-D1cyYgzRWbb0QGwqwAd5wuCJXo')"}}>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-charcoal text-white pt-24 pb-12 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-20">
            <div className="md:col-span-1">
              <div className="flex items-center gap-2 mb-8">
                <div className="text-primary">
                  <svg className="size-6" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                    <path d="M44 4H30.6666V17.3334H17.3334V30.6666H4V44H44V4Z" fill="currentColor"></path>
                  </svg>
                </div>
                <h4 className="serif-heading text-lg font-bold uppercase tracking-widest">Aurelius</h4>
              </div>
              <p className="text-white/50 text-sm leading-relaxed mb-8">
                Định nghĩa sự sang trọng từ năm 1924. Di sản của sự xuất sắc, tương lai của sự hùng vĩ.
              </p>
              <div className="flex gap-4">
                <a className="size-10 rounded-full border border-white/10 flex items-center justify-center hover:border-primary hover:text-primary transition-all" href="#">
                  <span className="material-symbols-outlined text-[18px]">public</span>
                </a>
                <a className="size-10 rounded-full border border-white/10 flex items-center justify-center hover:border-primary hover:text-primary transition-all" href="#">
                  <span className="material-symbols-outlined text-[18px]">share</span>
                </a>
                <a className="size-10 rounded-full border border-white/10 flex items-center justify-center hover:border-primary hover:text-primary transition-all" href="#">
                  <span className="material-symbols-outlined text-[18px]">photo_camera</span>
                </a>
              </div>
            </div>
            <div>
              <h5 className="text-xs font-bold uppercase tracking-widest mb-8 text-primary">Khám Phá</h5>
              <ul className="space-y-4 text-sm text-white/60">
                <li><a className="hover:text-white transition-colors" href="#">Phòng Suite</a></li>
                <li><a className="hover:text-white transition-colors" href="#">Nhà Hàng</a></li>
                <li><a className="hover:text-white transition-colors" href="#">Spa & Thể Dục</a></li>
                <li><a className="hover:text-white transition-colors" href="#">Không Gian Sự Kiện</a></li>
              </ul>
            </div>
            <div>
              <h5 className="text-xs font-bold uppercase tracking-widest mb-8 text-primary">Dịch Vụ Khách</h5>
              <ul className="space-y-4 text-sm text-white/60">
                <li><a className="hover:text-white transition-colors" href="#">Bàn Lễ Tân</a></li>
                <li><a className="hover:text-white transition-colors" href="#">Đưa Đón Sân Bay</a></li>
                <li><a className="hover:text-white transition-colors" href="#">Bữa Tối Riêng</a></li>
                <li><a className="hover:text-white transition-colors" href="#">Chính Sách Thú Cưng</a></li>
              </ul>
            </div>
            <div>
              <h5 className="text-xs font-bold uppercase tracking-widest mb-8 text-primary">Tham Gia Cộng Đồng</h5>
              <p className="text-sm text-white/60 mb-6 leading-relaxed">Đăng ký để nhận ưu đãi độc quyền và lời mời sự kiện riêng.</p>
              <div className="relative">
                <input className="w-full bg-white/5 border-white/10 rounded-lg py-4 px-6 text-sm focus:ring-1 focus:ring-primary focus:border-primary" placeholder="Địa chỉ Email" type="email"/>
                <button className="absolute right-4 top-1/2 -translate-y-1/2 text-primary">
                  <span className="material-symbols-outlined">arrow_forward</span>
                </button>
              </div>
            </div>
          </div>
          <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8 text-[10px] uppercase tracking-widest font-medium text-white/30">
            <div className="flex gap-8">
              <a href="#">Chính Sách Bảo Mật</a>
              <a href="#">Điều Khoản Dịch Vụ</a>
              <a href="#">Khả Năng Truy Cập</a>
            </div>
            <p>© 2024 Aurelius Grand Hotels & Resorts. Bảo Lưu Mọi Quyền.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Home

