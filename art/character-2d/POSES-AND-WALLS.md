# Carving y muros continuos

## Postura fija

Las vistas de carving conservan el pie delantero, la dirección de rodillas y zapatos y el lado de la correa. Nunca se debe espejar al rider para girar. `carve-left-v1.png` fue descartada por invertir la postura. Se usa `carve-left-v2.png` junto a `grounded-pose-v3.png` y `carve-right-v1.png`.

Las poses se seleccionan por la dirección del giro, con umbral de entrada 0,30 y retorno a neutral 0,13 para evitar cambios constantes. Cada imagen se alinea por la base de sus ruedas. La transición de opacidad es breve. El buzo recibe una deformación suave de textura limitada a la ropa; la cabeza, los pies y la tabla no se deforman. Es un efecto visual de tela, no una simulación física ni un ciclo completo de impulso.

## Muros

`dist/walls.js` crea caras interiores, exteriores, coronación y vereda con muestras compartidas cada 2 metros. Los grupos de geometría comparten sus extremos, sin huecos ni paneles rotados. La altura sigue `roadY` y la curva sigue `roadX`. Las coordenadas de textura siguen la distancia acumulada para evitar reinicios en las uniones.

## Arte generado

Herramienta integrada de imágenes. Prompts: variantes suaves de carving izquierdo/derecho del rider existente, misma postura y pies plantados, perspectiva trasera baja, transparencia; mural continuo con garzas, flores, follaje y pintura envejecida, paleta coral/ocre/verde petróleo. Archivos activos en `dist/assets/rider-2d/` y `dist/assets/walls/mural-v1.png`.
