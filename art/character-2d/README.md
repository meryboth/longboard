# Deriva — personaje ilustrado 2D

## Dirección

Personaje adulto de proporciones humanas, ilustrado con sombras por planos y pliegues de ropa. Buzo ocre, pantalón verde, zapatillas marrones con suela clara, pelo oscuro y bolso cruzado. La hoja de vistas es referencia de diseño, no un atlas utilizable directamente.

## Vistas

La cámara actual sigue al personaje desde atrás y algo elevada. Prioridad de producción: espalda, tres cuartos trasero izquierdo y derecho. Los perfiles resuelven slides y cámaras laterales. Frente y tres cuartos frontal completan la referencia, pero no necesitan todos los ciclos en la primera versión.

No espejar automáticamente: el bolso y la postura de los pies son asimétricos. Todas las vistas deben compartir escala, proporciones y punto de apoyo.

## Preparación para animación

Por vista: cabeza/pelo, torso/capucha, pelvis, brazos, antebrazos, manos, muslos, pantorrillas, zapatos y bolso separados. Pintar zonas ocultas alrededor de hombros, codos, cintura y rodillas para evitar huecos al girar las piezas. La separación y reconstrucción de esas zonas es una etapa posterior a la hoja de diseño.

## Ciclos mínimos

- Rodar: equilibrio suave, buzo y bolso con movimiento secundario.
- Carving izquierdo y derecho: inclinación y transferencia de peso.
- Impulso: un pie permanece en la tabla y el otro toca el suelo.
- Slide/freno: flexión de rodillas y apertura de brazos.

Duraciones iniciales sugeridas: rodar 1,2 s; impulso 0,8 s; transición de carving 0,25 s; entrada al slide 0,3 s. Ajustar tras probar el movimiento, no generar fotogramas independientes sin continuidad.

## Integración prevista

Exportar animaciones con transparencia y metadatos de vista, duración y pivote. Three.js conserva escenario, conducción y tabla; un plano orientado hacia la cámara representa al personaje. El pivote inferior y los apoyos de los pies deben coincidir con la tabla. Separar sombra de contacto, evitar iluminar dos veces las sombras pintadas y cambiar de vista con histéresis para evitar parpadeo.

Herramienta seleccionada: Blender. Primera vista de tres cuartos trasera articulada con huesos y ciclo de equilibrio de 24 fotogramas exportado e integrado al juego. Faltan las vistas restantes y los ciclos específicos de impulso y slide. Ver WORKFLOW.md.
