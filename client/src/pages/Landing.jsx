import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div className="landing">
      <section className="hero">
        <h1>Connect &amp; Explore</h1>
        <p className="tag">
          No algorithms. No gimmicks. Just people, photos, and honest words.
        </p>
        <p className="sub">
          You see the person. You read their story. If it resonates, you Connect.
          If it's mutual, you talk. That's the whole thing.
        </p>
        <div className="cta-row">
          <Link to="/signup" className="btn primary big">Create a profile</Link>
          <Link to="/login" className="btn ghost big">Sign in</Link>
        </div>
      </section>

      <section className="principles">
        <div className="principle">
          <h3>Connect, not Like</h3>
          <p>One intentional action. Mutual connection opens chat. No games, no waiting.</p>
        </div>
        <div className="principle">
          <h3>Explore, not Swipe</h3>
          <p>Browse at your own pace. A grid of real profiles, not a slot machine.</p>
        </div>
        <div className="principle">
          <h3>Your Story, not a quiz</h3>
          <p>Three prompts: who you are, who you want to be, and what you're looking for. Write like a human.</p>
        </div>
      </section>
    </div>
  );
}
