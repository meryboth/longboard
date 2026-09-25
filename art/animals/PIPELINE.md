# Animales que cruzan la ruta

Cómo se hicieron las llamas que reemplazaron a los conos, y cómo sumar otro animal con el mismo pipeline.

## 1. El arte (ComfyUI)

`art/comfyui-animals.mjs` genera un workflow por animal en `art/animals/comfyui/<id>.api.json`:

1. **Cuadro A:** vista de perfil, caminando hacia la derecha, a mitad de paso. Recibe como referencia de estilo la pose neutral del rider original, así el animal y los riders se ven del mismo mundo: línea de tinta y sombreado suave. El prompt aclara "no dibujes a la persona de la referencia, solo su estilo".
2. **Cuadro B:** una edición del cuadro A, no una generación nueva. Pide el mismo animal, en la misma posición y con el mismo encuadre, en la fase contraria del paso. Encadenarlos es lo que hace que sean el mismo animal.
3. **Recorte:** BiRefNet dentro del mismo workflow.

La llama lleva los pompones de lana de colores en las orejas de la tradición de la señalada andina, que la ubica en Jujuy sin disfrazarla.

**Exportación.** Los dos cuadros se recortan con **el mismo rectángulo**: la unión de sus contornos, leídos del alfa píxel por píxel, más un margen. Si cada uno se recortara a su propio contorno, el animal saltaría al alternar entre cuadros.

```bash
node art/export-sprite.mjs llama-walk-a.png dist/assets/animals/llama-walk-a.webp --height 512 --pad 10 --union llama-walk-b.png
node art/export-sprite.mjs llama-walk-b.png dist/assets/animals/llama-walk-b.webp --height 512 --pad 10 --union llama-walk-a.png
```

**Error encontrado.** La primera exportación usó `cropdetect` de ffmpeg, que con una sola imagen devolvió un rectángulo equivocado, el mismo para los dos cuadros. La llama quedó sin hocico ni punta de las orejas, y se notaba como "cara cortada" cuando la cámara se acercaba. Si se cambia el recorte, hay que revisar `HEIGHT` y la línea de la panza (`belly`) en `llamas.js`.

Costo: 2 imágenes de Nano Banana Pro (≈71 créditos) más el recorte.

## 2. En el juego (`dist/llamas.js`)

- **Posiciones:** las llamas usan exactamente la misma secuencia aleatoria que los conos. Los coleccionables se ubican esquivando esas posiciones, así que no se mueve nada más del nivel.
- **El cruce:** cada llama espera fuera de la ruta: en el campo, del otro lado de la pirca, o en la vereda si está en el pueblo. El carril donde estaba el cono solo decide de qué lado sale.
- **Apunta al rider:** arranca en el momento justo para cruzar la línea actual del rider 0,3 s antes de que llegue (`LEAD`), según su velocidad y posición de ese instante. Si el rider sigue derecho, choca; para esquivarla tiene que girar, frenar o acelerar. Una vez que arranca no corrige el rumbo, así que siempre se puede esquivar.
  - **Primera versión:** arrancaban con una velocidad de rider fija (≈50 km/h) y apuntaban al carril del cono. A 80 km/h salían tarde y casi nunca estaban en el camino del rider; en una prueba, de tres llamas solo una chocó yendo derecho. Con la versión actual chocaron las tres, avisando desde unos 36 m.
- **Llamas rápidas:** una de cada tres (fija, no al azar) cruza al trote, a 5,6 unidades por segundo. Arranca más tarde, a unos 17 m en lugar de unos 30, y barre la calzada más rápido, así que esquivarla de costado cuesta mucho más.
  - **Cómo se reconocen:** la lana es marrón, porque el material de su sprite se multiplica por un tono más oscuro. Así el jugador aprende a leerlas; el tinte de la noche se aplica encima.
  - **Qué hubo que corregir:** con un adelanto fijo de 0,3 s, la rápida ya había despejado la línea del rider cuando él llegaba y nunca chocaba. El adelanto pasó a ser una fracción del medio ancho de la llama dividida por su velocidad (`LEAD`): el cuerpo sigue sobre la línea en el instante en que llega el rider, sea rápida o lenta.
- **Velocidad:** las normales caminan a 3,2 unidades por segundo (≈2,4 m/s) y todas trotan más rápido cuando se asustan. El ciclo de patas avanza con el terreno recorrido (`STRIDE`), así que más rápido significa patas más rápidas, no patinar.
- **Huecos en las pircas:** `createWalls` se crea después de calcular los cruces y deja una abertura de 7 unidades en cada uno (`GAP` en `llamas.js`), así la llama no atraviesa el muro.
- **Caminata:**
  - Los dos cuadros pintados alternan cada medio ciclo, y el ciclo avanza con el terreno recorrido: al trotar, el paso se acelera solo.
  - Encima, un shader inclina las patas desde la línea de la panza: nada en la panza y el máximo en las pezuñas, con las patas de adelante y las de atrás en fases opuestas.
  - En el espacio de la textura la llama siempre mira a la derecha, porque el espejo es una inversión de las coordenadas UV. Por eso el shader sabe qué patas son las delanteras sin importar hacia dónde camina.
- **Choque:** el rider pierde velocidad y 100 de flow, y la llama se asusta y sale trotando en la dirección en que iba.
- **Noche:** las llamas reciben el mismo tinte que los árboles y arbustos pintados.

## 3. Cómo sumar otro animal

1. Agregar una entrada en `ANIMALS` dentro de `art/comfyui-animals.mjs`, con un `look` concreto: especie, pelaje y un rasgo local reconocible.
2. Correr `node art/comfyui-animals.mjs` y ejecutar el workflow en ComfyUI.
3. Revisar que los dos cuadros sean el mismo animal y que las patas estén en fases distintas. Exportar con el mismo recorte.
4. En el juego, `llamas.js` está pensado para un solo animal. Para varios, conviene pasar la ruta de las texturas, la altura (`HEIGHT`) y la línea de la panza (hoy `.37`) como parámetros por animal.

## 4. Verificación

- **Con el panel oculto:** el navegador frena el bucle del juego, así que las pruebas usan el gancho de depuración (`?desde`), que expone `step()` para avanzar cuadros a mano y `llamas` para mover una llama.
- **Choque:** se puso una llama quieta en el carril del rider y se avanzaron cuadros hasta el cruce. Apareció el aviso "LLAMA · −100 FLOW", la velocidad bajó de 26 a 15 km/h y la llama salió trotando.
- **Caminata:** hoja de contacto con seis cuadros de un ciclo.
- **Huecos y pueblo:** vista elevada de un cruce, con las dos pircas abiertas, y un cruce en el pueblo desde la vereda.
