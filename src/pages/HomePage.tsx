import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { NewsItem, newsItems as defaultNewsItems } from '../data/news';
import homeHero from '../assets/home-hero.jpg';

export default function HomePage() {
  const [latestNews, setLatestNews] = useState<NewsItem[]>([]);

  useEffect(() => {
    const savedNews = window.localStorage.getItem('communityNews');
    const allNews = savedNews ? JSON.parse(savedNews) : defaultNewsItems;
    const latest = [...allNews].slice(-2).reverse();
    setLatestNews(latest);
  }, []);

  return (
    <section className="page page-home">
      <div className="home-hero">
        <div className="hero-copy">
          <h1>Tanfield Lea Community Centre</h1>
          <p>
            A warm and welcoming place for neighbours, groups, and local leaders.
            Explore classes, events, and space bookings for your next Tanfield Lea
            Community Centre gathering.
          </p>
          <div className="hero-features">
            <div>
              <h3>Flexible spaces</h3>
              <p>Meeting rooms, activity studios, and a full hall are available for hire.</p>
            </div>
            <div>
              <h3>Friendly staff</h3>
              <p>Our team helps with event planning, room setup, and community outreach.</p>
            </div>
            <div>
              <h3>Regular programs</h3>
              <p>Join youth clubs, fitness classes, volunteer days, and local socials.</p>
            </div>
          </div>
          <div className="hero-actions">
            <Link to="/news" className="button">
              View community news
            </Link>
            <Link to="/booking" className="button secondary booking-button">
              Make a booking request
            </Link>
          </div>
        </div>

        <div className="hero-image-card">
          <img
            src={homeHero}
            alt="Community centre building"
          />
          <div className="hero-image-text">
            <p className="eyebrow">Featured space</p>
            <h2>Community Hall</h2>
            <p>Bright, accessible, and perfect for workshops, meetings, and socials.</p>
          </div>
        </div>
      </div>

      <section className="home-latest-news">
        <div className="section-header">
          <p className="eyebrow">Latest news</p>
          <h2>Recent updates from the centre</h2>
        </div>

        <div className="news-grid home-news-grid">
          {latestNews.map((item) => (
            <article className={`news-card${item.image ? ' has-image' : ''}`} key={item.id}>
              {item.image && <img className="news-image" src={item.image} alt={item.title} />}
              <div className="news-content">
                <div className="card-meta">
                  <span className="date">{item.date}</span>
                </div>
                <h3>{item.title}</h3>
                <p>{item.summary}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="home-contact-section">
        <div className="home-contact-card">
          <div>
            <p className="eyebrow">Visit us</p>
            <h2>Tanfield Lea Community Centre</h2>
            <p>Tanfield Lea Rd, Tanfield Lea, Stanley DH9 9NL</p>
            <div className="opening-hours">
              <p className="eyebrow">Opening hours</p>
              <ul>
                <li>Monday – Friday: 9:00 AM – 8:00 PM</li>
                <li>Saturday: 9:00 AM – 5:00 PM</li>
                <li>Sunday: Closed</li>
              </ul>
            </div>
          </div>
          <a
            href="https://www.google.com/maps/search/?api=1&query=Tanfield+Lea+Rd%2C+Tanfield+Lea%2C+Stanley+DH9+9NL"
            target="_blank"
            rel="noreferrer"
            className="button secondary map-link"
          >
            📍 Open in Google Maps
          </a>
        </div>
      </section>
    </section>
  );
}
