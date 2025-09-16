#!/bin/bash

# Generador de subtítulos FCPXML para Final Cut Pro
TEXT="$1"
OUTPUT="${2:-subtitles}.fcpxml"
WORDS_PER_SUBTITLE=3  # Perfecto para TikTok vertical

echo "🎬 Generando FCPXML para Final Cut Pro..."

# Crear header del FCPXML
cat > "$OUTPUT" <<'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE fcpxml>
<fcpxml version="1.10">
  <resources>
    <format id="r1" name="TikTokVertical" frameDuration="1001/30000s" width="1080" height="1920"/>
    <effect id="TextEffect" name="Basic Title" uid=".../Titles.localized/Build In:Out.localized/Basic Title.localized/Basic Title.moti"/>
  </resources>
  <library>
    <event name="TTS Subtitles">
      <project name="Subtitles">
        <sequence format="r1" duration="30s" tcStart="0s">
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

  # Duración más corta para TikTok: 1.5 segundos = 45 frames (a 30fps)
  duration_frames=45

  # Agregar título estilo TikTok (más grande, centrado)
  cat >> "$OUTPUT" <<EOF
            <title offset="${current_frame}/30s" duration="${duration_frames}/30s" name="TikTok Subtitle ${subtitle_index}">
              <param name="Position" key="9999/999166631/999166633/1/100/101" value="0 400"/>
              <text>
                <text-style font="Helvetica Neue" fontSize="96" fontFace="Bold" fontColor="1 1 1 1" alignment="center" strokeColor="0 0 0 1" strokeWidth="8">${subtitle_text# }</text-style>
              </text>
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
echo "3. Los subtítulos aparecerán como títulos en la timeline"
echo ""
echo "💡 Tips:"
echo "- Puedes ajustar posición, fuente y estilo de cada título"
echo "- Para cambiar todos a la vez: selecciona todos + Inspector"
echo "- Posición recomendada: Y = -400 (parte inferior)"