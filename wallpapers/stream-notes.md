# Relaxing water wallpaper

The user supplied a 179-second, 1920 × 1080, 30 fps MP4 cropped from a YouTube
stream wallpaper. Original filename:

`[appsgolem.com][1080p][01-58-01][02-01-00]_Gentle_Stream_Sounds_Relaxin.mp4`

The original download is 140,737,771 bytes and has no audio stream. Its creator
and original YouTube URL were not provided; no attribution is inferred.
The original download remains separate from the repository.

`stream-loop.mp4` is the full clip (49,490,964 bytes), optimized as H.264 at
1920 × 1080 / 24 fps, YUV420P, with MP4 fast-start metadata.
`stream-poster.webp` (259,786 bytes) is its first frame,
used during loading, playback errors and reduced-motion mode. No AI image or
synthetic water animation is part of this wallpaper.

Encoding settings (using the bundled ImageIO FFmpeg executable):

```sh
ffmpeg -i INPUT.mp4 -map 0:v:0 -an -vf fps=24 -c:v libx264 -preset veryfast -crf 28 -maxrate 2200k -bufsize 4400k -pix_fmt yuv420p -movflags +faststart -map_metadata -1 -threads 4 stream-loop.mp4
```

The HTML video is muted, loops inline, and has no controls or input handling.
Its source is assigned only when the water mix is selected and motion is
allowed. It pauses on another mix, page hiding, or reduced-motion preference.
The music remains entirely controlled by Aero's existing audio player.
