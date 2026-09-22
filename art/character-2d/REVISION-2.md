# Revisión 2: pose completa

La marioneta inicial fue rechazada visualmente: piernas deformadas por los solapes, postura rígida y perspectiva incompatible entre sprite y tabla 3D.

Se conserva el proyecto Blender como experimento, pero el juego usa ahora `dist/rider-illustrated.js` y `dist/assets/rider-2d/coherent-pose-v2.png`. La nueva ilustración incluye personaje y tabla para mantener unidos perspectiva y apoyos. Es una pose estática deliberadamente, no una animación terminada. No presenta los ciclos de impulso, carving ni slide.

Generada con la herramienta integrada de imágenes. Prompt de producción: ilustración completa RGBA, joven adulto sobre longboard visto desde atrás a tres cuartos, anatomía natural, rodillas flexionadas hacia el mismo lado, pies separados apoyados sobre la tabla, buzo ocre, pantalón verde y bolso bordó; tabla estrecha y proporcionada; sin fondo, sin partes separadas ni uniones visibles.

Antes de volver a animar en Blender: validar esta pose, establecer puntos de contacto con la tabla, preparar las poses extremas de cada movimiento y reconstruir sólo las zonas necesarias. No repetir el montaje automático de extremidades generadas independientemente.
