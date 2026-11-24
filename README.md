# Loopsy Doopsy Compatible

An experimental low-overhead version of [Loopsy Doopsy](https://github.com/deepbreathin/loopsydoopsy), served separately at <https://deepbreathin.github.io/loopsy-doopsy-compatible/>. It uses the original audio engine but replaces continuously animated pad waveforms with static text and state changes. The trim editor refreshes its playhead five times a second only while open. MP3 encoding starts only when requested. These choices are intended to reduce competition with audio; they have not established the cause of crackle on any particular device.

The app has eight synchronized pads, loop lengths and tempo, one-shots, per-pad volume, trim and silence, mic options and calibration, recordings with or without voice, soundboards, WAV and MP3 export, file import and `.loopsy` backups. Tap an empty pad to record, then tap to play or stop. Headphones reduce speaker bleed. Keep the app open while recording. Browser storage can be cleared; download or back up sounds you want to keep.

The first Compatible prototype's saved board is imported once as **My compatible loops**; the original prototype data is left in place. This app uses its own storage and service-worker cache. The original app and its site are separate. A browser may need a refresh or a full close and reopen to install the new version.

## Run and test

Serve `www/` over HTTPS or localhost (`npm start` uses the workspace's reserved port 8224). The microphone, AudioWorklet and offline installation require a secure context and browser support. On supported devices use Add to Home Screen / Install. Some older devices and browsers cannot support the required audio APIs. Mobile audio routing, latency and background behaviour vary. Real device testing remains essential.

`npm test` runs unit tests. With Playwright installed and a Chromium browser available, `npm run test:e2e` exercises recording and the main workflows with a simulated microphone; `node test/migration.mjs` checks the prototype board migration and `node test/pwa.mjs` checks offline reload and cache isolation. Both bind port 8224 and should run separately. GitHub Actions tests and publishes the static `www/` directory; it stamps each release so the offline cache updates.
