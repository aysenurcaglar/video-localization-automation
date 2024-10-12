const ffmpeg = require('fluent-ffmpeg');

async function overlayImage(videoPath, imagePath, outputPath, overlayArea) {
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .input(imagePath)
      .complexFilter([
        `[1:v]scale=${overlayArea.width}:${overlayArea.height}[overlay]`,
        `[0:v][overlay]overlay=${overlayArea.x}:${overlayArea.y}:enable='between(t,0,inf)'[out]`
      ])
      .map('[out]')
      .videoCodec('libx264')
      .audioCodec('copy')
      .output(outputPath)
      .on('end', () => {
        console.log('Image overlay complete:', outputPath);
        resolve();
      })
      .on('error', (err) => {
        console.error('Error overlaying image:', err);
        reject(err);
      })
      .run();
  });
}

module.exports = { overlayImage };