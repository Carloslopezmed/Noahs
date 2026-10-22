# Portal interno de operaciones de Noah's

## Separación de la tienda
- La tienda pública permanece en `/`.
- El portal de empleados usa una URL propia: `/operaciones`.
- Cocina, reparto y liquidaciones tienen rutas propias y requieren sesión válida.
- No se deben copiar usuarios, PIN, pedidos ni datos de otros restaurantes.

## Roles
- `master`: acceso completo, usuarios, asignar y liberar pedidos.
- `cashier`: confirmar pedidos y registrar cobros.
- `kitchen`: iniciar y finalizar preparación.
- `driver`: consultar sus asignaciones y registrar salida, entrega y cobro.
- El servidor debe validar el rol y la agencia en cada mutación; ocultar controles en la interfaz no es control de acceso.

## Pedidos y alarma
- Las vistas de cocina y reparto muestran tarjetas compactas, detalle y paginación.
- La alarma repite el aviso de pedidos nuevos hasta que todos los pendientes se atiendan; abrir un pedido no lo silencia.
- Mostrar permiso/estado de audio y reintentar la recuperación cuando el navegador lo permita.
- Los cambios de estado deben ser idempotentes y conservar historial.

## Dinero
- Registrar por separado efectivo y tarjeta.
- No habilitar pagos en línea ni simular una pasarela.
- Una asignación no equivale a cobro.
- Resumir por repartidor asignado, por cobrar, cobrado, entregado a caja y pendiente.
- Historial inmutable por pedido y por recepción de dinero; evitar duplicados mediante claves idempotentes y validación de servidor.

## Administración
- Datos comerciales, ubicación, horarios, redes y WhatsApp solo con valores confirmados.
- Fidelidad desactivada por defecto hasta definir condiciones y premios.
- Publicar políticas de privacidad, términos y entrega sin inventar datos fiscales.
- No incluir secretos, credenciales, PIN ni datos personales en el repositorio.

## Verificación antes de publicar
1. Ejecutar `node tests/run.mjs`.
2. Ejecutar comprobación TypeScript y build.
3. Probar cada rol y los intentos de acceso no autorizado.
4. Probar asignación/liberación, transiciones, cobros duplicados y liquidaciones en SQLite aislado.
5. Comprobar que la tienda pública y los pedidos existentes siguen funcionando.
6. No crear pedidos de prueba ni movimientos financieros en producción.
7. No desplegar sin autorización explícita del propietario.

## Estado inicial observado
La pantalla `/operaciones` ya existe. En la versión revisada, los paneles de cocina, motoristas y liquidaciones son todavía textos informativos y no pantallas operativas completas. Este documento registra el alcance pendiente; no significa que dichas funciones estén implementadas ni probadas.
