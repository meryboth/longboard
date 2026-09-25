# Pipeline de personajes en ComfyUI

Cómo crear un rider nuevo para Deriva, en el mismo estilo que los actuales, listo para el garage y para el juego. Todo corre en ComfyUI (Comfy Cloud o local) con Nano Banana Pro (`GeminiImage2Node`) y BiRefNet.

## Qué produce

Por personaje, cuatro imágenes con fondo transparente, en 2:3 (848 × 1264 px):

| Archivo | Uso |
|---|---|
| `<id>-portrait.webp` | Tarjeta del garage: cuerpo entero de frente a tres cuartos. |
| `<id>-neutral.webp` | Pose en el juego, de espaldas, rodillas flexionadas. |
| `<id>-left.webp` | Carving hacia la izquierda. |
| `<id>-right.webp` | Carving hacia la derecha. |

Los personajes se dibujan **sin tabla**. La tabla elegida en el garage se agrega aparte, así cualquier rider puede usar cualquier tabla sin generar combinaciones.

## Referencias

Las tres poses del rider original (Tomi), aplanadas sobre gris neutro `#d6d6d2`, en `art/characters/refs/`:

- `grounded-pose-v3-grey.png`: neutral.
- `carve-left-v2-grey.png`: carving izquierdo.
- `carve-right-v1-grey.png`: carving derecho.

Se aplanan porque la transparencia puede llegarle al modelo como negro. Cumplen dos funciones: fijan el estilo de ilustración (línea de tinta, sombreado suave, proporciones) y la pose exacta con el encuadre del juego.

## El workflow

`art/characters/comfyui/rider-<id>.api.json`, generado por `art/comfyui-riders.mjs`. Son cuatro pasos encadenados en un solo grafo:

```
ref neutral ──► [1] Ficha de frente ──┬──► recorte ► <id>-portrait
                   (descripción)      │
ref neutral ──► Batch ◄───────────────┘
                  └──► [2] Pose neutral de espaldas, sin tabla ──┬──► recorte ► <id>-neutral
ref carve-left  ──► Batch ◄───────────────────────────────────────┤
                      └──► [3] Carving izquierdo ─────────────────┼──► recorte ► <id>-left
ref carve-right ──► Batch ◄───────────────────────────────────────┘
                      └──► [4] Carving derecho ─────────────────────► recorte ► <id>-right
```

1. **Ficha de frente.** Recibe la pose neutral como referencia de estilo y la descripción del personaje. Define la identidad: cara, pelo, piel, cuerpo, ropa y colores.
2. **Pose neutral de espaldas.** Recibe la ficha (identidad) y la pose neutral original (pose y encuadre). Pide la misma cámara, escala y posición, y quita la tabla dejando los pies donde estaban.
3. **Carving.** Recibe la pose neutral nueva y la pose de carving original. Pide inclinar todo el cuerpo tanto como la referencia y **no espejar nunca** al personaje: mismo pie adelante y el bolso del mismo lado.
4. **Recorte.** BiRefNet saca el fondo gris dentro del mismo workflow (`RemoveBackground` → `InvertMask` → `JoinImageWithAlpha`).

El rider original usa una variante: su ficha sale de la referencia, y las tres poses son ediciones de las originales ("quitá la tabla, dejá todo lo demás igual").

### Método v2: cambio de identidad sobre la pose original (recomendado)

**Qué falló en la primera ronda.** Al pedir "dibujá a este personaje en la pose de la referencia", el modelo reinterpretó la postura en 2 de 4 riders. Killa y Nia salieron con las piernas abiertas de costado, una postura que no es de longboard: sobre una tabla recta, los pies van uno detrás del otro. Ningún ajuste de código lo tapaba bien, y la tabla terminaba torcida o un pie quedaba en el aire. Ramón y Ale sí respetaron la postura, pero no hay forma de saber de antemano qué personaje va a fallar.

**Método v2.** Cada pose es una edición de la pose original de Tomi. El modelo recibe dos imágenes:
1. La pose original, que es la imagen que se edita.
2. La ficha de frente del personaje, que aporta la identidad.

El prompt pide reemplazar solo la identidad y mantener exactos la postura, los pies uno detrás del otro, la flexión, los brazos y el encuadre ("Do not open the legs sideways"). Es lo mismo que funcionó con Tomi, donde la edición conserva la geometría. La ficha se aplana sobre gris (`refs/<id>-portrait-grey.png`) antes de subirla.

- **Dónde está:** función `repose()` en `art/comfyui-riders.mjs`. Genera `rider-<id>-v2.api.json` y `batch-v2.json`.
- **Costo:** 3 imágenes por personaje (≈106 créditos), porque la ficha ya existe.
- **Para personajes nuevos:** generar la ficha con el paso 1 y las poses con `repose()`.

## Cómo sumar un personaje

1. Agregar una entrada en `CHARACTERS` dentro de `art/comfyui-riders.mjs`, con nombre, subtítulo y `look`. El `look` es una descripción concreta de cara, pelo, piel, ropa y un accesorio reconocible de espaldas, como un bolso, una mochila o un gorro.
2. Correr `node art/comfyui-riders.mjs`. Genera el workflow y lo agrega a `art/characters/comfyui/batch.json`.
3. Cargar el workflow en ComfyUI. Si es otra cuenta, volver a subir las tres referencias y actualizar los nombres de archivo en los `LoadImage`. Después, ejecutar.
4. Exportar los cuatro recortes a WebP en `dist/assets/riders/`:
   - **Retrato:** se recorta al contorno del alfa con un margen de 12 px, usando `art/export-sprite.mjs`.
   - **Poses:** quedan en el cuadro completo, para que las tres compartan encuadre.
   ```bash
   node art/export-sprite.mjs portrait_cutout.png dist/assets/riders/<id>-portrait.webp --height 900 --pad 12
   ffmpeg -i neutral_cutout.png -c:v libwebp -quality 88 dist/assets/riders/<id>-neutral.webp
   ```
   No usar `cropdetect` de ffmpeg para esto: está pensado para video y con una sola imagen devolvió rectángulos equivocados. Cortó cabezas y pies en los cinco retratos del primer lote, y la nariz y la cola de dos tablas. `export-sprite.mjs` lee el alfa píxel por píxel.
5. Sumar el personaje a `RIDERS` en `dist/garage.js`.

Costo: 4 imágenes de Nano Banana Pro (≈141 créditos) más ≈40 s de GPU de BiRefNet por personaje.

## Criterios para describir personajes

- **Identidad concreta y respetuosa:** ropa contemporánea de skater y un rasgo propio, sin disfraz ni estereotipo. Para identidades culturales conviene aclararlo en el prompt ("contemporary skater style, not a folkloric costume").
- **Reconocible de espaldas:** en el juego se lo ve desde atrás. Pelo, gorro, mochila o bolso tienen que distinguirlo sin verle la cara.
- **Colores:** evitar el gris del fondo (`#d6d6d2`) en la ropa, para que el recorte no se coma partes.
- **Siempre adulto:** "semi-realistic adult proportions" está en el bloque de estilo.

## Qué revisar al terminar

- **La ficha:** que el personaje sea el mismo en las cuatro imágenes (cara, pelo, ropa, colores).
- **Las poses:** que ninguna tenga restos de tabla o ruedas y que los pies queden a la misma altura.
- **El carving:** que se note la inclinación y que el personaje no esté espejado. En el primer lote, los riders nuevos se inclinaron menos que la referencia: la diferencia se leía más en los brazos que en la cadera. Si hace falta más inclinación, conviene regenerar solo ese nodo con otra semilla antes que tocar el resto.
- **El recorte:** que no haya halos grises en el pelo o entre las piernas.

## Del asset al juego

Paso a paso de cómo el rider y la tabla elegidos en el garage llegan a la bajada.

### 1. Separar rider y tabla

El rider original tenía la tabla pintada dentro del sprite. Para poder combinar cualquier rider con cualquier tabla, se regeneraron todos sin tabla (ver arriba) y la tabla pasó a ser un objeto 3D. Cinco riders y seis tablas son 26 imágenes en lugar de 120.

### 2. La tabla en 3D (`dist/board.js`)

- **Deck:** un plano horizontal con la imagen de ComfyUI como textura y `alphaTest: .5`. El alfa del recorte define la silueta, así que pintail, drop-through o dancer salen de la imagen misma, sin modelar cada forma. El plano se rota para que la parte de arriba de la imagen (la nariz) apunte hacia adelante (−z).
- **Grip transparente:** la gráfica está en la cara inferior del deck, pero la cámara ve la tabla desde arriba y atrás. Para que la tabla elegida se vea en el juego, la cara superior muestra la misma gráfica oscurecida (`color: #b9b4ab`), como un grip transparente.
- **Espesor:** un segundo plano con la misma textura, teñido de madera y 3 cm más abajo. Desde la cámara se lee como el canto de las láminas de maple.
- **Medidas reales:** el largo sale de la ficha del garage (38" a 46") convertido a unidades del mundo, donde el sprite mide 2,35 unidades por ≈ 1,75 m. El ancho sale de la proporción de la imagen.
- **Trucks y ruedas:** cajas y cilindros simples. Las ruedas toman el color de la ficha (`wheels`), giran según la velocidad (`velocidad × dt / radio`) y el deck se inclina un poco hacia el lado del carving.

### 3. El rider sobre la tabla (`dist/rider-poses.js`)

- **Poses del rider:** `setRider(id)` carga `assets/riders/<id>-{neutral,left,right}.webp`. El resto del sistema de poses no cambió: el sprite elige la pose según el giro y hace un fundido entre ellas.
- **Pies sobre el deck:** el sprite se ancla en la suela, la última fila opaca del alfa, y se ubica a la altura de la cara superior del deck (`DECK_TOP`, exportado por `board.js`).
- **Altura:** sin tabla, el cuerpo se escala a 2,12 unidades (antes eran 2,35 contando la tabla pintada), así el conjunto mantiene el tamaño en pantalla.
- **Cambio sin parpadeo:** al cambiar de rider, cada pose nueva reemplaza a la vieja recién cuando termina de cargar, y la textura anterior se libera. Si se eligen dos riders seguidos, un contador descarta las cargas viejas.

### 4. Conectar el garage (`dist/game.js`)

```js
const board=createBoard();rider.add(board.root,riderModel.root);
function wear({rider:id,board:deck}){riderModel.setRider(id);board.setBoard(BOARDS.find(b=>b.id===deck));}
wear(currentGear());                       // elección guardada en localStorage
createGarage({…, onChange:wear});          // cada clic en el garage se aplica en vivo
// en el loop:
board.animate(active?dt:0,speed,steer);
```

### 5. Que ningún pie flote: la tabla se acomoda a los pies

**Problema.** En la primera versión, la tabla apuntaba siempre derecho hacia adelante. Los sprites, en cambio, tienen los pies separados en diagonal, porque están dibujados en vista de tres cuartos. Desde la cámara del juego, el deck quedaba como una franja angosta y el pie de atrás de Killa y de Nia quedaba en el aire, al costado.

**Diagnóstico.**
- Se renderizó cada rider en sus tres poses desde la cámara del juego y se armó una hoja de contacto.
- También se midieron los contornos: en los riders nuevos, las tres poses coinciden al píxel. El carving casi no cambia la silueta, así que la postura no se puede arreglar eligiendo otra pose.

**Solución (`findSoles` en `rider-poses.js` y `fit` en `board.js`):**
1. **Detectar los pies en cada pose.** Al cargar la textura, el 12 % inferior de la figura se separa en manchas conectadas: una por pierna con su zapatilla. Si las dos zapatillas se superponen en la imagen, queda una sola mancha.
2. **Punto de apoyo a media zapatilla.** El punto de apoyo no se toma en la suela sino un poco más arriba, a un 3,5 % de la altura de la figura. Desde una cámara alta, el ojo ubica el pie por el cuerpo de la zapatilla. Con la suela, todos los riders parecían parados sobre la nariz; con un 5 % quedaban sobre la cola. El valor se ajustó con hojas de contacto hasta que el pie de atrás cayó sobre el truck trasero.
3. **Proyectar en cada cuadro.** Cada punto de apoyo se pasa a coordenadas del mundo sobre el billboard, teniendo en cuenta la inclinación del sprite. Después se traza el rayo desde la cámara hasta el plano del deck: donde corta es donde ese pie se ve parado.
4. **Ubicar la tabla.** La tabla apunta **siempre derecho**, en la dirección de la bajada. Solo se desliza de costado y hacia adelante hasta quedar debajo de los pies. Con un solo apoyo, que corresponde al pie de atrás, el deck avanza un 6 % de su largo. La posición se suaviza con `damp`, para que no salte cuando cambia la pose.

Como se calcula en cada cuadro, funciona con las dos cámaras (cercana y abierta), con cualquier pose y con cualquier rider nuevo que salga del pipeline, sin ajustes a mano.

**Lo que se probó y se descartó:**
- **Girar la tabla para seguir la línea de los pies (hasta ±0,6 rad).** Los pies quedaban apoyados, pero la tabla iba en diagonal respecto de la ruta, algo que un longboard real no hace. Regla del proyecto: la tabla va derecha y es el cuerpo el que se adapta a ella, nunca al revés.
- **Deformar la pierna de adelante en el shader.** Con una máscara de la pierna rellenada por conectividad, se la desplazaba hacia la otra desde la rodilla hasta el pie. Dejaba cortes visibles en la pierna y se sacó del código.

**La causa real y el arreglo.** Killa y Nia no tenían una postura de longboard: la generación encadenada les había abierto las piernas de costado. Se regeneraron sus poses con el método v2 (ver "El workflow"), editando las poses originales de Tomi y cambiando solo la identidad. Con los pies uno detrás del otro, los cinco riders apoyan sobre la tabla derecha sin ningún truco.

### 6. Animación sobre las poses pintadas

Las tres poses son imágenes fijas y el carving de los riders nuevos es tímido. Encima de las poses se sumaron tres movimientos:
- **Inclinación en la curva:** el sprite rota hasta 0,15 rad (0,2 al frenar). El pivote es el centro del sprite, que está en las suelas, así que los pies no se despegan de la tabla.
- **Flexión al frenar:** el sprite baja un 4,5 % de alto y se ensancha un 2 %.
- **Rebote del asfalto:** una oscilación de 0,6 % de alto, proporcional a la velocidad.
- **Coordinación con la tabla:** el deck se inclina hacia el mismo lado que el rider.

### 7. Verificación

- **Cambios en vivo:** en el navegador se eligieron Killa con Garza, después Nia con Faroles y después Ramón con Siete Colores. En cada cambio se comprobó que carguen las texturas y el color de ruedas correctos, y que queden solo tres sprites.
- **Capturas:** para las fotos del report, el canvas se renderizó con una cámara propia y se subió a un servidor local del mismo origen, porque el panel oculto no corre el loop de animación.
- **Encastre de la tabla:** los 5 riders se capturaron con steer −1, 0 y +1 desde la cámara del juego, con el loop avanzado a mano, porque el panel oculto no anima. Se armó una hoja de contacto por iteración y se compararon las tres versiones del punto de apoyo: suela, 5 % y 3,5 %.
