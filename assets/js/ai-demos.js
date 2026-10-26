// Interactive demos for the AI page:
// 1. Motif demo: real output from the NeuralGambit logic engine for one position.
// 2. CHREST in miniature: a simplified simulation of chunk-based recall.
// 3. Live engine: loads neuralgambit.com/patterner into the page on request.

const FILES = "abcdefgh";

// Solid glyphs for both colours; colour comes from CSS. ︎ keeps them as text, not emoji.
const GLYPHS = { k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟" };

function parseFen(fen) {
  const pieces = {};
  fen.split(" ")[0].split("/").forEach((row, r) => {
    let file = 0;
    for (const ch of row) {
      if (/\d/.test(ch)) { file += Number(ch); continue; }
      pieces[FILES[file] + (8 - r)] = ch;
      file += 1;
    }
  });
  return pieces;
}

// The engine numbers squares 0 (a1) to 63 (h8)
function indexToSquare(index) {
  const i = Number(index);
  return FILES[i % 8] + (Math.floor(i / 8) + 1);
}

// Draws a board. options.highlight: { square: className }, options.ghosts: { square: piece }
function renderBoard(el, pieces, options = {}) {
  const { highlight = {}, ghosts = {} } = options;
  let html = "";

  for (let rank = 8; rank >= 1; rank--) {
    for (let f = 0; f < 8; f++) {
      const sq = FILES[f] + rank;
      const shade = (f + rank) % 2 === 1 ? "dark" : "light"; // a1 is dark
      const piece = pieces[sq] || ghosts[sq];
      const classes = ["sq", shade, highlight[sq] || ""];
      let content = "";

      if (piece) {
        const colour = piece === piece.toUpperCase() ? "white" : "black";
        const ghost = !pieces[sq] && ghosts[sq] ? " ghost" : "";
        content = `<span class="pc ${colour}${ghost}">${GLYPHS[piece.toLowerCase()]}︎</span>`;
      }

      const coordFile = rank === 1 ? `<span class="coord file">${FILES[f]}</span>` : "";
      const coordRank = f === 0 ? `<span class="coord rank">${rank}</span>` : "";
      html += `<div class="${classes.join(" ").trim()}" data-sq="${sq}">${content}${coordFile}${coordRank}</div>`;
    }
  }

  el.innerHTML = html;
}


// ---------- 1. Motif demo (real engine output) ----------

const MOTIF_FEN = "r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 0 1";

const MOTIFS = [
  {
    name: "Bishop Pair",
    description: "One side still has both of its bishops (the light-squared and the dark-squared one). Together they cover squares of both colours, which is usually an advantage in open positions.",
    sqs: [2, 26, 34, 58]
  },
  {
    name: "Center Control",
    description: "The pieces of one colour together attack all four central squares (d4, e4, d5, e5). Controlling the centre gives more space and mobility.",
    sqs: [1, 2, 3, 4, 5, 6, 8, 9, 10, 11, 12, 13, 15, 16, 17, 18, 19, 20, 21, 22, 23, 26, 27, 28, 29, 31, 33, 35, 36, 37, 38, 40, 44, 47, 53]
  },
  {
    name: "Connected Pawns",
    description: "Two pawns of the same colour that sit next to each other, or where one pawn defends the other. Connected pawns protect each other and are strong, especially in endgames.",
    sqs: [8, 9, 10, 13, 14, 15, 48, 49, 50, 51, 19, 53, 54, 55, 28]
  },
  {
    name: "Bad Bishop",
    description: "A bishop that is mostly guarding its own pieces (it defends more than one) and has fewer than 5 free squares to move to, usually because its own pawns block it.",
    sqs: [26]
  }
];

function initMotifDemo() {
  const board = document.getElementById("motif-board");
  const list = document.getElementById("motif-list");
  const description = document.getElementById("motif-description");
  if (!board) return;

  const pieces = parseFen(MOTIF_FEN);

  function select(index) {
    const motif = MOTIFS[index];
    const highlight = {};
    motif.sqs.forEach((i) => { highlight[indexToSquare(i)] = "hl"; });
    renderBoard(board, pieces, { highlight });

    list.querySelectorAll("button").forEach((btn, i) => btn.setAttribute("aria-pressed", String(i === index)));
    description.textContent = motif.description;
  }

  list.innerHTML = MOTIFS.map((m, i) =>
    `<button type="button" data-index="${i}" aria-pressed="false">${m.name}</button>`).join("");

  list.addEventListener("click", (event) => {
    const btn = event.target.closest("button[data-index]");
    if (btn) select(Number(btn.dataset.index));
  });

  select(0);
}


// ---------- 2. CHREST in miniature ----------

// Queen's Gambit Declined after 8.Bd3, a typical master-game position
const GAME_FEN = "r1bq1rk1/pp1nbppp/2p1pn2/3p2B1/2PP4/2NBPN2/PP3PPP/2RQK2R b K - 1 8";

// Chunks are lists of "piece@square". Uppercase = White, lowercase = Black.
const LTM = {
  expert: [
    { name: "Castled king template", items: ["k@g8", "r@f8", "p@f7", "p@g7", "p@h7", "n@f6", "b@e7"] },
    { name: "Queen's Gambit centre", items: ["P@c4", "P@d4", "P@e3", "p@c6", "p@d5", "p@e6", "N@c3", "B@d3"] },
    { name: "Uncastled king, kingside", items: ["K@e1", "R@h1", "P@f2", "P@g2", "P@h2", "N@f3"] },
    { name: "Black queenside", items: ["p@a7", "p@b7", "r@a8", "b@c8", "q@d8"] },
    { name: "White queenside", items: ["P@a2", "P@b2", "R@c1", "Q@d1"] },
    { name: "Pin on f6", items: ["B@g5", "n@f6", "q@d8"] }
  ],
  novice: [
    { name: "Pawns f7 g7 h7", items: ["p@f7", "p@g7", "p@h7"] },
    { name: "Pawns f2 g2 h2", items: ["P@f2", "P@g2", "P@h2"] },
    { name: "King and rook", items: ["k@g8", "r@f8"] },
    { name: "Pawns a7 b7", items: ["p@a7", "p@b7"] },
    { name: "Pawns a2 b2", items: ["P@a2", "P@b2"] }
  ]
};

const STM_SLOTS = 4;
const SLOT_CLASSES = ["c1", "c2", "c3", "c4"];

// Same pieces as the game position, scattered with a fixed seed so the demo repeats exactly
function randomPosition(pieces) {
  let seed = 7;
  const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

  const squares = [];
  for (let r = 1; r <= 8; r++) for (let f = 0; f < 8; f++) squares.push(FILES[f] + r);
  for (let i = squares.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [squares[i], squares[j]] = [squares[j], squares[i]];
  }

  const result = {};
  Object.values(pieces).forEach((piece, i) => { result[squares[i]] = piece; });
  return result;
}

// Order in which the model looks at single pieces: from the centre outwards
function byCentreDistance(a, b) {
  const d = (sq) => Math.abs(FILES.indexOf(sq[0]) - 3.5) + Math.abs(Number(sq[1]) - 4.5);
  return d(a) - d(b);
}

// Recognise chunks from long-term memory and fill short-term memory
function simulate(position, player) {
  const present = new Set(Object.entries(position).map(([sq, p]) => `${p}@${sq}`));
  const used = new Set();
  const slots = [];

  const matches = LTM[player]
    .filter((chunk) => chunk.items.every((item) => present.has(item)))
    .sort((a, b) => b.items.length - a.items.length);

  for (const chunk of matches) {
    if (slots.length === STM_SLOTS) break;
    if (chunk.items.some((item) => used.has(item))) continue;
    chunk.items.forEach((item) => used.add(item));
    slots.push({ name: chunk.name, items: chunk.items });
  }

  // Unfamiliar material can only be stored one piece per slot
  const leftovers = Object.keys(position).filter((sq) => !used.has(`${position[sq]}@${sq}`)).sort(byCentreDistance);
  while (slots.length < STM_SLOTS && leftovers.length) {
    const sq = leftovers.shift();
    slots.push({ name: "Single piece", items: [`${position[sq]}@${sq}`] });
  }

  return slots;
}

function initChrestDemo() {
  const root = document.getElementById("chrest-demo");
  if (!root) return;

  const board = document.getElementById("chrest-board");
  const boardTitle = document.getElementById("chrest-board-title");
  const slotsEl = document.getElementById("stm-slots");
  const runBtn = document.getElementById("chrest-run");
  const recallValue = document.getElementById("recall-value");
  const recallBar = document.getElementById("recall-bar");

  const gamePieces = parseFen(GAME_FEN);
  const positions = { game: gamePieces, random: randomPosition(gamePieces) };
  const state = { player: "expert", position: "game", running: false };
  let timers = [];

  function emptySlots() {
    slotsEl.innerHTML = Array.from({ length: STM_SLOTS }, () => `<li class="stm-slot empty">Empty</li>`).join("");
  }

  function reset() {
    timers.forEach(clearTimeout);
    timers = [];
    state.running = false;
    runBtn.disabled = false;
    boardTitle.textContent = "Position shown";
    renderBoard(board, positions[state.position]);
    emptySlots();
    recallValue.textContent = "–";
    recallBar.style.width = "0";
  }

  function run() {
    reset();
    state.running = true;
    runBtn.disabled = true;

    const position = positions[state.position];
    const slots = simulate(position, state.player);
    const highlight = {};
    const total = Object.keys(position).length;

    // Fill one slot at a time, highlighting the recognised chunk
    slots.forEach((slot, i) => {
      timers.push(setTimeout(() => {
        slot.items.forEach((item) => { highlight[item.split("@")[1]] = `hl ${SLOT_CLASSES[i]}`; });
        renderBoard(board, position, { highlight });

        const li = slotsEl.children[i];
        li.className = `stm-slot ${SLOT_CLASSES[i]}`;
        li.innerHTML = `<strong>${slot.name}</strong><span>${slot.items.length} piece${slot.items.length === 1 ? "" : "s"}</span>`;
      }, 700 * (i + 1)));
    });

    // Then show what the model can reconstruct from memory
    timers.push(setTimeout(() => {
      const recalled = {};
      const ghosts = {};
      slots.forEach((slot) => slot.items.forEach((item) => {
        const [piece, sq] = item.split("@");
        recalled[sq] = piece;
      }));
      Object.entries(position).forEach(([sq, piece]) => { if (!recalled[sq]) ghosts[sq] = piece; });

      boardTitle.textContent = "Recalled from memory (faded pieces were forgotten)";
      renderBoard(board, recalled, { ghosts, highlight });

      const count = Object.keys(recalled).length;
      const percent = Math.round((count / total) * 100);
      recallValue.textContent = `${count} of ${total} (${percent}%)`;
      recallBar.style.width = `${percent}%`;

      const cell = root.querySelector(`[data-cell="${state.player}-${state.position}"]`);
      if (cell) cell.textContent = `${percent}%`;

      state.running = false;
      runBtn.disabled = false;
    }, 700 * (slots.length + 1) + 300));
  }

  root.addEventListener("click", (event) => {
    const btn = event.target.closest("button[data-player], button[data-position]");
    if (!btn) return;

    if (btn.dataset.player) state.player = btn.dataset.player;
    if (btn.dataset.position) state.position = btn.dataset.position;

    root.querySelectorAll("[data-player]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.player === state.player)));
    root.querySelectorAll("[data-position]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.position === state.position)));
    reset();
  });

  runBtn.addEventListener("click", run);
  reset();
}


// ---------- 3. Live engine ----------

function initLiveEngine() {
  const btn = document.getElementById("load-live-engine");
  if (!btn) return;

  btn.addEventListener("click", () => {
    const container = document.getElementById("live-engine");
    container.classList.add("is-loaded");
    container.innerHTML = `
      <iframe src="https://www.neuralgambit.com/patterner" title="NeuralGambit Perception engine"
              loading="lazy" referrerpolicy="no-referrer"></iframe>
      <a class="text-cta" href="https://www.neuralgambit.com/patterner" target="_blank" rel="noopener noreferrer">
        Open full screen on NeuralGambit <span>↗</span>
      </a>`;
  });
}


document.addEventListener("DOMContentLoaded", () => {
  initMotifDemo();
  initChrestDemo();
  initLiveEngine();
});
