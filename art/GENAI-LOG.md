# Deriva — registro de IA generativa

Bitácora de investigación de todo el arte generado con IA para el juego: qué se pidió, con qué modelo, cuánto costó, qué falló y cómo se resolvió. Todo corre en Comfy Cloud. Los costos salen de `get_billing_activity`: créditos para nodos de API y segundos de GPU (RTX Pro 6000) para modelos abiertos.

Report publicado: https://claude.ai/artifact/5wNMqLwrfpRVviD2q3mr1j

## Ronda 1 — Pipeline de fachadas (22-09-2026)

- **Objetivo:** reemplazar las cajas lisas por fachadas pintadas sin perder el volumen 3D.
- **Decisión:** texturas ortográficas por cara (frente y lateral) en lugar de sprites. Se conservan la paralaje, las sombras y los tres ambientes de luz.
- **Workflow:** `houses/comfyui/deriva-house-facades.api.json`.
  - Nano Banana Pro (`GeminiImage2Node`, gemini-3-pro-image-preview) recibe como referencias de estilo el panorama y el mural del juego.
  - El frente va en 1:1. El lateral va en 4:3 y recibe el frente como referencia, para que las dos caras sean de la misma casa.
- **Prompt:** un bloque de estilo fijo más una variante editable. El bloque tiene tres partes: STYLE / FORMAT (pared de borde a borde, vista ortográfica) / FORBIDDEN (cielo, suelo, texto, sombras externas).
- **Resultado:** casa a (chapa teal). Salió de borde a borde a la primera. 2 imágenes, ≈71 créditos.

## Ronda 2 — Variantes y comparativa abierta (22-09-2026)

- **Nano Banana Pro:** casas b–h (7 × 2 imágenes). 7 de 8 cumplen todas las reglas. La d trajo un marco teal y se recortó 2,5 % por lado.
- **Comparativa:** mismo encargo, mismas semillas (1201/1202, 1301/1302), variantes b y c. Workflows en `houses/comfyui/compare/`.

| Modelo | Borde a borde | Estilo | Frente ↔ lateral | Sigue el encargo | Costo por casa |
|---|---|---|---|---|---|
| Nano Banana Pro | 5 | 5 | 5 | 4 | ≈71 créditos |
| Flux.2 Dev (fp8, 20 pasos, guidance 4, ReferenceLatent ×2) | 3 (márgenes blancos) | 4 | 4 | 3 (puso puerta en el lateral) | ≈75 s de GPU |
| Qwen-Image-Edit 2511 (fp8, 20 pasos, CFG 2,5) | 4 | 3 (plano) | 3 | 2 (lateral con 3 ventanas) | ≈74 s de GPU |
| Z-Image Turbo (8 pasos, solo texto) | 1 (dibuja cielo y calle) | 2 | 2 | 2 | ≈6 s de GPU |

  **Conclusión:** Nano Banana Pro para producción. Flux.2 Dev es la alternativa abierta si se le suma un recorte automático de márgenes. Los modelos sin referencias de imagen no mantienen la coherencia entre caras.
- **Entorno:**
  - Suelo que se repite sin costuras (1:1).
  - Hojas 2 × 2 de árboles y arbustos (2K) sobre fondo magenta, recortadas con BiRefNet en el mismo workflow (`RemoveBackground` → `InvertMask` → `JoinImageWithAlpha`).
- **Fallas:**
  - Halo magenta en los bordes: se corrigió con despill en ffmpeg (`geq`).
  - Buganvilla magenta sobre fondo magenta: el despill se limitó a píxeles con alfa < 250. Lección: el color del fondo no puede aparecer en ningún elemento de la hoja.
- **Gasto:** 17 imágenes de Nano Banana Pro (≈605 créditos) y ≈313 s de GPU.

## Ronda 3 — Contexto y referencias (22-09-2026)

- **Niebla:** la niebla lineal hacia un color fijo creaba siluetas menta frente al panorama. Se reemplazó el chunk de niebla de Three.js (`ShaderChunk.fog_*` más un `Material.prototype.onBeforeCompile` global). Ahora cada fragmento lejano se mezcla con el color del panorama en su dirección de vista, calculado por intersección rayo–cilindro, así que la geometría se disuelve en la pintura.
- **Investigación de referencias** (agente de búsqueda):
  - Firewatch: niebla en rampa de color.
  - Lonely Mountains: Downhill: terreno esculpido por la pista.
  - Uncharted 4: ciudad leída por los tejados.
  - Forza Horizon 5 (Guanajuato): cables y banderines cruzando la calle.
  - Kiki's Delivery Service: ciudad inventada con piezas reales.
- **Diagnóstico:** la escena leía "casas sobre césped" por la geometría, no por las texturas.
- **Terreno:** la ladera bajó de pendiente 0,24 a 0,07 y el borde lejano ahora cae hacia el valle, así que desapareció la loma blanca que la niebla ponía delante del panorama.

## Ronda 4 — Look Jujuy (22-09-2026)

- **Pedido:** que el contexto sea un pueblo real, con calles y manzanas en lugar de casas sueltas en la ladera, y que todo el juego tenga el look de Jujuy.
- **Referencias reales:** pueblos de la Quebrada de Humahuaca (Purmamarca, Tilcara, Humahuaca):
  - damero colonial de manzanas de ~40 m y calles de tierra;
  - casas bajas de adobe sobre la línea municipal, con fachada continua, techo plano de barro y patio interior;
  - plaza con iglesia blanca y campanario;
  - pircas de piedra seca, cardones, álamos junto al río seco y cerros policromos.
  
  El recorrido se inspira en la Cuesta de Lipán (RN 52), que baja hasta Purmamarca.
- **Estructura del recorrido:**
  - 0–620 m: cuesta con pircas y puestos rurales.
  - 620–1880 m: pueblo. La ruta es la calle principal, con 2 filas de manzanas por lado, calles transversales cada 48 m, una calle paralela, vereda y plaza con iglesia.
  - 1880–2400 m: salida.
- **Etapa 1 (ancla de estilo):** panorama de la Quebrada en 21:9 y 4K con Nano Banana Pro. Se le pasó el panorama viejo solo como referencia de técnica, con instrucción explícita de no copiar su contenido (sin mar ni edificios altos). Resultado: cerros policromos, cauce seco, pueblo en damero con iglesia, álamos y cardones. Queda como referencia de estilo para todo lo demás.
- **Etapa 2** (workflows en `jujuy/comfyui/`, generados por `art/comfyui-jujuy.mjs`):
  - 6 casas de adobe en 16:9 (8 × 4,5 m, frente y lateral).
  - Iglesia: frente 4:3, lateral 21:9, torre 9:16.
  - Suelo y calle de tierra que se repiten sin costuras.
  - Pirca en 21:9.
  - Hoja de cardón, álamo, algarrobo y molle.
  - Hoja de tola, ichu, rocas y cardón joven.

**Resultados de la etapa 2**

- **Casas:** las 6 son consistentes entre frente y lateral.
  - j1, j2 y j5 traían márgenes blancos. Se recortaron con `cropdetect` de ffmpeg sobre la imagen invertida (`negate,cropdetect=limit=0.1:skip=0`). En j5 fueron 86 px a los costados y 90 px arriba y abajo.
- **Iglesia:** frente, lateral con contrafuertes y torre con campana. El lateral salió más beige que el frente.
- **Árboles:** el algarrobo salió cortado y con un fragmento suelto. Se borró con la condición de alfa en `geq` antes de calcular el recuadro de recorte. Despill magenta en toda la hoja, porque ningún elemento es magenta.
- **Costo:** 20 imágenes, ≈706 créditos (≈35,3 por imagen). BiRefNet sumó 71 s de GPU. El panorama 4K costó 62 créditos. Total de la ronda: ≈768 créditos.

**Encuadre del panorama**

Se veía "alto": los cerros ocupaban el cielo. Se bajó la pintura en el cilindro (de −210…290 a −300…420 m) y se extendió el cielo estirando las 20 filas superiores, un degradé sin nubes, con `gblur` (`quebrada-v2.jpg`). No hubo que regenerar.

**Integración**

| Archivo | Qué hace |
|---|---|
| `dist/town.js` | Damero instanciado, calles de tierra, vereda, plaza e iglesia, puestos rurales. |
| `dist/walls.js` | Pircas con un corte donde está el pueblo. |
| `dist/scenery.js` | API `addTree` para patios y plaza. Oculta árboles y rocas aleatorios dentro de la trama. |
| `dist/city-backdrop.js` | Niebla que se disuelve en el panorama. |
| `game.js` | `groundY` aplana el valle bajo el pueblo. `?desde=<m>` arranca la bajada más adelante, para revisar. |

**Capturas del report**

Se capturó el canvas del juego a través de un servidor temporal que servía `dist/` y recibía POST en el mismo origen. El gancho `window.__deriva` solo existe con `?desde=`.

## Totales al 22-09-2026

| | Cantidad |
|---|---|
| Imágenes de Nano Banana Pro | 40 (≈1.444 créditos) |
| Imágenes de modelos abiertos | 12 |
| GPU | ≈457 s (comparativa y BiRefNet) |
