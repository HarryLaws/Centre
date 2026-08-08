import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppState } from '../context/AppContext';
import { NewsItem, newsItems as defaultNewsItems } from '../data/news';

const NEWS_STORAGE_KEY = 'communityNews';

export default function NewsPage() {
  const { isStaff } = useAppState();
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);

  useEffect(() => {
    const savedNews = window.localStorage.getItem(NEWS_STORAGE_KEY);
    if (savedNews) {
      setNewsItems(JSON.parse(savedNews));
    } else {
      setNewsItems(defaultNewsItems);
    }
  }, []);

  const removePost = (id: string) => {
    const updated = newsItems.filter((item) => item.id !== id);
    setNewsItems(updated);
    window.localStorage.setItem(NEWS_STORAGE_KEY, JSON.stringify(updated));
  };

  return (
    <section className="page page-news">
      <div className="section-header">
        <p className="eyebrow">Community News</p>
        <h1>Latest announcements and events</h1>
        <p>Stay up to date with the latest centre news and community activities.</p>
      </div>

      <div className="news-grid">
        {newsItems.map((item) => (
          <article className={`news-card${item.image ? ' has-image' : ''}`} key={item.id}>
            {isStaff && (
              <button className="news-delete-button" type="button" onClick={() => removePost(item.id)}>
                Remove
              </button>
            )}
            {item.image && <img className="news-image" src={item.image} alt={item.title} />}
            <div className="news-content">
              <div className="card-meta">
                <span className="date">{item.date}</span>
              </div>
              <h2>{item.title}</h2>
              <p>{item.summary}</p>
              {item.details && <p className="news-details">{item.details}</p>}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
