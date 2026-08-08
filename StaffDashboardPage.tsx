import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../context/AppContext';
import { NewsItem, newsItems as defaultNewsItems } from '../data/news';

const STORAGE_KEY = 'communityNews';

type StaffAccount = {
  username: string;
  isAdmin: boolean;
};

export default function StaffDashboardPage() {
  const { isStaff, isAdmin, staffUsername } = useAppState();
  const navigate = useNavigate();
  const [items, setItems] = useState<NewsItem[]>([]);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [summary, setSummary] = useState('');
  const [details, setDetails] = useState('');
  const [image, setImage] = useState<string>('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'news' | 'admin'>('news');
  const [accounts, setAccounts] = useState<StaffAccount[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [accountsError, setAccountsError] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newIsAdmin, setNewIsAdmin] = useState(false);
  const [accountActionMessage, setAccountActionMessage] = useState('');

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

  const loadAccounts = async () => {
    setAccountsLoading(true);
    setAccountsError('');
    try {
      const response = await fetch('/api/staff/accounts');
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setAccountsError(data?.error || 'Unable to load accounts.');
        setAccounts([]);
        return;
      }
      setAccounts(Array.isArray(data?.accounts) ? data.accounts : []);
    } catch {
      setAccountsError('Unable to load accounts.');
      setAccounts([]);
    } finally {
      setAccountsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin && activeTab === 'admin') {
      loadAccounts();
    }
  }, [isAdmin, activeTab]);

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

  const handleCreateAccount = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAccountsError('');
    setAccountActionMessage('');

    try {
      const response = await fetch('/api/staff/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: newUsername.trim(),
          password: newPassword.trim(),
          isAdmin: newIsAdmin,
        }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setAccountsError(data?.error || 'Failed to create account.');
        return;
      }

      setAccountActionMessage('Account created.');
      setNewUsername('');
      setNewPassword('');
      setNewIsAdmin(false);
      setAccounts(Array.isArray(data?.accounts) ? data.accounts : accounts);
    } catch {
      setAccountsError('Failed to create account.');
    }
  };

  const handleDeleteAccount = async (username: string) => {
    setAccountsError('');
    setAccountActionMessage('');

    try {
      const response = await fetch(`/api/staff/accounts/${encodeURIComponent(username)}`, {
        method: 'DELETE',
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setAccountsError(data?.error || 'Failed to delete account.');
        return;
      }

      setAccountActionMessage('Account removed.');
      setAccounts(Array.isArray(data?.accounts) ? data.accounts : accounts.filter((account) => account.username !== username));
    } catch {
      setAccountsError('Failed to delete account.');
    }
  };

  return (
    <section className="page page-dashboard">
      <div className="section-header">
        <p className="eyebrow">Staff dashboard</p>
        <h1>Post news and manage announcements</h1>
        <p>Use this area to publish new community news items with an image, title, date, and full details.</p>
      </div>

      <div className="staff-tabs">
        <button
          type="button"
          className={`tab-button${activeTab === 'news' ? ' active' : ''}`}
          onClick={() => setActiveTab('news')}
        >
          News
        </button>
        {isAdmin && (
          <button
            type="button"
            className={`tab-button${activeTab === 'admin' ? ' active' : ''}`}
            onClick={() => setActiveTab('admin')}
          >
            Admin
          </button>
        )}
      </div>

      {activeTab === 'admin' && isAdmin && (
        <section className="admin-panel">
          <h2>Manage staff accounts</h2>
          <p>Create or remove accounts used for staff sign-in.</p>

          <form className="booking-form" onSubmit={handleCreateAccount}>
            <div className="form-grid">
              <label>
                Username
                <input
                  value={newUsername}
                  onChange={(event) => setNewUsername(event.target.value)}
                  minLength={3}
                  required
                />
              </label>
              <label>
                Password
                <input
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  minLength={6}
                  required
                />
              </label>
            </div>

            <label className="admin-checkbox-row">
              <input
                type="checkbox"
                checked={newIsAdmin}
                onChange={(event) => setNewIsAdmin(event.target.checked)}
              />
              <span>Create as admin account</span>
            </label>

            <div className="form-footer">
              <button className="button" type="submit">Create account</button>
            </div>
          </form>

          {accountsError && <p className="booking-note error">{accountsError}</p>}
          {accountActionMessage && <p className="booking-note success">{accountActionMessage}</p>}

          <div className="admin-accounts-list">
            <h3>Current accounts</h3>
            {accountsLoading && <p>Loading accounts...</p>}
            {!accountsLoading && accounts.length === 0 && <p>No accounts found.</p>}
            {!accountsLoading && accounts.length > 0 && (
              <ul>
                {accounts.map((account) => (
                  <li key={account.username}>
                    <div>
                      <strong>{account.username}</strong>
                      <span>{account.isAdmin ? 'Admin' : 'Staff'}</span>
                    </div>
                    <button
                      type="button"
                      className="button secondary"
                      onClick={() => handleDeleteAccount(account.username)}
                      disabled={account.username === staffUsername}
                      title={account.username === staffUsername ? 'Sign out to remove your own account.' : 'Remove account'}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}

      {activeTab === 'admin' && !isAdmin && (
        <p className="booking-note error">Only admin accounts can manage staff users.</p>
      )}

      {activeTab === 'news' && (
        <>
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
        </>
      )}
    </section>
  );
}
