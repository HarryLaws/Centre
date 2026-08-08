import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../context/AppContext';
import { BookingRequest, BOOKING_STORAGE_KEY, CalendarBooking, CALENDAR_STORAGE_KEY, sampleBookingRequests } from '../data/booking';

const TIME_OPTIONS = Array.from({ length: 48 }, (_, index) => {
  const hours = Math.floor(index / 2).toString().padStart(2, '0');
  const minutes = index % 2 === 0 ? '00' : '30';
  return `${hours}:${minutes}`;
});

export default function StaffRequestsPage() {
  const { isStaff } = useAppState();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<BookingRequest[]>([]);
  const [draftNotes, setDraftNotes] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDrafts, setEditDrafts] = useState<Record<string, Partial<BookingRequest>>>({});

  const formatToISO = (value: string) => {
    // If already YYYY-MM-DD, return as-is
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    const d = new Date(value);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().slice(0,10);
  };

  useEffect(() => {
    if (!isStaff) {
      navigate('/staff');
      return;
    }

    const saved = window.localStorage.getItem(BOOKING_STORAGE_KEY);
    if (saved) {
      setRequests(JSON.parse(saved));
      return;
    }

    window.localStorage.setItem(BOOKING_STORAGE_KEY, JSON.stringify(sampleBookingRequests));
    setRequests(sampleBookingRequests);
  }, [isStaff, navigate]);

  // Try to import any server-side backups and merge into local requests
  useEffect(() => {
    const importBackups = async () => {
      try {
        const res = await fetch('/api/backups');
        if (!res.ok) return;
        const backups = await res.json();
        if (!Array.isArray(backups) || backups.length === 0) return;

        const normalized = backups.map((b: any) => ({
          id: b.id,
          name: b.name || '',
          email: b.email || '',
          phone: b.phone || '',
          eventType: b.eventType || '',
          eventDate: b.eventDate || b.date || '',
          proposedStartTime: b.proposedStartTime || '12:00',
          proposedEndTime: b.proposedEndTime || '13:00',
          attendees: b.attendees || '',
          notes: b.notes || '',
          submittedAt: b.createdAt || new Date().toLocaleString(),
          read: false,
          staffNotes: b.staffNotes || [],
        }));

        setRequests((current) => {
          const existingIds = new Set(current.map((r) => r.id));
          const toAdd = normalized.filter((n) => !existingIds.has(n.id));
          if (toAdd.length === 0) return current;
          const merged = [...toAdd, ...current];
          window.localStorage.setItem(BOOKING_STORAGE_KEY, JSON.stringify(merged));
          return merged;
        });
      } catch (err) {
        // ignore import errors
        console.error('Backups import failed', err);
      }
    };

    importBackups();

    // Listen for storage events (other tabs) to refresh requests
    const onStorage = (e: StorageEvent) => {
      if (e.key === BOOKING_STORAGE_KEY) {
        const saved = window.localStorage.getItem(BOOKING_STORAGE_KEY);
        setRequests(saved ? JSON.parse(saved) : []);
      }
    };
    window.addEventListener('storage', onStorage);

    // Listen for BroadcastChannel messages (real-time updates)
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('booking-updates');
      bc.onmessage = (msg) => {
        if (msg?.data?.type === 'new-booking') {
          const saved = window.localStorage.getItem(BOOKING_STORAGE_KEY);
          setRequests(saved ? JSON.parse(saved) : []);
        }
      };
    } catch (err) {
      bc = null;
    }

    return () => {
      window.removeEventListener('storage', onStorage);
      if (bc) bc.close();
    };
  }, []);

  const saveRequests = (updated: BookingRequest[]) => {
    setRequests(updated);
    window.localStorage.setItem(BOOKING_STORAGE_KEY, JSON.stringify(updated));
  };

  const removeRequest = (id: string) => {
    const updated = requests.filter((request) => request.id !== id);
    saveRequests(updated);
  };

  const addToCalendar = (id: string) => {
    const req = requests.find((r) => r.id === id);
    if (!req) return;
    const proposedStartTime = req.proposedStartTime || '12:00';
    const proposedEndTime = req.proposedEndTime || '';

    const dateIso = formatToISO(req.eventDate || '');
    const newEvent: CalendarBooking = {
      id: `event-${Date.now()}`,
      title: req.eventType || 'Booking',
      date: dateIso || new Date().toISOString().slice(0,10),
      time: proposedStartTime,
      endTime: proposedEndTime || undefined,
      attendees: req.attendees || '',
      notes: `From request by ${req.name}: ${req.notes || ''}`,
      createdAt: new Date().toLocaleString(),
    };

    try {
      const saved = window.localStorage.getItem(CALENDAR_STORAGE_KEY);
      const arr = saved ? JSON.parse(saved) : [];
      const updatedCal = [newEvent, ...arr];
      window.localStorage.setItem(CALENDAR_STORAGE_KEY, JSON.stringify(updatedCal));
      window.alert('Booking added to calendar successfully.');
      // navigate to calendar to show the new booking
      navigate('/staff/calendar');
    } catch (err) {
      console.error('Failed to add to calendar', err);
    }
  };

  const startEditing = (request: BookingRequest) => {
    setEditingId(request.id);
    setEditDrafts((cur) => ({
      ...cur,
      [request.id]: {
        name: request.name,
        email: request.email,
        phone: request.phone,
        eventType: request.eventType,
        eventDate: formatToISO(request.eventDate || ''),
        proposedStartTime: request.proposedStartTime || '12:00',
        proposedEndTime: request.proposedEndTime || '13:00',
        attendees: request.attendees,
        notes: request.notes,
      },
    }));
  };

  const cancelEditing = (id: string) => {
    setEditingId((cur) => (cur === id ? null : cur));
    setEditDrafts((cur) => { const copy = { ...cur }; delete copy[id]; return copy; });
  };

  const saveEditing = (id: string) => {
    const draft = editDrafts[id];
    if (!draft) return;
    if (draft.proposedStartTime && draft.proposedEndTime && draft.proposedEndTime <= draft.proposedStartTime) {
      window.alert('End time must be after start time.');
      return;
    }
    const updated = requests.map((r) => {
      if (r.id !== id) return r;
      return {
        ...r,
        name: (draft.name as string) || r.name,
        email: (draft.email as string) || r.email,
        phone: (draft.phone as string) || r.phone,
        eventType: (draft.eventType as string) || r.eventType,
        eventDate: draft.eventDate ? formatToISO(draft.eventDate as string) : r.eventDate,
        proposedStartTime: (draft.proposedStartTime as string) || r.proposedStartTime,
        proposedEndTime: (draft.proposedEndTime as string) || r.proposedEndTime,
        attendees: (draft.attendees as string) || r.attendees,
        notes: (draft.notes as string) || r.notes,
      };
    });
    saveRequests(updated);
    cancelEditing(id);
  };

  const handleEditChange = (id: string, field: string, value: string) => {
    setEditDrafts((cur) => ({ ...cur, [id]: { ...(cur[id] || {}), [field]: value } }));
  };

  const handleDraftChange = (id: string, value: string) => {
    setDraftNotes((current) => ({ ...current, [id]: value }));
  };

  const addStaffNote = (id: string) => {
    const text = draftNotes[id]?.trim();
    if (!text) return;

    const updated = requests.map((request) => {
      if (request.id !== id) return request;

      const nextNote = {
        id: `${id}-note-${Date.now()}`,
        author: 'Staff',
        text,
        createdAt: new Date().toLocaleString(),
      };

      return {
        ...request,
        staffNotes: request.staffNotes ? [nextNote, ...request.staffNotes] : [nextNote],
      };
    });

    saveRequests(updated);
    setDraftNotes((current) => ({ ...current, [id]: '' }));
  };

  return (
    <section className="page page-requests">
      <div className="section-header">
        <p className="eyebrow">Booking requests</p>
        <h1>Incoming booking requests</h1>
        <p>All requests are shown here with details so staff can review them quickly.</p>
      </div>

      {requests.length === 0 ? (
        <p>No booking requests yet.</p>
      ) : (
        <div className="requests-grid">
          {requests.map((request) => (
              <article className={`request-card ${request.read ? 'read' : 'unread'}`} key={request.id}>
                <div className="request-header">
                  <div>
                    <h2>{request.eventType}</h2>
                    <p className="request-meta">
                      {request.name} · {request.eventDate}
                    </p>
                    <div className="request-summary">
                      <span className="request-chip">Attendees: {request.attendees || 'N/A'}</span>
                      <span className="request-chip">Phone: {request.phone || 'N/A'}</span>
                      <span className="request-chip">Email: {request.email || 'N/A'}</span>
                      <span className="request-chip">Submitted: {request.submittedAt}</span>
                    </div>
                  </div>

                  <div className="request-status-block">
                    <div className="request-actions request-actions-header">
                      {editingId === request.id ? (
                        <>
                          <button
                            className="button"
                            type="button"
                            onClick={() => saveEditing(request.id)}
                          >
                            Save
                          </button>
                          <button
                            className="button danger"
                            type="button"
                            onClick={() => cancelEditing(request.id)}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            className="button"
                            type="button"
                            onClick={() => startEditing(request)}
                          >
                            Edit
                          </button>
                          <button
                            className="button calendar-action-button"
                            type="button"
                            onClick={() => addToCalendar(request.id)}
                          >
                            Add to calendar
                          </button>
                          <button
                            className="button danger"
                            type="button"
                            onClick={() => removeRequest(request.id)}
                          >
                            Remove
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="request-details">
                    <div className="request-body">
                      {editingId === request.id ? (
                        <div className="request-edit-fields">
                          <label>
                            Name
                            <input
                              value={(editDrafts[request.id]?.name as string) || ''}
                              onChange={(e) => handleEditChange(request.id, 'name', e.target.value)}
                            />
                          </label>
                          <label>
                            Email
                            <input
                              value={(editDrafts[request.id]?.email as string) || ''}
                              onChange={(e) => handleEditChange(request.id, 'email', e.target.value)}
                            />
                          </label>
                          <label>
                            Event type
                            <input
                              value={(editDrafts[request.id]?.eventType as string) || ''}
                              onChange={(e) => handleEditChange(request.id, 'eventType', e.target.value)}
                            />
                          </label>
                          <label>
                            Date
                            <input
                              type="date"
                              value={(editDrafts[request.id]?.eventDate as string) || ''}
                              onChange={(e) => handleEditChange(request.id, 'eventDate', e.target.value)}
                            />
                          </label>
                          <label>
                            Proposed start time
                            <select
                              value={(editDrafts[request.id]?.proposedStartTime as string) || '12:00'}
                              onChange={(e) => handleEditChange(request.id, 'proposedStartTime', e.target.value)}
                            >
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
                              value={(editDrafts[request.id]?.proposedEndTime as string) || '13:00'}
                              onChange={(e) => handleEditChange(request.id, 'proposedEndTime', e.target.value)}
                            >
                              {TIME_OPTIONS.map((timeOption) => (
                                <option key={timeOption} value={timeOption}>
                                  {timeOption}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label>
                            Notes
                            <textarea
                              value={(editDrafts[request.id]?.notes as string) || ''}
                              onChange={(e) => handleEditChange(request.id, 'notes', e.target.value)}
                              rows={4}
                            />
                          </label>
                        </div>
                      ) : (
                        <>
                          <p><strong>Email:</strong> {request.email}</p>
                          <p><strong>Posted date:</strong> {request.submittedAt || 'N/A'}</p>
                          <p>
                            <strong>Proposed time:</strong>{' '}
                            {(request.proposedStartTime || '12:00')} - {(request.proposedEndTime || '13:00')}
                          </p>
                          <p><strong>Notes:</strong> {request.notes || 'No additional notes.'}</p>
                        </>
                      )}
                    </div>

                    <div className="request-chat">
                      <div className="request-chat-header">
                        <h3>Staff notes</h3>
                        <p>Keep a record of conversations and follow-up actions.</p>
                      </div>

                      {request.staffNotes && request.staffNotes.length > 0 ? (
                        <div className="request-notes">
                          {request.staffNotes.map((note) => (
                            <div className="request-note" key={note.id}>
                              <div className="request-note-meta">
                                <strong>{note.author}</strong>
                                <span>{note.createdAt}</span>
                              </div>
                              <p>{note.text}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p>No staff notes yet.</p>
                      )}

                      <div className="request-note-form">
                        <label>
                          Add a new note
                          <textarea
                            value={draftNotes[request.id] || ''}
                            onChange={(event) => handleDraftChange(request.id, event.target.value)}
                            rows={4}
                            placeholder="e.g. Called the requester and confirmed date..."
                          />
                        </label>
                        <button
                          className="button"
                          type="button"
                          onClick={() => addStaffNote(request.id)}
                        >
                          Save note
                        </button>
                      </div>
                    </div>
                  </div>
              </article>
          ))}
        </div>
      )}
    </section>
  );
}
