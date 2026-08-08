export type NewsItem = {
  id: string;
  title: string;
  date: string;
  summary: string;
  details?: string;
  image?: string;
};

export const newsItems: NewsItem[] = [
  {
    id: '1',
    title: 'Community Garden Harvest Festival',
    date: 'July 2026',
    summary:
      'Celebrate local produce, crafts, and live music in the community garden.',
    details:
      'Bring a picnic and join gardening workshops, food stalls, and performances from local artists.',
    image:
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: '2',
    title: 'Youth Coding Club Starts Next Week',
    date: 'August 2026',
    summary:
      'New weekly sessions for young people to learn game design, web development, and creative coding.',
    details:
      'Beginner-friendly classes cover app design, teamwork, and digital creativity. No prior experience needed.',
    image:
      'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: '3',
    title: 'Volunteer Open House',
    date: 'September 2026',
    summary:
      'Discover volunteer roles for events, reception and community outreach at our open house.',
    details:
      'Chat with staff, explore opportunities, and sign up for the autumn volunteer schedule.',
    image:
      'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=900&q=80',
  },
];
