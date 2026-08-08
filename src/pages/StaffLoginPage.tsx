import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../context/AppContext';

export default function StaffLoginPage() {
  const { loginStaff } = useAppState();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    const success = await loginStaff(username.trim(), password.trim());
    if (success) {
      navigate('/staff/dashboard');
    } else {
      setError('Invalid staff credentials or auth server unavailable.');
    }
    setIsSubmitting(false);
  };

  return (
    <section className="page page-login">
      <div className="section-header">
        <p className="eyebrow">Staff login</p>
        <h1>Enter the staff area</h1>
        <p>Sign in to post news, upload images, and manage announcements.</p>
      </div>

      <form className="booking-form" onSubmit={handleSubmit}>
        <label>
          Username
          <input value={username} onChange={(event) => setUsername(event.target.value)} required />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
        </label>
        <div className="form-footer">
          <button className="button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>
        </div>
        {error && <p className="booking-note error">{error}</p>}
      </form>
    </section>
  );
}
