# Loopsy Doopsy Compatible

An experimental, smaller eight-pad voice looper based on [Loopsy Doopsy](https://github.com/deepbreathin/loopsydoopsy). No framework, build process, server, account, analytics, animated waveform or external runtime dependencies. The audio engine and its phone-specific safeguards come from the original; the interface and feature set are deliberately smaller.

Tap an empty pad, allow the microphone, wait for the count-in, and sing. Loops play together; tap a recorded pad to start or stop it. Choose the next loop length and tempo before recording. Download each pad as WAV to keep it; the board is saved in this browser's storage, which the browser can erase. Headphones reduce speaker bleed. Keep the app in the foreground.

Serve `www/` over HTTPS or localhost. For example `python3 -m http.server --directory www` and open localhost. On supported devices use the browser's Add to Home Screen / Install option. The app shell is cached after the first visit for offline use. Bump the cache version in `www/sw.js` on every release. GitHub Pages can serve the `www` directory through the included workflow.

Recording needs microphone permission, Web Audio and AudioWorklet in a secure context. Some old browsers/devices cannot support these, and installation and audio routing differ across platforms. Background recording is not supported. This is an experiment, not a guarantee of compatibility on every device. Bluetooth and speaker monitoring can add latency or bleed.

This version omits trim, projects, importing, mix recording, one-shots and backups. It does not access the original app's storage. The WAV files include the original app's tempo metadata. See the original project for the full feature set.

Run `npm test` for inherited timing and engine tests. Real device testing is still needed, particularly iOS Safari and older Android devices.
