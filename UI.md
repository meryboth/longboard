# La interfaz en el teléfono

Paso a paso de cómo quedó la capa de interfaz en mobile: mandos de juego, un header que entra en 375 px y nada superpuesto. El CSS está repartido entre `dist/style.css` (base y mandos táctiles) y `dist/collection.css` (identidad de vidrio, header, pie y pantallas).

## Qué estaba mal

Con la pantalla de un teléfono a 375 px de ancho:

- **El header se salía.** Los botones de sonido y pausa quedaban cortados fuera de pantalla, porque la marca, el reloj de ubicación y los cuatro botones no entran en una fila de 375 px.
- **El marcador pisaba los mandos.** El pie tenía 84 px de aire abajo y los mandos empezaban a 52 px del borde con 48 px de alto, así que se cruzaban.
- **Los mandos eran chicos:** 55 × 48 px, por debajo de los 44 px mínimos que recomiendan las guías táctiles, y separados en una sola fila de borde a borde.
- **En horizontal no había mandos.** Se mostraban solo por debajo de 700 px de ancho, y un teléfono acostado mide más que eso: aparecían los atajos de teclado y ningún botón.

## Cómo quedó

### 1. Los mandos, en dos grupos

En `index.html` los cuatro botones pasaron a estar en dos grupos: dirección a la izquierda y acciones a la derecha, que es donde caen los pulgares.

- **Tamaño:** 68 × 68 px, y 62 px en pantallas de menos de 360 px.
- **Forma:** cuadrados redondeados de 26 px de radio, con la misma identidad de vidrio que el resto de la interfaz, así que también acompañan el modo noche.
- **Etiquetas:** FRENO e IMPULSO se leen; las flechas van solas.
- **Respuesta al toque:** `:active` los achica un 7 % y los aclara, para que se note la pulsación sin esperar al juego.
- **Sin gestos del navegador:** `touch-action:none` y `user-select:none` evitan el scroll y la selección accidental.

### 2. Se muestran por pantalla táctil, no por ancho

```css
@media(max-width:700px),(hover:none) and (pointer:coarse){.touch{display:flex}}
```

La segunda condición es la que importa: un teléfono acostado mide más de 700 px pero sigue siendo táctil. Con la misma condición se esconden los atajos de teclado y se reserva el espacio del pie.

### 3. Nada encima de nada

- **Header:** por debajo de 860 px pasa a una fila compacta con botones de 46 px. Por debajo de 540 px queda solo la marca ◭, sin la palabra. El umbral es 860 y no 700 porque el teléfono acostado entra en ese rango.
- **Botín:** se fija debajo del header, centrado, y se esconde mientras el panel de ubicación está abierto, porque ocupan el mismo lugar.
- **Pie:** deja 100 px de aire abajo, que son los 68 px del botón más 18 px de margen más el área segura del teléfono. El marcador de velocidad queda apoyado arriba de los mandos.
- **Área segura:** `env(safe-area-inset-bottom)` y `env(safe-area-inset-top)` mantienen todo lejos de la barra de gestos y del notch.

### 4. Las pantallas que se abren encima

- **Modal de pausa:** ancho fijo de `100vw - 32px` en lugar de 320 px mínimos.
- **Garage:** la barra con la acción principal queda fija abajo del panel, con el botón a lo ancho, así no hay que scrollear hasta el final de la lista para continuar.
- **Panel de ubicación:** ocupa el ancho de la pantalla debajo del header, con botones de 44 px. El campo de búsqueda tiene 16 px de tipografía, que es lo que evita que iOS haga zoom al enfocarlo.

## Cómo verificarlo

En el navegador, con el panel en tamaño de teléfono:

1. **Vertical (375 × 812):** que los cinco controles del header entren en una fila y que el marcador quede arriba de los mandos.
2. **Horizontal (740 × 360):** que aparezcan los mandos y que el header no se corte.
3. **Tablet (768 px):** que vuelva la marca con la palabra.
4. **Escritorio:** que no haya mandos táctiles y que vuelvan los atajos de teclado.

Para medirlo en lugar de mirarlo, sirve comparar rectángulos en la consola:

```js
const r = s => { const b = document.querySelector(s).getBoundingClientRect(); return [b.top, b.bottom]; };
r('.meter');            // el marcador tiene que terminar antes…
r('.touch');            // …de donde empiezan los mandos
document.documentElement.scrollWidth > innerWidth;   // false: nada se sale de la pantalla
```
