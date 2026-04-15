import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div className="landing">
      <section className="hero">
        <h1>Connect &amp; Explore</h1>
        <p className="tag">
          A dating app with no gimmicks. Photos, a few honest paragraphs, and a chat.
        </p>
        <p className="sub">
          No swiping. No compatibility scores. No badges. You see the person.
          You read their story. If it resonates, you Connect. If it's mutual, you talk.
        </p>
        <div className="cta-row">
          <Link to="/signup" className="btn primary big">Create a profile</Link>
          <Link to="/login" className="btn ghost big">Sign in</Link>
        </div>
      </section>

      <section className="principles">
        <div className="principle">
          <h3>Connect, not Like</h3>
          <p>One word. You reached out, or you didn't. Mutual opens chat. That's it.</p>
        </div>
        <div className="principle">
          <h3>Explore, not Swipe</h3>
          <p>A browsable grid of real profiles. You decide when to move on.</p>
        </div>
        <div className="principle">
          <h3>Your Story, not a quiz</h3>
          <p>Three prompts: who you are, who you want to be, what you're looking for.
            Write like a person, not a résumé.</p>
        </div>
      </section>
    </div>
  );
}
