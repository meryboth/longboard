# Casas pintadas: pipeline ComfyUI + Nano Banana Pro

Las casas siguen siendo volúmenes 3D (caja 7 × 7 × 9 m y techo a cuatro aguas). Solo cambia la piel: cada cara lleva una fachada pintada en vista ortográfica. Así se conservan la paralaje, las sombras y los tres ambientes de luz.

## Workflow

`comfyui/deriva-house-facades.api.json` (formato API). También está guardado en Comfy Cloud como `deriva-house-facades`.

```
panorama ─┐
          ├─ Batch ─► Nano Banana Pro · FRENTE (1:1) ─┬─► house_front.png
mural ────┘                                           │
                     Nano Banana Pro · LATERAL (4:3) ◄┘─► house_side.png
```

- **Estilo global (fijo):** paleta, pincelada, reglas de textura: ortográfica, pared de borde a borde, sin cielo ni suelo ni texto, luz plana.
- **Variante de casa (editar):** material y colores de cada casa. Es lo único que cambia entre corridas, junto con las semillas.
- El lateral recibe el frente como referencia, así las dos caras quedan del mismo edificio.
- Costo aproximado: 34 créditos por imagen, unos 68 por casa.

Los nodos `GeminiImage2Node` son nodos de socio del núcleo de ComfyUI: el mismo JSON funciona en ComfyUI local con sesión de comfy.org iniciada. Hay que volver a cargar las dos referencias en los `LoadImage`.

## Variantes previstas

| id | variante |
|----|----------|
| a | chapa ondulada teal desteñida, marcos crema, puerta terracota, bordes oxidados |
| b | estuco ocre cálido, molduras blancas, postigos verdes de madera |
| c | revoque terracota con parches, cornisa crema, puerta teal |
| d | rosa pastel, marcos lila, balcones crema con baranda de hierro |
| e | planta baja crema, planta alta de tablas azul desteñido |
| f | chapa verde salvia con chorreaduras de óxido y detalles ocre |

## Integración

1. Guardar el PNG original en `art/houses/source/` y convertirlo a JPG para el juego: `ffmpeg -i source/house-<id>-front.png -q:v 3 ../../dist/assets/houses/house-<id>-front.jpg` (lo mismo para `-side`).
2. Listarlas en `dist/assets/houses/manifest.json`:
   ```json
   {"variants":[{"id":"a","front":"house-a-front.jpg","side":"house-a-side.jpg","roof":"#936e59"}]}
   ```
3. `dist/houses.js` lee el manifiesto. Si no existe, quedan las casas procedurales de antes. El orden de `rand()` no cambia, así que conos y coleccionables quedan en el mismo lugar.

## Estado

- Variantes a–h generadas e integradas. Workflows por variante en `comfyui/nb-house-<id>.api.json`, generados por `art/comfyui-gen.mjs`.
- La d trajo un marco teal: se recortó 2,5 % por lado antes de exportar el JPG.
- Tres filas por lado (649 casas) con `InstancedMesh`: 16 draw calls en total.
- Comparativa con modelos abiertos en `comfyui/compare/` y `source/compare/`: Flux.2 Dev (estilo cercano, deja márgenes blancos), Qwen-Image-Edit 2511 (plano, pierde ventanas en el lateral), Z-Image Turbo (no respeta la vista ortográfica). Nano Banana Pro queda como modelo de producción.

## Pendiente

- Máscara emisiva para la noche: una pasada de edición con Nano Banana, "ventanas encendidas cálidas sobre negro". El manifiesto ya acepta `frontEmissive` y `sideEmissive`.
- Textura de techo (chapa o teja).
