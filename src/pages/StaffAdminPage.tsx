import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../context/AppContext';

type StaffAccount = {
  username: string;
  isAdmin: boolean;
};

export default function StaffAdminPage() {
  const { isStaff, isAdmin, staffUsername } = useAppState();
  const navigate = useNavigate();

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
    if (!isAdmin) {
      navigate('/staff/dashboard', { replace: true });
    }
  }, [isStaff, isAdmin, navigate]);

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
    if (isAdmin) {
      loadAccounts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

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

  if (!isAdmin) {
    return null;
  }

  return (
    <section className="page page-dashboard">
      <div className="section-header">
        <p className="eyebrow">Admin</p>
        <h1>Manage staff accounts</h1>
        <p>Create or remove accounts used for staff sign-in.</p>
      </div>

      <section className="admin-panel">
        <div className="admin-layout-grid">
          <div className="admin-card">
            <h2>Add a new account</h2>
            <p>New accounts can sign in immediately with the credentials below.</p>

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
          </div>

          <div className="admin-card admin-accounts-list">
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
        </div>
      </section>
    </section>
  );
}
