const { program } = require('commander');
const fs = require('fs').promises;
const path = require('path');
const { processVideo } = require('./src/videoProcessor');
const { overlayImage } = require('./src/imageOverlay');
const { renderTitle } = require('./src/titleRenderer');
const { loadConfig } = require('./src/utils');
const { PromisePool } = require('@supercharge/promise-pool');

program
  .option('-i, --input <path>', 'Path to input video file')
  .option('-o, --output <path>', 'Output directory for localized videos')
  .option('-c, --config <path>', 'Path to configuration file')
  .option('--images <paths...>', 'Paths to overlay images')
  .option('--titles <titles...>', 'Titles to overlay on the videos')
  .parse(process.argv);

const options = program.opts();

async function createLocalizedVersions(inputVideo, images, titles, outputDir) {
  const greenArea = await processVideo(inputVideo, outputDir);

  await PromisePool
    .withConcurrency(5) // Adjust concurrency level based on system capability
    .for(images)
    .process(async (imagePath, i) => {
      const title = titles[i];
      const outputPath = path.join(outputDir, `localized_version_${i + 1}.mp4`);

      await overlayImage(inputVideo, imagePath, outputPath, greenArea);

      const titleImage = await renderTitle(title, greenArea.width, greenArea.height / 4);
      const titleImagePath = path.join(outputDir, `title_${i + 1}.png`);
      await fs.writeFile(titleImagePath, titleImage);

      const finalOutputPath = path.join(outputDir, `final_localized_version_${i + 1}.mp4`);
      await overlayImage(outputPath, titleImagePath, finalOutputPath, {
        x: greenArea.x,
        y: greenArea.y - greenArea.height / 4,
        width: greenArea.width,
        height: greenArea.height / 4
      });

      await fs.unlink(outputPath);
      await fs.unlink(titleImagePath);

      console.log(`Created localized version ${i + 1}: ${finalOutputPath}`);
    });
}

async function main() {
  try {
    const config = await loadConfig(options.config);

    const inputVideo = options.input || config.inputVideo;
    const outputDir = options.output || config.outputDirectory;
    const images = options.images || config.images || [];
    const titles = options.titles || config.titles || [];

    // Validation logic
    if (images.length !== titles.length) {
        throw new Error('The number of images must match the number of titles.');
      }

    console.log('Starting video localization process...');
    await createLocalizedVersions(inputVideo, images, titles, outputDir);

    console.log('Localized videos created successfully!');
  } catch (error) {
    console.error('An error occurred:', error.message);
    process.exit(1);
  }
}

main();