import { useState, useEffect } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import { API_URL, SOCKET_URL } from "../config";

const socket = io(SOCKET_URL);

function DriverDashboardPage() {
  const navigate = useNavigate();

  const token = localStorage.getItem("ucab_token");

  const api = axios.create({
    baseURL: API_URL,
    headers: { Authorization: `Bearer ${token}` }
  });

  const [driver, setDriver] = useState(null);
  const [rideRequests, setRideRequests] = useState([]);
  const [rideHistory, setRideHistory] = useState([]);
  const [activeTab, setTab] = useState("requests");
  const [acceptedRide, setAcceptedRide] = useState(null);
  const [isOnline, setIsOnline] = useState(true);

  // Fetch driver profile
  useEffect(() => {
    if (!token) { navigate("/login"); return; }
    const stored = JSON.parse(localStorage.getItem("ucab_user") || "{}");
    if (stored?.role !== "driver") { navigate("/bookings", { replace: true }); return; }

    api.get("/drivers/me").then((res) => {
      setDriver(res.data);
      setIsOnline(res.data.isAvailable !== false);
      socket.emit("joinDriverRoom", { vehicleType: res.data.vehicleType });

      // Load any pending bookings already in DB
      api.get("/bookings/pending").then((pending) => {
        setRideRequests(pending.data.map((b) => ({
          bookingId: b._id,
          pickupLocation: b.pickupLocation,
          dropLocation: b.dropLocation,
          fare: b.fare,
          distance: b.distance,
          vehicleType: b.vehicleType,
          riderName: b.rider?.name
        })));
      }).catch(() => {});
    }).catch(() => {
      Swal.fire("Profile Issue", "Driver profile details might need setting up. Please ensure your profile registration details are complete.", "warning");
    });

    api.get("/drivers/my-rides").then((res) => {
      setRideHistory(res.data);
    }).catch(() => {});
  }, [token]);

  // Re-join driver room if socket reconnects
  useEffect(() => {
    const rejoin = () => {
      if (driver?.vehicleType && isOnline) {
        socket.emit("joinDriverRoom", { vehicleType: driver.vehicleType });
      }
    };
    socket.on("connect", rejoin);
    return () => socket.off("connect", rejoin);
  }, [driver?.vehicleType, isOnline]);

  // Listen for ride requests via socket
  useEffect(() => {
    socket.on("newRideRequest", (data) => {
      if (!isOnline) return;
      setRideRequests((prev) => {
        const exists = prev.find((r) => String(r.bookingId) === String(data.bookingId));
        if (exists) return prev;
        return [data, ...prev];
      });
    });

    socket.on("rideRequestCancelled", ({ bookingId }) => {
      setRideRequests((prev) => prev.filter((r) => String(r.bookingId) !== String(bookingId)));
    });

    return () => {
      socket.off("newRideRequest");
      socket.off("rideRequestCancelled");
    };
  }, [isOnline]);

  const handleAccept = async (request) => {
    try {
      await api.put(`/bookings/${request.bookingId}/accept`);
      setRideRequests([]);
      setAcceptedRide(request);
      Swal.fire("Ride Confirmed", "Rider is notified. Drive safely to the pickup location.", "success");
    } catch (error) {
      Swal.fire("Error", error.response?.data?.message || "Could not accept ride", "error");
    }
  };

  const handleReject = (bookingId) => {
    setRideRequests((prev) => prev.filter((r) => String(r.bookingId) !== String(bookingId)));
  };

  const handleComplete = async () => {
    if (!acceptedRide) return;
    try {
      await api.put(`/bookings/${acceptedRide.bookingId}/complete`);
      setAcceptedRide(null);
      const res = await api.get("/drivers/my-rides");
      setRideHistory(res.data);
      Swal.fire("Ride Completed!", "Fare added to your earnings.", "success");
    } catch {
      Swal.fire("Error", "Could not mark ride as complete", "error");
    }
  };

  const handleToggleOnline = async () => {
    const nextState = !isOnline;
    setIsOnline(nextState);
    try {
      // Toggle backend state
      await api.put("/drivers/toggle-availability", { isAvailable: nextState });
      if (nextState && driver?.vehicleType) {
        socket.emit("joinDriverRoom", { vehicleType: driver.vehicleType });
      }
    } catch {
      // rollback on error
      setIsOnline(!nextState);
    }
  };

  if (!token) return null;

  // Calculate earnings stats
  const totalEarnings = rideHistory.reduce((sum, r) => sum + (r.fare || 0), 0);

  return (
    <div className="page-container-wide anim-fade-up">
      
      {/* Header with status switch */}
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
        <div>
          <h2 className="fw-bold mb-1">Driver Portal</h2>
          <p className="text-muted-sm mb-0">Manage bookings & check live earnings stats</p>
        </div>
        
        {/* Switch toggle */}
        <div className="d-flex align-items-center gap-3 bg-dark border border-white-5 p-2 px-3 rounded-pill" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
          <span className={`fw-bold ${isOnline ? "text-green" : "text-muted-sm"}`}>
            {isOnline ? "ONLINE" : "OFFLINE"}
          </span>
          <label className="online-toggle">
            <input type="checkbox" checked={isOnline} onChange={handleToggleOnline} />
            <span className="online-toggle-track"></span>
            <span className="online-toggle-thumb"></span>
          </label>
        </div>
      </div>

      <div className="row gy-4">
        
        {/* Left Side: Stats and Info */}
        <div className="col-lg-4">
          
          {/* Driver profile details */}
          {driver && (
            <div className="ucab-card card mb-4 p-4 shadow-lg">
              <div className="d-flex align-items-center gap-3 mb-3">
                <span className="fs-1">👨‍✈️</span>
                <div>
                  <h4 className="fw-bold mb-0">{driver.user?.name}</h4>
                  <p className="text-muted-sm mb-0">{driver.vehicleType?.toUpperCase()} Partner</p>
                </div>
              </div>
              
              <div className="section-divider my-3"></div>

              <div className="row g-3">
                <div className="col-6">
                  <div className="earnings-stat">
                    <div className="value">Rs.{totalEarnings}</div>
                    <div className="label">Total Earned</div>
                  </div>
                </div>
                <div className="col-6">
                  <div className="earnings-stat">
                    <div className="value">{rideHistory.length}</div>
                    <div className="label">Trips done</div>
                  </div>
                </div>
                <div className="col-12 mt-3">
                  <div className="earnings-stat py-2 text-start px-3 d-flex align-items-center justify-content-between">
                    <div>
                      <span className="text-muted-sm" style={{ fontSize: '0.72rem' }}>PARTNER RATING</span>
                      <div className="fw-bold text-white fs-5">{driver.rating > 0 ? driver.rating.toFixed(1) : "New"} ★</div>
                    </div>
                    <span style={{ fontSize: '1.5rem' }}>⭐</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Guidelines */}
          <div className="ucab-card card p-4 shadow-lg d-none d-lg-block">
            <h5 className="fw-bold mb-3 text-green">Safety Guidelines</h5>
            <ul className="text-muted-sm ps-3 mb-0 d-grid gap-2">
              <li>Always wear helmet / seatbelt during trips.</li>
              <li>Match passenger name before starting.</li>
              <li>Toggle OFF when taking break to preserve acceptancy rate metrics.</li>
            </ul>
          </div>

        </div>

        {/* Right Side: Active Rides / Live requests */}
        <div className="col-lg-8">
          
          {/* Active ride panel */}
          {acceptedRide && (
            <div className="card border-0 shadow-lg mb-4 p-4 bg-success opacity-95">
              <div className="d-flex align-items-center justify-content-between mb-3 text-dark">
                <h5 className="fw-bold mb-0">🎯 ACTIVE TRIP IN PROGRESS</h5>
                <span className="badge bg-dark text-white fw-bold">ONGOING</span>
              </div>
              <p className="mb-2 text-dark"><strong>Rider:</strong> {acceptedRide.riderName}</p>
              <p className="mb-1 text-dark"><strong>Pickup:</strong> {acceptedRide.pickupLocation}</p>
              <p className="mb-3 text-dark"><strong>Drop Location:</strong> {acceptedRide.dropLocation}</p>
              <div className="d-flex align-items-center justify-content-between pt-3 border-top border-dark border-opacity-10">
                <div className="text-dark">
                  <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>UPFRONT FARE</span>
                  <div className="fw-bold fs-4">Rs.{acceptedRide.fare}</div>
                </div>
                <button className="btn btn-dark btn-lg px-4" onClick={handleComplete}>
                  Mark Ride Completed
                </button>
              </div>
            </div>
          )}

          {/* Tab selector */}
          <ul className="nav nav-tabs mb-4">
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === "requests" ? "active" : ""}`}
                onClick={() => setTab("requests")}
              >
                Booking Requests {rideRequests.length > 0 && (
                  <span className="badge bg-danger ms-2">{rideRequests.length}</span>
                )}
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === "history" ? "active" : ""}`}
                onClick={() => setTab("history")}
              >
                History ({rideHistory.length})
              </button>
            </li>
          </ul>

          {/* Requests Tab */}
          {activeTab === "requests" && (
            <div className="d-grid gap-3">
              {rideRequests.length === 0 ? (
                <div className="text-center py-5 border rounded bg-dark border-1 border-white-5" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
                  <span className="fs-1 mb-2 d-block">📡</span>
                  <h5 className="fw-bold mb-1">Waiting for live requests...</h5>
                  <p className="text-muted-sm mb-0">Ensure availability is toggled ONLINE to receive trips.</p>
                </div>
              ) : (
                rideRequests.map((req) => (
                  <div key={req.bookingId} className="ride-request-card p-4">
                    
                    {/* Visual countdown progress */}
                    <div className="mb-3">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <span className="label-overline fw-bold">Acceptance Countdown</span>
                        <span className="badge bg-warning text-dark">NEW REQUEST</span>
                      </div>
                      <div className="countdown-bar-wrap">
                        <div className="countdown-bar"></div>
                      </div>
                    </div>

                    <div className="row gy-3 mb-4">
                      <div className="col-md-8">
                        <h4 className="fw-bold text-white mb-2">Ride from {req.riderName || 'Rider'}</h4>
                        <div className="d-flex flex-column gap-1 text-muted-sm">
                          <div>🟢 <strong>Pickup:</strong> {req.pickupLocation}</div>
                          <div>🔴 <strong>Drop:</strong> {req.dropLocation}</div>
                          <div>📏 <strong>Distance:</strong> {req.distance ? req.distance.toFixed(1) : "—"} km</div>
                        </div>
                      </div>
                      <div className="col-md-4 text-md-end d-flex flex-column justify-content-center">
                        <span className="text-muted-sm" style={{ fontSize: '0.75rem' }}>EST. EARNING</span>
                        <h3 className="fw-bold text-green mb-0 fs-2">Rs.{req.fare}</h3>
                      </div>
                    </div>

                    <div className="d-flex gap-3">
                      <button
                        className="btn btn-primary btn-lg flex-fill py-3 text-dark fw-bold"
                        onClick={() => handleAccept(req)}
                        disabled={!!acceptedRide}
                      >
                        Accept Booking
                      </button>
                      <button
                        className="btn btn-outline-danger btn-lg px-4"
                        onClick={() => handleReject(req.bookingId)}
                      >
                        Decline
                      </button>
                    </div>

                  </div>
                ))
              )}
            </div>
          )}

          {/* History Tab */}
          {activeTab === "history" && (
            <div className="d-grid gap-3">
              {rideHistory.length === 0 ? (
                <div className="text-center py-5 border rounded bg-dark border-1 border-white-5" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
                  <span className="fs-1 mb-2 d-block">📋</span>
                  <h5 className="fw-bold mb-1">No completed trips yet</h5>
                  <p className="text-muted-sm mb-0">Accept incoming bookings to start building stats.</p>
                </div>
              ) : (
                rideHistory.map((ride) => (
                  <div key={ride._id} className="ucab-card card p-3 shadow">
                    <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
                      <div>
                        <div className="fw-bold text-white-70 mb-1">Tripmate: {ride.rider?.name || 'Rider'}</div>
                        <div className="text-muted-sm mb-1">🟢 {ride.pickupLocation}</div>
                        <div className="text-muted-sm">🔴 {ride.dropLocation}</div>
                      </div>
                      <div className="text-end">
                        <span className="badge bg-success mb-2 d-inline-block">Completed</span>
                        <h5 className="fw-bold text-green mb-0">Rs.{ride.fare}</h5>
                        <p className="text-muted-sm mb-0" style={{ fontSize: '0.75rem' }}>{new Date(ride.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
}

export default DriverDashboardPage;
