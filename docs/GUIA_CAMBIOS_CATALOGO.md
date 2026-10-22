# Guía rápida — cambios de productos y precios

Esta guía existe para localizar y modificar el catálogo de Noah's Pedidos de forma puntual, sin volver a leer toda la documentación. Se debe usar junto con [Mapa del proyecto](MAPA_DEL_PROYECTO.md) y [Guía técnica](GUIA_TECNICA.md).

## Antes de editar

1. Abrir la rama y el commit actuales de `main`.
2. Leer en `README.md` las secciones que mencionen el producto o la categoría solicitada.
3. Buscar en GitHub el nombre exacto del producto y, si existe, su ID/slug.
4. Identificar todas las capas implicadas: catálogo visual, carrito, API/servicio, persistencia del pedido, cocina, WhatsApp y pruebas.
5. Confirmar la fuente real del precio en el código. No suponer que el precio del README o el texto visual sea el valor que valida el servidor.

## Lista de comprobación para un precio

- [ ] Precio mostrado al cliente actualizado.
- [ ] Precio/variante correcto al agregar al carrito.
- [ ] Total calculado y validado en el servidor; no confiar en el precio enviado por el navegador.
- [ ] Precios especiales, recargos y descuentos conservan sus reglas actuales.
- [ ] Diferencias de precio o disponibilidad por agencia respetadas.
- [ ] El resumen del pedido, cocina, historial y WhatsApp reflejan el precio/selección final.
- [ ] Pedidos históricos no se alteran al cambiar el catálogo.
- [ ] Pruebas agregadas o actualizadas, incluyendo intentos de manipular el precio desde el cliente.
- [ ] README actualizado si cambió un dato comercial confirmado.

## Lista de comprobación para agregar un producto

- [ ] Nombre y categoría confirmados por el propietario.
- [ ] Precio confirmado; si varía por agencia o selección, documentar cada opción.
- [ ] Ingredientes, cantidades y acompañamientos confirmados; no completar con suposiciones.
- [ ] Foto correcta y archivo/ubicación identificado.
- [ ] Agencia(s) donde se vende confirmadas.
- [ ] Disponibilidad, selectores y requisitos obligatorios implementados.
- [ ] Validación del servidor impide productos no disponibles o restringidos a otra agencia.
- [ ] Carrito, snapshot del pedido, cocina y WhatsApp conservan nombre y variante elegidos.
- [ ] Pruebas actualizadas.
- [ ] Documentación comercial actualizada.

## Reglas comerciales importantes ya documentadas

Estas son pistas de negocio; antes de cambiar algo, comprobar el README y la lógica vigente:
- El catálogo se organiza por agencias y hay reglas de disponibilidad/precio por agencia.
- La comida china y sus wantanes se restringen a Plaza Balcones, incluidas las validaciones de servidor y las restricciones de pedidos a domicilio documentadas para Ciudad Peronia.
- Los combos de hamburguesas pueden tener selectores obligatorios, precios fijos y acompañamientos específicos.
- Los precios de hamburguesa sola pueden ser distintos del combo; no extender descuentos a hot dogs, acompañamientos o combos para compartir si la regla no lo indica.
- Los pedidos guardan un snapshot de las selecciones para preservar el historial.
- Los precios e ingredientes deben venir del propietario o de una fuente comercial confirmada; no inventarlos.

Consulta las secciones del `README.md` sobre datos comerciales, hamburguesas, combos, complementos y comida china. El README puede ser largo, por lo que conviene buscar el nombre exacto del producto en vez de leerlo completo.

## Pruebas y publicación

Ejecutar cuando el entorno lo permita:

```sh
node tests/run.mjs
node node_modules/typescript/bin/tsc --noEmit
npm run lint
npm run build
```

No afirmar que el cambio está en producción solo porque el commit esté en GitHub. Confirmar aparte el despliegue de Cloudflare Workers y probar el flujo correspondiente sin generar pedidos o cobros reales.
