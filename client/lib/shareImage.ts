// Pure canvas renderer for the athlete share card. No React — takes a 2D
// context plus data and paints the branded résumé image at any platform size.

export type ShareCardData = {
  name: string;
  tagline: string;
  location: string;
  url: string;
  lines: string[];
  stats: { label: string; value: string }[];
};

export type ShareCardFonts = { display: string; body: string };

export function drawShareCard(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  data: ShareCardData,
  image: HTMLImageElement | null,
  fonts: ShareCardFonts,
) {
  const base = Math.min(W, H);
  const pad = base * 0.075;
  ctx.clearRect(0, 0, W, H);

  // Background — photo (cover) or brand gradient fallback.
  if (image) {
    drawCover(ctx, image, W, H);
  } else {
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#2d3133');
    bg.addColorStop(1, '#7a2600');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
  }

  // Readability gradients.
  const bottom = ctx.createLinearGradient(0, H * 0.3, 0, H);
  bottom.addColorStop(0, 'rgba(12,9,7,0)');
  bottom.addColorStop(1, 'rgba(11,8,6,0.97)');
  ctx.fillStyle = bottom;
  ctx.fillRect(0, 0, W, H);
  const left = ctx.createLinearGradient(0, 0, W * 0.95, 0);
  left.addColorStop(0, 'rgba(11,8,6,0.72)');
  left.addColorStop(1, 'rgba(11,8,6,0)');
  ctx.fillStyle = left;
  ctx.fillRect(0, 0, W, H);

  ctx.textAlign = 'left';

  // Top-left wordmark + promo subtitle.
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#ff5f1f';
  ctx.font = `800 ${base * 0.05}px ${fonts.display}`;
  ctx.fillText('ARC', pad, pad);
  const wordmarkW = ctx.measureText('ARC').width;
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.font = `600 ${base * 0.028}px ${fonts.body}`;
  ctx.fillText('- My athletic resume', pad + wordmarkW + base * 0.022, pad + base * 0.013);

  // Content block, anchored to the bottom — scales to fit when many items are picked.
  const maxW = W > H ? W * 0.64 : W - pad * 2;
  const contentTop = pad + base * 0.05 + base * 0.028 + base * 0.058 + base * 0.03;
  const available = H - pad - contentTop;

  let nameSize = base * 0.11;
  let tagSize = base * 0.036;
  let hSize = base * 0.032;
  let hGap = hSize * 1.55;
  let statVal = base * 0.062;
  let statLab = base * 0.024;
  let urlSize = base * 0.028;
  let gap = base * 0.032;

  const hasStats = data.stats.length > 0;
  const statsH0 = hasStats ? gap * 0.5 + statVal + statLab * 1.5 : 0;
  const blockH0 =
    nameSize + gap * 0.7 + tagSize + gap + data.lines.length * hGap + statsH0 + gap + urlSize;

  const k = Math.min(1, available / blockH0);
  nameSize *= k;
  tagSize *= k;
  hSize *= k;
  hGap *= k;
  statVal *= k;
  statLab *= k;
  urlSize *= k;
  gap *= k;

  let y = H - pad - blockH0 * k;

  // Name (auto-fit width).
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#ffffff';
  fitFont(ctx, data.name, '800', fonts.display, nameSize, maxW);
  ctx.fillText(data.name, pad, y);
  y += nameSize + gap * 0.7;

  // Tagline • location.
  ctx.font = `600 ${tagSize}px ${fonts.body}`;
  ctx.fillStyle = '#ffb59c';
  ctx.fillText(`${data.tagline}   •   ${data.location}`, pad, y);
  y += tagSize + gap;

  // Achievement lines (selected highlights + previous races).
  data.lines.forEach((line) => {
    ctx.fillStyle = '#ff5f1f';
    drawCheck(ctx, pad, y + hSize * 0.5, hSize * 0.42);
    ctx.fillStyle = 'rgba(255,255,255,0.93)';
    ctx.font = `500 ${hSize}px ${fonts.body}`;
    ctx.fillText(clampLine(ctx, line, maxW - hSize * 1.35), pad + hSize * 1.35, y);
    y += hGap;
  });

  // Stat row (shrinks horizontally so all selected stats fit one row).
  if (hasStats) {
    y += gap * 0.5;
    let statGap = base * 0.055 * k;
    let total = 0;
    data.stats.forEach((stat, index) => {
      ctx.font = `800 ${statVal}px ${fonts.display}`;
      const vw = ctx.measureText(stat.value).width;
      ctx.font = `700 ${statLab}px ${fonts.body}`;
      const lw = ctx.measureText(stat.label.toUpperCase()).width;
      total += Math.max(vw, lw) + (index < data.stats.length - 1 ? statGap : 0);
    });
    const statK = Math.min(1, maxW / total);
    const sVal = statVal * statK;
    const sLab = statLab * statK;
    statGap *= statK;
    let sx = pad;
    data.stats.forEach((stat) => {
      ctx.fillStyle = '#ffffff';
      ctx.font = `800 ${sVal}px ${fonts.display}`;
      ctx.fillText(stat.value, sx, y);
      const vw = ctx.measureText(stat.value).width;
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.font = `700 ${sLab}px ${fonts.body}`;
      const label = stat.label.toUpperCase();
      ctx.fillText(label, sx, y + sVal * 1.06);
      const lw = ctx.measureText(label).width;
      sx += Math.max(vw, lw) + statGap;
    });
    y += statVal + statLab * 1.5;
  }

  // URL.
  y += gap;
  ctx.fillStyle = 'rgba(255,255,255,0.72)';
  ctx.font = `600 ${urlSize}px ${fonts.body}`;
  ctx.fillText(data.url, pad, y);
}

function drawCover(ctx: CanvasRenderingContext2D, image: HTMLImageElement, W: number, H: number) {
  const imageRatio = image.width / image.height;
  const canvasRatio = W / H;
  let dw: number;
  let dh: number;
  let dx: number;
  let dy: number;
  if (imageRatio > canvasRatio) {
    dh = H;
    dw = H * imageRatio;
    dx = (W - dw) / 2;
    dy = 0;
  } else {
    dw = W;
    dh = W / imageRatio;
    dx = 0;
    dy = (H - dh) / 2;
  }
  ctx.drawImage(image, dx, dy, dw, dh);
}

function fitFont(
  ctx: CanvasRenderingContext2D,
  text: string,
  weight: string,
  family: string,
  size: number,
  maxWidth: number,
) {
  let current = size;
  ctx.font = `${weight} ${current}px ${family}`;
  while (ctx.measureText(text).width > maxWidth && current > size * 0.5) {
    current -= size * 0.04;
    ctx.font = `${weight} ${current}px ${family}`;
  }
}

function clampLine(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let clipped = text;
  while (clipped.length > 1 && ctx.measureText(`${clipped}…`).width > maxWidth) {
    clipped = clipped.slice(0, -1);
  }
  return `${clipped.trimEnd()}…`;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawCheck(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.save();
  ctx.strokeStyle = ctx.fillStyle;
  ctx.lineWidth = r * 0.55;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(x, y + r * 0.1);
  ctx.lineTo(x + r * 0.7, y + r * 0.8);
  ctx.lineTo(x + r * 1.9, y - r * 0.7);
  ctx.stroke();
  ctx.restore();
}
