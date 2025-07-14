import { useRef, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";

type RoomParams = {
  roomId: string;
};

const isRecordingSupported =
  !!navigator.mediaDevices &&
  typeof navigator.mediaDevices.getUserMedia === "function" &&
  typeof window.MediaRecorder === "function";

export function RecordRoomAudio() {
  const [isRecording, setIsRecording] = useState(false);
  const recorder = useRef<MediaRecorder | null>(null);
  const params = useParams<RoomParams>();
  const intervalRef = useRef<NodeJS.Timeout>(null);

  if (!params.roomId) {
    return <Navigate replace to="/" />;
  }

  async function uploadAudio(audio: Blob) {
    const formData = new FormData();

    formData.append("file", audio, "audio.webm");

    const response = await fetch(
      `http://localhost:3333/rooms/${params.roomId}/audio`,
      {
        method: "POST",
        body: formData,
      }
    );

    const result = await response.json();

    // biome-ignore lint/suspicious/noConsole: asd
    console.log(result);
  }

  function stopRecording() {
    setIsRecording(false);

    if (recorder?.current && recorder.current.state !== "inactive") {
      recorder.current.stop();
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  }

  function createRecorder(audio: MediaStream) {
    recorder.current = new MediaRecorder(audio, {
      mimeType: "audio/webm",
      audioBitsPerSecond: 64_000,
    });

    recorder.current.ondataavailable = (event) => {
      if (event.data.size > 0) {
        uploadAudio(event.data);
      }
    };

    recorder.current.start();
  }

  async function startRecording() {
    if (!isRecordingSupported) {
      alert("Seu navegador nao suporta gravação de audio");
      return;
    }

    setIsRecording(true);

    const audio = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        sampleRate: 44_100,
      },
    });

    createRecorder(audio);

    intervalRef.current = setInterval(() => {
      recorder.current?.stop();

      createRecorder(audio);
    }, 5000);
  }

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-3">
      {isRecording ? (
        <Button onClick={stopRecording}>Pausar gravação</Button>
      ) : (
        <Button onClick={startRecording}>Gravar Áudio</Button>
      )}
      {isRecording ? <p>Gravando...</p> : <p>Pausado</p>}
    </div>
  );
}
