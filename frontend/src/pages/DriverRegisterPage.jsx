import { useState } from 'react';
import axios from 'axios';

function DriverRegisterPage() {
  const [form, setForm] = useState({
    licenseNumber: '',
    vehicleNumber: '',
    vehicleModel: ''
  });
  const [message, setMessage] = useState('');

  const token = localStorage.getItem('ucab_token');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      const res = await axios.post('http://localhost:5000/api/drivers/register', form, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage(`Driver registered. Verification pending. ID: ${res.data._id}`);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Driver registration failed');
    }
  };

  if (!token) {
    return <p>Please login as a driver user to register.</p>;
  }

  return (
    <div className="row justify-content-center">
      <div className="col-md-5">
        <h2 className="mb-3">Driver Registration</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">License Number</label>
            <input
              type="text"
              name="licenseNumber"
              className="form-control"
              value={form.licenseNumber}
              onChange={handleChange}
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Vehicle Number</label>
            <input
              type="text"
              name="vehicleNumber"
              className="form-control"
              value={form.vehicleNumber}
              onChange={handleChange}
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Vehicle Model</label>
            <input
              type="text"
              name="vehicleModel"
              className="form-control"
              value={form.vehicleModel}
              onChange={handleChange}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary w-100">
            Submit for Verification
          </button>
        </form>
        {message && <p className="mt-3">{message}</p>}
      </div>
    </div>
  );
}

export default DriverRegisterPage;

