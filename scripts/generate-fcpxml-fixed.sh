#!/bin/bash

# Generador de FCPXML correcto para Final Cut Pro
TEXT="$1"
OUTPUT="${2:-subtitles}.fcpxml"
WORDS_PER_SUBTITLE=3

echo "🎬 Generando FCPXML para Final Cut Pro (formato correcto)..."

# Crear FCPXML con estructura simplificada que funciona
cat > "$OUTPUT" <<'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE fcpxml>
<fcpxml version="1.10">
  <resources>
    <format id="r1" name="TikTokVertical" frameDuration="1001/30000s" width="1080" height="1920"/>
    <effect id="r2" name="Basic Title" uid=".../Titles.localized/Build In:Out.localized/Basic Title.localized/Basic Title.moti"/>
  </resources>
  <library>
    <event name="TTS Subtitles">
      <project name="Subtitles">
        <sequence format="r1" duration="45s" tcStart="0s">
          <spine>
EOF

# Dividir texto en subtítulos
words=($TEXT)
total_words=${#words[@]}
current_frame=0
subtitle_index=1

for ((i=0; i<$total_words; i+=$WORDS_PER_SUBTITLE)); do
  # Obtener palabras para este subtítulo
  subtitle_text=""

  for ((j=i; j<i+$WORDS_PER_SUBTITLE && j<$total_words; j++)); do
    subtitle_text="$subtitle_text ${words[$j]}"
  done

  # Duración: 1.5 segundos = 45 frames (a 30fps)
  duration_frames=45

  # Usar estructura correcta con ref al efecto
  cat >> "$OUTPUT" <<EOF
            <title ref="r2" offset="${current_frame}/30s" duration="${duration_frames}/30s" name="Subtitle ${subtitle_index}">
              <text>${subtitle_text# }</text>
            </title>
EOF

  current_frame=$((current_frame + duration_frames))
  ((subtitle_index++))
done

# Cerrar FCPXML
cat >> "$OUTPUT" <<'EOF'
          </spine>
        </sequence>
      </project>
    </event>
  </library>
</fcpxml>
EOF

echo "✅ FCPXML generado: $OUTPUT"
echo ""
echo "📋 Para importar en Final Cut Pro:"
echo "1. File → Import → XML..."
echo "2. Selecciona: $OUTPUT"
echo "3. Los subtítulos aparecerán como títulos básicos"
echo "4. Puedes cambiar estilo después en el Inspector"
echo ""
echo "💡 Formato simplificado sin errores de validación DTD"