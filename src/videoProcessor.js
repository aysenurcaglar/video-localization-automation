const ffmpeg = require('fluent-ffmpeg');
const { createCanvas, loadImage } = require('canvas');
const fs = require('fs').promises;

async function processVideo(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .videoFilters([
        {
          filter: 'chromakey',
          options: { color: '0x00FF00', similarity: 0.3, blend: 0.1 }
        }
      ])
      .frames(1)
      .saveToFile('green_mask.png')
      .on('end', async () => {
        try {
          const image = await loadImage('green_mask.png');
          const canvas = createCanvas(image.width, image.height);
          const ctx = canvas.getContext('2d');
          ctx.drawImage(image, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const greenArea = identifyGreenArea(imageData);

          console.log('Green area identified:', greenArea);

          await fs.unlink('green_mask.png');
          resolve(greenArea);
        } catch (error) {
          reject(error);
        }
      })
      .on('error', (err) => {
        console.error('Error processing video:', err);
        reject(err);
      });
  });
}

function identifyGreenArea(imageData) {
  let minX = Infinity, minY = Infinity, maxX = 0, maxY = 0;

  for (let y = 0; y < imageData.height; y++) {
    for (let x = 0; x < imageData.width; x++) {
      const i = (y * imageData.width + x) * 4;
      const alpha = imageData.data[i + 3];

      if (alpha > 0) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }

  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

module.exports = { processVideo };