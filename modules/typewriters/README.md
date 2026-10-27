# Máquinas de escribir — módulo museológico (propuesta v1)

Este módulo se prepara separado del catalogador fotográfico para no alterar las colecciones existentes.

## Principios
- Unidad de catalogación: **ejemplar físico**, no imagen individual.
- Identificador propio de inventario; número de serie separado y preservado como texto.
- Fabricante, marca y modelo son autoridades reutilizables y no deben confundirse.
- Los hechos propios del **modelo** (fabricación, historia, tecnología) se almacenarán en una entidad de referencia; la ficha del **ejemplar** guarda estados, inscripciones, accesorios, procedencia y fecha de fabricación cuando puede verificarse.
- Fechas: intervalos y grado de certeza, con fuente de datación.
- Imágenes: varias por ejemplar, una principal, tipo de vista y orden.
- No inferir que una máquina funciona sin probarla; estado mecánico y estado material son distintos.
- Público: visibilizar solo fichas publicadas; nunca perder borradores.

## Reutilización prevista
Interfaz por pasos con Enter/Esc, galería de miniaturas, importación local de fotografías, zoom, edición masiva, JSON de respaldo, publicación en GitHub y visualizador web. No utilizar el esquema imagen→ficha del módulo fotográfico como estructura de objeto.

## Pendiente de implementación
1. Autoridades: fabricantes, marcas y modelos, con relaciones y fechas.
2. Almacenamiento de objetos y galería por objeto en rutas independientes de fotografias.
3. Editor de objetos por pasos, validación y persistencia segura.
4. Vista pública por objeto y filtros específicos.
5. Migraciones y pruebas de regresión para las colecciones fotográficas.

Esquema inicial: `typewriter-record.schema.json`. Este esquema no constituye aún un catalogador operativo.
