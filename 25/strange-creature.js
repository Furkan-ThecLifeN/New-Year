const backgroundColor = 'rgba(0,0,10,0.5)';
const baseHue = rand(360);
const rangeHue = 180;
const tentacleCount = 30;
const segmentCountMin = 15;
const segmentCountMax = 30;
const segmentLengthMin = 10;
const segmentLengthMax = 30;
const colonyRadius = 200;
const { buffer, ctx } = createRenderingContext();

let center;
let mouse;
let tick;
let simplex;
let tentacles;
let controls;
let drawStyle = 'dot-line';

class Tentacle {
  constructor(x, y, segmentNum, baseLength, baseDirection) {
    this.base = [x, y];
    this.position = [x, y];
    this.target = [x, y];
    this.segmentNum = segmentNum;
    this.baseLength = baseLength;
    this.baseDirection = baseDirection;
    this.segmentProps = ['x1', 'y1', 'x2', 'y2', 'l', 'd', 'h'];
    this.segments = new PropsArray(segmentNum, this.segmentProps);
    this.follow = false;

    let i = this.segments.length - this.segmentProps.length;
    let x1, y1, x2, y2, l, d, h;

    l = this.baseLength;
    d = this.baseDirection;

    for (; i >= 0; i -= this.segmentProps.length) {
      x1 = x2 || this.position[0];
      y1 = y2 || this.position[1];
      x2 = x1 - l * cos(d);
      y2 = y1 - l * sin(d);
      d += 0.309;
      l *= 0.98;
      h = baseHue + fadeIn(i, this.segments.length) * rangeHue;
      this.segments.set([x1, y1, x2, y2, l, d, h], i);
    }
  }
  setCtx(ctx) {
    this.ctx = ctx;
  }
  setTarget(target) {
    this.target = target;
  }
  updateBase() {
    let t = simplex.noise3D(this.base[0] * 0.005, this.base[1] * 0.005, tick * 0.005) * TAU;

    this.base.lerp([
    this.base[0] + 20 * cos(t),
    this.base[1] + 20 * sin(t)],
    0.025);
  }
  update() {
    let target = this.position;
    let i = this.segments.length - this.segmentProps.length;

    this.position.lerp(this.target, 0.015);
    !this.follow && this.updateBase();

    for (; i >= 0; i -= this.segmentProps.length) {
      let [x1, y1, x2, y2, l, d, h] = this.segments.get(i);
      let t, n, tn;

      x1 = target[0];
      y1 = target[1];
      t = angle(x1, y1, x2, y2);
      n = simplex.noise3D(
      x1 * 0.005,
      y1 * 0.005,
      (i + tick) * 0.005);

      tn = t + n * PI * 0.0125;
      x2 = x1 + l * cos(tn);
      y2 = y1 + l * sin(tn);
      d = t;

      target = [x2, y2];

      this.segments.set([x1, y1, x2, y2, l, d], i);
      this.drawSegment(x1, y1, x2, y2, h, n, i);
    }
  }
  drawSegment(x1, y1, x2, y2, h, n, i) {
    const fn = fadeInOut(1 + n, 2);
    const fa = fadeInOut(i, this.segments.length);
    const a = 0.25 * (fn + fa);

    if (drawStyle === 'dot-line' || drawStyle === 'line') {
      this.ctx.beginPath();
      this.ctx.strokeStyle = `hsla(${h}, 50%, 50%, ${a})`;
      this.ctx.moveTo(x2, y2);
      this.ctx.lineTo(x1, y1);
      this.ctx.stroke();
      this.ctx.closePath();
    }

    if (drawStyle === 'dot-line' || drawStyle === 'dot') {
      this.ctx.beginPath();
      this.ctx.strokeStyle = `hsla(${h}, 50%, 50%, ${a + 0.5})`;
      this.ctx.arc(x1, y1, fn * 3, 0, TAU);
      this.ctx.stroke();
      this.ctx.closePath();
    }
  }}


function setup() {
  tick = 0;
  simplex = new SimplexNoise();
  mouse = [0, 0];
  center = [];
  resize();
  tentacles = [];
  controls = [...document.querySelectorAll('.controls__rdo')];
  controls.forEach(rdo => {
    rdo.addEventListener('change', e => {
      if (e.target.checked)
      drawStyle = e.target.value;
    });
  });

  let i, d, t, tentacle;

  for (i = 0; i < tentacleCount; i++) {
    d = randRange(colonyRadius);
    t = i / tentacleCount * TAU;
    tentacle = new Tentacle(
    center[0] + d * cos(t),
    center[1] + d * sin(t),
    round(randIn(segmentCountMin, segmentCountMax)),
    round(randIn(segmentLengthMin, segmentLengthMax)),
    t);

    tentacle.setCtx(buffer);
    tentacles.push(tentacle);
  }

  loop();
}

function resize() {
  const { innerWidth, innerHeight } = window;

  buffer.canvas.width = innerWidth;
  buffer.canvas.height = innerHeight;

  buffer.drawImage(ctx.canvas, 0, 0);

  ctx.canvas.width = innerWidth;
  ctx.canvas.height = innerHeight;

  ctx.drawImage(buffer.canvas, 0, 0);

  center[0] = 0.5 * buffer.canvas.width;
  center[1] = 0.5 * buffer.canvas.height;
}

function renderBackground() {
  buffer.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, buffer.canvas.width, buffer.canvas.height);
}

function renderGlow() {
  ctx.save();
  ctx.filter = 'blur(8px) brightness(200%)';
  ctx.globalCompositeOperation = 'lighter';
  ctx.drawImage(buffer.canvas, 0, 0);
  ctx.drawImage(buffer.canvas, 0, 0);
  ctx.restore();
}

function renderToScreen() {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.drawImage(buffer.canvas, 0, 0);
  ctx.restore();
}

function loop() {
  window.requestAnimationFrame(loop);

  tick++;

  renderBackground();

  tentacles.forEach(tentacle => tentacle.update());

  renderGlow();
  renderToScreen();
}


window.addEventListener('mousemove', e => {
  tentacles.forEach((tentacle, i) => {
    const t = i / tentacles.length * TAU;
    tentacle.setTarget([e.clientX + colonyRadius * cos(t + tick * 0.05), e.clientY + colonyRadius * sin(t + tick * 0.05)]);
    tentacle.follow = true;
  });
});

window.addEventListener('load', setup);
window.addEventListener('resize', resize);
window.addEventListener('mouseout', () => {
  tentacles.forEach(tentacle => {
    tentacle.base = [
    center[0] + colonyRadius * cos(rand(TAU)),
    center[1] + colonyRadius * sin(rand(TAU))];

    tentacle.setTarget(tentacle.base);
    tentacle.follow = false;
  });
});