import { createRef, useEffect } from "react";

export default function SilenceCutter() {
  const mr = createRef<MediaRecorder>();

  useEffect(() => {
    function detectSilence(
      stream: MediaStream,
      onSoundEnd = () => {},
      onSoundStart = () => {},
      silence_delay = 500,
      // min_decibels = -80
      min_decibels = -45
    ) {
      const ctx = new AudioContext();
      const analyser = ctx.createAnalyser();
      const streamNode = ctx.createMediaStreamSource(stream);
      streamNode.connect(analyser);
      analyser.minDecibels = min_decibels;

      const data = new Uint8Array(analyser.frequencyBinCount); // will hold our data
      let silence_start = performance.now();
      let triggered = false; // trigger only once per silence event

      function loop(time = 0) {
        requestAnimationFrame(loop); // we'll loop every 60th of a second to check
        analyser.getByteFrequencyData(data); // get current data
        if (data.some((v) => v)) {
          // if there is data above the given db limit
          if (triggered) {
            triggered = false;
            onSoundStart();
          }
          silence_start = time; // set it to now
        }
        if (!triggered && time - silence_start > silence_delay) {
          onSoundEnd();
          triggered = true;
        }
      }
      loop();
    }

    function onSilence() {}
    function onSpeak() {}
    navigator.mediaDevices
      .getUserMedia({
        audio: true,
      })
      .then((stream) => {
        detectSilence(stream, onSilence, onSpeak);
        // do something else with the stream
      })
      .catch(console.error);
    /* eslint-disable */
  }, []);

  return (
    <button
      onClick={() => {
        if (mr.current?.state === "recording") {
          mr.current.stop();
        }
      }}
    >
      Detener
    </button>
  );
}
