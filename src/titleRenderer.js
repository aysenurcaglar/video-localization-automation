const { createCanvas } = require('canvas');

async function renderTitle(title, width, height, fontSize = 40) {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  ctx.font = `${fontSize}px Arial`;
  ctx.fillStyle = 'white';
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 2;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  let measuredWidth = ctx.measureText(title).width;
  while (measuredWidth > width * 0.9 && fontSize > 10) {
    fontSize -= 2;
    ctx.font = `${fontSize}px Arial`;
    measuredWidth = ctx.measureText(title).width;
  }

  const x = width / 2;
  const y = height / 2;
  ctx.strokeText(title, x, y);
  ctx.fillText(title, x, y);

  return canvas.toBuffer('image/png');
}

module.exports = { renderTitle };