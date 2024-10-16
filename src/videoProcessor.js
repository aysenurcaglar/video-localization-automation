const ffmpeg = require('fluent-ffmpeg');
const { createCanvas, loadImage } = require('canvas');
const fs = require('fs').promises;

async function processVideo(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .videoFilters([
        {
          filter: 'select',
          options: 'gte(n,0)',  // Select all frames
        },
        {
          filter: 'chromakey',
          options: { color: '04f405', similarity: 0.3, blend: 0.1 }
        }
      ])
      .outputOptions(['-vf', 'fps=1']) // Extract one frame per second
      .output('frames_%d.png')
      .on('end', async () => {
        try {
          const greenAreas = await processFrames();
          console.log('Green areas identified:', greenAreas);
          resolve(greenAreas);
        } catch (error) {
          reject(error);
        }
      })
      .on('error', (err) => {
        console.error('Error processing video:', err);
        reject(err);
      })
      .run();
  });
}

async function processFrames() {
  const files = await fs.readdir('.');
  const frameFiles = files.filter(file => file.startsWith('frames_') && file.endsWith('.png'));
  
  const greenAreas = await Promise.all(frameFiles.map(async (file, index) => {
    const image = await loadImage(file);
    const canvas = createCanvas(image.width, image.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const greenArea = identifyGreenArea(imageData);
    await fs.unlink(file);
    return { frame: index, ...greenArea };
  }));

  return greenAreas;
}

function identifyGreenArea(imageData) {
    const greenThreshold = { r: 4, g: 244, b: 5 };
    const tolerance = 30; // Adjust this tolerance as needed
  
    let minX = Infinity, minY = Infinity, maxX = 0, maxY = 0;
    const { width, height, data } = imageData;
  
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
  
        if (isGreen(r, g, b, greenThreshold, tolerance)) {
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        }
      }
    }
  
    if (minX === Infinity || minY === Infinity) {
      throw new Error('No green area detected');
    }
  
    return { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
  }
  
  function isGreen(r, g, b, threshold, tolerance) {
    const distance = Math.sqrt(
      Math.pow(r - threshold.r, 2) +
      Math.pow(g - threshold.g, 2) +
      Math.pow(b - threshold.b, 2)
    );
    return distance < tolerance;
  }

module.exports = { processVideo };