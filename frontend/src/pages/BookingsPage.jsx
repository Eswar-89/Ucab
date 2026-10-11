/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { io } from "socket.io-client";
import Swal from "sweetalert2";
import { API_URL, SOCKET_URL } from "../config";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet-routing-machine";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png"
});

const socket = io(SOCKET_URL);

// Predefined database of South India locations (Bangalore, Tamil Nadu, Andhra Pradesh)
const SOUTH_INDIA_LOCATIONS = [
  // Bangalore, Karnataka
  { name: "Kempegowda International Airport (BLR), Bangalore", lat: 13.1986, lng: 77.7066, region: "Bangalore" },
  { name: "Majestic Bus Station / KSR Railway Station, Bangalore", lat: 12.9779, lng: 77.5696, region: "Bangalore" },
  { name: "Indiranagar Metro Station, Bangalore", lat: 12.9784, lng: 77.6408, region: "Bangalore" },
  { name: "Koramangala 5th Block, Bangalore", lat: 12.9348, lng: 77.6189, region: "Bangalore" },
  { name: "Whitefield (ITPB), Bangalore", lat: 12.9842, lng: 77.7289, region: "Bangalore" },
  { name: "Electronic City Phase 1, Bangalore", lat: 12.8452, lng: 77.6636, region: "Bangalore" },
  { name: "Jayanagar 4th Block, Bangalore", lat: 12.9276, lng: 77.5873, region: "Bangalore" },
  
  // Tamil Nadu
  { name: "Chennai Central Railway Station (MAS), Chennai", lat: 13.0825, lng: 80.2707, region: "Tamil Nadu" },
  { name: "Chennai International Airport (MAA), Chennai", lat: 12.9941, lng: 80.1709, region: "Tamil Nadu" },
  { name: "T. Nagar (Thyagaraya Nagar), Chennai", lat: 13.0440, lng: 80.2314, region: "Tamil Nadu" },
  { name: "Marina Beach (Light House), Chennai", lat: 13.0373, lng: 80.2795, region: "Tamil Nadu" },
  { name: "Adyar Depot, Chennai", lat: 13.0076, lng: 80.2520, region: "Tamil Nadu" },
  { name: "OMR IT Corridor (Taramani), Chennai", lat: 12.9863, lng: 80.2458, region: "Tamil Nadu" },
  { name: "Coimbatore Junction Railway Station, Coimbatore", lat: 10.9991, lng: 76.9654, region: "Tamil Nadu" },
  { name: "Madurai Meenakshi Amman Temple, Madurai", lat: 9.9195, lng: 78.1193, region: "Tamil Nadu" },

  // Andhra Pradesh
  { name: "Tirupati Temple (Tirumala Hills), Tirupati", lat: 13.6833, lng: 79.3500, region: "Andhra Pradesh" },
  { name: "Tirupati Railway Station, Tirupati", lat: 13.6277, lng: 79.4187, region: "Andhra Pradesh" },
  { name: "Visakhapatnam Junction Railway Station, Vizag", lat: 17.7212, lng: 83.2925, region: "Andhra Pradesh" },
  { name: "RK Beach (Rama Krishna Beach), Visakhapatnam", lat: 17.7126, lng: 83.3228, region: "Andhra Pradesh" },
  { name: "Vijayawada Junction Railway Station, Vijayawada", lat: 16.5186, lng: 80.6201, region: "Andhra Pradesh" },
  { name: "Amaravati Legislative Assembly Secretariat", lat: 16.5369, lng: 80.5185, region: "Andhra Pradesh" },
  { name: "Guntur Railway Station, Guntur", lat: 16.3007, lng: 80.4538, region: "Andhra Pradesh" }
];

// Fare rates per vehicle type
const FARE_RATES = {
  bike: { base: 20, perKm: 8,  label: "Bike Partner", emoji: "🏍️", desc: "Cheapest & fastest in traffic", eta: "2 min" },
  auto: { base: 30, perKm: 10, label: "Auto (3-Wheeler)", emoji: "🛺", desc: "Convenient open-air local travel", eta: "3 min" },
  car:  { base: 40, perKm: 12, label: "Mini / Sedan", emoji: "🚗", desc: "Premium hatchbacks & sedans", eta: "4 min" },
  suv:  { base: 60, perKm: 15, label: "Premium SUV", emoji: "🚙", desc: "Spacious premium 6-seater SUVs", eta: "6 min" }
};

const calcFare = (type, dist) => {
  if (!dist || dist <= 0) return 0;
  const r = FARE_RATES[type];
  return Math.round(r.base + r.perKm * dist);
};

const haversineDistance = (p1, p2) => {
  const R = 6371;
  const dLat = (p2.lat - p1.lat) * (Math.PI / 180);
  const dLon = (p2.lng - p1.lng) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(p1.lat * (Math.PI / 180)) * Math.cos(p2.lat * (Math.PI / 180)) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// Search places - combining South India presets first
const getSearchSuggestions = async (query) => {
  if (!query || query.length < 2) return [];
  const normalizedQuery = query.toLowerCase();

  // 1. Search in local South India database
  const localMatches = SOUTH_INDIA_LOCATIONS.filter(loc => 
    loc.name.toLowerCase().includes(normalizedQuery) ||
    loc.region.toLowerCase().includes(normalizedQuery)
  ).map(loc => ({
    place_id: `local-${loc.name}`,
    display_name: loc.name,
    lat: loc.lat.toString(),
    lon: loc.lng.toString(),
    isLocal: true
  }));

  // 2. Fetch from Nominatim API as fallback/addition
  try {
    const encoded = encodeURIComponent(query + " India");
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encoded}&limit=6&addressdetails=1`,
      { headers: { "Accept-Language": "en", "Accept": "application/json" } }
    );
    const apiData = await res.json();
    const formattedApi = apiData.map(item => ({
      place_id: item.place_id,
      display_name: item.display_name,
      lat: item.lat,
      lon: item.lon,
      isLocal: false
    }));

    // Combine local first, then API (filtering out duplicates based on display name)
    const combined = [...localMatches];
    formattedApi.forEach(apiItem => {
      const exists = combined.some(loc => loc.display_name.split(",")[0] === apiItem.display_name.split(",")[0]);
      if (!exists) {
        combined.push(apiItem);
      }
    });
    return combined.slice(0, 7);
  } catch {
    return localMatches;
  }
};

function MapController({ center }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center[0], center[1]]);
  return null;
}

function BookingsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mapRef = useRef(null);
  const routeRef = useRef(null);

  const token = localStorage.getItem("ucab_token");
  const user = JSON.parse(localStorage.getItem("ucab_user") || "{}");

  useEffect(() => {
    if (!token) {
      navigate("/login", { replace: true });
    } else if (user?.role === "driver") {
      navigate("/driver-dashboard", { replace: true });
    }
  }, []);

  const api = axios.create({
    baseURL: API_URL,
    headers: { Authorization: `Bearer ${token}` }
  });

  const [vehicle, setVehicle] = useState("car");
  const [pickupInput, setPickupInput] = useState(searchParams.get("pickup") || "");
  const [dropInput, setDropInput] = useState(searchParams.get("drop") || "");
  const [pickupCoords, setPickupCoords] = useState({ lat: 12.9779, lng: 77.5696 }); // Default to Bangalore Majestic
  const [dropCoords, setDropCoords] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [dropSuggestions, setDropSuggestions] = useState([]);
  const [distance, setDistance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [driverInfo, setDriverInfo] = useState(null);

  // New features state
  const [bookingType, setBookingType] = useState(searchParams.get("type") || "ride"); // ride, rent, parcel, reserve, prices
  const [paymentMethod, setPaymentMethod] = useState("cash"); // cash, upi
  const [rentalPackage, setRentalPackage] = useState("1hr_10km"); // hourly packages
  const [receiverName, setReceiverName] = useState("");
  const [receiverPhone, setReceiverPhone] = useState("");
  const [parcelCategory, setParcelCategory] = useState("document");
  const [reserveDate, setReserveDate] = useState("");
  const [reserveTime, setReserveTime] = useState("");

  // If query parameters are present on load, trigger search
  useEffect(() => {
    const pParam = searchParams.get("pickup");
    const dParam = searchParams.get("drop");
    const typeParam = searchParams.get("type");
    
    if (typeParam) {
      setBookingType(typeParam);
    }
    if (pParam) {
      const match = SOUTH_INDIA_LOCATIONS.find(loc => loc.name === pParam);
      if (match) {
        setPickupCoords({ lat: match.lat, lng: match.lng });
      } else {
        getSearchSuggestions(pParam).then(res => {
          if (res.length > 0) setPickupCoords({ lat: parseFloat(res[0].lat), lng: parseFloat(res[0].lon) });
        });
      }
    }
    if (dParam) {
      const match = SOUTH_INDIA_LOCATIONS.find(loc => loc.name === dParam);
      if (match) {
        setDropCoords({ lat: match.lat, lng: match.lng });
      } else {
        getSearchSuggestions(dParam).then(res => {
          if (res.length > 0) setDropCoords({ lat: parseFloat(res[0].lat), lng: parseFloat(res[0].lon) });
        });
      }
    }
  }, [searchParams]);

  // Show captain immediately from API response — no loading, no polling needed
  const showCaptainInstantly = (cap, bookingId, vehicleType) => {
    const driverData = {
      bookingId,
      driverName: cap?.name || 'Rajesh Kumar',
      driverPhone: cap?.phone || '+91 98765 00003',
      vehicleType,
      vehicleNumber: cap?.plate || 'KA-03-ME-7788',
      vehicleModel: cap?.model || 'Maruti Suzuki Swift',
      rating: cap?.rating || 4.9,
      eta: cap?.eta || '4 mins',
    };
    setDriverInfo(driverData);
  };

  // Recalculate distance whenever either coord changes
  useEffect(() => {
    if (!dropCoords || !pickupCoords) return;

    const dist = haversineDistance(pickupCoords, dropCoords);
    setDistance(dist);

    if (mapRef.current) {
      if (routeRef.current) {
        try { mapRef.current.removeControl(routeRef.current); } catch { /* ignore */ }
      }
      try {
        routeRef.current = L.Routing.control({
          waypoints: [
            L.latLng(pickupCoords.lat, pickupCoords.lng),
            L.latLng(dropCoords.lat, dropCoords.lng)
          ],
          addWaypoints: false,
          draggableWaypoints: false,
          show: false,
          lineOptions: {
            styles: [{ color: "#000000", weight: 6, opacity: 0.85 }]
          }
        }).addTo(mapRef.current);
      } catch (err) { console.error("routing machine failed", err); }
    }
  }, [pickupCoords, dropCoords]);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      Swal.fire("Not Supported", "Geolocation is not supported by your browser", "warning");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        setPickupCoords({ lat, lng });
        setPickupInput(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
      },
      () => {
        Swal.fire("Location Error", "Could not fetch current coordinates.", "error");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handlePickupSearch = async (value) => {
    setPickupInput(value);
    const data = await getSearchSuggestions(value);
    setSuggestions(data);
  };

  const handleDropSearch = async (value) => {
    setDropInput(value);
    const data = await getSearchSuggestions(value);
    setDropSuggestions(data);
  };

  const handleBooking = async () => {
    if (!token) {
      Swal.fire("Please Login", "You must be logged in to book a ride", "warning")
        .then(() => navigate("/login"));
      return;
    }
    if (!pickupInput || !dropCoords) {
      Swal.fire("Missing Info", "Please set both pickup and drop locations", "warning");
      return;
    }
    setLoading(true);
    try {
      const bookingRes = await api.post("/bookings", {
        pickupLocation: pickupInput,
        dropLocation: dropInput,
        pickupCoords,
        dropCoords,
        vehicleType: vehicle,
        fare: calcFare(vehicle, distance),
        distance
      });
      const data = bookingRes.data;
      setLoading(false);
      // Captain is already assigned — show instantly like Zomato/Swiggy
      showCaptainInstantly(data.assignedCaptain, data._id, vehicle);
    } catch (error) {
      setLoading(false);
      const errMsg = error.response?.data?.message || "Booking failed";
      if (error.response?.status === 401) {
        Swal.fire({
          title: "Session Expired",
          text: "Your session is invalid or the database was refreshed. Please register or log in again.",
          icon: "warning",
          confirmButtonText: "Register/Login"
        }).then(() => {
          localStorage.removeItem("ucab_token");
          localStorage.removeItem("ucab_user");
          navigate("/login");
          window.location.reload();
        });
      } else {
        Swal.fire("Booking Failed", errMsg, "error");
      }
    }
  };

  if (!token || user?.role === "driver") return null;

  return (
    <div className="page-container-wide anim-fade-up">
      <div className="row gy-4">
        
        {/* Map Panel */}
        <div className="col-lg-7">
          <div className="map-wrapper" style={{ height: "500px" }}>
            <MapContainer
              center={[pickupCoords.lat, pickupCoords.lng]}
              zoom={13}
              style={{ height: "100%", width: "100%" }}
              whenCreated={(map) => { mapRef.current = map; }}
            >
              <TileLayer
                attribution="&copy; CartoDB Positron"
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              />
              <MapController center={[pickupCoords.lat, pickupCoords.lng]} />
              <Marker position={[pickupCoords.lat, pickupCoords.lng]}>
                <Popup>Pickup point</Popup>
              </Marker>
              {dropCoords && (
                <Marker position={[dropCoords.lat, dropCoords.lng]}>
                  <Popup>Drop point</Popup>
                </Marker>
              )}
            </MapContainer>
          </div>
        </div>

        {/* Input Details */}
        <div className="col-lg-5">
          <div className="ucab-card card p-4 shadow-sm border h-100 d-flex flex-column" style={{ borderColor: '#E2E2E2', minHeight: '520px' }}>
            
            {/* Interactive Switcher */}
            <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2" style={{ borderBottom: '1px solid #eee', paddingBottom: '1rem' }}>
              <button 
                className={`btn btn-sm fw-bold px-3 py-2 ${bookingType === 'ride' ? 'btn-dark' : 'btn-light text-black'}`}
                style={{ borderRadius: '20px', transition: 'all 0.2s' }}
                onClick={() => { setBookingType('ride'); setDriverInfo(null); }}
              >
                🚕 Ride
              </button>
              <button 
                className={`btn btn-sm fw-bold px-3 py-2 ${bookingType === 'rent' ? 'btn-dark' : 'btn-light text-black'}`}
                style={{ borderRadius: '20px', transition: 'all 0.2s' }}
                onClick={() => { setBookingType('rent'); setDriverInfo(null); }}
              >
                ⏱️ Rent
              </button>
              <button 
                className={`btn btn-sm fw-bold px-3 py-2 ${bookingType === 'parcel' ? 'btn-dark' : 'btn-light text-black'}`}
                style={{ borderRadius: '20px', transition: 'all 0.2s' }}
                onClick={() => { setBookingType('parcel'); setDriverInfo(null); }}
              >
                📦 Parcel
              </button>
              <button 
                className={`btn btn-sm fw-bold px-3 py-2 ${bookingType === 'reserve' ? 'btn-dark' : 'btn-light text-black'}`}
                style={{ borderRadius: '20px', transition: 'all 0.2s' }}
                onClick={() => { setBookingType('reserve'); setDriverInfo(null); }}
              >
                🗓️ Reserve
              </button>
              <button 
                className={`btn btn-sm fw-bold px-3 py-2 ${bookingType === 'prices' ? 'btn-dark' : 'btn-light text-black'}`}
                style={{ borderRadius: '20px', transition: 'all 0.2s' }}
                onClick={() => { setBookingType('prices'); setDriverInfo(null); }}
              >
                💰 See Prices
              </button>
            </div>

            {bookingType === 'prices' ? (
              /* SEE PRICES: Tourist locations and package prices list */
              <div className="flex-grow-1 overflow-auto" style={{ maxHeight: '480px' }}>
                <h5 className="fw-bold mb-3 text-black">Famous Tourist Packages</h5>
                <p className="text-muted-sm mb-4" style={{ fontSize: '0.8rem' }}>Book outstation tours and packages directly at flat rates.</p>
                
                <div className="d-flex flex-column gap-3">
                  {[
                    {
                      name: "Nandi Hills Sunrise Getaway",
                      desc: "Bangalore to Nandi Hills (Roundtrip with sightseeing)",
                      pickup: "Majestic Bus Station / KSR Railway Station, Bangalore",
                      drop: "Kempegowda International Airport (BLR), Bangalore",
                      pLat: 12.9779, pLng: 77.5696, dLat: 13.1986, dLng: 77.7066,
                      dist: "60 km",
                      duration: "1 Day Package",
                      sedanPrice: 1800,
                      suvPrice: 2500,
                    },
                    {
                      name: "Heritage Mysore Palace Tour",
                      desc: "Bangalore to Mysore (Palace, Srirangapatna & Chamundi Hills)",
                      pickup: "Koramangala 5th Block, Bangalore",
                      drop: "Whitefield (ITPB), Bangalore",
                      pLat: 12.9348, pLng: 77.6189, dLat: 12.9842, dLng: 77.7289,
                      dist: "145 km",
                      duration: "1 Day Package",
                      sedanPrice: 3500,
                      suvPrice: 4800,
                    },
                    {
                      name: "Mahabalipuram Shore Heritage Tour",
                      desc: "Chennai to Mahabalipuram shore temples roundtrip",
                      pickup: "Chennai Central Railway Station (MAS), Chennai",
                      drop: "OMR IT Corridor (Taramani), Chennai",
                      pLat: 13.0825, pLng: 80.2707, dLat: 12.9863, dLng: 80.2458,
                      dist: "55 km",
                      duration: "Half Day (6 hours)",
                      sedanPrice: 1500,
                      suvPrice: 2200,
                    },
                    {
                      name: "Pondicherry French Colony Getaway",
                      desc: "Chennai to Pondicherry colonial heritage and beaches",
                      pickup: "T. Nagar (Thyagaraya Nagar), Chennai",
                      drop: "Adyar Depot, Chennai",
                      pLat: 13.0440, pLng: 80.2314, dLat: 13.0076, dLng: 80.2520,
                      dist: "150 km",
                      duration: "1-2 Days Package",
                      sedanPrice: 4000,
                      suvPrice: 5500,
                    },
                    {
                      name: "Araku Valley Scenic Ride",
                      desc: "Vizag to Araku Valley scenic view and coffee plantations",
                      pickup: "Visakhapatnam Junction Railway Station, Vizag",
                      drop: "RK Beach (Rama Krishna Beach), Visakhapatnam",
                      pLat: 17.7212, pLng: 83.2925, dLat: 17.7126, dLng: 83.3228,
                      dist: "115 km",
                      duration: "1 Day Package",
                      sedanPrice: 3000,
                      suvPrice: 4200,
                    }
                  ].map((pkg, idx) => (
                    <div key={idx} className="card p-3 border rounded shadow-sm" style={{ backgroundColor: '#FFF9E6', color: '#000000', borderColor: '#E2D1A6', marginBottom: '1rem' }}>
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <h6 className="fw-bold mb-0" style={{ color: '#000000' }}>{pkg.name}</h6>
                        <span className="badge bg-dark text-white" style={{ fontSize: '0.7rem' }}>{pkg.duration}</span>
                      </div>
                      <p className="mb-3" style={{ fontSize: '0.8rem', color: '#2b2b2b' }}>{pkg.desc}</p>
                      
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <div style={{ fontSize: '0.82rem' }}>
                          <span style={{ color: '#000000', fontWeight: 'bold' }}>🚗 Sedan: Rs.{pkg.sedanPrice}</span> &nbsp;|&nbsp; 
                          <span style={{ color: '#000000', fontWeight: 'bold' }}> 🚙 SUV: Rs.{pkg.suvPrice}</span>
                        </div>
                        <span style={{ fontSize: '0.75rem', color: '#3b3b3b', fontWeight: 'bold' }}>{pkg.dist} distance</span>
                      </div>
                      
                      <div className="d-flex gap-2">
                        <button 
                          className="btn btn-sm btn-outline-dark fw-bold flex-fill"
                          onClick={() => {
                            setPickupInput(pkg.pickup);
                            setDropInput(pkg.desc);
                            setPickupCoords({ lat: pkg.pLat, lng: pkg.pLng });
                            setDropCoords({ lat: pkg.dLat, lng: pkg.dLng });
                            setVehicle("car");
                            setDistance(parseFloat(pkg.dist));
                            setBookingType("ride");
                            Swal.fire("Package Pre-filled", "Sedan package selected. Tap Request below to confirm instantly.", "info");
                          }}
                        >
                          Book Sedan
                        </button>
                        <button 
                          className="btn btn-sm btn-dark fw-bold flex-fill"
                          onClick={() => {
                            setPickupInput(pkg.pickup);
                            setDropInput(pkg.desc);
                            setPickupCoords({ lat: pkg.pLat, lng: pkg.pLng });
                            setDropCoords({ lat: pkg.dLat, lng: pkg.dLng });
                            setVehicle("suv");
                            setDistance(parseFloat(pkg.dist));
                            setBookingType("ride");
                            Swal.fire("Package Pre-filled", "SUV package selected. Tap Request below to confirm instantly.", "info");
                          }}
                        >
                          Book SUV
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* FOR RIDE, RENT, PARCEL, RESERVE */
              <div className="flex-grow-1 d-flex flex-column justify-content-between">
                <div>
                  <h4 className="fw-bold mb-3 text-black">
                    {bookingType === 'ride' && 'Request a Ride'}
                    {bookingType === 'rent' && 'Hourly Car Rental'}
                    {bookingType === 'parcel' && 'Same-Day Parcel Delivery'}
                    {bookingType === 'reserve' && 'Reserve Advance Ride'}
                  </h4>

                  {/* Connecting Line Graphic & Fields */}
                  <div className="connecting-inputs mb-4">
                    <div className="connecting-line-graphic" style={{ left: '16px', height: bookingType === 'rent' ? '0' : '40px' }}></div>
                    <div className="dot-start" style={{ left: '13px' }}></div>
                    {bookingType !== 'rent' && <div className="square-end" style={{ left: '13px' }}></div>}

                    {/* Pickup Location Field */}
                    <div className="uber-input-wrapper position-relative">
                      <input
                        type="text"
                        style={{ paddingLeft: '2.5rem' }}
                        value={pickupInput}
                        onChange={(e) => handlePickupSearch(e.target.value)}
                        placeholder="Enter pickup location"
                      />
                      <button className="btn btn-sm position-absolute" style={{ right: '0.5rem', top: '50%', transform: 'translateY(-50%)', borderRadius: '4px', padding: '0.2rem 0.5rem', fontSize: '0.75rem', color: '#000000', backgroundColor: '#ffffff', border: '1px solid #000000', fontWeight: '600' }} onClick={getCurrentLocation}>
                        📍 Current
                      </button>
                      {suggestions.length > 0 && (
                        <div className="suggestion-dropdown">
                          {suggestions.map((item) => (
                            <div
                              key={item.place_id}
                              className="suggestion-item"
                              onClick={() => {
                                setPickupInput(item.display_name);
                                setPickupCoords({ lat: parseFloat(item.lat), lng: parseFloat(item.lon) });
                                setSuggestions([]);
                              }}
                            >
                              <div>
                                <strong>{item.isLocal ? "⭐ Preset: " : ""}{item.display_name.split(",")[0]}</strong>
                                <small className="text-muted-sm" style={{ fontSize: '0.75rem' }}>{item.display_name}</small>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Dropoff / Destination Field (Not needed for Rental) */}
                    {bookingType !== 'rent' && (
                      <div className="uber-input-wrapper">
                        <input
                          type="text"
                          style={{ paddingLeft: '2.5rem' }}
                          value={dropInput}
                          onChange={(e) => handleDropSearch(e.target.value)}
                          placeholder={bookingType === 'parcel' ? "Where to deliver parcel?" : "Where to?"}
                        />
                        {dropSuggestions.length > 0 && (
                          <div className="suggestion-dropdown">
                            {dropSuggestions.map((item) => (
                              <div
                                key={item.place_id}
                                className="suggestion-item"
                                onClick={() => {
                                  setDropInput(item.display_name);
                                  setDropCoords({ lat: parseFloat(item.lat), lng: parseFloat(item.lon) });
                                  setDropSuggestions([]);
                                }}
                              >
                                <div>
                                  <strong>{item.isLocal ? "⭐ Preset: " : ""}{item.display_name.split(",")[0]}</strong>
                                  <small className="text-muted-sm" style={{ fontSize: '0.75rem' }}>{item.display_name}</small>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Booking-specific fields */}
                  {bookingType === 'rent' && (
                    <div className="mb-4">
                      <label className="fw-bold mb-2 text-black d-block" style={{ fontSize: '0.9rem' }}>Select Hourly Rental Package</label>
                      <select className="form-select text-black fw-semibold" style={{ height: '48px', borderRadius: '8px' }} value={rentalPackage} onChange={(e) => setRentalPackage(e.target.value)}>
                        <option value="1hr_10km">⏱️ 1 Hour (includes 10 km) — Rs.250</option>
                        <option value="2hr_20km">⏱️ 2 Hours (includes 20 km) — Rs.450</option>
                        <option value="4hr_40km">⏱️ 4 Hours (includes 40 km) — Rs.850</option>
                        <option value="8hr_80km">⏱️ 8 Hours (includes 80 km) — Rs.1600</option>
                      </select>
                    </div>
                  )}

                  {bookingType === 'parcel' && (
                    <div className="mb-4 border rounded p-3 bg-light-subtle">
                      <h6 className="fw-bold mb-3 text-black">Recipient & Package Info</h6>
                      <div className="row g-2 mb-2">
                        <div className="col">
                          <input 
                            type="text" 
                            className="form-control text-black" 
                            placeholder="Recipient Name" 
                            value={receiverName} 
                            onChange={(e) => setReceiverName(e.target.value)} 
                          />
                        </div>
                        <div className="col">
                          <input 
                            type="text" 
                            className="form-control text-black" 
                            placeholder="Recipient Phone" 
                            value={receiverPhone} 
                            onChange={(e) => setReceiverPhone(e.target.value)} 
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-black mb-1 fw-bold" style={{ fontSize: '0.8rem' }}>Parcel Category</label>
                        <select className="form-select text-black" value={parcelCategory} onChange={(e) => setParcelCategory(e.target.value)}>
                          <option value="document">📄 Document / Book</option>
                          <option value="electronics">💻 Laptop / Electronic item</option>
                          <option value="clothes">👕 Clothes / Apparel</option>
                          <option value="food">🍕 Food / Grocery</option>
                          <option value="other">📦 Other Box item</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {bookingType === 'reserve' && (
                    <div className="mb-4 border rounded p-3" style={{ backgroundColor: '#f8f9fa', color: '#000000', borderColor: '#dee2e6' }}>
                      <h6 className="fw-bold mb-3" style={{ color: '#000000' }}>Select Date & Time</h6>
                      
                      {/* Date Presets */}
                      <div className="mb-3">
                        <label className="fw-bold mb-2 d-block" style={{ fontSize: '0.8rem', color: '#555' }}>Quick Date Select</label>
                        <div className="d-flex gap-2 flex-wrap">
                          <button
                            type="button"
                            className={`btn btn-sm px-3 py-2 fw-semibold ${reserveDate === new Date().toISOString().split('T')[0] ? 'btn-dark' : 'btn-outline-dark text-black'}`}
                            style={{ borderRadius: '20px', fontSize: '0.8rem' }}
                            onClick={() => setReserveDate(new Date().toISOString().split('T')[0])}
                          >
                            📅 Today
                          </button>
                          <button
                            type="button"
                            className={`btn btn-sm px-3 py-2 fw-semibold ${reserveDate === new Date(Date.now() + 86400000).toISOString().split('T')[0] ? 'btn-dark' : 'btn-outline-dark text-black'}`}
                            style={{ borderRadius: '20px', fontSize: '0.8rem' }}
                            onClick={() => setReserveDate(new Date(Date.now() + 86400000).toISOString().split('T')[0])}
                          >
                            🌅 Tomorrow
                          </button>
                          <button
                            type="button"
                            className={`btn btn-sm px-3 py-2 fw-semibold ${reserveDate === new Date(Date.now() + 172800000).toISOString().split('T')[0] ? 'btn-dark' : 'btn-outline-dark text-black'}`}
                            style={{ borderRadius: '20px', fontSize: '0.8rem' }}
                            onClick={() => setReserveDate(new Date(Date.now() + 172800000).toISOString().split('T')[0])}
                          >
                            🗓️ Day After
                          </button>
                        </div>
                      </div>

                      {/* Time Presets */}
                      <div className="mb-3">
                        <label className="fw-bold mb-2 d-block" style={{ fontSize: '0.8rem', color: '#555' }}>Quick Time Select</label>
                        <div className="d-flex gap-2 flex-wrap">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-dark px-3 py-2 fw-semibold text-black"
                            style={{ borderRadius: '20px', fontSize: '0.8rem' }}
                            onClick={() => {
                              const d = new Date(Date.now() + 3600000);
                              setReserveDate(d.toISOString().split('T')[0]);
                              setReserveTime(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`);
                            }}
                          >
                            ⚡ In 1 Hour
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-dark px-3 py-2 fw-semibold text-black"
                            style={{ borderRadius: '20px', fontSize: '0.8rem' }}
                            onClick={() => {
                              const d = new Date(Date.now() + 7200000);
                              setReserveDate(d.toISOString().split('T')[0]);
                              setReserveTime(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`);
                            }}
                          >
                            ⚡ In 2 Hours
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-dark px-3 py-2 fw-semibold text-black"
                            style={{ borderRadius: '20px', fontSize: '0.8rem' }}
                            onClick={() => {
                              const d = new Date(Date.now() + 14400000);
                              setReserveDate(d.toISOString().split('T')[0]);
                              setReserveTime(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`);
                            }}
                          >
                            ⚡ In 4 Hours
                          </button>
                        </div>
                      </div>

                      {/* Custom input fields */}
                      <div className="border-top pt-3">
                        <label className="fw-bold mb-2 d-block" style={{ fontSize: '0.8rem', color: '#555' }}>Or Set Custom Date & Time</label>
                        <div className="row g-2">
                          <div className="col">
                            <input 
                              type="date" 
                              className="form-control text-black bg-white fw-semibold" 
                              style={{ height: '44px', border: '1px solid #ced4da', borderRadius: '6px' }}
                              value={reserveDate} 
                              onChange={(e) => setReserveDate(e.target.value)} 
                            />
                          </div>
                          <div className="col">
                            <input 
                              type="time" 
                              className="form-control text-black bg-white fw-semibold" 
                              style={{ height: '44px', border: '1px solid #ced4da', borderRadius: '6px' }}
                              value={reserveTime} 
                              onChange={(e) => setReserveTime(e.target.value)} 
                            />
                          </div>
                        </div>
                      </div>

                    </div>
                  )}

                  {/* Vehicle selector (For Ride, Parcel, Reserve) */}
                  {bookingType !== 'rent' && (
                    <>
                      <h5 className="fw-bold mb-3" style={{ color: '#000000' }}>Suggested rides</h5>
                      {distance > 0 && (
                        <p className="text-muted-sm mb-3">
                          Distance: <strong className="text-black">{distance.toFixed(2)} km</strong>
                        </p>
                      )}

                      <div className="d-flex flex-column gap-2 mb-4" style={{ maxHeight: "170px", overflowY: "auto" }}>
                        {Object.entries(FARE_RATES).map(([type, info]) => {
                          const fare = calcFare(type, distance);
                          const isSelected = vehicle === type;
                          return (
                            <div
                              key={type}
                              className={`d-flex align-items-center justify-content-between vehicle-card${isSelected ? " selected" : ""}`}
                              onClick={() => setVehicle(type)}
                            >
                              <div className="d-flex align-items-center gap-3">
                                <span style={{ fontSize: "2rem" }}>{info.emoji}</span>
                                <div>
                                  <div className="fw-bold d-flex align-items-center gap-2 text-black">
                                    {info.label} <span className="badge" style={{ fontSize: '0.65rem', backgroundColor: '#FCD116', color: '#000000', fontWeight: 'bold' }}>{info.eta}</span>
                                  </div>
                                  <div style={{ fontSize: "0.75rem", opacity: 0.75 }} className="text-muted">{info.desc}</div>
                                </div>
                              </div>
                              <div className="text-end">
                                <div className="fw-bold fs-5 text-black">
                                  {distance > 0 ? `Rs.${fare}` : "—"}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>

                {/* Bottom Payment Option Buttons & Request Ride trigger */}
                <div>
                  {/* Driver Accepted card */}
                  {driverInfo ? (
                    <div style={{
                      background: 'linear-gradient(135deg, #0f2027, #203a43, #2c5364)',
                      borderRadius: '16px',
                      padding: '1.2rem',
                      color: '#fff',
                      marginBottom: '1rem',
                      animation: 'fadeSlideUp 0.4s ease',
                      boxShadow: '0 8px 30px rgba(0,0,0,0.25)'
                    }}>
                      <div className="d-flex align-items-center gap-2 mb-3">
                        <span style={{ fontSize: '1.4rem' }}>✅</span>
                        <div>
                          <div className="fw-bold" style={{ fontSize: '1rem', color: '#4ade80' }}>
                            {bookingType === 'parcel' ? 'Courier Assigned!' : 'Captain Assigned!'}
                          </div>
                          <div style={{ fontSize: '0.78rem', opacity: 0.75 }}>
                            {bookingType === 'parcel' ? 'On the way to pick up package' : 'On the way to your pickup'}
                          </div>
                        </div>
                        <span className="ms-auto badge" style={{
                          backgroundColor: '#FCD116', color: '#000000',
                          fontSize: '0.78rem', padding: '0.35rem 0.75rem', borderRadius: '20px',
                          fontWeight: 'bold'
                        }}>ETA {driverInfo.eta || '4 mins'}</span>
                      </div>
                      <hr style={{ borderColor: 'rgba(255,255,255,0.15)', margin: '0.75rem 0' }} />
                      <div className="d-flex align-items-center gap-3">
                        <div style={{
                          width: 52, height: 52, borderRadius: '50%',
                          background: 'linear-gradient(135deg,#4ade80,#22d3ee)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '1.5rem', flexShrink: 0
                        }}>
                          {driverInfo.vehicleType === 'bike' ? '🏍️' : driverInfo.vehicleType === 'auto' ? '🛺' : driverInfo.vehicleType === 'suv' ? '🚙' : '🚗'}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div className="fw-bold" style={{ fontSize: '1rem' }}>{driverInfo.driverName}</div>
                          <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>{driverInfo.vehicleModel}</div>
                          <div style={{ fontSize: '0.78rem', opacity: 0.7 }}>
                            {driverInfo.vehicleNumber} &nbsp;·&nbsp; ⭐ {Number(driverInfo.rating).toFixed(1)}
                          </div>
                        </div>
                        <a href={`tel:${driverInfo.driverPhone}`} className="btn btn-sm fw-bold" style={{ background: '#4ade80', color: '#000', borderRadius: '50px', padding: '0.4rem 0.9rem', fontSize: '0.8rem' }}>
                          📞 Call
                        </a>
                      </div>
                      <button
                        className="btn w-100 mt-3 fw-bold"
                        onClick={() => { setDriverInfo(null); setDropInput(''); setDropCoords(null); setDistance(0); }}
                        style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.2)' }}
                      >
                        + Book Another
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Booking payment options buttons cash/upi */}
                      <div className="mb-3">
                        <div className="d-flex gap-2">
                          <button
                            type="button"
                            onClick={() => setPaymentMethod('cash')}
                            className={`btn flex-fill py-2 d-flex align-items-center justify-content-center gap-2 border fw-bold ${paymentMethod === 'cash' ? 'btn-dark border-dark' : 'btn-light border-secondary-subtle text-black'}`}
                            style={{ borderRadius: '8px', fontSize: '0.85rem' }}
                          >
                            💵 Pay via Cash
                          </button>
                          <button
                            type="button"
                            onClick={() => setPaymentMethod('upi')}
                            className={`btn flex-fill py-2 d-flex align-items-center justify-content-center gap-2 border fw-bold ${paymentMethod === 'upi' ? 'btn-dark border-dark' : 'btn-light border-secondary-subtle text-black'}`}
                            style={{ borderRadius: '8px', fontSize: '0.85rem' }}
                          >
                            📱 Pay via UPI
                          </button>
                        </div>
                      </div>

                      {/* Request Button based on Booking Type */}
                      {bookingType === 'reserve' ? (
                        <button
                          className="btn btn-primary w-100 py-3 text-white fw-bold"
                          onClick={() => {
                            if (!pickupInput || !dropCoords) {
                              Swal.fire("Missing Info", "Please select pickup and drop location", "warning");
                              return;
                            }
                            if (!reserveDate || !reserveTime) {
                              Swal.fire("Date & Time Required", "Please specify a future date and time for reservation", "warning");
                              return;
                            }
                            Swal.fire({
                              title: "Reservation Confirmed! 🗓️",
                              html: `<div style="text-align: left; font-size: 0.95rem; color: #000;">
                                      <p><b>Date:</b> ${reserveDate}</p>
                                      <p><b>Time:</b> ${reserveTime}</p>
                                      <p><b>Payment Method:</b> ${paymentMethod.toUpperCase()}</p>
                                      <p>A captain will be allocated and details will be shared 15 minutes before departure.</p>
                                     </div>`,
                              icon: "success"
                            });
                          }}
                          disabled={!dropCoords}
                          style={{ fontSize: '1.02rem', borderRadius: '8px' }}
                        >
                          Confirm Advance Booking — {reserveDate ? `${reserveDate}` : 'Select Date'}
                        </button>
                      ) : bookingType === 'rent' ? (
                        <button
                          className="btn btn-primary w-100 py-3 text-white fw-bold"
                          onClick={async () => {
                            if (!pickupInput) {
                              Swal.fire("Missing Info", "Please select rental pickup location", "warning");
                              return;
                            }
                            setLoading(true);
                            try {
                              let packPrice = 250;
                              if (rentalPackage === "2hr_20km") packPrice = 450;
                              else if (rentalPackage === "4hr_40km") packPrice = 850;
                              else if (rentalPackage === "8hr_80km") packPrice = 1600;

                              const bookingRes = await api.post("/bookings", {
                                pickupLocation: pickupInput,
                                dropLocation: `Hourly Rental (${rentalPackage})`,
                                pickupCoords,
                                dropCoords: pickupCoords,
                                vehicleType: "car",
                                fare: packPrice,
                                distance: 0
                              });
                              setLoading(false);
                              showCaptainInstantly(bookingRes.data.assignedCaptain, bookingRes.data._id, "car");
                              Swal.fire("Rental Assigned! ⏱️", `Your hourly rental driver is on the way. Payment mode: ${paymentMethod.toUpperCase()}`, "success");
                            } catch (error) {
                              setLoading(false);
                              Swal.fire("Booking Failed", "Failed to confirm hourly rental.", "error");
                            }
                          }}
                          style={{ fontSize: '1.02rem', borderRadius: '8px' }}
                        >
                          {loading ? 'Processing Rental...' : `Request Hourly Rental — Rs.${rentalPackage === '1hr_10km' ? '250' : rentalPackage === '2hr_20km' ? '450' : rentalPackage === '4hr_40km' ? '850' : '1600'}`}
                        </button>
                      ) : bookingType === 'parcel' ? (
                        <button
                          className="btn btn-primary w-100 py-3 text-white fw-bold"
                          onClick={async () => {
                            if (!pickupInput || !dropCoords) {
                              Swal.fire("Missing Info", "Please select pickup and recipient delivery location", "warning");
                              return;
                            }
                            if (!receiverName || !receiverPhone) {
                              Swal.fire("Recipient Info Required", "Please enter recipient name and phone number", "warning");
                              return;
                            }
                            setLoading(true);
                            try {
                              const bookingRes = await api.post("/bookings", {
                                pickupLocation: pickupInput,
                                dropLocation: `${dropInput} (To: ${receiverName}, Tel: ${receiverPhone}, Item: ${parcelCategory})`,
                                pickupCoords,
                                dropCoords,
                                vehicleType: vehicle,
                                fare: calcFare(vehicle, distance),
                                distance
                              });
                              setLoading(false);
                              showCaptainInstantly(bookingRes.data.assignedCaptain, bookingRes.data._id, vehicle);
                              Swal.fire("Delivery Assigned! 📦", `Your parcel partner is arriving to collect the item. Payment mode: ${paymentMethod.toUpperCase()}`, "success");
                            } catch (error) {
                              setLoading(false);
                              Swal.fire("Booking Failed", "Failed to book delivery.", "error");
                            }
                          }}
                          disabled={!dropCoords}
                          style={{ fontSize: '1.02rem', borderRadius: '8px' }}
                        >
                          {loading ? 'Processing Courier...' : `Book Delivery — Rs.${calcFare(vehicle, distance)}`}
                        </button>
                      ) : (
                        <button
                          className="btn btn-primary w-100 py-3 text-white fw-bold"
                          onClick={handleBooking}
                          disabled={!dropCoords || loading}
                          style={{ fontSize: '1.02rem', borderRadius: '8px' }}
                        >
                          {loading
                            ? <><span className="spinner-border spinner-border-sm me-2" />Booking...</>
                            : distance > 0
                              ? `Request ${FARE_RATES[vehicle].label} — Rs.${calcFare(vehicle, distance)}`
                              : 'Select dropoff to book'
                          }
                        </button>
                      )}
                    </>
                  )}
                </div>

              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}

export default BookingsPage;
