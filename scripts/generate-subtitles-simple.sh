#!/bin/bash

# Generador simple de subtítulos SRT sincronizados
TEXT="$1"
OUTPUT_BASE="${2:-subtitles}"
WORDS_PER_SUBTITLE=3  # Para TikTok: 2-3 palabras máximo
DURATION_PER_SUBTITLE=1500  # 1.5 segundos por subtítulo

generate_srt() {
  local text="$1"
  local output="$2.srt"

  echo "📝 Generando subtítulos SRT..."

  # Dividir texto en palabras
  local words=($text)
  local total_words=${#words[@]}
  local current_ms=0
  local subtitle_index=1

  > "$output"

  for ((i=0; i<$total_words; i+=$WORDS_PER_SUBTITLE)); do
    # Obtener palabras para este subtítulo
    local subtitle_text=""
    local word_count=0

    for ((j=i; j<i+$WORDS_PER_SUBTITLE && j<$total_words; j++)); do
      subtitle_text="$subtitle_text ${words[$j]}"
      ((word_count++))
    done

    # Usar duración fija optimizada para TikTok
    local duration_ms=$DURATION_PER_SUBTITLE

    # Calcular tiempos
    local start_ms=$current_ms
    local end_ms=$((current_ms + duration_ms))

    # Convertir a formato SRT
    local start_h=$((start_ms / 3600000))
    local start_m=$(((start_ms % 3600000) / 60000))
    local start_s=$(((start_ms % 60000) / 1000))
    local start_ms_part=$((start_ms % 1000))

    local end_h=$((end_ms / 3600000))
    local end_m=$(((end_ms % 3600000) / 60000))
    local end_s=$(((end_ms % 60000) / 1000))
    local end_ms_part=$((end_ms % 1000))

    # Escribir entrada SRT
    printf "%d\n" $subtitle_index >> "$output"
    printf "%02d:%02d:%02d,%03d --> %02d:%02d:%02d,%03d\n" \
      $start_h $start_m $start_s $start_ms_part \
      $end_h $end_m $end_s $end_ms_part >> "$output"
    echo "${subtitle_text# }" >> "$output"
    echo "" >> "$output"

    current_ms=$end_ms
    ((subtitle_index++))
  done

  echo "✅ SRT generado: $output"
}

# Generar solo SRT por ahora
generate_srt "$TEXT" "$OUTPUT_BASE"

echo ""
echo "📋 Para usar en Final Cut Pro:"
echo "1. Importa tu video a Final Cut"
echo "2. Selecciona el clip en la timeline"
echo "3. Modify → Captions → Import Captions..."
echo "4. Selecciona: $OUTPUT_BASE.srt"
echo "5. Formato: CEA-608"
echo ""
echo "📋 Para CapCut/DaVinci Resolve:"
echo "- Importa directamente el archivo SRT"
echo "- Ajusta posición y estilo según necesites"