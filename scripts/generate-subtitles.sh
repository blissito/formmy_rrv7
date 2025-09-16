#!/bin/bash

# Generador de subtítulos sincronizados con TTS
# Genera SRT y FCPXML para Final Cut Pro

TEXT="$1"
OUTPUT_BASE="${2:-subtitles}"
WORDS_PER_SUBTITLE=8  # Palabras por subtítulo
CHARS_PER_SECOND=15   # Velocidad de lectura promedio

# Función para convertir segundos a formato SRT (HH:MM:SS,mmm)
seconds_to_srt() {
  local total_seconds=$1
  local hours=$(printf "%.0f" $(echo "$total_seconds / 3600" | bc -l))
  local minutes=$(printf "%.0f" $(echo "($total_seconds % 3600) / 60" | bc -l))
  local seconds=$(echo "$total_seconds % 60" | bc -l)
  local ms=$(echo "($seconds - ${seconds%.*}) * 1000" | bc -l | cut -d. -f1)
  local sec_int=$(printf "%.0f" ${seconds%.*})
  printf "%02d:%02d:%02d,%03d" $hours $minutes $sec_int ${ms:-0}
}

# Función para generar SRT
generate_srt() {
  local text="$1"
  local output="$2.srt"

  echo "📝 Generando subtítulos SRT..."

  # Dividir texto en chunks
  local words=($text)
  local total_words=${#words[@]}
  local current_time=0
  local subtitle_index=1

  > "$output"  # Limpiar archivo

  for ((i=0; i<$total_words; i+=$WORDS_PER_SUBTITLE)); do
    # Obtener palabras para este subtítulo
    local subtitle_text=""
    local word_count=0

    for ((j=i; j<i+$WORDS_PER_SUBTITLE && j<$total_words; j++)); do
      subtitle_text="$subtitle_text ${words[$j]}"
      ((word_count++))
    done

    # Calcular duración basada en caracteres
    local char_count=${#subtitle_text}
    local duration=$(echo "scale=2; $char_count / $CHARS_PER_SECOND" | bc)

    # Tiempos de inicio y fin
    local start_time=$(seconds_to_srt $current_time)
    current_time=$(echo "$current_time + $duration" | bc)
    local end_time=$(seconds_to_srt $current_time)

    # Escribir entrada SRT
    echo "$subtitle_index" >> "$output"
    echo "$start_time --> $end_time" >> "$output"
    echo "$subtitle_text" | sed 's/^ //' >> "$output"
    echo "" >> "$output"

    ((subtitle_index++))
  done

  echo "✅ SRT generado: $output"
}

# Función para generar FCPXML para Final Cut Pro
generate_fcpxml() {
  local text="$1"
  local output="$2.fcpxml"
  local srt_file="$2.srt"

  echo "🎬 Generando FCPXML para Final Cut Pro..."

  cat > "$output" <<'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE fcpxml>
<fcpxml version="1.10">
  <resources>
    <format id="r1" name="FFVideoFormat1080p30" frameDuration="1001/30000s" width="1920" height="1080"/>
  </resources>
  <library>
    <event name="TTS Subtitles">
      <project name="Subtitles">
        <sequence format="r1" duration="30s">
          <spine>
EOF

  # Leer SRT y convertir a títulos FCPXML
  local index=1
  local last_end=0

  while IFS= read -r line1 && IFS= read -r line2 && IFS= read -r line3 && IFS= read -r line4; do
    if [[ "$line1" =~ ^[0-9]+$ ]]; then
      # Parsear tiempos del SRT
      local start_time=$(echo "$line2" | cut -d' ' -f1 | sed 's/,/./g' | awk -F: '{ print ($1 * 3600) + ($2 * 60) + $3 }')
      local end_time=$(echo "$line2" | cut -d' ' -f3 | sed 's/,/./g' | awk -F: '{ print ($1 * 3600) + ($2 * 60) + $3 }')
      local duration=$(echo "$end_time - $start_time" | bc)

      # Convertir a frames (30fps)
      local offset_frames=$(echo "$start_time * 30" | bc | cut -d. -f1)
      local duration_frames=$(echo "$duration * 30" | bc | cut -d. -f1)

      # Agregar título al FCPXML con ID único
      cat >> "$output" <<EOF
            <title offset="${offset_frames}/30s" duration="${duration_frames}/30s" name="Subtitle ${index}">
              <text>
                <text-style ref="ts${index}">$line3</text-style>
              </text>
              <text-style-def id="ts${index}">
                <text-style font="Helvetica" fontSize="60" fontColor="1 1 1 1" alignment="center"/>
              </text-style-def>
            </title>
EOF
      ((index++))
    fi
  done < "$srt_file"

  # Cerrar FCPXML
  cat >> "$output" <<'EOF'
          </spine>
        </sequence>
      </project>
    </event>
  </library>
</fcpxml>
EOF

  echo "✅ FCPXML generado: $output"
}

# Función principal
main() {
  if [ -z "$TEXT" ]; then
    echo "❌ Error: No se proporcionó texto"
    echo "Uso: $0 \"tu texto\" [nombre_salida]"
    exit 1
  fi

  # Generar ambos formatos
  generate_srt "$TEXT" "$OUTPUT_BASE"
  generate_fcpxml "$TEXT" "$OUTPUT_BASE"

  echo ""
  echo "📋 Instrucciones para Final Cut Pro:"
  echo "1. Abre Final Cut Pro"
  echo "2. File → Import → XML..."
  echo "3. Selecciona: $OUTPUT_BASE.fcpxml"
  echo "4. Los subtítulos aparecerán como títulos en la timeline"
  echo ""
  echo "📋 Para usar el SRT directamente:"
  echo "1. Importa tu video a Final Cut"
  echo "2. Selecciona el clip en la timeline"
  echo "3. Modify → Captions → Import Captions..."
  echo "4. Selecciona: $OUTPUT_BASE.srt"
  echo "5. Elige 'CEA-608' o 'ITT' como formato"
}

# Ejecutar
main