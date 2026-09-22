# Deriva

Juego de longboard para el navegador, hecho con Three.js. Son 2,4 km de bajada inspirados en la Quebrada de Humahuaca (Jujuy, Argentina): una cuesta con pircas y cardones y un pueblo de adobe en damero con plaza e iglesia. Tiene carving, conos, coleccionables y tres ambientes de luz. Todo el arte del escenario se pintó con IA generativa en ComfyUI.

![Calle principal del pueblo en el juego](docs/img/game/pueblo.jpg)

## Caso de estudio

En `docs/` hay tres reportes en HTML que documentan el proceso:

- [`docs/index.html`](docs/index.html): resumen del caso, con el antes y el después.
- [`docs/escenarios.html`](docs/escenarios.html): cómo se construyeron los escenarios (trama urbana, terreno, niebla, panorama).
- [`docs/assets.html`](docs/assets.html): cómo se crearon los assets con IA (workflows de ComfyUI, prompts, comparativa de modelos, posproceso y costos).

La bitácora completa, imagen por imagen, está en [`art/GENAI-LOG.md`](art/GENAI-LOG.md).

## Ejecutar

Requiere Node.js. No hay dependencias que instalar: Three.js viene incluido en `dist/vendor`.

```bash
npm run dev
```

Después, abrir http://127.0.0.1:5173.

Para revisar un tramo sin recorrer toda la bajada, agregar `?desde=<metros>` a la URL. Por ejemplo, `http://127.0.0.1:5173/?desde=1100` arranca en el pueblo.

## Controles

- Flechas izquierda/derecha o A/D: carving.
- Flecha arriba o W: impulso.
- Espacio, flecha abajo o S: slide/freno.
- P o Escape: pausa. R: reiniciar.
- En pantallas chicas hay controles táctiles.
- Los botones de arriba cambian la luz, la cámara y el sonido sintetizado.

## Estructura

| Ruta | Contenido |
|---|---|
| `dist/game.js` | Mundo, ruta, conducción, cámara e interfaz. |
| `dist/town.js` | Pueblo en damero: manzanas, calles de tierra, plaza, iglesia y puestos rurales, todo instanciado. |
| `dist/scenery.js` | Suelo pintado y sprites de árboles y arbustos. |
| `dist/walls.js` | Pircas junto a la ruta, cortadas donde empieza el pueblo. |
| `dist/city-backdrop.js` | Panorama de fondo y niebla que se disuelve en él. |
| `dist/assets/` | Texturas y sprites optimizados (JPG y WebP) con sus `manifest.json`. |
| `art/` | Workflows de ComfyUI en formato API, los generadores de workflows (`comfyui-gen.mjs`, `comfyui-jujuy.mjs`) y la bitácora. |
| `docs/` | Reportes del caso de estudio. |
| `tests/` | Pruebas de la lógica de coleccionables (`node tests/collection.test.mjs`). |

La conducción es arcade: la tabla sigue el eje de la ruta con un desplazamiento lateral, sin simular física de tabla rígida. Si no encuentra los `manifest.json` de assets, el juego usa volúmenes y colores de respaldo.

## Regenerar el arte

Los workflows de `art/*/comfyui/*.api.json` se pueden cargar en ComfyUI (local o Comfy Cloud). Usan el nodo `GeminiImage2Node`, que forma parte del núcleo de ComfyUI y requiere una cuenta de comfy.org con créditos. Las imágenes de referencia hay que volver a cargarlas en los nodos `LoadImage`. Los originales PNG de cada generación no están en el repo por su tamaño; `dist/assets` tiene las versiones optimizadas.

## Licencia

- **Código:** MIT (ver [`LICENSE`](LICENSE)).
- **Arte:** CC BY 4.0 (ver [`LICENSE-ASSETS.md`](LICENSE-ASSETS.md)).
- **Three.js v0.180.0:** MIT (ver `dist/vendor/LICENSE`).
