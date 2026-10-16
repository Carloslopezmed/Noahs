# Noah’s · Pedidos por agencia

Aplicación independiente de Javi Pizza. Catálogo visual, carrito, pedidos y seguimiento, operación por agencia, usuarios con PIN de ocho dígitos, cocina, reparto, cobros, liquidaciones y conteos de caja. No contiene usuarios ni datos operativos de otros negocios.

## Primer acceso

La versión inicial está publicada con acceso privado del propietario. Abrí **Acceso de personal** al pie de la tienda y creá tu propio usuario Maestro general y PIN. El registro inicial requiere identidad de ChatGPT y se cierra definitivamente al completarse. No hay PIN predeterminado ni contraseña en el repositorio. Completá este paso antes de ampliar el acceso del sitio. Luego creá encargados y empleados en **Usuarios**, cada uno con agencia y rol.

El acceso privado del sitio es una capa adicional: mientras se conserve, los clientes y empleados externos no pueden entrar sin acceso al sitio. Para una apertura pública, primero completar la configuración comercial, inicializar el maestro y revisar las políticas de acceso.

## Identidad visual

Logotipo oficial facilitado por el propietario, conservado en `assets/brand/`, con versiones optimizadas en `public/brand/`. Se usa el archivo transparente en cabecera, pie de página, operaciones e icono del sitio. Paleta: amarillo ámbar, naranja, marrón y fondos crema. Se conservan las proporciones y el lema original «Sacando fibra».

## Complementos · Salchipapas

Salchipapas Q35: papas fritas con salchicha y aderezos, con fotografía facilitada. Se muestran en **Complementos** para las tres agencias según disponibilidad. No se incluyen bebida ni ingredientes adicionales no confirmados.

## Comida china · Plaza Balcones

Combo Favorito Q165: un arroz frito de 2 libras, un chao mein de 2 libras, diez unidades de wantán y Pepsi de 1.5 litros. Se muestra en **Comida china**, con la fotografía facilitada. Es de contenido fijo; no se inventan variedades de proteína ni de relleno para el wantán incluido. Se restringe a Plaza Balcones tanto en catálogo como al registrar el pedido.

Combo Express Q95: arroz frito, wantán y Pepsi de 1.5 litros. Se muestra en **Comida china** de Plaza Balcones. Las cantidades de arroz y wantán no fueron indicadas: no reutilizar las del Combo Favorito ni inventarlas.

## Complementos de Plaza Balcones

Porciones de diez unidades: wantán de pollo Q55, camarón Q65 y cangrejo Q55. Se asignan inicialmente a Plaza Balcones, la agencia indicada con comida china. El precio genérico de Q55 se aplica a pollo/cangrejo, con corrección expresa de camarón Q65. La autorización del catálogo restringe estos productos a esa agencia también en servidor.

El archivo recibido como «WANTAN DE CANGREJO(1).png» era idéntico al de camarón y decía camarón. Se usa la foto genérica de wantán como ilustración para cangrejo hasta recibir la foto correcta.

## Portada y postres

La Master protagoniza la portada con etiqueta **NUEVO**, fotografía individual y precios actualizados según agencia. Cheesecake Q20 se muestra en **Postres**.

## Combos de tortilla y quesadilla

Gigante Tortilla Q40, Tortiburguer Q50 y Quesadilla Q45. Todos incluyen papas y gaseosa y aparecen en **Combos** con las fotografías facilitadas. Son combos de contenido fijo: no se aplica el descuento de Q10 de hamburguesas solas ni el selector de hamburguesas de combos familiares. No se atribuyen rellenos o ingredientes no confirmados.

## Combos personalizables

Combo Martes Q110: 2 hamburguesas; pa’3 Q165: 3; pa’4 Q225: 4; para6 Q334: 6. Se puede elegir cualquier hamburguesa del menú individual, incluida Quesoburguesa, dentro del precio fijo del combo. Se respetan las desactivaciones de productos por agencia. Todos incluyen una porción de papas y una bebida por hamburguesa; esta instrucción actualiza la descripción anterior de bebida de 1.5 litros compartida. El nombre «Martes» se conserva sin inventar una restricción de días. Las selecciones se guardan en el pedido, cocina y WhatsApp.

## Secciones del menú y sugerencia final

Las fotos con acompañamientos se muestran en **Combos**, incluidas las nuevas fotos proporcionadas por el propietario. Las fotos individuales están en **Hamburguesas**, con precio Q10 menor. El selector de variante cambia foto y precio, y el carrito conserva ambos. El Combo 2 Smash Burger se vende a Q120 con su foto correspondiente.

**Chili Garlic Q25** se ofrece al final del carrito, antes del total y la confirmación. Es opcional, nunca se agrega automáticamente. Respeta disponibilidad y precio por agencia y se registra como un producto normal en pedido y WhatsApp.

## Hamburguesas solas y en combo

Todos los precios base de hamburguesa corresponden al combo. Cada hamburguesa sola cuesta Q10 menos; se elige antes de agregar. La variante se conserva en carrito, pedido, cocina y WhatsApp y se calcula en el servidor. La regla también aplica a los precios por agencia. No aplica a hot dogs, acompañamientos ni combos para compartir. No se descuenta en productos sin precio. Los acompañamientos solo se describen cuando están confirmados.

La fotografía de Plaza Balcones fue facilitada e identificada por el propietario y se muestra en su sección de agencia. No se reutiliza como foto de las otras agencias.

## Datos comerciales cargados

- Plaza Balcones / San Cristóbal: 5464 0659, 5.ª avenida 4-39, Mixco. WhatsApp pendiente de verificar. Comida china: Combo Favorito Q165 y wantán en Complementos.
- Ciudad Peronia: WhatsApp 50259102450. Dirección pendiente.
- Ciudad Satélite: 5614 2755. WhatsApp y dirección pendientes.
- Horario: 09:00–20:00, zona horaria America/Guatemala. No se publican días específicos no confirmados.
- Chicago Q30, Doridog Q30, Tradicional Q30 y Americano Q35, con los acompañamientos confirmados.
- Acompañamientos: Papas Barbiquiu Q35 (barbacoa, ranch, tocino y cilantro), Cheesy Papas Q35 (queso y tocino), Papas Fritas 6 onzas Q10.
- Doggy Dog pendiente de precio y composición. Quesoburguesa: combo Q40, sola Q30; torta de ¼ de libra, aderezos, pepinillos y pan gourmet. El combo incluye papas y Coca-Cola en lata de 237 ml. Combo 2 Smash Burger Q120, con dos Smash Burger fijas. Los combos Martes (2), pa’3, pa’4 y para6 exigen una selección por hamburguesa y se venden a sus precios confirmados. Cada hamburguesa incluye una porción de papas y una bebida.
- Domicilio deshabilitado hasta configurar zonas y tarifas. Retiro disponible en agencias con WhatsApp verificado y pedidos habilitados, dentro del horario.
- Fidelidad desactivada hasta definir si comparte sellos y premios entre agencias.

Las fotografías de hamburguesas son ilustrativas generadas con las referencias facilitadas. Las fotos de hot dogs y combos provienen de los archivos facilitados. Revisar contra las recetas definitivas antes de publicidad comercial.

## Manual breve

### Clientes
1. Elegí una agencia antes de agregar productos. Cambiar de agencia vuelve a validar productos y precios y borra la zona de entrega anterior.
2. Elegí productos. En los combos Martes (2), pa’3, pa’4 y para6, elegí cada hamburguesa mediante las tarjetas con fotografía. Los espacios numerados muestran tus selecciones y permiten cambiarlas; podés repetir hamburguesas. Cada una incluye papas y bebida. Es obligatorio completar todos los espacios antes de agregar el combo.
3. Completá nombre, teléfono y modalidad. Para domicilio, elegí una zona configurada y una dirección completa.
4. Registrá y abrí WhatsApp. **Pulsá enviar en WhatsApp** para solicitar la confirmación. La aplicación no envía mensajes automáticamente.
5. Guardá el código y consultalo en **Seguí tu pedido**. La barra de carga evita consultas repetidas durante una solicitud.

### Maestro general y encargado
- Maestro administra las tres agencias; encargado solo su agencia. Configurá WhatsApp verificado, dirección, horario, disponibilidad, precios y cobertura en **Configuración**.
- Creá usuarios con nombre, usuario individual, PIN de ocho dígitos, rol y agencia. Se puede editar nombre, restablecer PIN, desactivar o eliminar acceso. El historial conserva nombres y movimientos registrados.
- No se permite quitar el último maestro ni eliminar/desactivar/cambiar de agencia a un motorista con entregas o efectivo pendientes.
- Solo maestro/encargado asignan o liberan órdenes listas. Un motorista puede recibir varias, siempre de su agencia.

### Cajero
- Confirmá o cancelá pedidos recibidos después de coordinar con el cliente. Confirmar inicia el flujo operativo.
- La alarma viene habilitada. El navegador exige una interacción para reproducir audio: al tocar o usar el teclado se intenta activar. **Activada** indica disponibilidad; **Reactivar sonido** permite recuperarla. Solo la administración puede silenciar desde el tablero. Se repite cada cinco segundos mientras haya pedidos recibidos. El tablero consulta cada quince segundos.
- Registrá efectivo solo cuando lo recibas, o tarjeta después de verificar el pago en el POS. Esta página no procesa tarjetas.
- Para retiro, marcá entregado cuando el pedido esté listo y tenga cobro registrado.

### Cocina
- Consultá los pedidos confirmados de tu agencia. Marcá **Preparar** y después **Marcar listo**. No asigna motoristas ni registra cobros.
- Las tarjetas se paginan de doce en doce; el detalle muestra el contenido y las notas.

### Motoristas
- Solo ve sus pedidos asignados. Marcá **Salir a ruta** y registrá el cobro efectivamente recibido. Con cobro registrado, marcá **Entregado**.
- La asignación por sí sola no genera efectivo cobrado. Si caja cobró antes, no se duplica el cobro en reparto.

### Caja y liquidación
- Se muestran asignado activo, pendiente de cobro, efectivo cobrado, tarjeta, entregado a caja y saldo pendiente de cada motorista.
- **Recibir efectivo** solo se usa después de recibir y contar físicamente el dinero. Acepta entregas parciales; cada recepción es inmutable y no puede superar el saldo.
- **Efectivo en caja** = cobros directos en efectivo + entregas recibidas de motoristas. Tarjetas y efectivo aún en poder de motoristas se muestran aparte.
- **Registrar conteo** compara efectivo físico con el acumulado esperado y conserva la diferencia. Es un conteo acumulado: no cierra turnos, no reinicia saldos y no registra fondo inicial, gastos, retiros ni depósitos.
- Las tablas financieras consultan totales históricos; las listas operativas muestran los últimos 1,000 registros y el historial visible los últimos 100 eventos.

## Arquitectura y seguridad

Vinext/React sobre Workers y D1. El API aplica autenticación, roles y alcance de agencia en el servidor. `lib/noahs/service.ts` valida precios, cobertura, horarios, estados, motorista y revisiones. Cookies HttpOnly Secure SameSite Strict, sesiones con expiración, PIN PBKDF2 SHA-256 con sal individual, límites de intentos y defensa de origen para mutaciones. No se devuelve el hash ni el PIN. Los códigos de seguimiento no exponen teléfono ni dirección.

Las actualizaciones usan revisión optimista; las acciones y su auditoría se confirman en un lote atómico. SQLite protege agencia de orden, cobros e historial inmutables, último maestro y saldo de remesas. La idempotencia de pedido usa clave aleatoria única; la recepción usa ID único. Sin integraciones externas de pagos ni envíos automáticos.

## Desarrollo y verificación

```sh
node tests/run.mjs
node node_modules/typescript/bin/tsc --noEmit
npm run build
```

Pruebas aisladas con SQLite en memoria, mismo servicio que usa el API. Cubren acceso entre agencias y roles, precios, horarios/configuración, combos incompletos, idempotencia, estados/revisiones, asignación, cobros, remesas parciales, conteo, eliminación de usuario e integridad de historial. No escriben producción ni envían WhatsApp.

El esquema está en `db/schema.ts`, las migraciones en `drizzle/`. No modificar migraciones aplicadas. Semillas comerciales viven fuera de migraciones. No incluir credenciales, bases de datos, cookies ni archivos de ejecución locales en git.

La compilación y las pruebas de servicio se verificaron. La revisión visual y del flujo en navegador queda pendiente cuando haya un navegador de prueba disponible.

### Módulo de comida china
Sección independiente con enlace propio en la navegación, fuera del listado general de hamburguesas y combos. Incluye Combo Favorito Q165 y Combo Express Q95, únicamente para Plaza Balcones. Comparte carrito, agencia y validación del pedido.
