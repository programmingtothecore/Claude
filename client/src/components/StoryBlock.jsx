export default function StoryBlock({ label, text }) {
  return (
    <section className="story-block">
      <h4 className="story-label">{label}</h4>
      {text && text.trim()
        ? <p className="story-text">{text}</p>
        : <p className="story-text empty">Not written yet.</p>}
    </section>
  );
}
