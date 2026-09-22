# Entorno pintado

Workflows en `comfyui/`, generados por `art/comfyui-gen.mjs`. Nano Banana Pro con el panorama y el mural como referencias.

- `ground`: textura de ladera seca que se repite sin costuras, vista desde arriba. `dist/scenery.js` la aplica al terreno con UV en metros (un tile cada 14 m) y conserva la variación por vértice como brillo.
- `trees`: hoja 2 × 2 con ciprés, palmera chilena, eucalipto y jacarandá sobre fondo magenta. BiRefNet recorta dentro del workflow (`RemoveBackground` → `InvertMask` → `JoinImageWithAlpha`).
- `shrubs`: buganvilla, arbusto, rocas y agave, recortados igual.

## Posproceso

Despill del halo magenta con ffmpeg, reduciendo R y B cuando superan a G por más de 50:

```
geq=r='r(X,Y)-if(gt(min(r(X,Y),b(X,Y))-g(X,Y),50),min(r(X,Y),b(X,Y))-g(X,Y),0)':g='g(X,Y)':b='b(X,Y)-…':a='alpha(X,Y)'
```

En `shrubs` se limita a píxeles con alfa menor a 250, porque la buganvilla es magenta. Lección: elegir un fondo que no comparta color con ningún elemento (verde puro para flores, magenta para follaje).

`scenery.js` recorta cada celda de la hoja al área opaca y la usa como `THREE.Sprite` anclado en la base. Sin `manifest.json`, quedan los árboles y rocas low-poly.
