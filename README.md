# Deriva

Prototipo web de longboard en Three.js. Barrio ficticio con murales procedurales, descenso de 2,4 km, conos, puntuación de carving y tres ambientes.

## Ejecutar

Requiere Node.js. Ejecutar `npm run dev` y abrir http://127.0.0.1:5173. Three.js está incluido en `dist/vendor`, sin instalación de dependencias.

## Controles

- Flechas izquierda/derecha o A/D: carving.
- Flecha arriba o W: impulso.
- Espacio, flecha abajo o S: slide/freno.
- P o Escape: pausa. R: reiniciar.
- Controles táctiles en pantallas pequeñas.
- Botones superiores: luz, cámara y sonido sintetizado.

## Iteración

`dist/game.js` contiene mundo, geometría, conducción y cámara; `dist/style.css` la interfaz; `dist/index.html` el contenido. Escenario y arte originales generados por código. La conducción es arcade: sigue el eje de la ruta con desplazamiento lateral, no simula una tabla rígida físicamente. Los tres ambientes modifican iluminación y niebla; no hay postprocesado cinematográfico todavía.

Three.js v0.180.0, licencia MIT (dist/vendor/LICENSE).
