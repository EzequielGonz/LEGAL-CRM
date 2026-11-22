# Modelos 3D de la Oficina · fuentes y licencias

Todos los archivos de `public/modelos/oficina/` son de dominio público (CC0 1.0). Se descargaron de
espejos en GitHub, se comprobó el archivo de licencia del autor en cada espejo, y se recomprimieron con
glTF-Transform (meshopt, cuantización, sin animaciones repetidas). No se pagó nada.

| Archivo | Qué es | Autor | Licencia | Espejo de donde se bajó |
|---|---|---|---|---|
| `oficina/muebles.glb` | 60 piezas del *Furniture Kit 2.1* (escritorios, sillas, bibliotecas, plantas, sillones, cocina, heladera, banquetas, alfombras, lámparas, etc.), juntas en un archivo, una pieza por nodo | Kenney (www.kenney.nl) | CC0 1.0 (`License.txt` del kit: «Creative Commons Zero, CC0») | `github.com/series-ai/jam-ready-assets` → `kenney-furniture-kit/3D/interior-furniture/Models/GLTF format/` |
| `oficina/casual_male.glb`, `casual_female.glb`, `suit_male.glb`, `suit_female.glb`, `worker_female.glb`, `casual2_male.glb` | Personajes low-poly con esqueleto (sin animaciones adentro) | Quaternius (quaternius.com) | CC0 1.0 (`License.txt` del pack: «CC0 1.0 Universal, Public Domain Dedication») | `github.com/BMOxOMB/Proyecto_ProgramacionConPatrones` → `Assets/Characters/Ultimate Animated Character Pack - Nov 2019/glTF/` |
| `oficina/animaciones.glb` | Animaciones compartidas por todos los personajes (Idle, Walk, Walk_Carry, SitDown, Victory, PickUp), sobre el esqueleto de `Casual_Male` | Quaternius | CC0 1.0 | mismo espejo |

Lo que el kit no trae (mesa de pool, tabiques de cubículos, monitores encendidos, lámparas colgantes,
pizarras, ventanas con persianas, árboles, faroles) está modelado en código en
`src/components/cerebro/oficina-reel-mundo.tsx`. Las texturas de pisos y pantallas se dibujan en el
navegador (sin archivos de terceros).
