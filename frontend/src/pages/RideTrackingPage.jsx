/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../config";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import Swal from "sweetalert2";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png"
});

const carIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/744/744465.png",
  iconSize: [40, 40]
});

function MapController({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, map.getZoom());
  }, [center]);
  return null;
}

function RideTrackingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const bookingId = searchParams.get("id");

  const token = localStorage.getItem("ucab_token");
  const api = axios.create({
    baseURL: API_URL,
    headers: { Authorization: `Bearer ${token}` }
  });

  const mapRef = useRef(null);
  const routeRef = useRef(null);
  const animIntervalRef = useRef(null);

  const [booking, setBooking] = useState(null);
  const [phase, setPhase] = useState("toPickup"); // "toPickup" | "toDropoff" | "completed"
  const [driverLocation, setDriverLocation] = useState(null);
  const [eta, setEta] = useState(8);
  const [rating, setRating] = useState(0);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  const driverStart = { lat: 18.515, lng: 73.850 };

  // Fetch booking
  useEffect(() => {
    if (!bookingId || !token) return;
    api.get(`/bookings/${bookingId}`).then((res) => {
      setBooking(res.data);
      setDriverLocation(driverStart);
    }).catch(() => {});
  }, [bookingId]);

  // ETA countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setEta((prev) => (prev > 1 ? prev - 1 : 1));
    }, 20000);
    return () => clearInterval(timer);
  }, []);

  // Animate driver between two coords
  const animateDriver = (from, to, onDone) => {
    const steps = 80;
    let step = 0;
    const latStep = (to.lat - from.lat) / steps;
    const lngStep = (to.lng - from.lng) / steps;

    if (animIntervalRef.current) clearInterval(animIntervalRef.current);

    animIntervalRef.current = setInterval(() => {
      step++;
      setDriverLocation((prev) => {
        if (!prev) return from;
        return {
          lat: prev.lat + latStep,
          lng: prev.lng + lngStep
        };
      });
      if (step >= steps) {
        clearInterval(animIntervalRef.current);
        onDone();
      }
    }, 150);
  };

  // Phase 1: driver → pickup
  useEffect(() => {
    if (!booking || phase !== "toPickup") return;
    const pickup = booking.pickupCoords;
    if (!pickup) return;

    if (mapRef.current) {
      try {
        if (routeRef.current) mapRef.current.removeControl(routeRef.current);
        routeRef.current = L.Routing.control({
          waypoints: [L.latLng(driverStart.lat, driverStart.lng), L.latLng(pickup.lat, pickup.lng)],
          addWaypoints: false,
          draggableWaypoints: false,
          show: false,
          lineOptions: {
            styles: [{ color: "#FFD60A", weight: 5, opacity: 0.85, dashArray: "5, 10" }]
          }
        }).addTo(mapRef.current);
      } catch { /* routing optional */ }
    }

    animateDriver(driverStart, pickup, () => {
      setPhase("toDropoff");
      Swal.fire({
        title: "Driver Arrived!",
        text: "Your Captain has arrived at the pickup location.",
        icon: "success",
        timer: 3000,
        showConfirmButton: false
      });
    });

    return () => {
      if (animIntervalRef.current) clearInterval(animIntervalRef.current);
    };
  }, [booking, phase]);

  // Phase 2: pickup → drop
  useEffect(() => {
    if (!booking || phase !== "toDropoff") return;
    const pickup = booking.pickupCoords;
    const drop = booking.dropCoords;
    if (!pickup || !drop) return;

    if (mapRef.current) {
      try {
        if (routeRef.current) mapRef.current.removeControl(routeRef.current);
        routeRef.current = L.Routing.control({
          waypoints: [L.latLng(pickup.lat, pickup.lng), L.latLng(drop.lat, drop.lng)],
          addWaypoints: false,
          draggableWaypoints: false,
          show: false,
          lineOptions: {
            styles: [{ color: "#09BE8B", weight: 6, opacity: 0.85 }]
          }
        }).addTo(mapRef.current);
      } catch { /* routing optional */ }
    }

    animateDriver(pickup, drop, async () => {
      try {
        await api.put(`/bookings/${bookingId}/complete`);
      } catch { /* ignore */ }
      setPhase("completed");
    });

    return () => {
      if (animIntervalRef.current) clearInterval(animIntervalRef.current);
    };
  }, [phase]);

  const handleRate = async (star) => {
    setRating(star);
    try {
      await api.put(`/bookings/${bookingId}/rate`, { rating: star });
      setRatingSubmitted(true);
      Swal.fire({
        title: "Rating Saved!",
        text: `Thank you for rating your driver.`,
        icon: "success",
        confirmButtonText: "Return Home"
      }).then(() => navigate("/bookings"));
    } catch {
      Swal.fire("Error", "Could not save rating", "error");
    }
  };

  if (!token) return <p className="p-4 text-center">Please login to track your ride.</p>;
  if (!bookingId) return <p className="p-4 text-center">No booking ID provided.</p>;

  const center = driverLocation
    ? [driverLocation.lat, driverLocation.lng]
    : [18.5204, 73.8567];

  return (
    <div className="page-container-wide anim-fade-up">
      <h2 className="fw-bold mb-4">Trip Tracking</h2>

      {/* Progress step bar */}
      <div className="ucab-card card p-4 mb-4 shadow-lg">
        <div className="status-progress">
          <div className={`status-step ${phase === "toPickup" ? "active" : "done"}`}>
            <div className="status-step-dot"></div>
            <span className="text-muted-sm mt-2" style={{ fontSize: '0.75rem' }}>Captain On Way</span>
          </div>
          <div className={`status-step ${phase === "toDropoff" ? "active" : phase === "completed" ? "done" : ""}`}>
            <div className="status-step-dot"></div>
            <span className="text-muted-sm mt-2" style={{ fontSize: '0.75rem' }}>Trip In Progress</span>
          </div>
          <div className={`status-step ${phase === "completed" ? "done" : ""}`}>
            <div className="status-step-dot"></div>
            <span className="text-muted-sm mt-2" style={{ fontSize: '0.75rem' }}>Arrived</span>
          </div>
        </div>
      </div>

      <div className="row gy-4">
        {/* Map view */}
        <div className="col-lg-8">
          <div className="map-wrapper" style={{ height: "420px" }}>
            <MapContainer
              center={center}
              zoom={14}
              style={{ height: "100%", width: "100%" }}
              whenCreated={(map) => { mapRef.current = map; }}
            >
              <TileLayer
                attribution="&copy; CartoDB Dark"
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              />
              <MapController center={driverLocation ? [driverLocation.lat, driverLocation.lng] : null} />

              {driverLocation && (
                <Marker position={[driverLocation.lat, driverLocation.lng]} icon={carIcon}>
                  <Popup>Captain Location</Popup>
                </Marker>
              )}

              {booking?.pickupCoords && (
                <Marker position={[booking.pickupCoords.lat, booking.pickupCoords.lng]}>
                  <Popup>Pickup: {booking.pickupLocation}</Popup>
                </Marker>
              )}

              {booking?.dropCoords && (
                <Marker position={[booking.dropCoords.lat, booking.dropCoords.lng]}>
                  <Popup>Dropoff: {booking.dropLocation}</Popup>
                </Marker>
              )}
            </MapContainer>
          </div>
        </div>

        {/* Driver Details card */}
        <div className="col-lg-4">
          {booking && (
            <div className="ucab-card card p-4 shadow-lg h-100 d-flex flex-column justify-content-between">
              <div>
                <h5 className="fw-bold mb-3 text-green">Trip Details</h5>
                
                {booking.driver ? (
                  <div className="d-flex align-items-center gap-3 p-3 rounded mb-3 bg-light border" style={{ borderColor: 'var(--uber-grey-border)' }}>
                    <span className="fs-1">👨‍✈️</span>
                    <div>
                      <h6 className="fw-bold text-black mb-1">{booking.driver.user?.name}</h6>
                      <p className="text-muted mb-1" style={{ fontSize: '0.8rem' }}>📞 {booking.driver.user?.phone}</p>
                      <div className="d-flex gap-1 flex-wrap align-items-center">
                        <span className="badge bg-dark text-white" style={{ fontSize: '0.65rem' }}>{booking.driver.vehicleType?.toUpperCase()}</span>
                        {booking.driver.vehicleNumber && (
                          <span className="badge bg-warning text-dark" style={{ fontSize: '0.65rem' }}>{booking.driver.vehicleNumber}</span>
                        )}
                      </div>
                      <p className="mb-0 mt-1 text-black fw-bold" style={{ fontSize: '0.75rem' }}>
                        Rating: {booking.driver.rating > 0 ? `${Number(booking.driver.rating).toFixed(1)} ⭐` : "⭐ New Driver Partner"}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-sm">Finding details...</p>
                )}

                <div className="text-muted-sm d-grid gap-2">
                  <div>🟢 <strong>Pickup:</strong> {booking.pickupLocation}</div>
                  <div>🔴 <strong>Drop:</strong> {booking.dropLocation}</div>
                  <div>💰 <strong>Est. Fare:</strong> <strong className="text-green">Rs.{booking.fare}</strong></div>
                </div>
              </div>

              {/* Rating block */}
              {phase === "completed" && !ratingSubmitted && (
                <div className="mt-4 pt-3 border-top border-white-5">
                  <h6 className="fw-bold text-center mb-2">Rate your trip experience</h6>
                  <div className="d-flex justify-content-center gap-2 mb-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        className={`btn btn-sm ${rating >= star ? "btn-warning" : "btn-outline-warning"}`}
                        onClick={() => handleRate(star)}
                        style={{ fontSize: "1.2rem", padding: "0.2rem 0.5rem" }}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {ratingSubmitted && (
                <div className="alert alert-success mt-4 mb-0 text-center py-2" style={{ fontSize: '0.85rem' }}>
                  Rating submitted! Thank you.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default RideTrackingPage;
