/**
 * FFmpeg Command Builder
 * Generates FFmpeg commands from template structures
 */

const logger = require('../utils/logger');
const { parseResolution } = require('../utils/validator');

/**
 * FFmpeg Command Builder Class
 */
class FFmpegBuilder {
  constructor(structure, inputFiles) {
    this.structure = structure;
    this.inputFiles = inputFiles; // { video1: '/path/to/file', video2: '...', ... }
    this.inputs = [];
    this.filterComplex = [];
    this.outputOptions = [];
    this.inputIndex = 0;
  }

  /**
   * Build complete FFmpeg command
   * @param {string} outputPath - Output file path
   * @returns {string} - Complete FFmpeg command
   */
  build(outputPath) {
    try {
      // Add inputs
      this.addInputs();

      // Build filter complex
      this.buildVideoFilters();
      this.buildAudioFilters();
      this.buildTextOverlays();

      // Build output options
      this.buildOutputOptions();

      // Generate command
      return this.generateCommand(outputPath);
    } catch (error) {
      logger.error('FFmpeg command build failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Add input files to command
   */
  addInputs() {
    // Add video clips
    if (this.structure.clips) {
      for (const clip of this.structure.clips) {
        this.addInput(clip.src);
      }
    }

    // Add voiceover
    if (this.structure.voiceover) {
      this.addInput(this.structure.voiceover.src);
    }

    // Add background audio
    if (this.structure.audio) {
      this.addInput(this.structure.audio.src);
    }
  }

  /**
   * Add single input
   * @param {string} src - Source identifier (e.g., 'video1')
   */
  addInput(src) {
    const filePath = this.inputFiles[src];
    if (!filePath) {
      throw new Error(`Input file not found for: ${src}`);
    }
    this.inputs.push(filePath);
    this.inputIndex++;
  }

  /**
   * Build video filter chain
   */
  buildVideoFilters() {
    if (!this.structure.clips || this.structure.clips.length === 0) {
      return;
    }

    const { width, height } = parseResolution(this.structure.output.resolution);
    const fps = this.structure.output.fps || 30;

    const videoLabels = [];
    let currentTime = 0;

    // Process each clip
    for (let i = 0; i < this.structure.clips.length; i++) {
      const clip = this.structure.clips[i];
      const duration = clip.duration || 5;
      const label = `v${i}`;

      // Scale and apply transitions
      let filter = `[${i}:v]scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=${fps}`;

      // Add fade out if transition specified
      if (clip.transition_out) {
        const fadeStart = duration - 0.5;
        filter += `,fade=t=out:st=${fadeStart}:d=0.5`;
      }

      // Add fade in if not first clip
      if (i > 0) {
        filter += `,fade=t=in:st=0:d=0.5`;
      }

      filter += `[${label}]`;
      this.filterComplex.push(filter);
      videoLabels.push(label);

      currentTime += duration;
    }

    // Concatenate clips if multiple
    if (videoLabels.length > 1) {
      const concatFilter = videoLabels.map((l) => `[${l}]`).join('') + `concat=n=${videoLabels.length}:v=1:a=0[vbase]`;
      this.filterComplex.push(concatFilter);
      this.finalVideoLabel = 'vbase';
    } else {
      this.finalVideoLabel = videoLabels[0];
    }

    this.totalDuration = currentTime;
  }

  /**
   * Build text overlay filters
   */
  buildTextOverlays() {
    if (!this.structure.text_overlays || this.structure.text_overlays.length === 0) {
      return;
    }

    let videoLabel = this.finalVideoLabel || 'v0';

    for (let i = 0; i < this.structure.text_overlays.length; i++) {
      const overlay = this.structure.text_overlays[i];
      const nextLabel = i === this.structure.text_overlays.length - 1 ? 'vfinal' : `vtext${i}`;

      // Build drawtext filter
      let drawtextFilter = `[${videoLabel}]drawtext=`;

      // Text content
      const text = overlay.text.replace(/'/g, "\\'").replace(/:/g, '\\:');
      drawtextFilter += `text='${text}'`;

      // Font settings
      drawtextFilter += `:fontsize=${overlay.font_size || 50}`;
      drawtextFilter += `:fontcolor=${overlay.color || 'white'}`;

      if (overlay.font) {
        drawtextFilter += `:fontfile=${overlay.font}`;
      }

      // Position
      drawtextFilter += `:x=${this.getXPosition(overlay.position)}`;
      drawtextFilter += `:y=${this.getYPosition(overlay.position)}`;

      // Background box
      if (overlay.background) {
        drawtextFilter += `:box=1:boxcolor=${overlay.background}:boxborderw=10`;
      }

      // Timing
      if (overlay.start !== undefined && overlay.duration !== undefined) {
        const end = overlay.start + overlay.duration;
        drawtextFilter += `:enable='between(t,${overlay.start},${end})'`;
      }

      drawtextFilter += `[${nextLabel}]`;
      this.filterComplex.push(drawtextFilter);

      videoLabel = nextLabel;
    }

    this.finalVideoLabel = 'vfinal';
  }

  /**
   * Get X position for text overlay
   * @param {string} position - Position name
   * @returns {string} - X expression
   */
  getXPosition(position) {
    const positions = {
      center: '(w-text_w)/2',
      left: '50',
      right: 'w-text_w-50',
      top: '(w-text_w)/2',
      bottom: '(w-text_w)/2',
    };
    return positions[position] || positions.center;
  }

  /**
   * Get Y position for text overlay
   * @param {string} position - Position name
   * @returns {string} - Y expression
   */
  getYPosition(position) {
    const positions = {
      center: '(h-text_h)/2',
      top: '50',
      bottom: 'h-text_h-50',
      left: '(h-text_h)/2',
      right: '(h-text_h)/2',
    };
    return positions[position] || positions.center;
  }

  /**
   * Build audio filter chain
   */
  buildAudioFilters() {
    const audioInputs = [];
    const audioFilters = [];

    let audioIndex = this.structure.clips ? this.structure.clips.length : 0;

    // Add voiceover
    if (this.structure.voiceover) {
      const volume = this.structure.voiceover.volume || 1.0;
      audioFilters.push(`[${audioIndex}:a]volume=${volume}[vo]`);
      audioInputs.push('[vo]');
      audioIndex++;
    }

    // Add background music
    if (this.structure.audio) {
      const volume = this.structure.audio.volume || 0.3;
      let filter = `[${audioIndex}:a]volume=${volume}`;

      // Add fade out
      if (this.structure.audio.fade_out && this.totalDuration) {
        const fadeStart = this.totalDuration - this.structure.audio.fade_out;
        filter += `,afade=t=out:st=${fadeStart}:d=${this.structure.audio.fade_out}`;
      }

      filter += '[bg]';
      audioFilters.push(filter);
      audioInputs.push('[bg]');
    }

    // Mix audio streams if multiple
    if (audioInputs.length > 1) {
      const mixFilter = audioInputs.join('') + `amix=inputs=${audioInputs.length}:duration=longest[a]`;
      audioFilters.push(mixFilter);
      this.finalAudioLabel = 'a';
    } else if (audioInputs.length === 1) {
      this.finalAudioLabel = audioInputs[0].replace(/[\[\]]/g, '');
    }

    // Add audio filters to filter complex
    this.filterComplex.push(...audioFilters);
  }

  /**
   * Build output options
   */
  buildOutputOptions() {
    const output = this.structure.output;

    // Map video
    if (this.finalVideoLabel) {
      this.outputOptions.push(`-map [${this.finalVideoLabel}]`);
    }

    // Map audio
    if (this.finalAudioLabel) {
      this.outputOptions.push(`-map [${this.finalAudioLabel}]`);
    }

    // Duration
    if (this.totalDuration) {
      this.outputOptions.push(`-t ${this.totalDuration}`);
    }

    // FPS
    if (output.fps) {
      this.outputOptions.push(`-r ${output.fps}`);
    }

    // Video codec
    this.outputOptions.push('-c:v libx264');
    this.outputOptions.push('-preset medium');
    this.outputOptions.push('-crf 23');
    this.outputOptions.push('-pix_fmt yuv420p');

    // Audio codec
    if (this.finalAudioLabel) {
      this.outputOptions.push('-c:a aac');
      this.outputOptions.push('-b:a 192k');
    }

    // Output format
    this.outputOptions.push('-movflags +faststart');
  }

  /**
   * Generate complete FFmpeg command
   * @param {string} outputPath - Output file path
   * @returns {string} - Complete command
   */
  generateCommand(outputPath) {
    const parts = ['ffmpeg', '-y']; // -y to overwrite

    // Add inputs
    for (const input of this.inputs) {
      parts.push(`-i "${input}"`);
    }

    // Add filter complex
    if (this.filterComplex.length > 0) {
      const filterString = this.filterComplex.join('; ');
      parts.push(`-filter_complex "${filterString}"`);
    }

    // Add output options
    parts.push(...this.outputOptions);

    // Add output path
    parts.push(`"${outputPath}"`);

    return parts.join(' ');
  }

  /**
   * Get estimated duration
   * @returns {number} - Duration in seconds
   */
  getDuration() {
    return this.totalDuration || 0;
  }
}

/**
 * Build FFmpeg command from structure
 * @param {Object} structure - Template structure
 * @param {Object} inputFiles - Input file paths
 * @param {string} outputPath - Output file path
 * @returns {Object} - { command, duration }
 */
function buildFFmpegCommand(structure, inputFiles, outputPath) {
  const builder = new FFmpegBuilder(structure, inputFiles);
  const command = builder.build(outputPath);
  const duration = builder.getDuration();

  return { command, duration };
}

module.exports = {
  FFmpegBuilder,
  buildFFmpegCommand,
};
