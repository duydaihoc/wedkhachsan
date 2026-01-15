import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

const Rooms = () => {
  const { user, logout } = useAuth()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [roomCategories, setRoomCategories] = useState([])
  const [roomTypes, setRoomTypes] = useState([])
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [loadingTypes, setLoadingTypes] = useState(true)
  const [rooms, setRooms] = useState([])
  const [loadingRooms, setLoadingRooms] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedRoomType, setSelectedRoomType] = useState('all')
  const [selectedFloor, setSelectedFloor] = useState('all')
  const [guestCount, setGuestCount] = useState({
    adults: 1,
    children: 0
  })

  useEffect(() => {
    fetchRoomCategories()
    fetchRoomTypes()
    fetchRooms()
  }, [])

  const fetchRoomCategories = async () => {
    try {
      setLoadingCategories(true)
      const response = await api.get('/roomcategories')
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
      setLoadingTypes(true)
      const response = await api.get('/roomtypes')
      setRoomTypes(response.data)
    } catch (error) {
      console.error('Không thể tải loại phòng:', error)
    } finally {
      setLoadingTypes(false)
    }
  }

  const fetchRooms = async () => {
    try {
      setLoadingRooms(true)
      const response = await api.get('/rooms')
      // Chỉ lấy phòng có status Available và một số phòng nổi bật
      const availableRooms = response.data.filter(room => room.status === 'Available')
      // Lấy tối đa 12 phòng nổi bật (có thể randomize hoặc theo điều kiện khác)
      const featuredRooms = availableRooms.slice(0, 12)
      setRooms(featuredRooms)
    } catch (error) {
      console.error('Không thể tải danh sách phòng:', error)
    } finally {
      setLoadingRooms(false)
    }
  }

  const handleCategoryClick = (categoryId) => {
    setSelectedCategory(categoryId)
  }

  const handleRoomTypeClick = (typeId) => {
    setSelectedRoomType(typeId)
  }

  const handleFloorClick = (floor) => {
    setSelectedFloor(floor)
  }

  const getUniqueFloors = () => {
    const floors = [...new Set(rooms.map(room => room.floor))]
    return floors.sort((a, b) => {
      // Sắp xếp tầng (số trước, chữ sau)
      const numA = parseInt(a)
      const numB = parseInt(b)
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB
      return a.localeCompare(b)
    })
  }

  const handleGuestChange = (type, operation) => {
    setGuestCount(prev => ({
      ...prev,
      [type]: operation === 'increment' 
        ? prev[type] + 1 
        : Math.max(type === 'adults' ? 1 : 0, prev[type] - 1)
    }))
  }

  const getFilteredRooms = () => {
    let filtered = [...rooms]
    
    // Lọc theo category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(room => 
        room.category?._id === selectedCategory || room.category === selectedCategory
      )
    }
    
    // Lọc theo room type
    if (selectedRoomType !== 'all') {
      filtered = filtered.filter(room => 
        room.type?._id === selectedRoomType || room.type === selectedRoomType
      )
    }
    
    // Lọc theo tầng
    if (selectedFloor !== 'all') {
      filtered = filtered.filter(room => room.floor === selectedFloor)
    }
    
    // Lọc theo số người
    const totalGuests = guestCount.adults + guestCount.children
    filtered = filtered.filter(room => {
      const maxAdults = room.type?.maxAdults || 2
      const maxChildren = room.type?.maxChildren || 0
      const maxTotal = maxAdults + maxChildren
      return maxTotal >= totalGuests && maxAdults >= guestCount.adults
    })
    
    return filtered
  }

  const filteredRooms = getFilteredRooms()

  return (
    <div className="bg-background-light dark:bg-background-dark font-display text-charcoal dark:text-white antialiased min-h-screen">
      {/* Navigation */}
      <header className="fixed top-0 w-full z-50 glass-nav border-b border-primary/10">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="text-primary">
              <svg className="size-8" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path d="M44 4H30.6666V17.3334H17.3334V30.6666H4V44H44V4Z" fill="currentColor"></path>
              </svg>
            </div>
            <h1 className="serif-heading text-xl font-bold uppercase tracking-widest">Aurelius Grand</h1>
          </Link>
          <nav className="hidden md:flex items-center gap-10">
            <Link to="/" className="text-xs font-bold uppercase tracking-widest hover:text-primary transition-colors">Trang Chủ</Link>
            <Link to="/rooms" className="text-xs font-bold uppercase tracking-widest text-primary">Phòng</Link>
            <a className="text-xs font-bold uppercase tracking-widest hover:text-primary transition-colors" href="/#dining">Nhà Hàng</a>
            <a className="text-xs font-bold uppercase tracking-widest hover:text-primary transition-colors" href="/#wellness">Spa</a>
            <a className="text-xs font-bold uppercase tracking-widest hover:text-primary transition-colors" href="/#experiences">Trải Nghiệm</a>
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
              <div className="flex items-center gap-4">
                <Link to="/login" className="text-xs font-bold uppercase tracking-widest hover:text-primary transition-colors">
                  Đăng Nhập
                </Link>
                <Link to="/register" className="px-6 py-2.5 bg-primary text-white text-xs font-bold uppercase tracking-widest rounded-full hover:brightness-110 transition-all shadow-lg shadow-primary/20">
                  Đăng Ký
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-20">
        {/* Hero Section */}
        <section className="relative h-[60vh] flex items-center justify-center overflow-hidden">
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: 'url(https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=1920)',
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-background-light dark:to-background-dark"></div>
          </div>
          <div className="relative z-10 text-center text-white px-6">
            <h1 className="serif-heading text-5xl md:text-7xl mb-6 font-bold">Phòng Nghỉ Sang Trọng</h1>
            <p className="text-xl md:text-2xl opacity-90 max-w-2xl mx-auto italic serif-heading">
              Khám phá các phòng nghỉ được thiết kế tinh tế, mang đến sự thoải mái và đẳng cấp vượt trội.
            </p>
          </div>
        </section>

        {/* Rooms Section */}
        <section className="max-w-7xl mx-auto px-6 py-20">
          <div className="text-center mb-12">
            <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-primary mb-4">Bộ Sưu Tập</h3>
            <h2 className="serif-heading text-4xl md:text-5xl mb-4">Phòng Nổi Bật</h2>
            <p className="text-charcoal/60 dark:text-white/60 max-w-2xl mx-auto">
              Khám phá những phòng nghỉ đẳng cấp, được lựa chọn kỹ lưỡng cho trải nghiệm hoàn hảo
            </p>
          </div>

          {/* Advanced Filters */}
          <div className="bg-white dark:bg-charcoal rounded-2xl shadow-luxury border border-black/5 dark:border-white/5 p-6 mb-12">
            <h3 className="text-sm font-bold uppercase tracking-widest text-charcoal dark:text-white mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">filter_list</span>
              Bộ Lọc Tìm Kiếm
            </h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Số Người */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-charcoal/60 dark:text-white/60 mb-3">
                  Số Người
                </label>
                <div className="space-y-3">
                  {/* Adults */}
                  <div className="flex items-center justify-between p-3 bg-background-light dark:bg-background-dark rounded-lg border border-black/5 dark:border-white/5">
                    <div>
                      <p className="text-sm font-semibold text-charcoal dark:text-white">Người Lớn</p>
                      <p className="text-xs text-charcoal/50 dark:text-white/50">Từ 13 tuổi trở lên</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleGuestChange('adults', 'decrement')}
                        disabled={guestCount.adults <= 1}
                        className="w-8 h-8 rounded-full border-2 border-primary text-primary hover:bg-primary hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
                      >
                        <span className="material-symbols-outlined text-base">remove</span>
                      </button>
                      <span className="text-lg font-bold text-charcoal dark:text-white w-8 text-center">{guestCount.adults}</span>
                      <button
                        onClick={() => handleGuestChange('adults', 'increment')}
                        className="w-8 h-8 rounded-full border-2 border-primary text-primary hover:bg-primary hover:text-white transition-all flex items-center justify-center"
                      >
                        <span className="material-symbols-outlined text-base">add</span>
                      </button>
                    </div>
                  </div>
                  
                  {/* Children */}
                  <div className="flex items-center justify-between p-3 bg-background-light dark:bg-background-dark rounded-lg border border-black/5 dark:border-white/5">
                    <div>
                      <p className="text-sm font-semibold text-charcoal dark:text-white">Trẻ Em</p>
                      <p className="text-xs text-charcoal/50 dark:text-white/50">Dưới 13 tuổi</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleGuestChange('children', 'decrement')}
                        disabled={guestCount.children <= 0}
                        className="w-8 h-8 rounded-full border-2 border-primary text-primary hover:bg-primary hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
                      >
                        <span className="material-symbols-outlined text-base">remove</span>
                      </button>
                      <span className="text-lg font-bold text-charcoal dark:text-white w-8 text-center">{guestCount.children}</span>
                      <button
                        onClick={() => handleGuestChange('children', 'increment')}
                        className="w-8 h-8 rounded-full border-2 border-primary text-primary hover:bg-primary hover:text-white transition-all flex items-center justify-center"
                      >
                        <span className="material-symbols-outlined text-base">add</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Loại Phòng */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-charcoal/60 dark:text-white/60 mb-3">
                  Loại Phòng
                </label>
                <div className="space-y-2 max-h-[180px] overflow-y-auto pr-2">
                  <button
                    onClick={() => handleRoomTypeClick('all')}
                    className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      selectedRoomType === 'all'
                        ? 'bg-primary text-white'
                        : 'bg-background-light dark:bg-background-dark text-charcoal dark:text-white hover:bg-primary/10 border border-black/5 dark:border-white/5'
                    }`}
                  >
                    Tất Cả Loại Phòng
                  </button>
                  {loadingTypes ? (
                    <p className="text-xs text-charcoal/60 dark:text-white/60 px-4 py-2">Đang tải...</p>
                  ) : (
                    roomTypes.map((type) => (
                      <button
                        key={type._id}
                        onClick={() => handleRoomTypeClick(type._id)}
                        className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                          selectedRoomType === type._id
                            ? 'bg-primary text-white'
                            : 'bg-background-light dark:bg-background-dark text-charcoal dark:text-white hover:bg-primary/10 border border-black/5 dark:border-white/5'
                        }`}
                      >
                        {type.name}
                        {type.maxAdults && (
                          <span className="text-xs opacity-70 ml-2">
                            (Tối đa {type.maxAdults} người lớn)
                          </span>
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Danh Mục */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-charcoal/60 dark:text-white/60 mb-3">
                  Danh Mục
                </label>
                <div className="space-y-2 max-h-[180px] overflow-y-auto pr-2">
                  <button
                    onClick={() => handleCategoryClick('all')}
                    className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      selectedCategory === 'all'
                        ? 'bg-primary text-white'
                        : 'bg-background-light dark:bg-background-dark text-charcoal dark:text-white hover:bg-primary/10 border border-black/5 dark:border-white/5'
                    }`}
                  >
                    Tất Cả Danh Mục
                  </button>
                  {loadingCategories ? (
                    <p className="text-xs text-charcoal/60 dark:text-white/60 px-4 py-2">Đang tải...</p>
                  ) : (
                    roomCategories.map((category) => (
                      <button
                        key={category._id}
                        onClick={() => handleCategoryClick(category._id)}
                        className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                          selectedCategory === category._id
                            ? 'bg-primary text-white'
                            : 'bg-background-light dark:bg-background-dark text-charcoal dark:text-white hover:bg-primary/10 border border-black/5 dark:border-white/5'
                        }`}
                      >
                        {category.name}
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Tầng */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-charcoal/60 dark:text-white/60 mb-3">
                  Tầng
                </label>
                <div className="space-y-2 max-h-[180px] overflow-y-auto pr-2">
                  <button
                    onClick={() => handleFloorClick('all')}
                    className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      selectedFloor === 'all'
                        ? 'bg-primary text-white'
                        : 'bg-background-light dark:bg-background-dark text-charcoal dark:text-white hover:bg-primary/10 border border-black/5 dark:border-white/5'
                    }`}
                  >
                    Tất Cả Tầng
                  </button>
                  {getUniqueFloors().map((floor) => (
                    <button
                      key={floor}
                      onClick={() => handleFloorClick(floor)}
                      className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        selectedFloor === floor
                          ? 'bg-primary text-white'
                          : 'bg-background-light dark:bg-background-dark text-charcoal dark:text-white hover:bg-primary/10 border border-black/5 dark:border-white/5'
                      }`}
                    >
                      {floor}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Filter Summary */}
            <div className="mt-6 pt-6 border-t border-black/5 dark:border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-charcoal/60 dark:text-white/60">
                <span className="material-symbols-outlined text-base">info</span>
                <span>
                  Tìm thấy <strong className="text-primary font-bold">{filteredRooms.length}</strong> phòng phù hợp
                </span>
              </div>
              <button
                onClick={() => {
                  setSelectedCategory('all')
                  setSelectedRoomType('all')
                  setSelectedFloor('all')
                  setGuestCount({ adults: 1, children: 0 })
                }}
                className="text-xs font-bold uppercase tracking-widest text-primary hover:underline"
              >
                Đặt Lại Bộ Lọc
              </button>
            </div>
          </div>

          {/* Category Filter Pills (Keep for quick access) */}
          {!loadingCategories && roomCategories.length > 0 && (
            <div className="flex flex-wrap justify-center gap-3 mb-12">
              <button
                onClick={() => handleCategoryClick('all')}
                className={`px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${
                  selectedCategory === 'all'
                    ? 'bg-primary text-white shadow-lg shadow-primary/30'
                    : 'bg-white dark:bg-charcoal border border-black/10 dark:border-white/10 text-charcoal dark:text-white hover:border-primary'
                }`}
              >
                Tất Cả
              </button>
              {roomCategories.map((category) => (
                <button
                  key={category._id}
                  onClick={() => handleCategoryClick(category._id)}
                  className={`px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${
                    selectedCategory === category._id
                      ? 'bg-primary text-white shadow-lg shadow-primary/30'
                      : 'bg-white dark:bg-charcoal border border-black/10 dark:border-white/10 text-charcoal dark:text-white hover:border-primary'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          )}

          {/* Rooms Grid */}
          {loadingRooms ? (
            <div className="text-center py-20">
              <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
              <p className="mt-4 text-charcoal/60 dark:text-white/60">Đang tải danh sách phòng...</p>
            </div>
          ) : filteredRooms.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredRooms.map((room) => (
                <Link
                  key={room._id}
                  to={`/rooms/${room._id}`}
                  className="group bg-white dark:bg-charcoal rounded-2xl overflow-hidden shadow-luxury hover:shadow-2xl transition-all duration-500 border border-black/5 dark:border-white/5"
                >
                  {/* Room Image */}
                  <div className="relative aspect-[4/3] overflow-hidden bg-charcoal/5">
                    {room.image ? (
                      <img
                        src={`http://localhost:5000${room.image}`}
                        alt={`Phòng ${room.roomNumber}`}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                    ) : room.images && room.images.length > 0 ? (
                      <img
                        src={`http://localhost:5000${room.images[0]}`}
                        alt={`Phòng ${room.roomNumber}`}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                    ) : room.type?.image ? (
                      <img
                        src={`http://localhost:5000${room.type.image}`}
                        alt={`Phòng ${room.roomNumber}`}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-charcoal/10 flex items-center justify-center">
                        <span className="material-symbols-outlined text-6xl text-primary/30">bed</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0"></div>
                    
                    {/* Status Badge */}
                    <div className="absolute top-4 right-4">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest bg-white/95 text-green-700 backdrop-blur-sm shadow-lg">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                        Trống
                      </span>
                    </div>

                    {/* Room Number Overlay */}
                    <div className="absolute bottom-4 left-4">
                      <span className="text-xs font-bold uppercase tracking-widest text-white/60 mb-1 block">Phòng</span>
                      <span className="text-3xl font-display font-bold text-white">{room.roomNumber}</span>
                    </div>
                  </div>

                  {/* Room Details */}
                  <div className="p-6">
                    <div className="mb-4">
                      <h3 className="serif-heading text-2xl text-charcoal dark:text-white group-hover:text-primary transition-colors mb-2">
                        {room.type?.name || `Phòng ${room.roomNumber}`}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-charcoal/60 dark:text-white/60">
                        <span className="material-symbols-outlined text-base">location_on</span>
                        <span className="font-semibold">{room.floor}</span>
                        {room.category?.name && (
                          <>
                            <span>•</span>
                            <span>{room.category.name}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {room.type?.description && (
                      <p className="text-sm text-charcoal/60 dark:text-white/60 leading-relaxed mb-4 line-clamp-2">
                        {room.type.description}
                      </p>
                    )}

                    {/* Amenities */}
                    {room.amenities && room.amenities.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {room.amenities.slice(0, 3).map((amenity, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary/5 dark:bg-primary/10 rounded-full text-xs text-charcoal dark:text-white"
                          >
                            <span className="material-symbols-outlined text-sm text-primary">check_circle</span>
                            {typeof amenity === 'string' ? amenity : amenity.name}
                          </span>
                        ))}
                        {room.amenities.length > 3 && (
                          <span className="inline-flex items-center px-2.5 py-1 bg-charcoal/5 dark:bg-white/5 rounded-full text-xs text-charcoal/60 dark:text-white/60">
                            +{room.amenities.length - 3} tiện ích
                          </span>
                        )}
                      </div>
                    )}

                    {/* Price & CTA */}
                    <div className="flex items-end justify-between pt-4 border-t border-black/5 dark:border-white/5">
                      <div>
                        <p className="text-[10px] uppercase tracking-widest font-bold text-charcoal/40 dark:text-white/40 mb-1">Từ</p>
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-display font-bold text-primary">
                            {new Intl.NumberFormat('vi-VN', {
                              style: 'currency',
                              currency: 'VND',
                              maximumFractionDigits: 0
                            }).format(room.price?.daily || 0)}
                          </span>
                          <span className="text-xs text-charcoal/40 dark:text-white/40">/đêm</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary group-hover:gap-3 transition-all">
                        <span>Đặt Ngay</span>
                        <span className="material-symbols-outlined text-base">arrow_forward</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <span className="material-symbols-outlined text-6xl text-charcoal/20 dark:text-white/20 mb-4">bed</span>
              <p className="text-charcoal/60 dark:text-white/60">
                {selectedCategory === 'all' 
                  ? 'Chưa có phòng nào khả dụng' 
                  : 'Không có phòng nào trong danh mục này'}
              </p>
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-charcoal text-white py-16 mt-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <div className="text-primary">
                  <svg className="size-8" fill="none" viewBox="0 0 48 48">
                    <path d="M44 4H30.6666V17.3334H17.3334V30.6666H4V44H44V4Z" fill="currentColor"></path>
                  </svg>
                </div>
                <h2 className="serif-heading text-xl font-bold uppercase tracking-widest">Aurelius Grand</h2>
              </div>
              <p className="text-white/70 leading-relaxed max-w-md italic serif-heading">
                "Nơi sang trọng hòa quyện với sự thoải mái, mang đến trải nghiệm nghỉ dưỡng đẳng cấp."
              </p>
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest mb-6">Liên Hệ</h4>
              <ul className="space-y-4 text-sm text-white/70">
                <li><Link to="/contact" className="hover:text-primary transition-colors">Liên Hệ</Link></li>
                <li><Link to="/faq" className="hover:text-primary transition-colors">FAQ</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest mb-6">Địa Chỉ</h4>
              <p className="text-sm text-white/70 leading-relaxed">
                123 Đường Biển<br/>
                Thành Phố Đà Nẵng<br/>
                Việt Nam
              </p>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 text-center">
            <p className="text-xs text-white/40 uppercase tracking-widest">© 2026 Aurelius Grand Hotel. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Rooms
