/**
 * VoiceChat Component
 * Modal de conversación de voz con LiveKit
 *
 * Estados:
 * - idle: No conectado
 * - connecting: Creando sesión
 * - ready: Conectado, esperando
 * - listening: Usuario hablando
 * - thinking: Agente procesando
 * - speaking: Agente respondiendo
 * - error: Error de conexión
 */

import { useState, useEffect, useRef } from "react";
import { Room, RoomEvent } from "livekit-client";
import VoiceWaveform from "./VoiceWaveform";
import { FiPhone, FiMic, FiMicOff, FiX } from "react-icons/fi";
import toast from "react-hot-toast";

interface VoiceChatProps {
  chatbotId: string;
  isOpen: boolean;
  onClose: () => void;
}

type VoiceState = "idle" | "connecting" | "ready" | "listening" | "thinking" | "speaking" | "error";

export default function VoiceChat({ chatbotId, isOpen, onClose }: VoiceChatProps) {

  const [state, setState] = useState<VoiceState>("idle");
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0); // Segundos
  const [error, setError] = useState<string | null>(null);

  const roomRef = useRef<Room | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioElementsRef = useRef<HTMLAudioElement[]>([]); // Para cleanup

  /**
   * Conectar a LiveKit cuando se abre el modal
   */
  useEffect(() => {
    if (isOpen && state === "idle") {
      connectToVoice();
    }

    // Cleanup al cerrar
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isOpen]);

  /**
   * Crear sesión y conectar a LiveKit
   */
  const connectToVoice = async () => {
    setState("connecting");
    setError(null);

    try {
      // 1. Crear sesión de voz con API (usa la voz configurada en el modal)
      const response = await fetch("/api/voice/v1?intent=create_session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // ✅ Incluir cookies de sesión
        body: JSON.stringify({
          chatbotId,
          ttsProvider: "elevenlabs", // ✅ ElevenLabs con voces mexicanas
          sttLanguage: "es",
          // ttsVoiceId se obtiene automáticamente de la integración en el backend
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          response.status === 403
            ? "Tu plan actual no incluye conversaciones de voz"
            : response.status === 402
            ? "No tienes créditos suficientes para llamadas de voz"
            : response.status === 401
            ? "Error de autenticación. Por favor, recarga la página"
            : "Error al iniciar llamada. Intenta de nuevo"
        );
      }

      const data = await response.json();
      sessionIdRef.current = data.sessionId;


      // 2. Conectar a LiveKit room
      const room = new Room();
      roomRef.current = room;

      // Escuchar eventos del room
      room.on(RoomEvent.Connected, () => {
        setState("connecting"); // ✅ Esperar a que llegue el agente
        startTimer();
      });

      room.on(RoomEvent.Disconnected, () => {
        handleDisconnect();
      });

      // ✅ Detectar cuando hay un nuevo participante (el agente)
      room.on(RoomEvent.ParticipantConnected, (participant) => {
        if (participant.identity !== room.localParticipant.identity) {
          setState("speaking"); // ✅ Agente conectado, esperando mensaje
        }
      });

      // ✅ Detectar cuando el AGENTE publica un track
      room.on(RoomEvent.TrackPublished, (publication, participant) => {
        if (publication.kind === "audio" && participant.identity !== room.localParticipant.identity) {
        }
      });

      // ✅ Detectar cuando el AGENTE habla
      room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {

        if (track.kind === "audio" && participant.identity !== room.localParticipant.identity) {
          // Agente está hablando
          setState("speaking");

          // ⚠️ CRÍTICO: Attachear el track de audio al DOM para reproducirlo
          const audioElement = track.attach();
          audioElement.autoplay = true;
          audioElement.volume = 1.0;
          audioElement.muted = false; // ✅ Asegurar que no esté muteado
          audioElement.play().catch(err => {
            console.error("❌ Error playing audio:", err);
          });
          document.body.appendChild(audioElement);
          audioElementsRef.current.push(audioElement); // Para cleanup posterior
        }
      });

      room.on(RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
        if (track.kind === "audio" && state === "speaking") {
          // Agente terminó de hablar
          setState("ready");
        }
      });

      // ✅ Detectar cuando el USUARIO habla
      room.on(RoomEvent.LocalTrackPublished, (publication) => {
        if (publication.kind === "audio") {
          setState("listening");
        }
      });

      room.on(RoomEvent.LocalTrackUnpublished, (publication) => {
        if (publication.kind === "audio" && state === "listening") {
          setState("ready");
        }
      });

      // 3. Conectar al room
      await room.connect(data.wsUrl, data.token);

      // 4. Habilitar micrófono del usuario
      await room.localParticipant.setMicrophoneEnabled(true);

    } catch (err: any) {
      console.error("❌ Error connecting to voice:", err);
      const errorMessage = err.message || "Error al conectar con el sistema de voz";
      setError(errorMessage);
      setState("error");
      // No mostrar toast, solo en el modal para evitar duplicados
    }
  };

  /**
   * Iniciar timer de duración
   */
  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setDuration((prev) => {
        const newDuration = prev + 1;

        // Advertencia a los 9 minutos
        if (newDuration === 9 * 60) {
          toast("Queda 1 minuto antes del límite de la sesión", {
            icon: "⏱️",
          });
        }

        // Auto-disconnect a los 10 minutos
        if (newDuration >= 10 * 60) {
          toast.error("Se alcanzó el límite de 10 minutos");
          handleHangup();
        }

        return newDuration;
      });
    }, 1000);
  };

  /**
   * Toggle mute/unmute
   */
  const toggleMute = async () => {
    if (!roomRef.current) return;

    const newMutedState = !isMuted;
    await roomRef.current.localParticipant.setMicrophoneEnabled(!newMutedState);
    setIsMuted(newMutedState);

    toast(newMutedState ? "Micrófono silenciado" : "Micrófono activado", {
      icon: newMutedState ? "🔇" : "🎤",
    });
  };

  /**
   * Colgar (finalizar sesión)
   */
  const handleHangup = async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    // Cleanup de audio elements
    audioElementsRef.current.forEach(el => {
      el.pause();
      el.remove();
    });
    audioElementsRef.current = [];

    // Desconectar de LiveKit
    if (roomRef.current) {
      await roomRef.current.disconnect();
      roomRef.current = null;
    }

    // Finalizar sesión en backend
    if (sessionIdRef.current) {
      try {
        await fetch(`/api/voice/v1?intent=end_session&sessionId=${sessionIdRef.current}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include", // ✅ Incluir cookies de sesión
        });

      } catch (err) {
        console.error("❌ Error ending session:", err);
      }
    }

    handleDisconnect();
  };

  /**
   * Manejar desconexión (cerrar modal)
   */
  const handleDisconnect = () => {
    setState("idle");
    setDuration(0);
    sessionIdRef.current = null;
    onClose();
  };

  /**
   * Formatear duración MM:SS
   */
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  /**
   * Texto de estado
   */
  const getStateText = (): string => {
    switch (state) {
      case "idle":
        return "No conectado";
      case "connecting":
        return "Iniciando...";
      case "ready":
        return "Te escucho...";
      case "listening":
        return "Escuchando...";
      case "thinking":
        return "Pensando...";
      case "speaking":
        return "Hablando...";
      case "error":
        return error || "Error de conexión";
      default:
        return "";
    }
  };

  // No renderizar si no está abierto
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm" style={{ zIndex: 9999 }}>
      {/* Modal - UI Simplificado */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-sm mx-4 p-6 relative">
        {/* Botón cerrar */}
        <button
          onClick={handleHangup}
          className="absolute top-3 right-3 p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          aria-label="Cerrar"
        >
          <FiX className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        </button>

        {/* Estado y Timer - Compacto */}
        <div className="text-center mb-8 mt-2">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{getStateText()}</p>
          <div className="text-5xl font-mono font-bold text-gray-900 dark:text-white">
            {formatDuration(duration)}
          </div>
        </div>

        {/* Waveform */}
        <div className="mb-8">
          <VoiceWaveform isActive={state === "listening" || state === "speaking"} />
        </div>

        {/* Controles - Simplificados */}
        <div className="flex items-center justify-center gap-6">
          {/* Mute/Unmute */}
          <button
            onClick={toggleMute}
            disabled={state !== "ready" && state !== "listening" && state !== "speaking"}
            className={`p-4 rounded-full transition-all shadow-lg ${
              isMuted
                ? "bg-red-500 text-white hover:bg-red-600"
                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            aria-label={isMuted ? "Activar micrófono" : "Silenciar micrófono"}
          >
            {isMuted ? <FiMicOff className="w-6 h-6" /> : <FiMic className="w-6 h-6" />}
          </button>

          {/* Hang up - Más grande */}
          <button
            onClick={handleHangup}
            disabled={state === "idle" || state === "connecting"}
            className="p-5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Colgar"
          >
            <FiPhone className="w-7 h-7 transform rotate-135" />
          </button>
        </div>

        {/* Error state */}
        {state === "error" && (
          <div className="mt-6 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            <button
              onClick={connectToVoice}
              className="mt-2 text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-medium"
            >
              Reintentar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
