import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const TIME_OPTIONS = Array.from({ length: 48 }, (_, index) => {
  const hours = Math.floor(index / 2).toString().padStart(2, '0');
  const minutes = index % 2 === 0 ? '00' : '30';
  return `${hours}:${minutes}`;
});

export default function BookingPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [eventType, setEventType] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [proposedStartTime, setProposedStartTime] = useState('');
  const [proposedEndTime, setProposedEndTime] = useState('');
  const [attendees, setAttendees] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [validationError, setValidationError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setValidationError('');

    if (!name.trim() || !email.trim() || !eventType.trim() || !eventDate.trim()) {
      setValidationError('Please fill in all required fields.');
      return;
    }

    if (proposedStartTime && proposedEndTime && proposedEndTime <= proposedStartTime) {
      setValidationError('End time must be after start time.');
      return;
    }

    setStatus('sending');
    setMessage('');

    // Create the booking object and persist locally immediately so staff see it
    const stored = window.localStorage.getItem('communityBookingRequests');
    const existing = stored ? JSON.parse(stored) : [];
    const nextRequest = {
      id: Date.now().toString(),
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      eventType: eventType.trim(),
      eventDate: eventDate.trim(),
      proposedStartTime: proposedStartTime.trim(),
      proposedEndTime: proposedEndTime.trim(),
      attendees: attendees.trim(),
      notes: notes.trim(),
      submittedAt: new Date().toLocaleString(),
      read: false,
    };
    window.localStorage.setItem('communityBookingRequests', JSON.stringify([nextRequest, ...existing]));

    // Notify other tabs (staff portal) about the new booking
    try {
      const bc = new BroadcastChannel('booking-updates');
      bc.postMessage({ type: 'new-booking', booking: nextRequest });
      bc.close();
    } catch (e) {
      // BroadcastChannel may not be supported; rely on storage event as fallback
    }

    // Navigate immediately — the staff page will pick up the new booking from localStorage
    navigate('/thank-you');

    // Send to server in background (optional backup); ignore errors so user isn't blocked
    (async () => {
      try {
        await fetch('/api/booking', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, phone, eventType, eventDate, proposedStartTime, proposedEndTime, attendees, notes }),
        });
      } catch (err) {
        // ignore network/server errors — backup path already persisted client-side
      }
    })();
    setStatus('idle');
  };

  return (
    <section className="page page-booking">
      <div className="section-header">
        <p className="eyebrow">Booking Request</p>
        <h1>Request a room or event booking</h1>
        <p>
          Fill in the form and Tanfield Lea Community Centre will receive your booking
          request by email.
        </p>
      </div>

      <form className="booking-form" onSubmit={handleSubmit}>
        <div className="form-grid">
          <label>
            Your name
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </label>
          <label>
            Email address
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label>
            Phone number
            <input
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
            />
          </label>
          <label>
            Event type
            <input
              type="text"
              value={eventType}
              onChange={(event) => setEventType(event.target.value)}
              placeholder="e.g. community meeting, workshop, party"
              required
            />
          </label>
          <label>
            Preferred date
            <input
              type="date"
              value={eventDate}
              onChange={(event) => setEventDate(event.target.value)}
              required
            />
          </label>
          <label>
            Proposed start time
            <select
              value={proposedStartTime}
              onChange={(event) => setProposedStartTime(event.target.value)}
            >
              <option value="">Select a time</option>
              {TIME_OPTIONS.map((timeOption) => (
                <option key={timeOption} value={timeOption}>
                  {timeOption}
                </option>
              ))}
            </select>
          </label>
          <label>
            Proposed end time
            <select
              value={proposedEndTime}
              onChange={(event) => setProposedEndTime(event.target.value)}
            >
              <option value="">Select a time</option>
              {TIME_OPTIONS.map((timeOption) => (
                <option key={timeOption} value={timeOption}>
                  {timeOption}
                </option>
              ))}
            </select>
          </label>
          <label>
            Number of attendees
            <input
              type="text"
              value={attendees}
              onChange={(event) => setAttendees(event.target.value)}
            />
          </label>
        </div>

        <label>
          Additional notes
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={5}
          />
        </label>

        <div className="form-footer">
          <button type="submit" className="button" disabled={status === 'sending'}>
            {status === 'sending' ? 'Sending…' : 'Send booking request'}
          </button>
        </div>

        {validationError && <p className="booking-note error">{validationError}</p>}
        {message && !validationError && (
          <p className={`booking-note ${status === 'error' ? 'error' : 'success'}`}>
            {message}
          </p>
        )}
      </form>
    </section>
  );
}
