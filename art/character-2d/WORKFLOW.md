# Blender: primera prueba 2D

`parts-v1.png`: ilustración RGBA de piezas, generada con la herramienta integrada de imágenes. Prompt: atlas 4 × 3 de cabeza, torso, brazos, antebrazos con manos, muslos, pantorrillas y zapatos; vista trasera a tres cuartos; buzo ocre y pantalón verde; fondo transparente y articulaciones solapadas.

`build_puppet.py`: genera planos texturizados con UV independientes, asigna cada pieza a un hueso y crea un ciclo de equilibrio de 24 fotogramas. No requiere complementos pagos. Ejecutar con Blender en segundo plano; añadir `-- --render` para exportar la secuencia completa.

`deriva-rider-v1.blend`: escena editable con ilustración empaquetada, esqueleto, cámara ortográfica y claves de animación. Los huesos están visibles delante de las piezas. Seleccionar el esqueleto y entrar en Pose Mode para editar la postura. Timeline: 1–24; el fotograma 25 repite el primero para cerrar el ciclo.

Es una primera vista articulada. No sustituye todavía el trabajo de dibujar los otros ángulos, corregir solapes y fijar el pie de apoyo con IK para el impulso. La ilustración tiene sombras pintadas: se renderiza con emisión para mantener sus colores sin iluminación duplicada.
