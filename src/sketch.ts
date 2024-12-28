import "./style.css";
import { Ball } from "./balls";
import { canvas, ctx, gameState, Status, RADIUS, GameState } from "./core";

// Update the players / balls when the user types in the textarea.
// Store the players in localStorage.
const playerTextarea = document.getElementById(
  "players"
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
  gameState.reset();
  resizeCanvas(gameState);
  window.addEventListener("resize", () => resizeCanvas(gameState));
  // Retrieve the players from localStorage if they exist.
  const content = localStorage.getItem("players");
  const playerTextarea = document.getElementById(
    "players"
  ) as HTMLInputElement | null;
  if (content && playerTextarea) {
    playerTextarea!.value = content;
    gameState.frame = window.requestAnimationFrame(() => draw(gameState));
    // Let the listeners know that the players have been updated.
    playerTextarea?.dispatchEvent(new Event("input"));
  }
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
      0.65
    );
  }
  if (gameState.status === Status.PAUSED) {
    return;
  }

  // Mark dead balls. Check for collisions and adjust velocities.
  for (let i = 0; i < gameState.balls.length; i++) {
    gameState.balls[i].gone(gameState);
    for (let j = 0; j < i; j++) {
      gameState.balls[i].collide(gameState.balls[j]);
    }
  }

  // Move and draw the balls.
  for (let i = 0; i < gameState.balls.length; i++) {
    gameState.balls[i].move(gameState);
    gameState.balls[i].render(gameState, 1);
  }

  // Check if the game is over and set the gameState status appropriatley.
  gameState.gameOver();
  if ((gameState.status as Status) === Status.OVER) {
    let ball = gameState.winners()[0];
    ball.vel = gameState.center().sub(ball.pos);
    ball.vel = ball.vel.withMag(3);
    // If the game is over and the winner has returned to the center, stop the animation and
    // animate the winner.
    if (
      gameState.balls[gameState.runnerUp].radius < 3 &&
      ball.pos.distance(gameState.center()) < 3
    ) {
      window.cancelAnimationFrame(gameState.frame);
      animateWinner(gameState);
      return;
    }
  }
  gameState.frame = window.requestAnimationFrame(() => draw(gameState));
  console.log(gameState.frame);
}

function animateWinner(gameState: GameState) {
  if (!ctx) return;
  ctx.fillStyle = "black";
  ctx.strokeStyle = "black";
  ctx.fillRect(0, 0, gameState.width, gameState.height);
  ctx.strokeRect(0, 0, gameState.width, gameState.height);
  nightstars();

  const ball = gameState.winners()[0];
  const fontSize = (25 / RADIUS) * ball.radius * gameState.scale;
  const text = `${ball.name}`;

  ctx.font = `bold ${fontSize}px sans-serif`;
  ball.color.setAlpha(1);
  ctx.fillStyle = ball.color.color();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, gameState.center().x, gameState.center().y);

  if (
    gameState.players.includes("Reed") ||
    gameState.players.includes("reed")
  ) {
    ctx.save();
    ctx.font = "bold ${1.40 * fontSize}px sans-serif";
    ctx.shadowColor = "rgb(190, 190, 190)";
    ctx.shadowOffsetX = 10;
    ctx.shadowOffsetY = 10;
    ctx.shadowBlur = 10;
    const gradient = ctx.createLinearGradient(
      gameState.center().x - 100,
      gameState.center().x + 100,
      150,
      100
    );
    gradient.addColorStop(0, "rgb(255, 0, 0)");
    gradient.addColorStop(1, "rgb(255, 255, 0)");
    ctx.fillStyle = gradient;
    ctx.fillText(
      "Happy 30th Brithday, Reed!",
      gameState.center().x,
      gameState.center().y + 125
    );
    ctx.restore();
  }

  ball.radius += 0.5;
  if (ball.radius > 100) {
    ball.reset(gameState);
    window.cancelAnimationFrame(gameState.frame);
    return;
  }
  gameState.frame = window.requestAnimationFrame(() =>
    animateWinner(gameState)
  );
}

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
