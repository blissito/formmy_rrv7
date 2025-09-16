#!/bin/bash

# CLI para Google Text-to-Speech
# Uso: ./generate-tts.sh [opciones]

# Cargar API key del .env
if [ -f .env ]; then
  export $(grep -E '^GOOGLE_API_KEY=' .env | xargs)
fi

# Valores por defecto
TEXT=""
VOICE="es-US-Neural2-A"  # Voz femenina por defecto
OUTPUT="tts-output.mp3"
LIST_VOICES=false
SPEAKING_RATE=1.0
PITCH=0
GENERATE_SUBS=false

# Voces disponibles en español
declare -A VOICES=(
  ["mujer-a"]="es-US-Neural2-A"
  ["hombre-b"]="es-US-Neural2-B"
  ["hombre-c"]="es-US-Neural2-C"
  ["mujer-premium"]="es-US-Studio-B"
  ["mujer-wavenet"]="es-US-Wavenet-A"
  ["hombre-wavenet"]="es-US-Wavenet-B"
  ["mujer-standard"]="es-US-Standard-A"
  ["hombre-standard"]="es-US-Standard-B"
)

# Función para mostrar ayuda
show_help() {
  echo "🎤 Google Text-to-Speech CLI"
  echo ""
  echo "Uso: $0 [opciones]"
  echo ""
  echo "Opciones:"
  echo "  -t, --text <texto>      Texto a convertir en voz"
  echo "  -f, --file <archivo>    Leer texto desde archivo"
  echo "  -v, --voice <voz>       Seleccionar voz (ver -l para lista)"
  echo "  -o, --output <archivo>  Archivo de salida (default: tts-output.mp3)"
  echo "  -r, --rate <velocidad>  Velocidad del habla (0.25 a 4.0, default: 1.0)"
  echo "  -p, --pitch <tono>      Tono de voz (-20 a 20, default: 0)"
  echo "  -s, --subtitles         Generar subtítulos SRT y FCPXML"
  echo "  -l, --list              Listar voces disponibles"
  echo "  -h, --help              Mostrar esta ayuda"
  echo ""
  echo "Ejemplos:"
  echo "  $0 -t 'Hola mundo' -v hombre-b"
  echo "  $0 -f script.txt -v mujer-premium -o narration.mp3"
  echo "  $0 -l"
}

# Función para listar voces
list_voices() {
  echo "🗣️ Voces disponibles en español:"
  echo ""
  echo "ID              | Tipo      | Descripción"
  echo "----------------|-----------|----------------------------------"
  echo "mujer-a         | Neural    | Voz femenina neural (recomendada)"
  echo "hombre-b        | Neural    | Voz masculina neural"
  echo "hombre-c        | Neural    | Voz masculina neural alternativa"
  echo "mujer-premium   | Studio    | Voz femenina premium (alta calidad)"
  echo "mujer-wavenet   | WaveNet   | Voz femenina WaveNet"
  echo "hombre-wavenet  | WaveNet   | Voz masculina WaveNet"
  echo "mujer-standard  | Standard  | Voz femenina estándar"
  echo "hombre-standard | Standard  | Voz masculina estándar"
  echo ""
  echo "💡 Tip: Las voces Neural y Studio tienen mejor calidad"
}

# Parsear argumentos
while [[ $# -gt 0 ]]; do
  case $1 in
    -t|--text)
      TEXT="$2"
      shift 2
      ;;
    -f|--file)
      if [ -f "$2" ]; then
        TEXT=$(cat "$2")
      else
        echo "❌ Error: Archivo '$2' no encontrado"
        exit 1
      fi
      shift 2
      ;;
    -v|--voice)
      if [[ -n "${VOICES[$2]}" ]]; then
        VOICE="${VOICES[$2]}"
      else
        echo "❌ Error: Voz '$2' no válida. Usa -l para ver opciones"
        exit 1
      fi
      shift 2
      ;;
    -o|--output)
      OUTPUT="$2"
      shift 2
      ;;
    -r|--rate)
      SPEAKING_RATE="$2"
      shift 2
      ;;
    -p|--pitch)
      PITCH="$2"
      shift 2
      ;;
    -s|--subtitles)
      GENERATE_SUBS=true
      shift
      ;;
    -l|--list)
      list_voices
      exit 0
      ;;
    -h|--help)
      show_help
      exit 0
      ;;
    *)
      echo "❌ Opción desconocida: $1"
      echo "Usa -h para ver ayuda"
      exit 1
      ;;
  esac
done

# Verificar que hay texto para procesar
if [ -z "$TEXT" ]; then
  echo "❌ Error: No se proporcionó texto"
  echo "Usa -t 'tu texto' o -f archivo.txt"
  echo "Usa -h para ver ayuda"
  exit 1
fi

# Verificar API key
if [ -z "$GOOGLE_API_KEY" ]; then
  echo "❌ Error: GOOGLE_API_KEY no configurada en .env"
  exit 1
fi

# Crear JSON request
cat > /tmp/tts-request.json <<EOF
{
  "input": {
    "text": "$TEXT"
  },
  "voice": {
    "languageCode": "es-US",
    "name": "$VOICE"
  },
  "audioConfig": {
    "audioEncoding": "MP3",
    "speakingRate": $SPEAKING_RATE,
    "pitch": $PITCH
  }
}
EOF

echo "🎤 Generando audio con voz: $VOICE"
echo "📝 Texto: $(echo "$TEXT" | head -c 50)..."
echo "⚙️  Velocidad: $SPEAKING_RATE | Tono: $PITCH"

# Hacer petición a Google TTS
response=$(curl -s -X POST \
  "https://texttospeech.googleapis.com/v1/text:synthesize?key=$GOOGLE_API_KEY" \
  -H "Content-Type: application/json" \
  -d @/tmp/tts-request.json)

# Verificar errores
if echo "$response" | grep -q "error"; then
  echo "❌ Error en la API:"
  echo "$response" | jq '.error.message' 2>/dev/null || echo "$response"
  rm /tmp/tts-request.json
  exit 1
fi

# Decodificar y guardar audio
echo "$response" | jq -r '.audioContent' | base64 --decode > "$OUTPUT"

# Verificar que se generó el archivo
if [ -s "$OUTPUT" ]; then
  size=$(ls -lh "$OUTPUT" | awk '{print $5}')
  echo "✅ Audio generado exitosamente: $OUTPUT"
  echo "📊 Tamaño: $size"
  echo ""
  echo "🎧 Reproduce con: afplay $OUTPUT"
else
  echo "❌ Error: No se pudo generar el audio"
  exit 1
fi

# Generar subtítulos si se solicitó
if [ "$GENERATE_SUBS" = true ]; then
  echo ""
  echo "🎬 Generando subtítulos..."

  # Obtener nombre base sin extensión
  base_name="${OUTPUT%.*}"

  # Llamar al generador de subtítulos
  bash scripts/generate-subtitles.sh "$TEXT" "$base_name"
fi

# Limpiar archivos temporales
rm -f /tmp/tts-request.json