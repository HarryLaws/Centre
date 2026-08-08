import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { NewsItem, newsItems as defaultNewsItems } from '../data/news';
import homeHero from '../assets/home-hero.jpg';
import EditableText from '../components/EditableText';
import EditableImage from '../components/EditableImage';

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
          <EditableText id="home.hero.title" as="h1" defaultValue="Tanfield Lea Community Centre" />
          <EditableText
            id="home.hero.description"
            as="p"
            multiline
            defaultValue="A warm and welcoming place for neighbours, groups, and local leaders. Explore classes, events, and space bookings for your next Tanfield Lea Community Centre gathering."
          />
          <div className="hero-features">
            <div>
              <EditableText id="home.feature1.title" as="h3" defaultValue="Flexible spaces" />
              <EditableText
                id="home.feature1.body"
                as="p"
                defaultValue="Meeting rooms, activity studios, and a full hall are available for hire."
              />
            </div>
            <div>
              <EditableText id="home.feature2.title" as="h3" defaultValue="Friendly staff" />
              <EditableText
                id="home.feature2.body"
                as="p"
                defaultValue="Our team helps with event planning, room setup, and community outreach."
              />
            </div>
            <div>
              <EditableText id="home.feature3.title" as="h3" defaultValue="Regular programs" />
              <EditableText
                id="home.feature3.body"
                as="p"
                defaultValue="Join youth clubs, fitness classes, volunteer days, and local socials."
              />
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
          <EditableImage id="home.hero.image" defaultSrc={homeHero} alt="Community centre building" />
          <div className="hero-image-text">
            <p className="eyebrow">Featured space</p>
            <EditableText id="home.hero.imageTitle" as="h2" defaultValue="Community Hall" />
            <EditableText
              id="home.hero.imageBody"
              as="p"
              defaultValue="Bright, accessible, and perfect for workshops, meetings, and socials."
            />
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
            <EditableText id="home.contact.title" as="h2" defaultValue="Tanfield Lea Community Centre" />
            <EditableText id="home.contact.address" as="p" defaultValue="Tanfield Lea Rd, Tanfield Lea, Stanley DH9 9NL" />
            <div className="opening-hours">
              <p className="eyebrow">Opening hours</p>
              <ul>
                <li>
                  <EditableText id="home.hours.weekday" defaultValue="Monday – Friday: 9:00 AM – 8:00 PM" />
                </li>
                <li>
                  <EditableText id="home.hours.saturday" defaultValue="Saturday: 9:00 AM – 5:00 PM" />
                </li>
                <li>
                  <EditableText id="home.hours.sunday" defaultValue="Sunday: Closed" />
                </li>
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
