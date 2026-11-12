# Comparar los tiempos de dos archivos SRT

Este programa compara la cantidad de bloques y los tiempos de inicio y fin de un SRT original y otro ya traducido. Funciona en tu equipo con Python 3.9 o posterior y la biblioteca estándar. No traduce, modifica ni envía los archivos.

## Probar con los ejemplos

```sh
python check_srt_timing.py workshop.en.srt workshop.pt-BR.srt
python check_srt_timing.py workshop.en.srt workshop.pt-BR.shifted-1ms.srt
```

El original inglés es una obra ficticia creada para Scanfile. El archivo en portugués de Brasil es una salida real de una muestra de Scanfile; sus tiempos coinciden con los del original. No es un ejemplo de traducción al español ni una evaluación independiente de calidad.

El archivo `shifted-1ms` es una copia modificada deliberadamente: termina el tercer bloque un milisegundo más tarde. El segundo comando informa de una diferencia en la posición 3. Los ejemplos están bajo [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/): atribuye a Scanfile e indica los cambios. El código tiene [licencia MIT](LICENSE.txt). También existe un [conjunto JSONL con estos ejemplos](https://huggingface.co/datasets/zsoat/subtitle-timing-fixture-en-pt-br).

## Comprobar tus archivos

```sh
python check_srt_timing.py original.srt traduccion.srt
```

El resultado es JSON. El código de salida es **0** si coinciden la cantidad de bloques y los tiempos comprobados, **1** si hay diferencias y **2** si la entrada no es válida. Compara por posición, no por el número del bloque. Si las cantidades difieren, informa de ello sin alinear los bloques individuales.

Solo admite SRT básico en UTF-8, de hasta 5 MiB por archivo. No admite VTT, ASS ni extensiones no estándar de tiempos; tampoco comprueba solapamientos ni el orden cronológico. Los mensajes de error pueden incluir rutas locales: revísalos antes de compartirlos. En CI, tu proveedor puede guardar registros o archivos según su propia configuración.

**Un resultado coincidente no demuestra** la calidad de la traducción, la sincronización con el vídeo, la velocidad de lectura ni la accesibilidad. Compara el contenido con el original y mira los subtítulos con el vídeo.

## Relación con Scanfile

Este proyecto está mantenido por el equipo de Scanfile. La [traducción de subtítulos de Scanfile](https://scanfile.online/es/tools/ai-subtitle-translator) es un servicio comercial independiente que requiere subir el archivo y muestra las condiciones de muestra y créditos antes de empezar. Este comprobador local no necesita una cuenta. Esta descripción fue preparada con ayuda de IA.

## Pruebas

```sh
python -m unittest test_check_srt_timing.py
```

