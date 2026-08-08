import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import SiteHeader from './components/SiteHeader';
import HomePage from './pages/HomePage';
import NewsPage from './pages/CounterPage';
import BookingPage from './pages/BookingPage';
import StaffLoginPage from './pages/StaffLoginPage';
import StaffDashboardPage from './pages/StaffDashboardPage';
import StaffAdminPage from './pages/StaffAdminPage';
import StaffRequestsPage from './pages/StaffRequestsPage';
import StaffCalendarPage from './pages/StaffCalendarPage';
import ThankYouPage from './pages/ThankYouPage';
import AboutPage from './pages/AboutPage';
import './App.css';

type RouteSeo = {
  title: string;
  description: string;
  noindex?: boolean;
};

const SITE_NAME = 'Tanfield Lea Community Centre';

const routeSeo: Record<string, RouteSeo> = {
  '/': {
    title: SITE_NAME,
    description:
      'Tanfield Lea Community Centre in Stanley, County Durham. Book spaces, read community news, and find local updates.'
  },
  '/about': {
    title: `About | ${SITE_NAME}`,
    description:
      'Learn about Tanfield Lea Community Centre, our location in Tanfield Lea, and the services we provide for local residents.'
  },
  '/news': {
    title: `Community News | ${SITE_NAME}`,
    description:
      'Read the latest community updates, announcements, and local stories from Tanfield Lea Community Centre.'
  },
  '/booking': {
    title: `Book A Room | ${SITE_NAME}`,
    description:
      'Request or manage bookings for rooms and activities at Tanfield Lea Community Centre.'
  },
  '/thank-you': {
    title: `Booking Confirmation | ${SITE_NAME}`,
    description:
      'Your booking request has been submitted to Tanfield Lea Community Centre. We will be in touch shortly.'
  },
  '/staff': {
    title: `Staff Login | ${SITE_NAME}`,
    description: 'Secure staff access for Tanfield Lea Community Centre administration.',
    noindex: true
  },
  '/staff/dashboard': {
    title: `Staff Dashboard | ${SITE_NAME}`,
    description: 'Internal dashboard for Tanfield Lea Community Centre staff.',
    noindex: true
  },
  '/staff/requests': {
    title: `Booking Requests | ${SITE_NAME}`,
    description: 'Internal booking request management for staff.',
    noindex: true
  },
  '/staff/calendar': {
    title: `Staff Calendar | ${SITE_NAME}`,
    description: 'Internal calendar view for staff scheduling and bookings.',
    noindex: true
  },
  '/staff/admin': {
    title: `Staff Admin | ${SITE_NAME}`,
    description: 'Internal admin user management for staff accounts.',
    noindex: true
  }
};

function upsertMetaTag(selector: string, attributes: Record<string, string>) {
  let tag = document.head.querySelector(selector) as HTMLMetaElement | null;
  if (!tag) {
    tag = document.createElement('meta');
    document.head.appendChild(tag);
  }
  Object.entries(attributes).forEach(([key, value]) => {
    tag!.setAttribute(key, value);
  });
}

function upsertCanonical(href: string) {
  let link = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', href);
}

function SeoManager() {
  const location = useLocation();

  useEffect(() => {
    const seo = routeSeo[location.pathname] ?? routeSeo['/'];
    const canonicalUrl = `${window.location.origin}${location.pathname}`;

    document.title = seo.title;
    upsertMetaTag('meta[name="description"]', {
      name: 'description',
      content: seo.description
    });
    upsertMetaTag('meta[name="robots"]', {
      name: 'robots',
      content: seo.noindex ? 'noindex, nofollow' : 'index, follow'
    });
    upsertMetaTag('meta[property="og:title"]', {
      property: 'og:title',
      content: seo.title
    });
    upsertMetaTag('meta[property="og:description"]', {
      property: 'og:description',
      content: seo.description
    });
    upsertMetaTag('meta[property="og:url"]', {
      property: 'og:url',
      content: canonicalUrl
    });
    upsertMetaTag('meta[name="twitter:title"]', {
      name: 'twitter:title',
      content: seo.title
    });
    upsertMetaTag('meta[name="twitter:description"]', {
      name: 'twitter:description',
      content: seo.description
    });
    upsertCanonical(canonicalUrl);
  }, [location.pathname]);

  return null;
}

function App() {
  return (
    <div className="app">
      <BrowserRouter>
        <SeoManager />
        <SiteHeader />
        <main className="app-main">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/news" element={<NewsPage />} />
            <Route path="/booking" element={<BookingPage />} />
            <Route path="/staff" element={<StaffLoginPage />} />
            <Route path="/staff/dashboard" element={<StaffDashboardPage />} />
            <Route path="/staff/admin" element={<StaffAdminPage />} />
            <Route path="/staff/requests" element={<StaffRequestsPage />} />
            <Route path="/staff/calendar" element={<StaffCalendarPage />} />
            <Route path="/thank-you" element={<ThankYouPage />} />
            <Route path="/about" element={<AboutPage />} />
          </Routes>
        </main>
        <footer className="site-footer">
          Tanfield Lea Rd, Tanfield Lea, Stanley DH9 9NL
        </footer>
      </BrowserRouter>
    </div>
  );
}

export default App;
