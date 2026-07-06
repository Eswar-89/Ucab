import { useEffect, useState } from 'react';
import axios from 'axios';

function PaymentPage() {
  const [bookings, setBookings] = useState([]);
  const [form, setForm] = useState({ bookingId: '', amount: '', method: 'card' });
  const [payments, setPayments] = useState([]);
  const [message, setMessage] = useState('');

  const token = localStorage.getItem('ucab_token');

  const api = axios.create({
    baseURL: 'http://localhost:5000/api',
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });

  const loadData = async () => {
    try {
      const [bRes, pRes] = await Promise.all([api.get('/bookings'), api.get('/payments')]);
      setBookings(bRes.data);
      setPayments(pRes.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (token) {
      loadData();
    }
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      await api.post('/payments', form);
      setMessage('Payment successful');
      setForm({ bookingId: '', amount: '', method: 'card' });
      loadData();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Payment failed');
    }
  };

  if (!token) {
    return <p>Please login to make payments.</p>;
  }

  return (
    <div className="row">
      <div className="col-md-5">
        <h2 className="mb-3">Online Payment</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Select Booking</label>
            <select
              name="bookingId"
              className="form-select"
              value={form.bookingId}
              onChange={handleChange}
              required
            >
              <option value="">Choose...</option>
              {bookings.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.pickupLocation} → {b.dropoffLocation} ({b.status})
                </option>
              ))}
            </select>
          </div>
          <div className="mb-3">
            <label className="form-label">Amount</label>
            <input
              type="number"
              name="amount"
              className="form-control"
              value={form.amount}
              onChange={handleChange}
              required
              min="1"
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Payment Method</label>
            <select
              name="method"
              className="form-select"
              value={form.method}
              onChange={handleChange}
            >
              <option value="card">Card</option>
              <option value="wallet">Wallet</option>
              <option value="upi">UPI</option>
              <option value="cash">Cash</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary w-100">
            Pay Now
          </button>
        </form>
        {message && <p className="mt-3">{message}</p>}
      </div>
      <div className="col-md-7">
        <h2 className="mb-3">Payment History & Receipts</h2>
        {payments.length === 0 ? (
          <p>No payments yet.</p>
        ) : (
          <table className="table table-dark table-striped">
            <thead>
              <tr>
                <th>Amount</th>
                <th>Method</th>
                <th>Status</th>
                <th>Txn ID</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p._id}>
                  <td>₹{p.amount}</td>
                  <td>{p.method}</td>
                  <td>{p.status}</td>
                  <td>{p.transactionId}</td>
                  <td>{new Date(p.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default PaymentPage;

