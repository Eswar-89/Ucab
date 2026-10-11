import { useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../config";

function RegisterPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: "rider",
    licenseNumber: "",
    vehicleType: "car"
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      return Swal.fire({
        title: "Password Mismatch",
        text: "Password and confirm password do not match",
        icon: "error"
      });
    }

    try {
      const payload = {
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        role: form.role
      };

      if (form.role === "driver") {
        payload.licenseNumber = form.licenseNumber || "PENDING";
        payload.vehicleType = form.vehicleType;
      }

      await axios.post(`${API_URL}/auth/register`, payload, {
        headers: { "Content-Type": "application/json" }
      });

      Swal.fire({
        title: "Registration Successful",
        text: "Account has been successfully set up. Please log in to continue.",
        icon: "success",
        confirmButtonText: "OK"
      }).then(() => {
        if (form.role === 'driver') {
          navigate("/driver-login");
        } else {
          navigate("/login");
        }
      });
    } catch (error) {
      const message = error.response?.data?.message || error.message || "Registration failed";
      Swal.fire({ title: "Error", text: message, icon: "error" });
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: '480px' }}>
        <div className="auth-card-header text-center">
          <h2 className="auth-title">Create Account</h2>
          <p className="auth-subtitle mb-0">Join UCab to get rides or start earning</p>
        </div>

        <div className="auth-card-body">
          <form onSubmit={handleSubmit} className="d-grid gap-3">
            
            {/* Role Switch */}
            <div className="mb-2">
              <label className="form-label text-center d-block fw-bold mb-2">Select User Type</label>
              <div className="d-flex gap-3">
                <div
                  className={`flex-fill text-center p-3 rounded border`}
                  style={{
                    cursor: "pointer",
                    background: form.role === "rider" ? "var(--uber-grey-light)" : "#ffffff",
                    borderColor: form.role === "rider" ? "var(--uber-black)" : "var(--uber-grey-border)",
                    transition: "all 0.25s"
                  }}
                  onClick={() => setForm({ ...form, role: "rider" })}
                >
                  <div style={{ fontSize: "1.5rem" }}>🧍</div>
                  <strong className="text-black">Rider</strong>
                </div>
                <div
                  className={`flex-fill text-center p-3 rounded border`}
                  style={{
                    cursor: "pointer",
                    background: form.role === "driver" ? "var(--uber-grey-light)" : "#ffffff",
                    borderColor: form.role === "driver" ? "var(--uber-black)" : "var(--uber-grey-border)",
                    transition: "all 0.25s"
                  }}
                  onClick={() => setForm({ ...form, role: "driver" })}
                >
                  <div style={{ fontSize: "1.5rem" }}>🚗</div>
                  <strong className="text-black">Driver Partner</strong>
                </div>
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="form-label text-black">Full Name</label>
              <input
                type="text"
                name="name"
                className="form-control"
                placeholder="Enter your full name"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>

            {/* Email */}
            <div>
              <label className="form-label text-black">Email Address</label>
              <input
                type="email"
                name="email"
                className="form-control"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>

            {/* Phone */}
            <div>
              <label className="form-label text-black">Phone Number</label>
              <input
                type="tel"
                name="phone"
                className="form-control"
                placeholder="Enter phone number"
                value={form.phone}
                onChange={handleChange}
                required
              />
            </div>

            {/* Driver Fields */}
            {form.role === "driver" && (
              <>
                <div>
                  <label className="form-label text-black">Driving License Number</label>
                  <input
                    type="text"
                    name="licenseNumber"
                    className="form-control"
                    placeholder="Enter license number"
                    value={form.licenseNumber}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div>
                  <label className="form-label text-black">Preferred Vehicle Type</label>
                  <select
                    name="vehicleType"
                    className="form-select"
                    value={form.vehicleType}
                    onChange={handleChange}
                  >
                    <option value="bike">Bike (🏍️)</option>
                    <option value="auto">Auto (🛺)</option>
                    <option value="car">Car (🚗)</option>
                    <option value="suv">SUV (🚙)</option>
                  </select>
                </div>
              </>
            )}

            {/* Password */}
            <div>
              <label className="form-label text-black">Password</label>
              <input
                type="password"
                name="password"
                className="form-control"
                placeholder="Create password"
                value={form.password}
                onChange={handleChange}
                required
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label className="form-label text-black">Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                className="form-control"
                placeholder="Re-enter password"
                value={form.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary w-100 py-3 mt-2 text-white fw-bold" style={{ borderRadius: '8px' }}>
              Register as {form.role === "driver" ? "Driver Partner" : "Rider"}
            </button>

            <p className="text-center text-muted-sm mb-0">
              Already have an account?{' '}
              <span
                style={{ cursor: "pointer", color: "var(--uber-black)", textDecoration: 'underline' }}
                className="fw-bold"
                onClick={() => navigate(form.role === "driver" ? "/driver-login" : "/login")}
              >
                Login
              </span>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
