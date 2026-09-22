# Ciudad del valle

Panorama generado con la herramienta integrada de imágenes, guardado en `dist/assets/scenery/valley-city-v1.png`.

Prompt: pintura ambiental panorámica 3:1 para juego de longboard; ciudad sudamericana ficticia inspirada en Valparaíso, casas sobre cerros, centro urbano y torre esbelta, bahía, nubes iluminadas al atardecer; paleta teal, terracota y crema; sin personajes, texto ni edificios grandes en primer plano.

`dist/city-backdrop.js` coloca la ilustración en un fondo curvo lejano, fuera del sistema de niebla del camino, y añade una capa económica de edificios 3D instanciados. El fondo acompaña el descenso y conserva su orientación para que las curvas cambien el encuadre. Los ambientes lila y noche tiñen el panorama; no son ilustraciones separadas de distintas horas.

Se retiraron las montañas cónicas. Las casas cercanas tienen menos altura y mayor separación para abrir vistas hacia el valle.

## Casas pintadas

Las casas cercanas usan fachadas generadas con Nano Banana Pro desde ComfyUI (frente 7 × 7 m, lateral 9 × 7 m) aplicadas sobre los mismos volúmenes. Pipeline, prompts y variantes en `houses/PIPELINE.md`; originales PNG en `houses/source/`, JPG livianos en `dist/assets/houses/`. Primera variante generada: `a`, chapa teal.
