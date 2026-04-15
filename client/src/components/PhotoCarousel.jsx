import { useState } from 'react';

export default function PhotoCarousel({ photos }) {
  const [i, setI] = useState(0);
  if (!photos || photos.length === 0) {
    return <div className="carousel empty">No photo yet</div>;
  }
  const n = photos.length;
  const cur = photos[i];
  const go = (delta) => setI((p) => (p + delta + n) % n);
  return (
    <div className="carousel">
      <img
        src={`/uploads/${cur.filename}`}
        alt=""
        className="carousel-img"
        onClick={() => go(1)}
      />
      {n > 1 && (
        <>
          <button className="carousel-nav left" onClick={() => go(-1)} aria-label="Previous">‹</button>
          <button className="carousel-nav right" onClick={() => go(1)} aria-label="Next">›</button>
          <div className="carousel-dots">
            {photos.map((_, idx) => (
              <span key={idx} className={idx === i ? 'dot active' : 'dot'} onClick={() => setI(idx)} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
