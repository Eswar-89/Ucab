import { useState } from 'react';
import axios from 'axios';
import '../App.css';

function SearchCabsPage() {
  const [form, setForm] = useState({
    pickupLocation: '',
    dropoffLocation: '',
    distanceKm: ''
  });
  const [result, setResult] = useState(null);
  const [message, setMessage] = useState('');

  const token = localStorage.getItem('ucab_token');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      const res = await axios.post('http://localhost:5000/api/bookings/search', form, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setResult(res.data);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Search failed');
    }
  };

  return (
    <div className="row">
      <div className="col-md-5">
        <h2 className=" text-white  mb-3">Search Nearby Cabs</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Pickup Location</label>
            <input
              type="text"
              name="pickupLocation"
              className="form-control"
              value={form.pickupLocation}
              onChange={handleChange}
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Dropoff Location</label>
            <input
              type="text"
              name="dropoffLocation"
              className="form-control"
              value={form.dropoffLocation}
              onChange={handleChange}
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Approx Distance (km)</label>
            <input
              type="number"
              name="distanceKm"
              className="form-control"
              value={form.distanceKm}
              onChange={handleChange}
              min="1"
            />
          </div>
          <button type="submit" className="btn btn-primary w-100">
            Search & Estimate Fare
          </button>
        </form>
        {message && <p className="mt-3">{message}</p>}
      </div>
      <div className="col-md-7">
        {result && (
          <div className="card bg-dark mt-4">
            <div className="card-body">
              <h5 className="card-title">Estimation</h5>
              <p>Nearby cabs: {result.nearbyCabs}</p>
              <p>Distance: {result.distanceKm} km</p>
              <p>Estimated Fare: ₹{result.estimatedFare}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SearchCabsPage;

