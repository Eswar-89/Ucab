import { useEffect, useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { API_URL } from '../config';

function HistorySupportPage() {
  const [bookings, setBookings] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [form, setForm] = useState({
    subject: '',
    category: 'general',
    cabNumber: '',
    driverName: '',
    message: ''
  });
  const [message, setMessage] = useState('');

  const token = localStorage.getItem('ucab_token');

  const api = axios.create({
    baseURL: API_URL,
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });

  const loadData = async () => {
    try {
      const [bRes, tRes] = await Promise.all([api.get('/bookings'), api.get('/support')]);
      setBookings(bRes.data);
      setTickets(tRes.data);
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
    
    // Construct dynamic ticket subject and message
    const formattedSubject = `[${form.category.toUpperCase()}] ${form.subject}`;
    let formattedMessage = form.message;
    
    if (form.cabNumber || form.driverName) {
      formattedMessage += `\n\n--- Incident Details ---\n`;
      if (form.cabNumber) formattedMessage += `Cab Plate: ${form.cabNumber}\n`;
      if (form.driverName) formattedMessage += `Driver: ${form.driverName}\n`;
    }

    try {
      await api.post('/support', {
        subject: formattedSubject,
        message: formattedMessage
      });
      
      Swal.fire({
        title: 'Support Ticket Created',
        text: 'Our team will review your query and get back to you shortly.',
        icon: 'success',
        confirmButtonText: 'OK'
      });

      setForm({
        subject: '',
        category: 'general',
        cabNumber: '',
        driverName: '',
        message: ''
      });
      loadData();
    } catch (error) {
      Swal.fire({
        title: 'Submission Failed',
        text: error.response?.data?.message || 'Could not submit your request.',
        icon: 'error'
      });
    }
  };

  if (!token) {
    return <p className="p-4 text-center text-black">Please login to view history and support.</p>;
  }

  // Show conditional input fields for complaints or safety incidents
  const showIncidentFields = form.category === 'complaint' || form.category === 'accident';

  return (
    <div className="page-container-wide anim-fade-up">
      <div className="row gy-5">
        
        {/* Booking History Table */}
        <div className="col-md-7">
          <h2 className="fw-bold mb-4" style={{ color: '#000000' }}>Ride History</h2>
          
          {bookings.length === 0 ? (
            <div className="p-4 border rounded text-center text-black" style={{ backgroundColor: '#F6F6F6', borderColor: '#E2E2E2', color: '#000000' }}>
              ℹ️ No rides completed yet.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-striped align-middle">
                <thead>
                  <tr>
                    <th style={{ color: '#000000' }}>From</th>
                    <th style={{ color: '#000000' }}>To</th>
                    <th style={{ color: '#000000' }}>Status</th>
                    <th style={{ color: '#000000' }}>Fare</th>
                    <th style={{ color: '#000000' }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b) => (
                    <tr key={b._id}>
                      <td className="fw-medium" style={{ color: '#000000' }}>{b.pickupLocation?.split(',')[0]}</td>
                      <td style={{ color: '#000000' }}>{b.dropLocation?.split(',')[0]}</td>
                      <td>
                        {(() => {
                          let bgColor = '#757575'; // default grey
                          let textColor = '#ffffff';
                          
                          const status = b.status?.toLowerCase();
                          if (status === 'pending') {
                            bgColor = '#ff9800'; // Orange
                          } else if (status === 'accepted' || status === 'completed' || status === 'approved') {
                            bgColor = '#2e7d32'; // Green
                          } else if (status === 'cancelled' || status === 'failed') {
                            bgColor = '#d32f2f'; // Red
                          }
                          
                          return (
                            <span 
                              className="badge" 
                              style={{ 
                                backgroundColor: bgColor, 
                                color: textColor,
                                padding: '0.45rem 0.8rem',
                                borderRadius: '30px',
                                textTransform: 'capitalize',
                                fontWeight: '600'
                              }}
                            >
                              {b.status}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="fw-bold" style={{ color: '#000000' }}>Rs.{b.fare ?? '-'}</td>
                      <td style={{ fontSize: '0.82rem', color: '#000000' }}>
                        {new Date(b.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Support Request Panel */}
        <div className="col-md-5">
          <div className="ucab-card card p-4 shadow-sm border" style={{ borderColor: '#E2E2E2', backgroundColor: '#ffffff' }}>
            <h3 className="fw-bold mb-3" style={{ color: '#000000' }}>Contact Support</h3>
            <p className="mb-4" style={{ fontSize: '0.88rem', color: '#000000' }}>Have an issue with a ride, driver, or need to report a safety concern?</p>

            <form onSubmit={handleSubmit} className="d-grid gap-3">
              
              {/* Category dropdown selector */}
              <div>
                <label className="form-label text-black fw-bold" style={{ color: '#000000' }}>Select Category</label>
                <select
                  name="category"
                  className="form-select"
                  value={form.category}
                  onChange={handleChange}
                  required
                  style={{ color: '#000000' }}
                >
                  <option value="general" style={{ color: '#000000' }}>General Help / Question</option>
                  <option value="billing" style={{ color: '#000000' }}>Fare or Billing Issue</option>
                  <option value="complaint" style={{ color: '#000000' }}>Complaint about Cab / Driver</option>
                  <option value="lost" style={{ color: '#000000' }}>Lost Item Retrieval</option>
                  <option value="accident" style={{ color: '#000000' }}>🚨 Report Accident or Safety Incident</option>
                </select>
              </div>

              {/* Subject */}
              <div>
                <label className="form-label text-black fw-bold" style={{ color: '#000000' }}>Brief Subject</label>
                <input
                  type="text"
                  name="subject"
                  className="form-control"
                  placeholder="e.g. Lost my wallet, Driver behavior, Accident report"
                  value={form.subject}
                  onChange={handleChange}
                  required
                  style={{ color: '#000000' }}
                />
              </div>

              {/* Incident/Complaint specific fields */}
              {showIncidentFields && (
                <div className="p-3 border rounded bg-light d-grid gap-2" style={{ borderColor: '#E2E2E2' }}>
                  <span className="fw-bold text-black" style={{ fontSize: '0.85rem', color: '#000000' }}>Additional Incident Details</span>
                  
                  <div>
                    <label className="form-label" style={{ fontSize: '0.8rem', color: '#000000' }}>Cab Plate / Vehicle Number (Optional)</label>
                    <input
                      type="text"
                      name="cabNumber"
                      className="form-control py-2"
                      placeholder="e.g. KA-03-ME-1234"
                      value={form.cabNumber}
                      onChange={handleChange}
                      style={{ color: '#000000' }}
                    />
                  </div>

                  <div>
                    <label className="form-label" style={{ fontSize: '0.8rem', color: '#000000' }}>Driver Name (Optional)</label>
                    <input
                      type="text"
                      name="driverName"
                      className="form-control py-2"
                      placeholder="Enter driver name if known"
                      value={form.driverName}
                      onChange={handleChange}
                      style={{ color: '#000000' }}
                    />
                  </div>
                </div>
              )}

              {/* Message */}
              <div>
                <label className="form-label text-black fw-bold" style={{ color: '#000000' }}>Detailed Explanation</label>
                <textarea
                  name="message"
                  className="form-control"
                  rows="4"
                  placeholder="Please describe what happened, including dates or times if applicable."
                  value={form.message}
                  onChange={handleChange}
                  required
                  style={{ color: '#000000' }}
                />
              </div>

              <button type="submit" className="btn btn-primary w-100 py-3 mt-2 text-white fw-bold">
                {form.category === 'accident' ? '🚨 Submit Urgent Report' : 'Submit Support Request'}
              </button>
            </form>

            {/* My Tickets Section */}
            <h4 className="fw-bold mt-5 mb-3" style={{ color: '#000000' }}>Recent Tickets</h4>
            {tickets.length === 0 ? (
              <p className="text-muted-sm text-center mb-0" style={{ color: '#000000' }}>No active support requests.</p>
            ) : (
              <ul className="list-group list-group-flush" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {tickets.map((t) => (
                  <li key={t._id} className="list-group-item border-bottom mb-2 bg-light text-black">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className="fw-bold text-black" style={{ fontSize: '0.9rem', color: '#000000' }}>{t.subject}</span>
                      <span className={`badge ${t.status === 'open' ? 'bg-warning text-dark' : 'bg-success text-white'}`} style={{ fontSize: '0.7rem' }}>
                        {t.status}
                      </span>
                    </div>
                    <p className="mb-0 text-black" style={{ fontSize: '0.85rem', color: '#000000', whiteSpace: 'pre-wrap' }}>{t.message}</p>
                    <div className="text-muted-sm mt-1" style={{ fontSize: '0.72rem', color: '#000000' }}>
                      Submitted: {new Date(t.createdAt).toLocaleDateString()}
                    </div>
                  </li>
                ))}
              </ul>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}

export default HistorySupportPage;
