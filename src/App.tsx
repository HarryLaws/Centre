import { BrowserRouter, Routes, Route } from 'react-router-dom';
import SiteHeader from './components/SiteHeader';
import HomePage from './pages/HomePage';
import NewsPage from './pages/CounterPage';
import BookingPage from './pages/BookingPage';
import StaffLoginPage from './pages/StaffLoginPage';
import StaffDashboardPage from './pages/StaffDashboardPage';
import StaffRequestsPage from './pages/StaffRequestsPage';
import StaffCalendarPage from './pages/StaffCalendarPage';
import ThankYouPage from './pages/ThankYouPage';
import AboutPage from './pages/AboutPage';
import './App.css';

function App() {
  return (
    <div className="app">
      <BrowserRouter>
        <SiteHeader />
        <main className="app-main">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/news" element={<NewsPage />} />
            <Route path="/booking" element={<BookingPage />} />
            <Route path="/staff" element={<StaffLoginPage />} />
            <Route path="/staff/dashboard" element={<StaffDashboardPage />} />
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
