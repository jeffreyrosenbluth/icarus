import "./style.css";
import { Ball } from "./balls";
import {
  canvas,
  ctx,
  gameState,
  Status,
  RADIUS,
  GameState,
  BallState,
} from "./core";

const SPEED_KEY = "icarus.speedFactor";
const WINNERS_KEY = "icarus.winnersCount";
const SHOW_LEADERBOARD_KEY = "icarus.showLeaderboard";

// Target positions for the winners during the end animation, keyed by ball id.
let winnerTargets = new Map<number, { x: number; y: number }>();

// Snapshot of the elimination-order length we last reflected into the DOM.
let renderedEliminations = 0;
// Whether the OVER-state winner slots have been written to (or scheduled for) the DOM.
let renderedWinners = false;
let winnerRevealTimer: number | null = null;
const WINNER_REVEAL_DELAY_MS = 800;

const leaderboardEl = document.getElementById("leaderboard") as HTMLOListElement;
const prefsPanel = document.getElementById("prefsPanel") as HTMLDivElement;
const instructionsPanel = document.getElementById(
  "instructionsPanel",
) as HTMLDivElement;
const instructionsClose = document.getElementById(
  "instructionsClose",
) as HTMLButtonElement;
const prefWinners = document.getElementById("prefWinners") as HTMLInputElement;
const prefSpeed = document.getElementById("prefSpeed") as HTMLInputElement;
const prefSpeedValue = document.getElementById(
  "prefSpeedValue",
) as HTMLSpanElement;
const prefShowLeaderboard = document.getElementById(
  "prefShowLeaderboard",
) as HTMLInputElement;
const prefsSave = document.getElementById("prefsSave") as HTMLButtonElement;
const prefsCancel = document.getElementById(
  "prefsCancel",
) as HTMLButtonElement;
const prefsReset = document.getElementById("prefsReset") as HTMLButtonElement;
const prefGenWord = document.getElementById("prefGenWord") as HTMLInputElement;
const prefGenCount = document.getElementById(
  "prefGenCount",
) as HTMLInputElement;
const prefGenBtn = document.getElementById("prefGenBtn") as HTMLButtonElement;

const DEFAULT_SPEED = 1.0;
const DEFAULT_WINNERS = 1;
const DEFAULT_SHOW_LEADERBOARD = true;

// Update the players / balls when the user types in the textarea.
// Store the players in localStorage.
const playerTextarea = document.getElementById(
  "players",
) as HTMLInputElement | null;
playerTextarea?.addEventListener("input", function (event) {
  const target = event.target as HTMLInputElement;
  const players = target.value.split(",");
  gameState.players = players.map((v) => v.trim());
  gameState.balls = [];
  gameState.players.forEach((name, i) => {
    let ball = new Ball(RADIUS * gameState.scale);
    ball.name = name;
    ball.id = i;
    gameState.balls.push(ball);
  });
  gameState.reset();
  rebuildLeaderboard();
  clampCommittedWinners();
  if (localStorage) {
    localStorage.setItem("players", target.value);
  }
});

// The play button starts the game.
const playButton = document.getElementById("playButton");
playButton?.addEventListener("click", function handleClick(_event) {
  // If the game is already going, reset it.
  window.cancelAnimationFrame(gameState.frame);
  gameState.reset();
  rebuildLeaderboard();
  winnerTargets.clear();
  gameState.status = Status.STARTED;
  draw(gameState);
});

// Draw the sun to the canvas.
function sun(x: number, y: number, r: number, n: number, inset: number) {
  if (!ctx) return;
  ctx.save();
  ctx.beginPath();
  ctx.translate(x, y);
  ctx.moveTo(0, 0 - r);
  for (let i = 0; i < n; i++) {
    ctx.rotate(Math.PI / n);
    ctx.lineTo(0, 0 - r * inset);
    ctx.rotate(Math.PI / n);
    ctx.lineTo(0, 0 - r);
  }
  ctx.closePath();
  ctx.fillStyle = "rgba(255, 215, 0, 0.7)";
  ctx.fill();
  ctx.restore();
  let radius = r / 1.4;
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = "rgba(255, 65, 0, 0.31)";
    ctx.beginPath();
    ctx.arc(x, y, radius * gameState.scale, 0, 2 * Math.PI);
    ctx.closePath();
    ctx.fill();
    radius /= 1.8;
  }
}

// Draw the background stars.
function nightstars() {
  if (!ctx) {
    return;
  }
  for (const star of gameState.stars) {
    ctx.fillStyle = `rgba(255, 255, 255, ${0.5 * star.alpha})`;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.r * gameState.scale, 0, 2 * Math.PI);
    ctx.fill();
  }
}

function setup(gameState: GameState) {
  if (!ctx || !canvas) {
    return;
  }
  loadPrefs();
  gameState.reset();
  resizeCanvas(gameState);
  window.addEventListener("resize", () => resizeCanvas(gameState));
  // Retrieve the players from localStorage if they exist.
  const content = localStorage.getItem("players");
  const playerTextarea = document.getElementById(
    "players",
  ) as HTMLInputElement | null;
  if (content && playerTextarea) {
    playerTextarea!.value = content;
    gameState.frame = window.requestAnimationFrame(() => draw(gameState));
    // Let the listeners know that the players have been updated.
    playerTextarea?.dispatchEvent(new Event("input"));
  }
  rebuildLeaderboard();
  gameState.frame = window.requestAnimationFrame(() => draw(gameState));
}

function draw(gameState: GameState) {
  if (!ctx) return;
  // Clear the canvas.
  ctx.fillStyle = "black";
  ctx.strokeStyle = "black";
  ctx.fillRect(0, 0, gameState.width, gameState.height);
  ctx.strokeRect(0, 0, gameState.width, gameState.height);

  nightstars();
  let radius = RADIUS;

  if (gameState.status === Status.STARTED) {
    sun(
      gameState.center().x,
      gameState.center().y,
      1.4 * radius * gameState.scale,
      16,
      0.65,
    );
  }
  if (gameState.status === Status.PAUSED) {
    return;
  }

  // Mark dead balls. Check for collisions and adjust velocities.
  for (let i = 0; i < gameState.balls.length; i++) {
    gameState.balls[i].gone(gameState);
    for (let j = 0; j < i; j++) {
      gameState.balls[i].collide(gameState.balls[j], gameState);
    }
  }

  // Move and draw the balls.
  for (let i = 0; i < gameState.balls.length; i++) {
    gameState.balls[i].move(gameState);
    gameState.balls[i].render(gameState, 1);
  }

  // Check if the game is over and set the gameState status appropriatley.
  gameState.gameOver();
  syncLeaderboard(gameState);

  if ((gameState.status as Status) === Status.OVER) {
    const winners = gameState.winners();
    if (winnerTargets.size === 0) {
      assignWinnerTargets(gameState, winners);
    }
    let allWinnersAtTarget = true;
    for (const w of winners) {
      const t = winnerTargets.get(w.id);
      if (!t) continue;
      const dx = t.x - w.pos.x;
      const dy = t.y - w.pos.y;
      const distSq = dx * dx + dy * dy;
      if (distSq < 9) {
        w.vel.x = 0;
        w.vel.y = 0;
        w.pos.x = t.x;
        w.pos.y = t.y;
      } else {
        const d = Math.sqrt(distSq);
        w.vel.x = (dx / d) * 3;
        w.vel.y = (dy / d) * 3;
        allWinnersAtTarget = false;
      }
    }
    const allDeadFaded = gameState.balls.every(
      (b) => b.state !== BallState.DEAD || b.radius < 3,
    );
    if (allWinnersAtTarget && allDeadFaded) {
      window.cancelAnimationFrame(gameState.frame);
      animateWinners(gameState);
      return;
    }
  }
  gameState.frame = window.requestAnimationFrame(() => draw(gameState));
}

function assignWinnerTargets(gameState: GameState, winners: Ball[]) {
  winnerTargets.clear();
  const cy = gameState.center().y;
  const cx = gameState.center().x;
  const n = winners.length;
  if (n === 1) {
    winnerTargets.set(winners[0].id, { x: cx, y: cy });
    return;
  }
  const spacing = Math.min(
    gameState.width / (n + 1),
    220 * gameState.scale,
  );
  const startX = cx - ((n - 1) * spacing) / 2;
  // Sort by id for stable left-to-right placement.
  const sorted = [...winners].sort((a, b) => a.id - b.id);
  sorted.forEach((w, i) => {
    winnerTargets.set(w.id, { x: startX + i * spacing, y: cy });
  });
}

function animateWinners(gameState: GameState) {
  if (!ctx) return;
  ctx.fillStyle = "black";
  ctx.strokeStyle = "black";
  ctx.fillRect(0, 0, gameState.width, gameState.height);
  ctx.strokeRect(0, 0, gameState.width, gameState.height);
  nightstars();

  const winners = gameState.winners();
  const cap = winners.length === 1
    ? 100
    : Math.max(40, 100 / Math.sqrt(winners.length));

  let allCapped = true;
  for (const ball of winners) {
    const target = winnerTargets.get(ball.id);
    if (target) {
      ball.pos.x = target.x;
      ball.pos.y = target.y;
    }
    const fontSize = (25 / RADIUS) * ball.radius * gameState.scale;
    ball.color.setAlpha(1);
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.fillStyle = ball.color.color();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(ball.name, ball.pos.x, ball.pos.y);

    if (ball.radius < cap) {
      ball.radius += 0.5;
      allCapped = false;
    }
  }

  if (allCapped) {
    winners.forEach((b) => b.reset(gameState));
    window.cancelAnimationFrame(gameState.frame);
    return;
  }
  gameState.frame = window.requestAnimationFrame(() => animateWinners(gameState));
}

function rebuildLeaderboard() {
  if (!leaderboardEl) return;
  leaderboardEl.innerHTML = "";
  const n = gameState.players.length;
  for (let i = 1; i <= n; i++) {
    const li = document.createElement("li");
    li.dataset.rank = String(i);
    const rank = document.createElement("span");
    rank.className = "rank";
    rank.textContent = `${i}.`;
    const name = document.createElement("span");
    name.className = "name";
    name.textContent = "";
    li.appendChild(rank);
    li.appendChild(name);
    leaderboardEl.appendChild(li);
  }
  renderedEliminations = 0;
  renderedWinners = false;
  if (winnerRevealTimer !== null) {
    window.clearTimeout(winnerRevealTimer);
    winnerRevealTimer = null;
  }
}

function brightColor(ball: Ball) {
  // Lerp 45% toward white so darker random colors stay legible on the dark sidebar.
  const r = Math.round(ball.color.r + (255 - ball.color.r) * 0.45);
  const g = Math.round(ball.color.g + (255 - ball.color.g) * 0.45);
  const b = Math.round(ball.color.b + (255 - ball.color.b) * 0.45);
  return `rgb(${r}, ${g}, ${b})`;
}

function fillSlot(rank: number, ball: Ball, isWinner: boolean) {
  if (!leaderboardEl) return;
  const li = leaderboardEl.querySelector<HTMLLIElement>(
    `li[data-rank="${rank}"]`,
  );
  if (!li) return;
  const name = li.querySelector<HTMLSpanElement>(".name");
  if (!name) return;
  if (li.dataset.playerId === String(ball.id)) return;
  li.dataset.playerId = String(ball.id);
  name.textContent = ball.name;
  name.style.color = brightColor(ball);
  if (isWinner) {
    li.classList.add("slot-winner");
  }
  // Retrigger the slide-in animation.
  li.classList.remove("slot-filled");
  void li.offsetWidth;
  li.classList.add("slot-filled");
}

function syncLeaderboard(gameState: GameState) {
  const n = gameState.players.length;
  const order = gameState.eliminationOrder;
  // Each new elimination fills the next slot from the bottom upward.
  while (renderedEliminations < order.length) {
    const rank = n - renderedEliminations;
    const ball = gameState.balls[order[renderedEliminations]];
    if (ball) fillSlot(rank, ball, false);
    renderedEliminations++;
  }
  if (
    (gameState.status as Status) === Status.OVER &&
    !renderedWinners &&
    winnerRevealTimer === null
  ) {
    // Snapshot winner IDs now and reveal after a short pause so the leaderboard
    // beat lands a bit after the final elimination.
    const winnerIds = gameState
      .winners()
      .map((w) => w.id)
      .sort((a, b) => a - b);
    winnerRevealTimer = window.setTimeout(() => {
      winnerIds.forEach((id, i) => {
        const ball = gameState.balls[id];
        if (ball) fillSlot(i + 1, ball, true);
      });
      renderedWinners = true;
      winnerRevealTimer = null;
    }, WINNER_REVEAL_DELAY_MS);
  }
}

// --- Preferences panel -------------------------------------------------

let prePanelStatus: Status | null = null;

function openPrefs() {
  if (!prefsPanel.hidden) return;
  prePanelStatus = gameState.status;
  if (gameState.status === Status.STARTED) {
    gameState.status = Status.PAUSED;
    window.cancelAnimationFrame(gameState.frame);
  }
  // Populate the form from current state. Edits stay in the form until Save.
  writeFormValues(
    gameState.speedFactor,
    gameState.winnersCount,
    gameState.showLeaderboard,
  );
  prefsPanel.hidden = false;
}

function writeFormValues(speed: number, winners: number, show: boolean) {
  prefSpeed.value = String(speed);
  prefSpeedValue.textContent = `${speed.toFixed(2)}×`;
  prefWinners.value = String(winners);
  clampWinnersInput();
  prefShowLeaderboard.checked = show;
}

function readFormValues() {
  let speed = parseFloat(prefSpeed.value);
  if (!Number.isFinite(speed) || speed <= 0) speed = DEFAULT_SPEED;
  let winners = parseInt(prefWinners.value, 10);
  const maxWinners = Math.max(1, gameState.players.length - 1);
  if (!Number.isFinite(winners) || winners < 1) winners = 1;
  if (winners > maxWinners) winners = maxWinners;
  return {
    speed,
    winners,
    showLeaderboard: prefShowLeaderboard.checked,
  };
}

function applyLeaderboardVisibility() {
  if (!leaderboardEl) return;
  leaderboardEl.classList.toggle("hidden", !gameState.showLeaderboard);
}

function closePrefs() {
  if (prefsPanel.hidden) return;
  prefsPanel.hidden = true;
  if (prePanelStatus === Status.STARTED) {
    gameState.status = Status.STARTED;
    gameState.frame = window.requestAnimationFrame(() => draw(gameState));
  }
  prePanelStatus = null;
}

function savePrefs() {
  const v = readFormValues();
  gameState.speedFactor = v.speed;
  gameState.winnersCount = v.winners;
  gameState.showLeaderboard = v.showLeaderboard;
  if (localStorage) {
    localStorage.setItem(SPEED_KEY, String(v.speed));
    localStorage.setItem(WINNERS_KEY, String(v.winners));
    localStorage.setItem(SHOW_LEADERBOARD_KEY, v.showLeaderboard ? "1" : "0");
  }
  applyLeaderboardVisibility();
  closePrefs();
}

function togglePrefs() {
  if (prefsPanel.hidden) openPrefs();
  else closePrefs();
}

function clampWinnersInput() {
  const n = gameState.players.length;
  const max = Math.max(1, n - 1);
  prefWinners.max = String(max);
  let v = parseInt(prefWinners.value, 10);
  if (!Number.isFinite(v) || v < 1) v = 1;
  if (v > max) v = max;
  prefWinners.value = String(v);
}

function clampCommittedWinners() {
  const n = gameState.players.length;
  const max = Math.max(1, n - 1);
  if (gameState.winnersCount > max) {
    gameState.winnersCount = max;
    if (localStorage) {
      localStorage.setItem(WINNERS_KEY, String(max));
    }
  }
}

prefsSave?.addEventListener("click", savePrefs);
prefsCancel?.addEventListener("click", closePrefs);
prefsReset?.addEventListener("click", () => {
  writeFormValues(DEFAULT_SPEED, DEFAULT_WINNERS, DEFAULT_SHOW_LEADERBOARD);
});

prefGenBtn?.addEventListener("click", () => {
  const word = prefGenWord.value.trim() || "Player";
  let count = parseInt(prefGenCount.value, 10);
  if (!Number.isFinite(count) || count < 1) count = 1;
  if (count > 100) count = 100;
  const names = Array.from({ length: count }, (_, i) => `${word} ${i + 1}`);
  if (playerTextarea) {
    playerTextarea.value = names.join(", ");
    playerTextarea.dispatchEvent(new Event("input"));
  }
});

prefWinners?.addEventListener("input", clampWinnersInput);

prefSpeed?.addEventListener("input", () => {
  const v = parseFloat(prefSpeed.value);
  if (Number.isFinite(v)) {
    prefSpeedValue.textContent = `${v.toFixed(2)}×`;
  }
});

function openInstructions() {
  if (!instructionsPanel.hidden) return;
  if (!prefsPanel.hidden) closePrefs();
  instructionsPanel.hidden = false;
}

function closeInstructions() {
  if (instructionsPanel.hidden) return;
  instructionsPanel.hidden = true;
}

function toggleInstructions() {
  if (instructionsPanel.hidden) openInstructions();
  else closeInstructions();
}

instructionsClose?.addEventListener("click", closeInstructions);

instructionsPanel?.addEventListener("click", (e) => {
  if (e.target === instructionsPanel) closeInstructions();
});

window.addEventListener("keydown", (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === ",") {
    e.preventDefault();
    togglePrefs();
  } else if ((e.metaKey || e.ctrlKey) && (e.key === "i" || e.key === "I")) {
    e.preventDefault();
    toggleInstructions();
  } else if (e.key === "Escape") {
    if (!prefsPanel.hidden) {
      e.preventDefault();
      closePrefs();
    } else if (!instructionsPanel.hidden) {
      e.preventDefault();
      closeInstructions();
    }
  }
});

prefsPanel?.addEventListener("click", (e) => {
  if (e.target === prefsPanel) closePrefs();
});

function loadPrefs() {
  const s = localStorage.getItem(SPEED_KEY);
  if (s !== null) {
    const v = parseFloat(s);
    if (Number.isFinite(v) && v > 0) gameState.speedFactor = v;
  }
  const w = localStorage.getItem(WINNERS_KEY);
  if (w !== null) {
    const v = parseInt(w, 10);
    if (Number.isFinite(v) && v >= 1) gameState.winnersCount = v;
  }
  const sl = localStorage.getItem(SHOW_LEADERBOARD_KEY);
  if (sl !== null) {
    gameState.showLeaderboard = sl === "1";
  }
  writeFormValues(
    gameState.speedFactor,
    gameState.winnersCount,
    gameState.showLeaderboard,
  );
  applyLeaderboardVisibility();
}

// -----------------------------------------------------------------------

function resizeCanvas(gameState: GameState) {
  if (!canvas || !ctx) {
    return;
  }
  const windowWidth = 0.75 * window.innerWidth;
  const windowHeight = 0.6 * window.innerHeight;

  canvas.width = Math.floor(windowWidth * window.devicePixelRatio);
  canvas.height = Math.floor(windowHeight * window.devicePixelRatio);

  canvas.style.width = windowWidth + "px";
  canvas.style.height = windowHeight + "px";

  ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

  gameState.width = windowWidth;
  gameState.height = windowHeight;
  gameState.scale = Math.sqrt(gameState.width * gameState.height) / 1000;
  if (gameState.status !== Status.STARTED) {
    gameState.frame = window.requestAnimationFrame(() => draw(gameState));
  }
}

setup(gameState);
