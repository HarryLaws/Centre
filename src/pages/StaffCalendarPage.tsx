import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppState } from '../context/AppContext';
import { BookingRequest, CalendarBooking, CALENDAR_STORAGE_KEY, sampleCalendarBookings } from '../data/booking';

type LocationState = { request?: BookingRequest };

function startOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function addMonths(d: Date, months: number) { return new Date(d.getFullYear(), d.getMonth() + months, 1); }
function getMonthOnlyGrid(date: Date) {
  const start = startOfMonth(date);
  const last = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const firstDay = start.getDay();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= last; d++) cells.push(new Date(date.getFullYear(), date.getMonth(), d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export default function StaffCalendarPage() {
  const { isStaff } = useAppState();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | null;
  const prefillRequest = state?.request;

  const [events, setEvents] = useState<CalendarBooking[]>([]);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('12:00');
  const [endTime, setEndTime] = useState('');
  const [attendees, setAttendees] = useState('');
  const [notes, setNotes] = useState('');
  const [message, setMessage] = useState('');
  const [currentMonth, setCurrentMonth] = useState<Date>(startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [eventDetail, setEventDetail] = useState<CalendarBooking | null>(null);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  const extractEndTimeFromNotes = (notes: string) => {
    const match = notes.match(/Proposed end time:\s*(\d{2}:\d{2})/i);
    return match ? match[1] : '';
  };

  const getEventEndTime = (event: CalendarBooking) => {
    return event.endTime || extractEndTimeFromNotes(event.notes || '');
  };

  const formatEventTime = (event: CalendarBooking) => {
    const resolvedEndTime = getEventEndTime(event);
    return `${event.time} - ${resolvedEndTime || 'Not set'}`;
  };

  useEffect(() => {
    if (!isStaff) { navigate('/staff'); return; }
    const saved = window.localStorage.getItem(CALENDAR_STORAGE_KEY);
    if (saved) {
      const parsed: CalendarBooking[] = JSON.parse(saved);
      const normalized = parsed.map((event) => ({
        ...event,
        endTime: event.endTime || extractEndTimeFromNotes(event.notes || '') || undefined,
      }));
      setEvents(normalized);
      window.localStorage.setItem(CALENDAR_STORAGE_KEY, JSON.stringify(normalized));
    }
    else { window.localStorage.setItem(CALENDAR_STORAGE_KEY, JSON.stringify(sampleCalendarBookings)); setEvents(sampleCalendarBookings); }
  }, [isStaff, navigate]);

  useEffect(() => {
    if (!prefillRequest) return;
    setTitle(prefillRequest.eventType);
    setDate(prefillRequest.eventDate);
    setTime(prefillRequest.proposedStartTime || '12:00');
    setEndTime(prefillRequest.proposedEndTime || '');
    setAttendees(prefillRequest.attendees);
    setNotes(`From request by ${prefillRequest.name}: ${prefillRequest.notes}`);
    setShowModal(true);
  }, [prefillRequest]);

  const saveEvents = (updated: CalendarBooking[]) => { setEvents(updated); window.localStorage.setItem(CALENDAR_STORAGE_KEY, JSON.stringify(updated)); };

  const addEventFor = (dateValue: string, timeValue?: string, endTimeValue?: string) => {
    setMessage('');
    const t = timeValue ?? time;
    const end = endTimeValue ?? endTime;
    if (!title.trim() || !dateValue.trim()) { setMessage('Please add a title and date.'); return false; }
    if (end && end <= t) { setMessage('End time must be after start time.'); return false; }
    if (events.some((e) => e.date === dateValue && e.time === t)) { setMessage('That timeslot is already booked.'); return false; }
    const newEvent: CalendarBooking = {
      id: `event-${Date.now()}`,
      title: title.trim(),
      date: dateValue,
      time: t.trim(),
      endTime: end.trim() || undefined,
      attendees: attendees.trim(),
      notes: notes.trim(),
      createdAt: new Date().toLocaleString(),
    };
    saveEvents([newEvent, ...events]);
    setTitle(''); setDate(''); setTime('12:00'); setEndTime(''); setAttendees(''); setNotes(''); setMessage('Booking added to the calendar.');
    return true;
  };

  const removeEvent = (id: string) => {
    const updated = events.filter((event) => event.id !== id);
    saveEvents(updated);
    setEventDetail(null);
  };

  const timeslots = Array.from({ length: 13 }, (_, i) => `${(8 + i).toString().padStart(2,'0')}:00`);
  const isSlotBooked = (dateIso: string, slot: string) => events.some((e) => e.date === dateIso && e.time === slot);

  const monthCells = getMonthOnlyGrid(currentMonth);
  const todayISO = new Date().toISOString().slice(0,10);

  return (
    <section className="page page-calendar">
      <div className="section-header">
        <p className="eyebrow">Staff calendar</p>
        <h1>Manage bookings and calendar events</h1>
        <p>Review upcoming bookings and add new calendar entries for Tanfield Lea Community Centre.</p>
      </div>

      <div className="calendar-layout">
        <div className="calendar-panel">
          <div className="calendar-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button className="button" onClick={() => setCurrentMonth(addMonths(currentMonth, -1))}>&lt;</button>
              <h2 style={{ margin: 0 }}>{currentMonth.toLocaleString(undefined, { month: 'long', year: 'numeric' })}</h2>
              <button className="button" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>&gt;</button>
            </div>
            <p>Click a day to expand and view details, or click a title to open full details.</p>
          </div>

          <div className="calendar-grid month-view" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d) => (<div key={d} className="calendar-weekday"><strong>{d}</strong></div>))}

            {monthCells.map((cell, idx) => {
              if (!cell) return <div key={`empty-${idx}`} className="calendar-day empty" />;
              const isoDate = cell.toISOString().slice(0,10);
              const inMonth = cell.getMonth() === currentMonth.getMonth();
              const dayEvents = events.filter((item) => item.date === isoDate);
              const isToday = isoDate === todayISO;
              const isExpanded = expandedDay === isoDate;

              return (
                <div
                  key={isoDate}
                  className={`calendar-day ${inMonth ? '' : 'muted'} ${isToday ? 'today' : ''} ${isExpanded ? 'expanded' : ''} ${dayEvents.length > 0 ? 'has-events' : ''}`}
                  onClick={() => { setSelectedDate(isoDate); setEventDetail(null); setShowModal(false); setExpandedDay(isExpanded ? null : isoDate); }}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="calendar-day-header">
                    <span className="calendar-day-weekday">{cell.toLocaleDateString(undefined, { weekday: 'short' })}</span>
                    <div className="calendar-day-daynum">
                      <strong>{cell.getDate()}</strong>
                      {dayEvents.length > 0 && <span className="calendar-event-count">{dayEvents.length}</span>}
                    </div>
                  </div>

                  <div className="calendar-day-events">
                    {dayEvents.slice(0,3).map((item) => (
                      <div key={item.id} className="calendar-event" onClick={(e) => { e.stopPropagation(); setEventDetail(item); }} role="button" tabIndex={0}>
                        <span className="calendar-event-time">{formatEventTime(item)}</span>
                        <strong className="calendar-event-title">{item.title}</strong>
                      </div>
                    ))}
                    {dayEvents.length > 3 && <p className="calendar-event-more">+{dayEvents.length - 3} more</p>}
                  </div>

                  <div className="calendar-day-details">
                    {dayEvents.length === 0 ? (
                      <p className="calendar-empty">No bookings</p>
                    ) : (
                      dayEvents.map((ev) => (
                        <div className="calendar-event-detail" key={ev.id} onClick={(e) => e.stopPropagation()}>
                          <strong>{ev.title} <span className="detail-time">{formatEventTime(ev)}</span></strong>
                          {ev.attendees && <div className="detail-attendees">{ev.attendees} attendees</div>}
                          {ev.notes && <div className="detail-notes">{ev.notes}</div>}
                          <div style={{ marginTop: 6 }}>
                            <button className="button" onClick={() => setEventDetail(ev)}>View</button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal day-view" onClick={(e) => e.stopPropagation()}>
            <h3>Day view — {selectedDate}</h3>
            <div className="day-view-grid">
              <div className="timeslots">
                {timeslots.map((slot) => {
                  const booked = isSlotBooked(selectedDate, slot);
                  const existing = events.find((e) => e.date === selectedDate && e.time === slot);
                  return (
                    <div key={slot} className={`timeslot ${booked ? 'booked' : 'available'}`} onClick={() => { if (!booked) setTime(slot); }}>
                      <div className="timeslot-time">{slot}</div>
                      <div className="timeslot-info">
                        {booked ? (
                          <>
                            <strong>{existing?.title}</strong>
                            {existing?.notes && <div className="timeslot-notes">{existing.notes}</div>}
                            <div className="timeslot-meta">{existing?.attendees ? `${existing.attendees} attendees` : ''}</div>
                          </>
                        ) : (
                          <span>Available</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="day-form">
                <form onSubmit={(e) => { e.preventDefault(); if (addEventFor(selectedDate, time, endTime)) { setShowModal(false); } }}>
                  <label>
                    Title
                    <input value={title} onChange={(ev) => setTitle(ev.target.value)} />
                  </label>
                  <label>
                    Start time
                    <input type="time" value={time} onChange={(ev) => setTime(ev.target.value)} />
                  </label>
                  <label>
                    End time
                    <input type="time" value={endTime} onChange={(ev) => setEndTime(ev.target.value)} />
                  </label>
                  <label>
                    Attendees
                    <input value={attendees} onChange={(ev) => setAttendees(ev.target.value)} />
                  </label>
                  <label>
                    Notes
                    <textarea value={notes} onChange={(ev) => setNotes(ev.target.value)} rows={4} />
                  </label>
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <button className="button" type="submit">Add</button>
                    <button type="button" className="button" onClick={() => setShowModal(false)}>Cancel</button>
                  </div>
                  {message && <p className="booking-note error">{message}</p>}
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {eventDetail && (
        <div className="modal-overlay" onClick={() => setEventDetail(null)}>
          <div className="modal event-detail" onClick={(e) => e.stopPropagation()}>
            <h3>{eventDetail.title}</h3>
            <p><strong>Date:</strong> {eventDetail.date}</p>
            <p><strong>Time:</strong> {formatEventTime(eventDetail)}</p>
            {eventDetail.attendees && <p><strong>Attendees:</strong> {eventDetail.attendees}</p>}
            {eventDetail.notes && (
              <div>
                <h4>Notes</h4>
                <p>{eventDetail.notes}</p>
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button
                className="button danger small-button"
                onClick={() => removeEvent(eventDetail.id)}
              >
                Remove
              </button>
              <button className="button" onClick={() => setEventDetail(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
