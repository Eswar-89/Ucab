import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "./App.css";

import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import DriverLoginPage from "./pages/DriverLoginPage";
import RegisterPage from "./pages/RegisterPage";
import BookingsPage from "./pages/BookingsPage";
import DriverRegisterPage from "./pages/DriverRegisterPage";
import DriverVerificationPage from "./pages/DriverVerificationPage";
import SearchCabsPage from "./pages/SearchCabsPage";
import RideTrackingPage from "./pages/RideTrackingPage";
import PaymentPage from "./pages/PaymentPage";
import HistorySupportPage from "./pages/HistorySupportPage";
import DriverDashboardPage from "./pages/DriverDashboardPage";

function Navbar() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const token = localStorage.getItem("ucab_token");

  useEffect(() => {
    const stored = localStorage.getItem("ucab_user");
    if (stored) {
      setUser(JSON.parse(stored));
    } else {
      setUser(null);
    }
  }, [token, localStorage.getItem("ucab_user")]);

  const handleLogout = () => {
    localStorage.removeItem("ucab_token");
    localStorage.removeItem("ucab_user");
    setUser(null);
    navigate("/login");
  };

  return (
    <nav className="navbar navbar-expand navbar-dark ucab-nav-blur">
      <div className="container-fluid d-flex align-items-center justify-content-between">
        <div className="d-flex align-items-center gap-4">
          <Link className="ucab-logo" to="/">
            <span className="fw-bold">UCab</span>
          </Link>
          {token && user && user.role !== "driver" && (
            <div className="d-none d-md-flex align-items-center gap-3">
              <Link className="nav-link text-white" to="/bookings">Ride</Link>
              <Link className="nav-link text-white" to="/history-support">Support</Link>
            </div>
          )}
        </div>

        <div className="d-flex align-items-center gap-3">
          {token && user ? (
            <>
              {user.role === "driver" && (
                <Link className="nav-link text-white fw-bold px-3 py-1 bg-dark rounded-pill" to="/driver-dashboard" style={{ fontSize: "0.85rem", border: "1px solid #333" }}>
                  Dashboard
                </Link>
              )}
              <div className="nav-user-chip d-none d-sm-flex">
                <span className="nav-avatar">
                  {user.name ? user.name[0].toUpperCase() : "U"}
                </span>
                <span className="nav-user-name">{user.name}</span>
              </div>
              <button onClick={handleLogout} className="btn-nav-logout">
                Logout
              </button>
            </>
          ) : (
            <div className="d-flex align-items-center">
              <button className="btn-nav-login" onClick={() => navigate("/login")}>
                Log in
              </button>
              <button className="btn-nav-signup" onClick={() => navigate("/register")}>
                Sign up
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

function App() {
  return (
    <Router>
      <div className="ucab-layout">
        <Navbar />

        <main className="ucab-main">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/driver-login" element={<DriverLoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/bookings" element={<BookingsPage />} />
            <Route path="/driver/register" element={<DriverRegisterPage />} />
            <Route path="/driver/verify" element={<DriverVerificationPage />} />
            <Route path="/search" element={<SearchCabsPage />} />
            <Route path="/track" element={<RideTrackingPage />} />
            <Route path="/payments" element={<PaymentPage />} />
            <Route path="/history-support" element={<HistorySupportPage />} />
            <Route path="/driver-dashboard" element={<DriverDashboardPage />} />
          </Routes>
        </main>

        <footer className="ucab-footer mt-auto">
          <div className="container">
            <div className="row justify-content-between align-items-center">
              <div className="col-md-4 mb-3 mb-md-0 text-center text-md-start">
                <span className="ucab-footer-brand text-white">UCab</span>
                <p className="mt-2 mb-0" style={{ color: '#a6a6a6', fontSize: '0.85rem' }}>
                  Premium, clean ride sharing platform matching class aesthetics.
                </p>
              </div>
              <div className="col-md-8 text-center text-md-end">
                <div className="d-flex flex-wrap justify-content-center justify-content-md-end gap-4">
                  <Link to="/">Home</Link>
                  <Link to="/bookings">Book Ride</Link>
                  <Link to="/history-support">Support & Help</Link>
                </div>
              </div>
            </div>
            <div className="section-divider"></div>
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-center" style={{ color: '#666', fontSize: '0.82rem' }}>
              <p className="mb-2 mb-md-0">&copy; 2026 UCab Inc. All rights reserved.</p>
              <div className="d-flex gap-3">
                <Link to="/driver-login" style={{ color: '#fff', fontWeight: '600' }}>Driver Partner Portal</Link>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;