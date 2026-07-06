import { useEffect, useState } from 'react';
import axios from 'axios';

function DriverVerificationPage() {
  const [drivers, setDrivers] = useState([]);
  const [message, setMessage] = useState('');

  const token = localStorage.getItem('ucab_token');

  const api = axios.create({
    baseURL: 'http://localhost:5000/api',
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });

  const fetchDrivers = async () => {
    try {
      const res = await api.get('/drivers?isVerified=false');
      setDrivers(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (token) {
      fetchDrivers();
    }
  }, []);

  const verifyDriver = async (id, isVerified) => {
    try {
      await api.patch(`/drivers/${id}/verify`, { isVerified });
      setMessage('Driver status updated');
      fetchDrivers();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Update failed');
    }
  };

  if (!token) {
    return <p>Only admin users should access this page.</p>;
  }

  return (
    <div>
      <h2 className="mb-3">Driver Verification</h2>
      {drivers.length === 0 ? (
        <p>No pending drivers.</p>
      ) : (
        <table className="table table-dark table-striped">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>License</th>
              <th>Vehicle</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {drivers.map((d) => (
              <tr key={d._id}>
                <td>{d.user?.name}</td>
                <td>{d.user?.email}</td>
                <td>{d.licenseNumber}</td>
                <td>
                  {d.vehicleModel} ({d.vehicleNumber})
                </td>
                <td>
                  <button
                    className="btn btn-sm btn-success me-2"
                    onClick={() => verifyDriver(d._id, true)}
                  >
                    Verify
                  </button>
                  <button
                    className="btn btn-sm btn-outline-light"
                    onClick={() => verifyDriver(d._id, false)}
                  >
                    Keep Pending
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {message && <p className="mt-3">{message}</p>}
    </div>
  );
}

export default DriverVerificationPage;

