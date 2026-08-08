import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../context/AppContext';
import { NewsItem, newsItems as defaultNewsItems } from '../data/news';

const STORAGE_KEY = 'communityNews';

export default function StaffDashboardPage() {
  const { isStaff } = useAppState();
  const navigate = useNavigate();
  const [items, setItems] = useState<NewsItem[]>([]);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [summary, setSummary] = useState('');
  const [details, setDetails] = useState('');
  const [image, setImage] = useState<string>('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isStaff) {
      navigate('/staff');
      return;
    }

    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setItems(JSON.parse(saved));
    } else {
      setItems(defaultNewsItems);
    }
  }, [isStaff, navigate]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (!title.trim() || !date.trim() || !summary.trim()) {
      setError('Title, date, and summary are required.');
      return;
    }

    const newItem: NewsItem = {
      id: Date.now().toString(),
      title: title.trim(),
      date: date.trim(),
      summary: summary.trim(),
      details: details.trim(),
      image,
    };

    setItems([newItem, ...items]);
    setTitle('');
    setDate('');
    setSummary('');
    setDetails('');
    setImage('');
  };

  return (
    <section className="page page-dashboard">
      <div className="section-header">
        <p className="eyebrow">Staff dashboard</p>
        <h1>Post news and manage announcements</h1>
        <p>Use this area to publish new community news items with an image, title, date, and full details.</p>
      </div>

      <form className="booking-form" onSubmit={handleSubmit}>
            <div className="form-grid">
              <label>
                Title
                <input value={title} onChange={(event) => setTitle(event.target.value)} required />
              </label>
              <label>
                Publish date
                <input
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  required
                />
              </label>
              <label>
                Summary
                <input value={summary} onChange={(event) => setSummary(event.target.value)} required />
              </label>
              <label>
                Image attachment
                <input type="file" accept="image/*" onChange={handleImageChange} />
              </label>
            </div>

            <label>
              Main text
              <textarea value={details} onChange={(event) => setDetails(event.target.value)} rows={6} />
            </label>

            {image && (
              <div className="image-preview">
                <p>Preview</p>
                <img src={image} alt="News preview" />
              </div>
            )}

            {error && <p className="booking-note error">{error}</p>}

            <div className="form-footer">
              <button className="button" type="submit">
                Publish news
              </button>
            </div>
          </form>

      <div className="news-grid">
        {items.map((item) => (
          <article className="news-card" key={item.id}>
            {item.image && <img className="news-image" src={item.image} alt={item.title} />}
            <div className="card-meta">
              <span className="date">{item.date}</span>
            </div>
            <h2>{item.title}</h2>
            <p>{item.summary}</p>
            {item.details && <p>{item.details}</p>}
          </article>
        ))}
      </div>
    </section>
  );
}
