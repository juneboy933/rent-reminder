import Link from "next/link";

export default function HomePage() {
  return (
    <main className="home-page">
      <section className="home-shell">
        <div className="logo-badge" aria-hidden="true">RR</div>
        <h1>Rent Reminder</h1>
        <h2>Professional Rent Collection and Reminder Management for Modern Landlords</h2>
        <p>
          Track payment status, organize tenants, and manage reminder communication from one dashboard.
          Designed for clarity, speed, and daily landlord operations.
        </p>
        <div className="home-actions">
          <Link className="btn large" href="/register">Create Account</Link>
          <Link className="btn ghost large" href="/login">Login</Link>
        </div>
      </section>
    </main>
  );
}
