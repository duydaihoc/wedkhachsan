import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

const RoomDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [room, setRoom] = useState(null)
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Booking states
  const [bookingType, setBookingType] = useState('daily') // 'hourly', 'overnight', 'daily'
  const [checkIn, setCheckIn] = useState(new Date().toISOString().split('T')[0])
  const [checkInTime, setCheckInTime] = useState('15:00') // Giờ nhận phòng
  const [checkOut, setCheckOut] = useState(new Date(Date.now() + 86400000).toISOString().split('T')[0])
  const [checkOutTime, setCheckOutTime] = useState('12:00') // Giờ trả phòng
  const [hours, setHours] = useState(1)
  const [selectedAmenities, setSelectedAmenities] = useState([])
  const [selectedServices, setSelectedServices] = useState([])
  const [adults, setAdults] = useState(1)
  const [children, setChildren] = useState(0)

  useEffect(() => {
    fetchRoomDetail()
    fetchServices()
  }, [id])

  // Tự động set số khách từ loại phòng khi room được load
  useEffect(() => {
    if (room?.type) {
      if (room.type.maxAdults) {
        setAdults(room.type.maxAdults)
      }
      if (room.type.maxChildren !== undefined) {
        setChildren(room.type.maxChildren || 0)
      }
    }
  }, [room])

  // Xóa selected services khi chuyển sang hourly
  useEffect(() => {
    if (bookingType === 'hourly') {
      setSelectedServices([])
    }
  }, [bookingType])

  // Tự động set check-out cho overnight: ngày hôm sau lúc 12:00
  useEffect(() => {
    if (bookingType === 'overnight' && checkIn) {
      const checkInDate = new Date(checkIn)
      const nextDay = new Date(checkInDate)
      nextDay.setDate(nextDay.getDate() + 1)
      setCheckOut(nextDay.toISOString().split('T')[0])
      setCheckOutTime('12:00')
    }
  }, [bookingType, checkIn])

  // Tự động tính check-out cho hourly: dựa trên checkIn, checkInTime và hours
  useEffect(() => {
    if (bookingType === 'hourly' && checkIn && checkInTime && hours) {
      // Parse checkInTime (HH:MM)
      const [hoursStr, minutesStr] = checkInTime.split(':')
      const checkInHours = parseInt(hoursStr, 10)
      const checkInMinutes = parseInt(minutesStr, 10)
      
      // Tạo Date object từ checkIn và checkInTime
      const checkInDateTime = new Date(checkIn)
      checkInDateTime.setHours(checkInHours, checkInMinutes, 0, 0)
      
      // Thêm số giờ vào checkInDateTime
      const checkOutDateTime = new Date(checkInDateTime)
      checkOutDateTime.setHours(checkOutDateTime.getHours() + hours)
      
      // Cập nhật checkOutDate và checkOutTime
      setCheckOut(checkOutDateTime.toISOString().split('T')[0])
      
      // Format checkOutTime (HH:MM)
      const checkOutHours = checkOutDateTime.getHours().toString().padStart(2, '0')
      const checkOutMinutes = checkOutDateTime.getMinutes().toString().padStart(2, '0')
      setCheckOutTime(`${checkOutHours}:${checkOutMinutes}`)
    }
  }, [bookingType, checkIn, checkInTime, hours])

  // Tính toán giá tự động khi thay đổi
  useEffect(() => {
    // Recalculate khi booking type, dates, hours, amenities, hoặc services thay đổi
  }, [bookingType, checkIn, checkOut, hours, selectedAmenities, selectedServices])

  const fetchRoomDetail = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/rooms/${id}`)
      setRoom(response.data)
    } catch (error) {
      setError('Không thể tải thông tin phòng')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const fetchServices = async () => {
    try {
      const response = await api.get('/services')
      // Chỉ lấy các dịch vụ đang available
      const availableServices = response.data.filter(service => service.isAvailable)
      setServices(availableServices)
    } catch (error) {
      console.error('Không thể tải danh sách dịch vụ:', error)
    }
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price)
  }

  // Tính số đêm từ check-in và check-out
  const calculateNights = () => {
    if (!checkIn || !checkOut) return 0
    const checkInDate = new Date(checkIn)
    const checkOutDate = new Date(checkOut)
    const diffTime = checkOutDate - checkInDate
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays > 0 ? diffDays : 1
  }

  // Tính giá phòng dựa trên booking type
  const calculateRoomPrice = () => {
    if (!room?.price) return 0

    switch (bookingType) {
      case 'hourly':
        if (hours <= 1) {
          return room.price.firstHour || 0
        } else {
          return (room.price.firstHour || 0) + ((hours - 1) * (room.price.nextHour || 0))
        }
      case 'overnight':
        return room.price.overnight || 0
      case 'daily':
        const nights = calculateNights()
        return (room.price.daily || 0) * nights
      default:
        return room.price.daily || 0
    }
  }

  // Tính giá tiện ích đã chọn
  const calculateAmenitiesPrice = () => {
    if (!room?.amenities || selectedAmenities.length === 0) return 0
    
    return selectedAmenities.reduce((total, amenityId) => {
      const amenity = room.amenities.find(a => (a._id || a) === amenityId)
      if (amenity && amenity.price) {
        // Nếu là hourly, tính theo giờ, nếu không tính 1 lần
        if (bookingType === 'hourly' && amenity.price) {
          return total + (amenity.price * hours)
        }
        return total + (amenity.price || 0)
      }
      return total
    }, 0)
  }

  // Tính giá dịch vụ đã chọn
  const calculateServicesPrice = () => {
    if (selectedServices.length === 0) return 0
    
    return selectedServices.reduce((total, serviceId) => {
      const service = services.find(s => s._id === serviceId)
      if (service && service.price) {
        return total + (service.price || 0)
      }
      return total
    }, 0)
  }

  // Tính tổng tiền
  const calculateTotal = () => {
    const roomPrice = calculateRoomPrice()
    const amenitiesPrice = calculateAmenitiesPrice()
    const servicesPrice = calculateServicesPrice()
    return roomPrice + amenitiesPrice + servicesPrice
  }

  // Toggle amenity selection
  const toggleAmenity = (amenityId) => {
    setSelectedAmenities(prev => {
      if (prev.includes(amenityId)) {
        return prev.filter(id => id !== amenityId)
      } else {
        return [...prev, amenityId]
      }
    })
  }

  // Toggle service selection
  const toggleService = (serviceId) => {
    setSelectedServices(prev => {
      if (prev.includes(serviceId)) {
        return prev.filter(id => id !== serviceId)
      } else {
        return [...prev, serviceId]
      }
    })
  }

  // Handle submit booking
  const handleSubmitBooking = (e) => {
    e.preventDefault()
    
    // Kiểm tra đăng nhập
    if (!user) {
      navigate('/login', { state: { from: `/rooms/${id}` } })
      return
    }

    // Tính checkOutDate và checkOutTime cho từng loại booking
    let finalCheckOutDate = checkOut
    let finalCheckOutTime = checkOutTime
    
    if (bookingType === 'overnight') {
      // Overnight: ngày hôm sau lúc 12:00
      const checkInDate = new Date(checkIn)
      const nextDay = new Date(checkInDate)
      nextDay.setDate(nextDay.getDate() + 1)
      finalCheckOutDate = nextDay.toISOString().split('T')[0]
      finalCheckOutTime = '12:00'
    } else if (bookingType === 'hourly') {
      // Hourly: tự động tính từ checkIn, checkInTime và hours
      if (checkIn && checkInTime && hours) {
        try {
          const [hoursStr, minutesStr] = checkInTime.split(':')
          const checkInHours = parseInt(hoursStr, 10)
          const checkInMinutes = parseInt(minutesStr, 10)
          
          const checkInDateTime = new Date(checkIn)
          checkInDateTime.setHours(checkInHours, checkInMinutes, 0, 0)
          
          const checkOutDateTime = new Date(checkInDateTime)
          checkOutDateTime.setHours(checkOutDateTime.getHours() + hours)
          
          finalCheckOutDate = checkOutDateTime.toISOString().split('T')[0]
          
          const checkOutHours = checkOutDateTime.getHours().toString().padStart(2, '0')
          const checkOutMinutes = checkOutDateTime.getMinutes().toString().padStart(2, '0')
          finalCheckOutTime = `${checkOutHours}:${checkOutMinutes}`
        } catch (error) {
          console.error('Error calculating checkout time:', error)
          // Fallback: sử dụng giá trị hiện tại
        }
      }
    }

    // Chuẩn bị dữ liệu booking
    const bookingData = {
      room: room._id,
      bookingType,
      checkInDate: checkIn,
      checkInTime,
      checkOutDate: finalCheckOutDate,
      checkOutTime: finalCheckOutTime,
      hours: bookingType === 'hourly' ? hours : 1,
      adults,
      children,
      amenities: selectedAmenities,
      services: bookingType === 'hourly' ? [] : selectedServices, // Chỉ chọn services khi daily/overnight
      roomPrice: calculateRoomPrice(),
      amenitiesPrice: calculateAmenitiesPrice(),
      servicesPrice: calculateServicesPrice(),
      totalPrice: calculateTotal()
    }

    // Lưu vào sessionStorage và chuyển đến trang xác nhận
    sessionStorage.setItem('pendingBooking', JSON.stringify(bookingData))
    navigate('/booking/confirm')
  }

  // Lấy amenities có giá (có thể chọn)
  const getSelectableAmenities = () => {
    if (!room?.amenities) return []
    return room.amenities.filter(amenity => amenity.price !== undefined && amenity.price > 0)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center">
        <p className="text-charcoal/60 dark:text-white/60">Đang tải thông tin phòng...</p>
      </div>
    )
  }

  if (error || !room) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
            {error || 'Không tìm thấy phòng'}
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

  // Chuyển đổi images từ định dạng cũ (string) sang định dạng mới (object)
  let convertedImages = []
  if (room.images && Array.isArray(room.images)) {
    convertedImages = room.images.map(img => {
      // Nếu là string (định dạng cũ), chuyển thành object
      if (typeof img === 'string') {
        return {
          url: img,
          category: 'other',
          label: ''
        }
      }
      // Nếu đã là object (định dạng mới), giữ nguyên
      return img
    })
  }

  // Nhóm images theo category
  const imagesByCategory = {
    living_room: convertedImages.filter(img => img.category === 'living_room'),
    bedroom: convertedImages.filter(img => img.category === 'bedroom'),
    bathroom: convertedImages.filter(img => img.category === 'bathroom'),
    other: convertedImages.filter(img => img.category === 'other')
  }

  // Kết hợp ảnh đại diện và ảnh chi tiết cho gallery
  const displayImages = []
  if (room.image) {
    displayImages.push(room.image)
  }
  // Thêm 2 ảnh đầu tiên từ convertedImages để hiển thị trong gallery
  if (convertedImages.length > 0) {
    displayImages.push(...convertedImages.slice(0, 2).map(img => img.url))
  }
  // Nếu không có ảnh nào, dùng ảnh mẫu từ loại phòng
  if (displayImages.length === 0 && room.type?.image) {
    displayImages.push(room.type.image)
  }

  // Lấy ảnh chính và 2 ảnh phụ
  const mainImage = displayImages[0] || null
  const sideImages = displayImages.slice(1, 3)

  // Tính max guests từ room type
  const maxAdults = room.type?.maxAdults || 2
  const maxChildren = room.type?.maxChildren || 0

  return (
    <div className="bg-background-light dark:bg-background-dark text-[#161513] dark:text-white transition-colors duration-300">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-md border-b border-black/5 dark:border-white/5">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="size-6 text-primary">
              <svg fill="currentColor" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path clipRule="evenodd" d="M24 4H6V17.3333V30.6667H24V44H42V30.6667V17.3333H24V4Z" fillRule="evenodd"></path>
              </svg>
            </div>
            <h2 className="text-xl font-bold tracking-widest uppercase font-display">Aurelius Grand</h2>
          </Link>
          <nav className="hidden md:flex items-center gap-10">
            <Link to="/#suites" className="text-xs font-semibold tracking-widest uppercase hover:text-primary transition-colors">
              Phòng
            </Link>
            <a className="text-xs font-semibold tracking-widest uppercase hover:text-primary transition-colors" href="#">
              Dịch Vụ
            </a>
            <a className="text-xs font-semibold tracking-widest uppercase hover:text-primary transition-colors" href="#">
              Trải Nghiệm
            </a>
            <a className="text-xs font-semibold tracking-widest uppercase hover:text-primary transition-colors" href="#">
              Thư Viện
            </a>
          </nav>
          <div className="flex items-center gap-4">
            <button className="px-6 py-2.5 bg-primary text-white text-xs font-bold uppercase tracking-widest rounded-lg hover:brightness-110 transition-all">
              Đặt Ngay
            </button>
            {user?.isAdmin && (
              <Link to="/admin" className="text-xs font-semibold tracking-widest uppercase hover:text-primary transition-colors">
                Admin
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 lg:px-12 py-8">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 mb-8 text-sm opacity-60">
          <Link to="/" className="hover:text-primary">Trang Chủ</Link>
          <span className="material-symbols-outlined text-xs">chevron_right</span>
          <Link to="/#suites" className="hover:text-primary">Phòng Của Chúng Tôi</Link>
          <span className="material-symbols-outlined text-xs">chevron_right</span>
          <span className="text-primary font-medium italic">Phòng {room.roomNumber}</span>
        </nav>

        {/* Gallery Grid */}
        {mainImage && (
          <div className="grid grid-cols-12 gap-4 h-[600px] mb-12">
            {/* Main Image */}
            <div className="col-span-12 lg:col-span-8 rounded-xl overflow-hidden relative group">
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                style={{ backgroundImage: `url(http://localhost:5000${mainImage})` }}
              ></div>
              <div className="absolute bottom-6 left-6 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full text-white text-xs font-medium border border-white/20">
                Phòng Chính
              </div>
            </div>

            {/* Side Images */}
            {sideImages.length > 0 && (
              <div className="hidden lg:grid col-span-4 grid-rows-2 gap-4">
                {sideImages.map((image, index) => (
                  <div key={index} className="rounded-xl overflow-hidden relative group">
                    <div 
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                      style={{ backgroundImage: `url(http://localhost:5000${image})` }}
                    ></div>
                    <div className="absolute bottom-4 left-4 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full text-white text-[10px] uppercase tracking-widest border border-white/10">
                      {index === 0 ? 'Tiện Ích' : 'Không Gian'}
                    </div>
                  </div>
                ))}
                {/* Placeholder nếu không đủ 2 ảnh */}
                {sideImages.length === 1 && (
                  <div className="rounded-xl overflow-hidden relative bg-charcoal/5 flex items-center justify-center">
                    <span className="material-symbols-outlined text-6xl text-primary/30">bed</span>
                  </div>
                )}
              </div>
            )}
            {/* Nếu không có ảnh phụ, hiển thị placeholder */}
            {sideImages.length === 0 && (
              <div className="hidden lg:grid col-span-4 grid-rows-2 gap-4">
                <div className="rounded-xl overflow-hidden relative bg-charcoal/5 flex items-center justify-center">
                  <span className="material-symbols-outlined text-6xl text-primary/30">bed</span>
                </div>
                <div className="rounded-xl overflow-hidden relative bg-charcoal/5 flex items-center justify-center">
                  <span className="material-symbols-outlined text-6xl text-primary/30">bed</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Categorized Images Section */}
        {convertedImages.length > 0 && (
          <div className="mb-12 space-y-10">
            {/* Phòng Khách */}
            {imagesByCategory.living_room.length > 0 && (
              <div>
                <h3 className="text-2xl font-display mb-6 flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary text-3xl">living</span>
                  Phòng Khách
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {imagesByCategory.living_room.map((image, index) => (
                    <div key={index} className="relative group rounded-xl overflow-hidden aspect-[4/3]">
                      <img 
                        src={`http://localhost:5000${image.url}`} 
                        alt={image.label || 'Phòng khách'} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      {image.label && (
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                          <p className="text-white text-sm font-medium">{image.label}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Phòng Ngủ */}
            {imagesByCategory.bedroom.length > 0 && (
              <div>
                <h3 className="text-2xl font-display mb-6 flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary text-3xl">bed</span>
                  Phòng Ngủ
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {imagesByCategory.bedroom.map((image, index) => (
                    <div key={index} className="relative group rounded-xl overflow-hidden aspect-[4/3]">
                      <img 
                        src={`http://localhost:5000${image.url}`} 
                        alt={image.label || 'Phòng ngủ'} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      {image.label && (
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                          <p className="text-white text-sm font-medium">{image.label}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Phòng Tắm */}
            {imagesByCategory.bathroom.length > 0 && (
              <div>
                <h3 className="text-2xl font-display mb-6 flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary text-3xl">bathtub</span>
                  Phòng Tắm
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {imagesByCategory.bathroom.map((image, index) => (
                    <div key={index} className="relative group rounded-xl overflow-hidden aspect-[4/3]">
                      <img 
                        src={`http://localhost:5000${image.url}`} 
                        alt={image.label || 'Phòng tắm'} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      {image.label && (
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                          <p className="text-white text-sm font-medium">{image.label}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Khu Vực Khác */}
            {imagesByCategory.other.length > 0 && (
              <div>
                <h3 className="text-2xl font-display mb-6 flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary text-3xl">image</span>
                  Khu Vực Khác
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {imagesByCategory.other.map((image, index) => (
                    <div key={index} className="relative group rounded-xl overflow-hidden aspect-[4/3]">
                      <img 
                        src={`http://localhost:5000${image.url}`} 
                        alt={image.label || 'Khu vực khác'} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      {image.label && (
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                          <p className="text-white text-sm font-medium">{image.label}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-16">
          {/* Content Area (Left) */}
          <div className="w-full lg:w-2/3">
            {/* Title and Specs */}
            <div className="mb-10">
              <h1 className="text-5xl lg:text-6xl font-display mb-4 leading-[1.1]">
                {room.type?.name || `Phòng ${room.roomNumber}`}
              </h1>
              <div className="flex flex-wrap gap-6 text-sm text-[#7f786c] dark:text-gray-400 font-medium italic">
                {room.type?.area && (
                  <span className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm">square_foot</span>
                    {room.type.area} m²
                  </span>
                )}
                {room.category?.name && (
                  <span className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm">visibility</span>
                    {room.category.name}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">king_bed</span>
                  {room.type?.bedType || '1 Giường'}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">group</span>
                  Tối đa {maxAdults} {maxAdults === 1 ? 'Người lớn' : 'Người lớn'}
                  {maxChildren > 0 && `, ${maxChildren} Trẻ em`}
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="prose dark:prose-invert max-w-none text-lg leading-relaxed mb-16 opacity-80">
              {room.type?.description ? (
                <p className="mb-6">{room.type.description}</p>
              ) : (
                <>
                  <p className="mb-6">
                    Phòng {room.roomNumber} tại tầng {room.floor} mang đến không gian nghỉ dưỡng sang trọng và tiện nghi. 
                    Với thiết kế hiện đại và đầy đủ tiện ích, phòng này là lựa chọn lý tưởng cho kỳ nghỉ của bạn.
                  </p>
                  <p>
                    Mỗi chi tiết đều được chăm chút kỹ lưỡng để mang đến trải nghiệm nghỉ dưỡng hoàn hảo nhất. 
                    Từ nội thất sang trọng đến dịch vụ chu đáo, chúng tôi cam kết mang đến sự thoải mái và tiện nghi tối đa.
                  </p>
                </>
              )}
            </div>

            {/* Room Amenities Grid */}
            {room.amenities && room.amenities.length > 0 && (
              <div className="mb-16">
                <h3 className="text-2xl font-display mb-8 pb-4 border-b border-black/5 dark:border-white/5">
                  Tiện Ích Phòng
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-y-10 gap-x-6">
                  {room.amenities.map((amenity) => {
                    const amenityId = amenity._id || amenity
                    const isSelectable = amenity.price !== undefined && amenity.price > 0
                    const isSelected = selectedAmenities.includes(amenityId)
                    
                    return (
                      <div 
                        key={amenityId} 
                        className={`flex items-start gap-4 p-4 rounded-lg border transition-all ${
                          isSelectable 
                            ? `cursor-pointer hover:border-primary ${isSelected ? 'border-primary bg-primary/5' : 'border-black/5 dark:border-white/5'}`
                            : ''
                        }`}
                        onClick={() => isSelectable && toggleAmenity(amenityId)}
                      >
                        {amenity.image ? (
                          <img
                            src={`http://localhost:5000${amenity.image}`}
                            alt={amenity.name}
                            className="w-12 h-12 object-cover rounded-lg"
                          />
                        ) : (
                          <span className="material-symbols-outlined text-primary text-3xl">room_service</span>
                        )}
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <h4 className="font-bold text-sm uppercase tracking-wide">{amenity.name || amenity}</h4>
                              {amenity.description && (
                                <p className="text-xs opacity-60 mt-1">{amenity.description}</p>
                              )}
                              {amenity.price !== undefined && (
                                <p className="text-xs opacity-60 mt-1">
                                  {amenity.price === 0 ? 'Miễn phí' : formatPrice(amenity.price)}
                                  {bookingType === 'hourly' && amenity.price > 0 && '/giờ'}
                                </p>
                              )}
                            </div>
                            {isSelectable && (
                              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                                isSelected 
                                  ? 'bg-primary border-primary' 
                                  : 'border-black/20 dark:border-white/20'
                              }`}>
                                {isSelected && (
                                  <span className="material-symbols-outlined text-white text-sm">check</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Policies */}
            <div className="space-y-4">
              <h3 className="text-2xl font-display mb-6">Chính Sách Phòng</h3>
              <div className="p-6 bg-white dark:bg-background-dark border border-black/5 dark:border-white/5 rounded-xl shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm font-bold uppercase tracking-wider">Nhận Phòng / Trả Phòng</span>
                  <span className="text-sm italic opacity-70">15:00 / 12:00</span>
                </div>
                <div className="h-px bg-black/5 dark:bg-white/5 my-4"></div>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm font-bold uppercase tracking-wider">Hủy Đặt Phòng</span>
                  <span className="text-sm italic opacity-70">Miễn phí hủy trước 24 giờ</span>
                </div>
                <div className="h-px bg-black/5 dark:bg-white/5 my-4"></div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold uppercase tracking-wider">Thú Cưng</span>
                  <span className="text-sm italic opacity-70">
                    {room.note?.toLowerCase().includes('pet') ? 'Cho phép thú cưng' : 'Không cho phép thú cưng'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Booking Widget (Right Sidebar) */}
          <div className="w-full lg:w-1/3">
            <div className="sticky top-24 p-8 bg-white dark:bg-background-dark border border-black/10 dark:border-white/10 rounded-2xl shadow-xl shadow-black/5">
              <div className="flex items-baseline justify-between mb-8">
                <div>
                  <span className="text-4xl font-display font-bold">
                    {bookingType === 'hourly' 
                      ? formatPrice(room.price?.firstHour || 0)
                      : bookingType === 'overnight'
                      ? formatPrice(room.price?.overnight || 0)
                      : formatPrice(room.price?.daily || 0)
                    }
                  </span>
                  <span className="text-sm opacity-60 ml-1">
                    {bookingType === 'hourly' ? '/ Giờ đầu' : bookingType === 'overnight' ? '/ Qua đêm' : '/ Đêm'}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-primary">
                  <span className="material-symbols-outlined text-sm fill-1">star</span>
                  <span className="text-sm font-bold">4.9</span>
                </div>
              </div>

              <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                {/* Booking Type Selection */}
                <div className="bg-white dark:bg-background-dark border border-black/10 dark:border-white/10 p-4 rounded-lg">
                  <label className="block text-[10px] uppercase font-bold tracking-widest mb-2 opacity-50">
                    Loại Thuê
                  </label>
                  <select 
                    value={bookingType}
                    onChange={(e) => {
                      setBookingType(e.target.value)
                      if (e.target.value === 'hourly') {
                        setHours(1)
                      }
                    }}
                    className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm font-medium appearance-none"
                  >
                    <option value="hourly">Theo Giờ</option>
                    <option value="overnight">Qua Đêm (21h - 12h)</option>
                    <option value="daily">Theo Ngày (24h)</option>
                  </select>
                </div>

                {/* Hourly Input */}
                {bookingType === 'hourly' && (
                  <div className="space-y-4">
                    <div className="bg-white dark:bg-background-dark border border-black/10 dark:border-white/10 p-4 rounded-lg">
                      <label className="block text-[10px] uppercase font-bold tracking-widest mb-1 opacity-50">
                        Ngày Nhận Phòng
                      </label>
                      <input
                        type="date"
                        value={checkIn}
                        onChange={(e) => setCheckIn(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm font-medium"
                      />
                    </div>
                    <div className="bg-white dark:bg-background-dark border border-black/10 dark:border-white/10 p-4 rounded-lg">
                      <label className="block text-[10px] uppercase font-bold tracking-widest mb-1 opacity-50">
                        Giờ Nhận Phòng
                      </label>
                      <input
                        type="time"
                        value={checkInTime}
                        onChange={(e) => setCheckInTime(e.target.value)}
                        className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm font-medium"
                      />
                    </div>
                    <div className="bg-white dark:bg-background-dark border border-black/10 dark:border-white/10 p-4 rounded-lg">
                      <label className="block text-[10px] uppercase font-bold tracking-widest mb-2 opacity-50">
                        Số Giờ
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="24"
                        value={hours}
                        onChange={(e) => setHours(parseInt(e.target.value) || 1)}
                        className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm font-medium"
                      />
                      <p className="text-xs opacity-50 mt-1">
                        Giờ đầu: {formatPrice(room.price?.firstHour || 0)}, 
                        Giờ tiếp theo: {formatPrice(room.price?.nextHour || 0)}/giờ
                      </p>
                    </div>
                    <div className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 p-4 rounded-lg">
                      <label className="block text-[10px] uppercase font-bold tracking-widest mb-1 opacity-50">
                        Ngày & Giờ Trả Phòng (Tự động)
                      </label>
                      <p className="text-sm font-medium opacity-70">
                        {(() => {
                          if (!checkIn || !checkInTime || !hours) return 'Vui lòng chọn ngày, giờ nhận và số giờ'
                          try {
                            const [hoursStr, minutesStr] = checkInTime.split(':')
                            const checkInHours = parseInt(hoursStr, 10)
                            const checkInMinutes = parseInt(minutesStr, 10)
                            
                            const checkInDateTime = new Date(checkIn)
                            checkInDateTime.setHours(checkInHours, checkInMinutes, 0, 0)
                            
                            const checkOutDateTime = new Date(checkInDateTime)
                            checkOutDateTime.setHours(checkOutDateTime.getHours() + hours)
                            
                            const checkOutHours = checkOutDateTime.getHours().toString().padStart(2, '0')
                            const checkOutMinutes = checkOutDateTime.getMinutes().toString().padStart(2, '0')
                            
                            return `${checkOutDateTime.toLocaleDateString('vi-VN', { 
                              weekday: 'long', 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })} lúc ${checkOutHours}:${checkOutMinutes}`
                          } catch (error) {
                            return 'Vui lòng chọn đầy đủ thông tin'
                          }
                        })()}
                      </p>
                    </div>
                  </div>
                )}

                {/* Date Selection - Overnight: chỉ ngày nhận và giờ nhận */}
                {bookingType === 'overnight' && (
                  <div className="space-y-4">
                    <div className="bg-white dark:bg-background-dark border border-black/10 dark:border-white/10 p-4 rounded-lg">
                      <label className="block text-[10px] uppercase font-bold tracking-widest mb-1 opacity-50">
                        Ngày Nhận Phòng
                      </label>
                      <input
                        type="date"
                        value={checkIn}
                        onChange={(e) => setCheckIn(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm font-medium"
                      />
                    </div>
                    <div className="bg-white dark:bg-background-dark border border-black/10 dark:border-white/10 p-4 rounded-lg">
                      <label className="block text-[10px] uppercase font-bold tracking-widest mb-1 opacity-50">
                        Giờ Nhận Phòng
                      </label>
                      <input
                        type="time"
                        value={checkInTime}
                        onChange={(e) => setCheckInTime(e.target.value)}
                        className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm font-medium"
                      />
                    </div>
                    <div className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 p-4 rounded-lg">
                      <label className="block text-[10px] uppercase font-bold tracking-widest mb-1 opacity-50">
                        Ngày Trả Phòng (Tự động)
                      </label>
                      <p className="text-sm font-medium opacity-70">
                        {(() => {
                          const checkInDate = new Date(checkIn)
                          const nextDay = new Date(checkInDate)
                          nextDay.setDate(nextDay.getDate() + 1)
                          return nextDay.toLocaleDateString('vi-VN', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })
                        })()} lúc 12:00
                      </p>
                    </div>
                  </div>
                )}

                {/* Date Selection - Daily: ngày nhận/trả và giờ nhận/trả */}
                {bookingType === 'daily' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-px bg-black/10 dark:bg-white/10 border border-black/10 dark:border-white/10 rounded-lg overflow-hidden">
                      <div className="bg-white dark:bg-background-dark p-4">
                        <label className="block text-[10px] uppercase font-bold tracking-widest mb-1 opacity-50">
                          Ngày Nhận
                        </label>
                        <input
                          type="date"
                          value={checkIn}
                          onChange={(e) => {
                            setCheckIn(e.target.value)
                            // Tự động cập nhật check-out nếu nhỏ hơn check-in
                            if (e.target.value >= checkOut) {
                              const newCheckOut = new Date(e.target.value)
                              newCheckOut.setDate(newCheckOut.getDate() + 1)
                              setCheckOut(newCheckOut.toISOString().split('T')[0])
                            }
                          }}
                          min={new Date().toISOString().split('T')[0]}
                          className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm font-medium"
                        />
                      </div>
                      <div className="bg-white dark:bg-background-dark p-4">
                        <label className="block text-[10px] uppercase font-bold tracking-widest mb-1 opacity-50">
                          Ngày Trả
                        </label>
                        <input
                          type="date"
                          value={checkOut}
                          onChange={(e) => setCheckOut(e.target.value)}
                          min={checkIn || new Date().toISOString().split('T')[0]}
                          className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm font-medium"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-px bg-black/10 dark:bg-white/10 border border-black/10 dark:border-white/10 rounded-lg overflow-hidden">
                      <div className="bg-white dark:bg-background-dark p-4">
                        <label className="block text-[10px] uppercase font-bold tracking-widest mb-1 opacity-50">
                          Giờ Nhận
                        </label>
                        <input
                          type="time"
                          value={checkInTime}
                          onChange={(e) => setCheckInTime(e.target.value)}
                          className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm font-medium"
                        />
                      </div>
                      <div className="bg-white dark:bg-background-dark p-4">
                        <label className="block text-[10px] uppercase font-bold tracking-widest mb-1 opacity-50">
                          Giờ Trả
                        </label>
                        <input
                          type="time"
                          value={checkOutTime}
                          onChange={(e) => setCheckOutTime(e.target.value)}
                          className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm font-medium"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Guests Selection */}
                <div className="space-y-4">
                  <div className="bg-white dark:bg-background-dark border border-black/10 dark:border-white/10 p-4 rounded-lg">
                    <label className="block text-[10px] uppercase font-bold tracking-widest mb-1 opacity-50">
                      Người Lớn
                      {maxAdults && <span className="text-[9px] normal-case ml-1 opacity-40">(Tối đa: {maxAdults})</span>}
                    </label>
                    <select 
                      value={adults}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 1
                        setAdults(Math.min(value, maxAdults))
                      }}
                      className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm font-medium appearance-none"
                    >
                      {Array.from({ length: maxAdults }, (_, i) => i + 1).map((num) => (
                        <option key={num} value={num}>
                          {num} {num === 1 ? 'Người lớn' : 'Người lớn'}
                        </option>
                      ))}
                    </select>
                  </div>
                  {maxChildren > 0 && (
                    <div className="bg-white dark:bg-background-dark border border-black/10 dark:border-white/10 p-4 rounded-lg">
                      <label className="block text-[10px] uppercase font-bold tracking-widest mb-1 opacity-50">
                        Trẻ Em
                        <span className="text-[9px] normal-case ml-1 opacity-40">(Tối đa: {maxChildren})</span>
                      </label>
                      <select 
                        value={children}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 0
                          setChildren(Math.min(value, maxChildren))
                        }}
                        className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm font-medium appearance-none"
                      >
                        {Array.from({ length: maxChildren + 1 }, (_, i) => i).map((num) => (
                          <option key={num} value={num}>
                            {num} {num === 1 ? 'Trẻ em' : 'Trẻ em'}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Services Selection - Chỉ hiển thị khi daily hoặc overnight */}
                {(bookingType === 'daily' || bookingType === 'overnight') && services.length > 0 && (
                  <div className="bg-white dark:bg-background-dark border border-black/10 dark:border-white/10 p-4 rounded-lg">
                    <label className="block text-[10px] uppercase font-bold tracking-widest mb-3 opacity-50">
                      Dịch Vụ (Tùy chọn)
                    </label>
                    <div className="max-h-48 overflow-y-auto space-y-2">
                      {services.map((service) => {
                        const isSelected = selectedServices.includes(service._id)
                        return (
                          <div
                            key={service._id}
                            onClick={() => toggleService(service._id)}
                            className={`flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-all ${
                              isSelected
                                ? 'border-primary bg-primary/5'
                                : 'border-black/10 dark:border-white/10 hover:border-primary/50'
                            }`}
                          >
                            {service.image ? (
                              <img
                                src={`http://localhost:5000${service.image}`}
                                alt={service.name}
                                className="w-10 h-10 object-cover rounded"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-primary/10 rounded flex items-center justify-center">
                                <span className="material-symbols-outlined text-primary text-lg">room_service</span>
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <h4 className="text-sm font-medium truncate">{service.name}</h4>
                                <span className="text-sm font-bold text-primary whitespace-nowrap">
                                  {formatPrice(service.price)}
                                </span>
                              </div>
                              {service.description && (
                                <p className="text-xs opacity-60 mt-0.5 truncate">{service.description}</p>
                              )}
                              <p className="text-xs opacity-50 mt-0.5">
                                {service.unit} • {service.type}
                              </p>
                            </div>
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                              isSelected
                                ? 'bg-primary border-primary'
                                : 'border-black/20 dark:border-white/20'
                            }`}>
                              {isSelected && (
                                <span className="material-symbols-outlined text-white text-sm">check</span>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Price Breakdown */}
                <div className="space-y-3 pt-4 border-t border-black/5 dark:border-white/5">
                  {/* Room Price */}
                  <div className="flex justify-between text-sm">
                    <span className="opacity-60">
                      {bookingType === 'hourly' 
                        ? `${formatPrice(room.price?.firstHour || 0)} + ${hours > 1 ? `${hours - 1} giờ x ${formatPrice(room.price?.nextHour || 0)}` : ''}`
                        : bookingType === 'overnight'
                        ? 'Qua đêm'
                        : `${formatPrice(room.price?.daily || 0)} x ${calculateNights()} đêm`
                      }
                    </span>
                    <span className="font-medium">{formatPrice(calculateRoomPrice())}</span>
                  </div>

                  {/* Selected Amenities */}
                  {selectedAmenities.length > 0 && (
                    <div className="space-y-1">
                      {selectedAmenities.map(amenityId => {
                        const amenity = room.amenities.find(a => (a._id || a) === amenityId)
                        if (!amenity) return null
                        const amenityPrice = bookingType === 'hourly' && amenity.price 
                          ? amenity.price * hours 
                          : amenity.price || 0
                        return (
                          <div key={amenityId} className="flex justify-between text-xs opacity-60">
                            <span>+ {amenity.name}</span>
                            <span>{formatPrice(amenityPrice)}</span>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* Selected Services */}
                  {selectedServices.length > 0 && (
                    <div className="space-y-1">
                      {selectedServices.map(serviceId => {
                        const service = services.find(s => s._id === serviceId)
                        if (!service) return null
                        return (
                          <div key={serviceId} className="flex justify-between text-xs opacity-60">
                            <span>+ {service.name}</span>
                            <span>{formatPrice(service.price || 0)}</span>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* Total */}
                  <div className="flex justify-between text-lg font-bold font-display pt-2 border-t border-black/5 dark:border-white/5">
                    <span>Tổng</span>
                    <span className="text-primary">{formatPrice(calculateTotal())}</span>
                  </div>
                </div>

                {room.status === 'Available' ? (
                  <button
                    type="submit"
                    onClick={handleSubmitBooking}
                    className="w-full py-4 bg-primary text-white font-bold uppercase tracking-[0.2em] rounded-lg hover:brightness-105 transition-all shadow-lg shadow-primary/20"
                  >
                    Xác Nhận Đặt Phòng
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="w-full py-4 bg-charcoal/20 text-charcoal/40 dark:text-white/20 dark:text-white/40 font-bold uppercase tracking-[0.2em] rounded-lg cursor-not-allowed"
                  >
                    Phòng Không Có Sẵn
                  </button>
                )}
                <p className="text-[10px] text-center opacity-40 uppercase tracking-widest">
                  Bạn sẽ không bị tính phí ngay
                </p>
              </form>
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
              "Định nghĩa lại bản chất của cuộc sống ven biển thông qua kiến trúc thanh lịch và sự hiếu khách tinh tế."
            </p>
            <div className="flex gap-4">
              <a className="p-2 border border-black/10 dark:border-white/10 rounded-full hover:border-primary hover:text-primary transition-colors" href="#">
                <span className="material-symbols-outlined text-sm">public</span>
              </a>
              <a className="p-2 border border-black/10 dark:border-white/10 rounded-full hover:border-primary hover:text-primary transition-colors" href="#">
                <span className="material-symbols-outlined text-sm">photo_camera</span>
              </a>
            </div>
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest mb-6">Liên Hệ</h4>
            <ul className="space-y-4 text-sm opacity-70">
              <li><a className="hover:text-primary" href="#">Liên Hệ Chúng Tôi</a></li>
              <li><a className="hover:text-primary" href="#">Câu Hỏi Thường Gặp</a></li>
              <li><a className="hover:text-primary" href="#">Báo Chí</a></li>
              <li><a className="hover:text-primary" href="#">Bền Vững</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest mb-6">Địa Chỉ</h4>
            <p className="text-sm opacity-70 leading-relaxed">
              123 Đường Biển,<br/>
              Thành Phố, Việt Nam<br/>
            </p>
            <a className="text-xs font-bold text-primary mt-4 inline-block underline underline-offset-4" href="#">
              Xem Bản Đồ
            </a>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-black/5 dark:border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] uppercase tracking-[0.2em] opacity-40 font-bold">
          <p>© 2024 Aurelius Grand. Bảo lưu mọi quyền.</p>
          <div className="flex gap-8">
            <a href="#">Chính Sách Bảo Mật</a>
            <a href="#">Điều Khoản Dịch Vụ</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default RoomDetail
