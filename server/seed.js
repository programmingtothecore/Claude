// Creates 10 demo accounts with photos + stories if the users table is empty.
// Safe to re-run; it is a no-op when users already exist.

const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const db = require('./db');
const { UPLOAD_DIR } = require('./upload');

const PASSWORD = 'password123';

const PEOPLE = [
  {
    email: 'mira@example.com', display_name: 'Mira', age: 28, gender: 'female', seeking_gender: 'male', location: 'Brooklyn, NY',
    colors: ['#f6c6b0', '#c68b74'],
    who_i_am: "Potter by day, baker of very average sourdough by weekend. I laugh too loud in movie theaters and I'm not sorry about it.",
    who_i_want_to_be: "Someone who keeps a kiln in the backyard and a garden that actually survives. More patient. Less on my phone.",
    what_im_looking_for: "A person with their own thing going on. Long walks, quiet evenings, shared curiosity. Someone I can build a small life with.",
  },
  {
    email: 'daniel@example.com', display_name: 'Daniel', age: 31, gender: 'male', seeking_gender: 'female', location: 'Brooklyn, NY',
    colors: ['#a7c7e7', '#3a5a80'],
    who_i_am: "Middle-school music teacher. I play bass badly and piano well. I own too many plants and I'm on a first-name basis with the guy at the hardware store.",
    who_i_want_to_be: "A father one day. Someone who finally learns to cook something besides pasta.",
    what_im_looking_for: "Honesty and softness. A partner, not a project. Someone who likes Sunday mornings as much as Saturday nights.",
  },
  {
    email: 'ayla@example.com', display_name: 'Ayla', age: 26, gender: 'female', seeking_gender: 'any', location: 'Oakland, CA',
    colors: ['#e8b8d4', '#8b4f78'],
    who_i_am: "ER nurse. I'm tired a lot but I'm also the first person at the party dancefloor. Dog person, coffee person, sit-on-the-fire-escape person.",
    who_i_want_to_be: "Calmer. A better listener. Someone who travels slow instead of fast.",
    what_im_looking_for: "Warmth. Someone who asks real questions and actually waits for the answers.",
  },
  {
    email: 'sam@example.com', display_name: 'Sam', age: 29, gender: 'nonbinary', seeking_gender: 'any', location: 'Portland, OR',
    colors: ['#c9e4b4', '#4f7a3e'],
    who_i_am: "Freelance illustrator. I rescue plants from sidewalks and occasionally they survive. I read slowly because I like to underline things.",
    who_i_want_to_be: "Someone whose work feels less like grinding and more like making. Also: braver about big conversations.",
    what_im_looking_for: "Kindness and a little weirdness. Someone who will split a dessert with me instead of ordering their own.",
  },
  {
    email: 'rafael@example.com', display_name: 'Rafael', age: 34, gender: 'male', seeking_gender: 'female', location: 'Austin, TX',
    colors: ['#f0d08a', '#8a6212'],
    who_i_am: "I build bicycle frames for a living and ride them badly on long weekends. I can cook one great meal and I will cook it for you.",
    who_i_want_to_be: "A little less stubborn. Someone who remembers birthdays. Maybe a dad, eventually.",
    what_im_looking_for: "Someone kind, funny, and a bit stubborn themselves. I want to be pushed back on.",
  },
  {
    email: 'lila@example.com', display_name: 'Lila', age: 27, gender: 'female', seeking_gender: 'female', location: 'Chicago, IL',
    colors: ['#f4a6a6', '#9a3a3a'],
    who_i_am: "Architect. I overthink menus. I cry at commercials. I'm really good at planning trips and really bad at going on them.",
    who_i_want_to_be: "Braver. Someone who goes on the trip. Someone who builds something that outlives her.",
    what_im_looking_for: "A partner who is steady without being boring. I want late-night kitchen conversations and a shared calendar.",
  },
  {
    email: 'jordan@example.com', display_name: 'Jordan', age: 32, gender: 'male', seeking_gender: 'nonbinary', location: 'Brooklyn, NY',
    colors: ['#b8c4f4', '#3a4d9a'],
    who_i_am: "Software engineer who actually goes outside. I run half-marathons slowly and make playlists for every mood a person can have.",
    who_i_want_to_be: "Someone whose job doesn't sit in his chest at night. More present. Better at calling my mom.",
    what_im_looking_for: "A creative, quietly confident person. I want to build traditions together, even small ones.",
  },
  {
    email: 'nadia@example.com', display_name: 'Nadia', age: 30, gender: 'female', seeking_gender: 'male', location: 'Austin, TX',
    colors: ['#e4b4f4', '#6a2a88'],
    who_i_am: "Documentary editor. I talk with my hands. I love almost every cuisine and I make tea constantly.",
    who_i_want_to_be: "Someone who finishes her own film. Someone who owns a dog she didn't plan to own.",
    what_im_looking_for: "A curious, grounded person. Someone who can sit in a long silence and still feel close.",
  },
  {
    email: 'ethan@example.com', display_name: 'Ethan', age: 33, gender: 'male', seeking_gender: 'female', location: 'Oakland, CA',
    colors: ['#b4e4d4', '#2a6a58'],
    who_i_am: "Carpenter. I read a lot of fiction. I laugh at my own jokes and I will apologize for it later.",
    who_i_want_to_be: "More open. Someone who travels with only a backpack. A partner worth having.",
    what_im_looking_for: "Someone warm and a little bit weird. I want ordinary days that feel like something.",
  },
  {
    email: 'kai@example.com', display_name: 'Kai', age: 25, gender: 'nonbinary', seeking_gender: 'nonbinary', location: 'Portland, OR',
    colors: ['#f4d4b4', '#a06028'],
    who_i_am: "Bookstore clerk and zine maker. I have strong opinions about commas and almost none about restaurants.",
    who_i_want_to_be: "A person who finishes a novel instead of starting three. Someone who writes postcards.",
    what_im_looking_for: "A soft, serious person. I want long conversations and the kind of quiet that isn't empty.",
  },
];

function ensureUploadDir() {
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Produce a pleasant placeholder SVG: full-bleed color gradient with a large initial.
function makeSvg({ initial, bg, fg, tag }) {
  const w = 900, h = 1200;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${bg}"/>
      <stop offset="100%" stop-color="${fg}"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#g)"/>
  <text x="50%" y="54%" font-family="Georgia, 'Times New Roman', serif" font-size="520"
        text-anchor="middle" fill="rgba(255,255,255,0.95)" font-weight="700">${initial}</text>
  <text x="50%" y="88%" font-family="Georgia, serif" font-size="48" letter-spacing="6"
        text-anchor="middle" fill="rgba(255,255,255,0.85)">${tag}</text>
</svg>`;
}

function writePhoto(userId, filename, svg) {
  fs.writeFileSync(path.join(UPLOAD_DIR, filename), svg);
}

function run() {
  ensureUploadDir();
  const count = db.prepare('SELECT COUNT(*) AS n FROM users').get().n;
  if (count > 0) {
    console.log(`[seed] skipping - ${count} user(s) already exist`);
    return;
  }

  const hash = bcrypt.hashSync(PASSWORD, 10);
  const insertUser = db.prepare(`
    INSERT INTO users (email, password_hash, display_name, age, gender, seeking_gender, location,
                       who_i_am, who_i_want_to_be, what_im_looking_for)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertPhoto = db.prepare(`
    INSERT INTO photos (user_id, filename, is_primary, sort_order) VALUES (?, ?, ?, ?)
  `);

  const tx = db.transaction(() => {
    for (const p of PEOPLE) {
      const info = insertUser.run(
        p.email, hash, p.display_name, p.age, p.gender, p.seeking_gender, p.location,
        p.who_i_am, p.who_i_want_to_be, p.what_im_looking_for,
      );
      const userId = info.lastInsertRowid;
      const tones = [
        { bg: p.colors[0], fg: p.colors[1] },
        { bg: p.colors[1], fg: p.colors[0] },
        { bg: '#222', fg: p.colors[1] },
      ];
      tones.forEach((tone, i) => {
        const fname = `seed-${userId}-${i}.svg`;
        const svg = makeSvg({
          initial: p.display_name[0],
          bg: tone.bg, fg: tone.fg,
          tag: p.display_name.toUpperCase(),
        });
        writePhoto(userId, fname, svg);
        insertPhoto.run(userId, fname, i === 0 ? 1 : 0, i);
      });
    }
  });
  tx();

  console.log(`[seed] created ${PEOPLE.length} demo users (password: "${PASSWORD}")`);
  for (const p of PEOPLE) console.log(`  - ${p.email}  (${p.display_name}, ${p.gender}/${p.seeking_gender})`);
}

if (require.main === module) {
  run();
}

module.exports = { run };
