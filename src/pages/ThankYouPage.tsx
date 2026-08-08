import { Link } from 'react-router-dom';

export default function ThankYouPage() {
  return (
    <section className="page page-thank-you">
      <div className="section-header">
        <p className="eyebrow">Booking sent</p>
        <h1>Thank you!</h1>
        <p>Your booking request has been received. The Tanfield Lea Community Centre team will review it and get back to you soon.</p>
      </div>
      <Link to="/" className="button">
        Back to home
      </Link>
    </section>
  );
}
