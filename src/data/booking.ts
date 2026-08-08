export type StaffNote = {
  id: string;
  author: string;
  text: string;
  createdAt: string;
};

export type BookingRequest = {
  id: string;
  name: string;
  email: string;
  phone: string;
  eventType: string;
  eventDate: string;
  proposedStartTime?: string;
  proposedEndTime?: string;
  attendees: string;
  notes: string;
  submittedAt: string;
  read: boolean;
  staffNotes?: StaffNote[];
};

export const BOOKING_STORAGE_KEY = 'communityBookingRequests';
export const CALENDAR_STORAGE_KEY = 'communityBookingCalendar';

export type CalendarBooking = {
  id: string;
  title: string;
  date: string;
  time: string;
  endTime?: string;
  attendees: string;
  notes: string;
  createdAt: string;
};

export const sampleCalendarBookings: CalendarBooking[] = [
  {
    id: 'cal-1',
    title: 'Children’s story hour',
    date: '2026-08-12',
    time: '10:00',
    endTime: '11:30',
    attendees: '20',
    notes: 'Use the library room and seating area.',
    createdAt: 'July 26, 2026 11:25 AM',
  },
  {
    id: 'cal-2',
    title: 'Community yoga session',
    date: '2026-08-20',
    time: '18:00',
    endTime: '19:00',
    attendees: '12',
    notes: 'Include yoga mats and water station.',
    createdAt: 'July 25, 2026 3:20 PM',
  },
  {
    id: 'cal-3',
    title: 'Local history talk',
    date: '2026-09-05',
    time: '14:00',
    endTime: '16:00',
    attendees: '35',
    notes: 'Projector required for speakers.',
    createdAt: 'July 24, 2026 6:12 PM',
  },
];

export const sampleBookingRequests: BookingRequest[] = [
  {
    id: 'req-1',
    name: 'Maya Thompson',
    email: 'maya.t@example.com',
    phone: '555-0123',
    eventType: 'Children’s story hour',
    eventDate: '2026-08-12',
    proposedStartTime: '10:00',
    proposedEndTime: '11:30',
    attendees: '20',
    notes: 'Would like a cosy corner with cushions and a small sound system.',
    submittedAt: 'July 26, 2026 10:15 AM',
    read: false,
    staffNotes: [
      {
        id: 'note-1',
        author: 'Alyssa',
        text: 'Called and confirmed the sound system availability. Waiting to hear back about seating layout.',
        createdAt: 'July 26, 2026 11:00 AM',
      },
    ],
  },
  {
    id: 'req-2',
    name: 'Jamila Carter',
    email: 'jamila.carter@example.com',
    phone: '555-0456',
    eventType: 'Community yoga session',
    eventDate: '2026-08-20',
    proposedStartTime: '18:00',
    proposedEndTime: '19:00',
    attendees: '12',
    notes: 'Early evening class, please confirm availability of yoga mats.',
    submittedAt: 'July 25, 2026 2:40 PM',
    read: true,
    staffNotes: [
      {
        id: 'note-2',
        author: 'Sam',
        text: 'Yoga mats can be provided for 15 people. Email sent to Jamila with options.',
        createdAt: 'July 25, 2026 3:10 PM',
      },
    ],
  },
  {
    id: 'req-3',
    name: 'Oliver Reed',
    email: 'oliver.reed@example.com',
    phone: '555-0789',
    eventType: 'Local history talk',
    eventDate: '2026-09-05',
    proposedStartTime: '14:00',
    proposedEndTime: '16:00',
    attendees: '35',
    notes: 'Need seating arranged theatre-style and projector access.',
    submittedAt: 'July 24, 2026 6:05 PM',
    read: false,
  },
];
