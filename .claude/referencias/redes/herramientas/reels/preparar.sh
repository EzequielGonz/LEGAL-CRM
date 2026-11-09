#!/bin/bash
# Prepara la carpeta de trabajo: fuentes de Google Fonts (licencia OFL) y logos del proyecto.
cd "$(dirname "$0")"; mkdir -p fonts logos reels aud
cp ../../logos/*.png logos/
UA="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0 Safari/537.36"
baja(){ curl -s -A "$UA" "https://fonts.googleapis.com/css2?family=$1" | grep -o "https://fonts.gstatic.com[^)]*" | head -1; }
curl -s -o fonts/PlayfairDisplay.ttf "$(curl -s "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400..900" | grep -o 'https://[^)]*' | head -1)"
curl -s -o fonts/PlayfairDisplay-Italic.ttf "$(curl -s "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@1,400..900" | grep -o 'https://[^)]*' | head -1)"
curl -s -o fonts/Manrope.ttf "$(curl -s "https://fonts.googleapis.com/css2?family=Manrope:wght@200..800" | grep -o 'https://[^)]*' | head -1)"
for w in 500 700 800 900; do curl -s -o fonts/Archivo-$w.ttf "$(curl -s "https://fonts.googleapis.com/css2?family=Archivo:wght@$w" | grep -o 'https://[^)]*' | head -1)"; done
for w in 400 500 600 700 800; do
  curl -s -o fonts/PlusJakartaSans-W$w.ttf "$(curl -s "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@$w" | grep -o 'https://[^)]*' | head -1)"
  curl -s -o fonts/Outfit-W$w.ttf "$(curl -s "https://fonts.googleapis.com/css2?family=Outfit:wght@$w" | grep -o 'https://[^)]*' | head -1)"
done
pip install -q edge-tts numpy 2>/dev/null; ls fonts | wc -l
