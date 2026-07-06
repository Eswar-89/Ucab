import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

// South Indian Preset Locations database
const SOUTH_INDIA_LOCATIONS = [
  { name: "Kempegowda International Airport (BLR), Bangalore", lat: 13.1986, lng: 77.7066, region: "Bangalore" },
  { name: "Majestic Bus Station / KSR Railway Station, Bangalore", lat: 12.9779, lng: 77.5696, region: "Bangalore" },
  { name: "Indiranagar Metro Station, Bangalore", lat: 12.9784, lng: 77.6408, region: "Bangalore" },
  { name: "Koramangala 5th Block, Bangalore", lat: 12.9348, lng: 77.6189, region: "Bangalore" },
  { name: "Whitefield (ITPB), Bangalore", lat: 12.9842, lng: 77.7289, region: "Bangalore" },
  { name: "Electronic City Phase 1, Bangalore", lat: 12.8452, lng: 77.6636, region: "Bangalore" },
  { name: "Jayanagar 4th Block, Bangalore", lat: 12.9276, lng: 77.5873, region: "Bangalore" },
  { name: "Chennai Central Railway Station (MAS), Chennai", lat: 13.0825, lng: 80.2707, region: "Tamil Nadu" },
  { name: "Chennai International Airport (MAA), Chennai", lat: 12.9941, lng: 80.1709, region: "Tamil Nadu" },
  { name: "T. Nagar (Thyagaraya Nagar), Chennai", lat: 13.0440, lng: 80.2314, region: "Tamil Nadu" },
  { name: "Marina Beach (Light House), Chennai", lat: 13.0373, lng: 80.2795, region: "Tamil Nadu" },
  { name: "Adyar Depot, Chennai", lat: 13.0076, lng: 80.2520, region: "Tamil Nadu" },
  { name: "OMR IT Corridor (Taramani), Chennai", lat: 12.9863, lng: 80.2458, region: "Tamil Nadu" },
  { name: "Tirupati Temple (Tirumala Hills), Tirupati", lat: 13.6833, lng: 79.3500, region: "Andhra Pradesh" },
  { name: "Tirupati Railway Station, Tirupati", lat: 13.6277, lng: 79.4187, region: "Andhra Pradesh" },
  { name: "Visakhapatnam Junction Railway Station, Vizag", lat: 17.7212, lng: 83.2925, region: "Andhra Pradesh" },
  { name: "RK Beach (Rama Krishna Beach), Visakhapatnam", lat: 17.7126, lng: 83.3228, region: "Andhra Pradesh" },
  { name: "Vijayawada Junction Railway Station, Vijayawada", lat: 16.5186, lng: 80.6201, region: "Andhra Pradesh" }
];

// Local autocomplete query
const getSuggestions = (query) => {
  if (!query || query.length < 2) return [];
  const normalized = query.toLowerCase();
  return SOUTH_INDIA_LOCATIONS.filter(loc => 
    loc.name.toLowerCase().includes(normalized) ||
    loc.region.toLowerCase().includes(normalized)
  );
};

// Clean, high-contrast, black vector SVGs for each service card
const CarSvg = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '56px', height: '56px', color: '#000000' }}>
    <rect x="2" y="13" width="20" height="8" rx="2"></rect>
    <path d="M17 13l-1.5-6h-7L7 13"></path>
    <circle cx="5.5" cy="18.5" r="2.5" fill="#000000"></circle>
    <circle cx="18.5" cy="18.5" r="2.5" fill="#000000"></circle>
  </svg>
);

const CalendarSvg = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '56px', height: '56px', color: '#000000' }}>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="16" y1="2" x2="16" y2="6"></line>
    <line x1="8" y1="2" x2="8" y2="6"></line>
    <line x1="3" y1="10" x2="21" y2="10"></line>
    <circle cx="12" cy="16" r="2" fill="#000000"></circle>
  </svg>
);

const RoadSvg = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '56px', height: '56px', color: '#000000' }}>
    <path d="M4 22L8 2h8l4 20M12 2v20M12 6h.01M12 12h.01M12 18h.01"></path>
  </svg>
);

const BoxSvg = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '56px', height: '56px', color: '#000000' }}>
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
    <line x1="12" y1="22.08" x2="12" y2="12"></line>
  </svg>
);

const ClockCarSvg = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '56px', height: '56px', color: '#000000' }}>
    <circle cx="12" cy="12" r="10"></circle>
    <polyline points="12 6 12 12 16 14"></polyline>
  </svg>
);

const BikeSvg = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '56px', height: '56px', color: '#000000' }}>
    <circle cx="5.5" cy="12.5" r="3.5"></circle>
    <circle cx="18.5" cy="12.5" r="3.5"></circle>
    <path d="M12 8.5V11M5.5 12.5L12 8.5M18.5 12.5L15 6.5h-5"></path>
  </svg>
);

function HomePage() {
  const navigate = useNavigate();
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [currentCity, setCurrentCity] = useState('Bhopal');
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  
  const [pickupSuggestions, setPickupSuggestions] = useState([]);
  const [dropoffSuggestions, setDropoffSuggestions] = useState([]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (pickup || dropoff) {
      navigate(`/bookings?pickup=${encodeURIComponent(pickup)}&drop=${encodeURIComponent(dropoff)}`);
    } else {
      navigate('/bookings');
    }
  };

  const handleCityChange = (city) => {
    setCurrentCity(city);
    setShowCityDropdown(false);
    
    // Automatically preset the pickup location based on the city selection
    if (city === 'Bangalore') {
      setPickup('Majestic Bus Station / KSR Railway Station, Bangalore');
    } else if (city === 'Chennai') {
      setPickup('Chennai Central Railway Station (MAS), Chennai');
    } else if (city === 'Visakhapatnam') {
      setPickup('Visakhapatnam Junction Railway Station, Vizag');
    } else {
      setPickup('');
    }
    setPickupSuggestions([]);
  };

  const detectCityLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude: lat, longitude: lng } = position.coords;
          setPickup(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
          setCurrentCity('My Location');
          
          Swal.fire({
            title: 'Location Detected',
            text: `Pickup updated to your current coordinates.`,
            icon: 'success',
            timer: 2000,
            showConfirmButton: false
          });
        },
        () => {
          Swal.fire('GPS Denied', 'Please grant location permissions.', 'warning');
        }
      );
    } else {
      Swal.fire('Not Supported', 'Geolocation is not supported by your browser.', 'warning');
    }
  };

  const handlePickupChange = (value) => {
    setPickup(value);
    setPickupSuggestions(getSuggestions(value));
  };

  const handleDropoffChange = (value) => {
    setDropoff(value);
    setDropoffSuggestions(getSuggestions(value));
  };

  const services = [
    {
      title: 'Ride',
      desc: 'Go anywhere with UCab. Request a ride, hop in, and go.',
      svg: <CarSvg />,
      link: '/bookings?type=ride'
    },
    {
      title: 'Reserve',
      desc: 'Reserve your ride in advance so you can relax on the day of your trip.',
      svg: <CalendarSvg />,
      link: '/bookings?type=reserve'
    },
    {
      title: 'Intercity',
      desc: 'Get convenient, affordable outstation cabs anytime at your door.',
      svg: <RoadSvg />,
      link: '/bookings?type=prices'
    },
    {
      title: 'Parcel',
      desc: 'UCab makes same-day item delivery easier than ever.',
      svg: <BoxSvg />,
      link: '/bookings?type=parcel'
    },
    {
      title: 'Rentals',
      desc: 'Request a trip for a block of time and make multiple stops.',
      svg: <ClockCarSvg />,
      link: '/bookings?type=rent'
    },
    {
      title: 'Bike',
      desc: 'Get affordable motorbike rides in minutes at your doorstep.',
      svg: <BikeSvg />,
      link: '/bookings?type=ride'
    }
  ];

  return (
    <div style={{ backgroundColor: '#ffffff' }}>
      
      {/* Top Banner and Booking Panel Section */}
      <section className="container py-5">
        
        {/* Minimal rounded corner sub-navbar switcher */}
        <div className="d-flex align-items-center justify-content-start mb-5">
          <div className="sub-nav-bar">
            <Link className="sub-nav-tab active" to="/bookings?type=ride">Request a ride</Link>
            <Link className="sub-nav-tab" to="/bookings?type=reserve">Reserve a ride</Link>
            <Link className="sub-nav-tab" to="/bookings?type=prices">See prices</Link>
          </div>
        </div>

        <div className="row align-items-center gy-5">
          {/* Left: Input booking box */}
          <div className="col-lg-5">
            <div className="uber-search-container p-0">
              
              {/* Interactive City Selector and Geolocation option */}
              <div className="d-flex align-items-center gap-3 mb-4 flex-wrap">
                <div className="dropdown position-relative">
                  <button
                    className="btn btn-sm dropdown-toggle text-black d-flex align-items-center gap-1"
                    type="button"
                    onClick={() => setShowCityDropdown(!showCityDropdown)}
                    style={{ borderRadius: '20px', fontSize: '0.85rem', border: '1px solid #000000', backgroundColor: '#ffffff', fontWeight: '600' }}
                  >
                    📍 {currentCity} ▾
                  </button>
                  {showCityDropdown && (
                    <div className="suggestion-dropdown" style={{ minWidth: '160px', top: '100%', left: 0 }}>
                      {['Bangalore', 'Chennai', 'Visakhapatnam', 'Bhopal', 'Hyderabad', 'Mumbai', 'Delhi'].map(city => (
                        <div
                          key={city}
                          className="suggestion-item text-black"
                          onClick={() => handleCityChange(city)}
                          style={{ padding: '0.5rem 1rem' }}
                        >
                          <strong>{city}</strong>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1"
                  type="button"
                  onClick={detectCityLocation}
                  style={{ borderRadius: '20px', fontSize: '0.85rem' }}
                >
                  🧭 Use Current Location
                </button>
              </div>

              <h1 className="fw-bold mb-4" style={{ fontSize: '2.8rem', letterSpacing: '-0.02em', lineHeight: '1.1', color: '#000000' }}>
                Request a ride for now or later
              </h1>

              <div className="promo-badge">
                🏷️
                <div>
                  <strong>Up to 50% off your first 5 UCab rides.</strong>
                  <div className="text-muted-sm" style={{ color: '#137333', fontSize: '0.8rem' }}>*Valid within 15 days of signup.</div>
                </div>
              </div>

              {/* Time pill selector */}
              <div className="time-selector-pill">
                🕒 Pickup now ▾
              </div>

              {/* Connecting line inputs */}
              <form onSubmit={handleSearch} className="connecting-inputs mb-4">
                <div className="connecting-line-graphic"></div>
                <div className="dot-start"></div>
                <div className="square-end"></div>

                {/* Pickup Autocomplete input */}
                <div className="uber-input-wrapper position-relative">
                  <input
                    type="text"
                    placeholder="Enter pickup location"
                    value={pickup}
                    onChange={(e) => handlePickupChange(e.target.value)}
                    required
                  />
                  <span className="input-icon-right">🧭</span>
                  {pickupSuggestions.length > 0 && (
                    <div className="suggestion-dropdown">
                      {pickupSuggestions.map((item, idx) => (
                        <div
                          key={idx}
                          className="suggestion-item text-black"
                          onClick={() => {
                            setPickup(item.name);
                            setPickupSuggestions([]);
                          }}
                        >
                          <strong>{item.name.split(',')[0]}</strong>
                          <small className="text-muted-sm" style={{ fontSize: '0.75rem' }}>{item.name}</small>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Dropoff Autocomplete input */}
                <div className="uber-input-wrapper position-relative">
                  <input
                    type="text"
                    placeholder="Enter dropoff location"
                    value={dropoff}
                    onChange={(e) => handleDropoffChange(e.target.value)}
                    required
                  />
                  {dropoffSuggestions.length > 0 && (
                    <div className="suggestion-dropdown">
                      {dropoffSuggestions.map((item, idx) => (
                        <div
                          key={idx}
                          className="suggestion-item text-black"
                          onClick={() => {
                            setDropoff(item.name);
                            setDropoffSuggestions([]);
                          }}
                        >
                          <strong>{item.name.split(',')[0]}</strong>
                          <small className="text-muted-sm" style={{ fontSize: '0.75rem' }}>{item.name}</small>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button type="submit" className="btn btn-primary w-100 py-3 mt-3 text-white fw-bold" style={{ borderRadius: '8px', fontSize: '1rem' }}>
                  See prices
                </button>
              </form>

            </div>
          </div>

          {/* Right: Modern Retro Car 16:9 Looping Video */}
          <div className="col-lg-7 text-center d-flex justify-content-center align-items-center">
            <div style={{ width: '100%', maxWidth: '540px', aspectRatio: '16/9', overflow: 'hidden', borderRadius: '12px', border: '1px solid var(--uber-grey-border)', boxShadow: '0 8px 30px rgba(0,0,0,0.08)', backgroundColor: '#000000' }}>
              <video
                src="/video.mp4"
                autoPlay
                loop
                muted
                playsInline
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Grid section: Explore what you can do */}
      <section className="container py-5 mt-4">
        <h2 className="fw-bold mb-4" style={{ fontSize: '2.1rem', color: '#000000' }}>Explore what you can do with UCab</h2>
        
        <div className="uber-grid">
          {services.map((s, index) => (
            <div key={index} className="uber-card-grid" onClick={() => navigate(s.link)} style={{ cursor: 'pointer' }}>
              <div>
                <h4 className="uber-card-title">{s.title}</h4>
                <p className="uber-card-desc">{s.desc}</p>
              </div>
              <button className="uber-card-btn">Details</button>
              <div className="uber-card-img-container">
                {s.svg}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Scrolled Down partner portal section */}
      <section className="container py-5 my-5 border-top pt-5">
        <div className="row align-items-center gy-4 p-4 rounded-4" style={{ backgroundColor: '#F6F6F6' }}>
          <div className="col-lg-8">
            <h2 className="fw-bold text-black mb-3" style={{ fontSize: '1.8rem' }}>Drive with UCab</h2>
            <p className="text-muted mb-0" style={{ maxWidth: '640px' }}>
              Register your vehicle type, pass verification, accept ride coordinates, complete trips, and receive online payments immediately.
            </p>
          </div>
          <div className="col-lg-4 text-lg-end">
            <div className="d-flex flex-wrap gap-2 justify-content-lg-end">
              <Link to="/driver-login" className="btn btn-primary py-3 px-4 text-white">
                Log in to drive
              </Link>
              <Link to="/register" className="btn btn-outline-primary py-3 px-4">
                Register as Partner
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}

export default HomePage;
