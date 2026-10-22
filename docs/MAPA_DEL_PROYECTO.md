# Mapa del proyecto — Noah's Pedidos

Este archivo es el índice rápido para cualquier programador o asistente que vaya a modificar el repositorio. **No releer todo el README de entrada:** primero identificar la tarea aquí, abrir únicamente los archivos afectados y verificar siempre la estructura real de la rama actual.

## Punto de entrada obligatorio

1. Revisar el estado actual de la rama `main` y el commit más reciente.
2. Leer este mapa y luego la sección correspondiente de `README.md`.
3. Para infraestructura, seguridad y comandos, consultar [Guía técnica](GUIA_TECNICA.md).
4. Para productos y precios, consultar [Guía de cambios de catálogo](GUIA_CAMBIOS_CATALOGO.md).
5. Buscar el archivo real en GitHub antes de editarlo. Las rutas descritas en la documentación son pistas; el código actual es la fuente de verdad.

## Mapa conocido de archivos y directorios

| Ruta | Para qué sirve / qué revisar |
|---|---|
| `README.md` | Descripción funcional extensa, reglas de negocio, agencias, productos y precios confirmados, manual operativo. |
| `docs/` | Documentación para desarrollo, mantenimiento y futuras configuraciones. |
| `package.json` | Scripts, versiones de dependencias y gestor de paquetes. |
| `db/schema.ts` | Esquema de tablas de la aplicación y estructura de datos. |
| `drizzle/` | Migraciones de base de datos. No editar migraciones ya aplicadas en producción. |
| `drizzle.config.ts` | Configuración de Drizzle Kit. |
| `lib/noahs/service.ts` | Lógica central de negocio y validaciones del servidor, según la documentación existente; confirmar ruta en la rama actual. |
| `tests/` | Pruebas automatizadas; ejecutar `node tests/run.mjs`. |
| `scripts/` | Herramientas de desarrollo/build, incluido el arranque del framework y la instalación de pnpm. |
| `assets/brand/` | Recursos de marca facilitados por el propietario. |
| `public/brand/` | Versiones públicas/optimizadas de recursos de marca. |
| `package.json` → `dev`, `build`, `start`, `lint`, `db:generate` | Comandos documentados para desarrollar, compilar, ejecutar localmente, revisar estilo y generar migraciones. |

La tabla no pretende ser un inventario completo. Para conocer todas las carpetas, abrir la pestaña **Code** en GitHub y revisar la raíz y los directorios relevantes.

## Buscar un cambio sin revisar todo el repositorio

En la búsqueda de GitHub, limitar la búsqueda al repositorio y probar en este orden:

1. El nombre exacto que aparece en pantalla, por ejemplo `Combo Favorito`, `Cheesecake` o `Chili Garlic`.
2. El ID/slug del producto, si aparece en el código o en el pedido.
3. El texto del botón o encabezado de la pantalla.
4. Los nombres de propiedades relacionados: `price`, `agency`, `availability`, `product`, `variant`, `combo`.
5. La ruta API o función de servicio que guarda/valida el pedido.

Después de encontrar una coincidencia, seguir las referencias/importaciones para descubrir si ese archivo es catálogo, presentación, carrito, API, servicio o prueba. No asumir que el primer resultado es la fuente de verdad.

## Fuente de verdad: no duplicar reglas

Para un cambio de precio, producto o variante, identificar y verificar las capas aplicables:
- **Catálogo/presentación:** qué ve el cliente.
- **Carrito y resumen:** qué producto y precio se conservan al seleccionar/agregar.
- **API/servicio de servidor:** precio, disponibilidad, agencia, selección obligatoria y total recalculados o validados.
- **Persistencia/snapshot del pedido:** qué datos quedan guardados para que el historial no cambie si luego se edita el catálogo.
- **WhatsApp, cocina y operación:** que se muestre la selección final confirmada.
- **Pruebas:** que cubran el precio correcto y que el cliente no pueda enviar un precio manipulado.

No basta con cambiar el texto del precio en la interfaz. La validación crítica debe permanecer en el servidor.

## Archivos por tipo de trabajo

| Tarea | Qué localizar y comprobar |
|---|---|
| Agregar producto | Catálogo, imagen/asset, categoría, precio por agencia si corresponde, disponibilidad, servidor, carrito, pedido guardado, WhatsApp y pruebas. |
| Cambiar precio | Fuente de precio del catálogo y validación del servidor; variante/recargos, combos, precio de producto solo vs. combo cuando aplique; pruebas. |
| Cambiar ingredientes o contenido de combo | Texto de catálogo, selectores, validación de selecciones, snapshot de pedido, cocina/WhatsApp y README. No inventar ingredientes. |
| Cambiar producto por agencia | Filtros de catálogo **y** autorización en servidor. Revisar carrito mixto y entrega/retiro si aplica. |
| Cambiar fotografía | Assets existentes, referencias/importaciones y todos los tamaños/estados donde se reutilice. |
| Cambiar base de datos | `db/schema.ts`, nueva migración en `drizzle/`, servicio/API y pruebas. Nunca editar una migración ya aplicada. |
| Cambiar permisos o acceso | Autenticación, autorización en servidor, sesiones, límites de intentos, auditoría y pruebas negativas entre agencias. |
| Cambiar dominio o publicación | Ajustes reales de Cloudflare Workers, dominios/rutas, binding D1 y despliegue. No se arregla necesariamente editando el código. |

## Flujo corto para cada modificación

1. Localizar el código exacto mediante búsqueda de GitHub.
2. Abrir solo los archivos relevantes y sus imports/llamadas.
3. Anotar la regla actual y el cambio solicitado.
4. Modificar el mínimo de archivos necesario, incluyendo servidor y pruebas cuando aplique.
5. Ejecutar:
   ```sh
   node tests/run.mjs
   node node_modules/typescript/bin/tsc --noEmit
   npm run lint
   npm run build
   ```
6. Revisar el diff y buscar inconsistencias entre interfaz, servidor, pedido guardado y documentación.
7. Actualizar el README y esta guía si cambió una regla de negocio o una ruta importante.
8. Guardar un commit con un mensaje claro y verificar el despliegue por separado.

## Reglas de trabajo

- No inventar precios, ingredientes, cantidades, direcciones ni datos comerciales.
- El README documenta numerosas decisiones comerciales; comprobar que coincidan con el código actual antes de usarlas como especificación final.
- No incluir secretos, PIN, cookies, tokens, IDs privados innecesarios ni datos personales en documentación o commits.
- No hacer pruebas de pedidos ni cobros reales.
- Si una ruta documentada no existe, buscar el nombre actual y corregir el mapa en el mismo cambio.
- Registrar en el resumen final qué archivos se cambiaron, qué pruebas se ejecutaron y qué queda pendiente.
