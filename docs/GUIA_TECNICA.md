# Guía técnica y de continuidad — Noah's Pedidos

> Objetivo: que otra persona desarrolladora pueda localizar el código, comprender la infraestructura, preparar un entorno, diagnosticar la publicación y hacer cambios sin depender de conversaciones anteriores.
>
> **Regla de seguridad:** este documento no debe contener contraseñas, PIN, tokens, cookies, claves API, credenciales de Cloudflare ni datos secretos de producción. Guardarlos únicamente como secretos de Cloudflare/GitHub o variables locales ignoradas por Git.

## 1. Repositorio y punto de partida

- Repositorio: https://github.com/Carloslopezmed/Noahs
- Rama principal: `main`
- Aplicación: **Noah's · Pedidos por agencia**, independiente de Javi Pizza.
- Último commit de referencia conocido al iniciar esta documentación: `cd29510` (confirmar siempre el HEAD actual en GitHub antes de trabajar).
- Commit de corrección de D1 mencionado en el historial: **Fix Cloudflare D1 database binding for noahs-db**.
- La aplicación utiliza Next.js 16.3.4 con Vinext/Vite, React 19, TypeScript, Drizzle ORM y Cloudflare Workers.
- Gestor de paquetes: pnpm 11.25.0.
- Versión de Node requerida: `>=22.13.0`.

Empieza leyendo este documento y después `README.md`, `package.json`, `db/schema.ts`, `drizzle/`, `lib/noahs/service.ts`, rutas API y pruebas.

## 2. Infraestructura y publicación

- Proveedor de ejecución: Cloudflare Workers.
- Nombre del Worker conocido: `noahs`.
- URL anterior de Workers que llegó a abrir correctamente: `https://252d2b61-noahs.carloslopezmed.workers.dev/`.
- URL anterior estable conocida: `https://noahs.carloslopezmed.workers.dev/` (el propietario indicó que iba a cambiar el subdominio de cuenta).
- Subdominio de cuenta nuevo solicitado: `noahspedidos`.
- URL deseada: `https://noahs.noahspedidos.workers.dev/`.
- Estado de la URL nueva en el último reporte: Cloudflare mostraba el Worker bajo ese dominio, pero el navegador daba `ERR_SSL_VERSION_OR_CIPHER_MISMATCH`. **No se ha confirmado que HTTPS esté funcionando en el nuevo dominio.** Verificar el dominio y el estado de despliegue directamente en Cloudflare antes de declararlo resuelto.
- Dominio de producción y dominio `workers.dev` son ajustes de la cuenta/Worker, no solo del código. Cambiar el subdominio de la cuenta puede dejar de enrutar inmediatamente el dominio antiguo y puede tardar un tiempo en habilitar el nuevo.

### Verificaciones en Cloudflare

1. Abrir la cuenta correcta de Cloudflare y seleccionar Workers & Pages → Worker `noahs`.
2. Revisar **Settings → Domains & Routes**. Confirmar que `noahs.noahspedidos.workers.dev` aparece como dominio `workers.dev`, habilitado y asociado al Worker correcto.
3. Revisar la pestaña de despliegues/actividad y confirmar qué versión está activa y recibe tráfico.
4. Verificar el binding D1 llamado exactamente `DB` y que su identificador corresponde a la base de datos real de este proyecto.
5. Comprobar logs y errores de runtime después de desplegar.
6. Probar la URL HTTPS desde una ventana privada y desde otra red/dispositivo. No cambiar más ajustes de cuenta si no se conoce el efecto.
7. No afirmar que el nuevo dominio funciona hasta que la negociación HTTPS y la aplicación se hayan comprobado.

## 3. Base de datos D1

- La aplicación usa Cloudflare D1 (SQLite) mediante Drizzle.
- Esquema de aplicación: `db/schema.ts`.
- Migraciones: `drizzle/`.
- Configuración de Drizzle: `drizzle.config.ts`.
- El Worker necesita un binding D1 llamado `DB`.
- Hubo un fallo previo porque la configuración del binding apuntaba a un ID de base de datos ficticio: `00000000-0000-4000-8000-000000000000`.
- En el historial se menciona la creación/configuración de una base de datos llamada `noahs-db` y anteriormente una base `site-creator-d1`. **No asumir cuál es la base de producción activa ni copiar un ID antiguo**: comprobar en Cloudflare qué base está enlazada al Worker actual.
- Antes de cualquier migración de producción, identificar la base correcta, revisar las migraciones pendientes y asegurar una copia de seguridad/exportación recuperable.
- No editar migraciones que ya se aplicaron en producción; crear una migración nueva.
- No ejecutar pruebas o semillas sobre producción.

La configuración declarativa de Wrangler se debe localizar en los archivos versionados del repositorio (buscar `wrangler`, `cloudflare`, `d1_databases` y `binding`). Confirmar el archivo realmente utilizado por el build antes de modificarlo: el script de inicio utiliza `dist/server/wrangler.json`, generado por la compilación.

## 4. Preparar el entorno local

1. Instalar Node.js 22.13.0 o superior y pnpm 11.25.0 compatible.
2. Clonar el repositorio y entrar en él:
   ```sh
   git clone https://github.com/Carloslopezmed/Noahs.git
   cd Noahs
   git switch main
   ```
3. Instalar dependencias según el flujo de CI del proyecto:
   ```sh
   npm run install:ci
   ```
   Si ese script no funciona en el entorno disponible, revisar `scripts/install-pnpm.sh` y las instrucciones actuales del proyecto; no sustituir a ciegas el lockfile.
4. Ejecutar pruebas y compilación antes de cambiar código:
   ```sh
   node tests/run.mjs
   node node_modules/typescript/bin/tsc --noEmit
   npm run build
   ```
5. Para desarrollo local, consultar los scripts actuales en `package.json`. `npm run dev` inicia el flujo de desarrollo del framework. `npm run start` ejecuta Wrangler local sobre la compilación, con estado local en `.wrangler/state`.
6. Revisar `.gitignore` antes de guardar cualquier archivo de configuración local. Nunca subir `.dev.vars`, credenciales, estado de Wrangler, dumps de la base o datos personales.

## 5. Scripts y tecnologías

Scripts declarados en `package.json`:
- `npm run dev`: servidor de desarrollo Vinext.
- `npm run build`: compilación de producción.
- `npm run start`: Wrangler local usando la compilación.
- `npm run lint`: ESLint.
- `npm run db:generate`: genera migraciones con Drizzle Kit.
- `node tests/run.mjs`: suite de pruebas de servicio.
- `node node_modules/typescript/bin/tsc --noEmit`: comprobación TypeScript.

Dependencias relevantes:
- Next.js 16.3.4, Vinext 1.0.0-beta.5, Vite 8, React 19.
- Cloudflare Vite plugin y Wrangler 4.
- Drizzle ORM / Drizzle Kit con SQLite.
- TypeScript 5.9.

## 6. Dónde investigar antes de cambiar

- `README.md`: especificación funcional detallada, reglas de negocio, contenido de menú y manual operativo.
- `package.json`: scripts, versiones y dependencias.
- `db/schema.ts`: tablas y relaciones.
- `drizzle/`: migraciones SQL versionadas.
- `drizzle.config.ts`: configuración de generación de migraciones.
- `lib/noahs/service.ts`: lógica de negocio/validación de pedidos, precios, cobertura, horarios, estados y revisiones (confirmar el path en el HEAD actual).
- `tests/run.mjs` y archivos de `tests/`: pruebas y reglas esperadas.
- Directorios de rutas API: comprobar autorización y validación en el servidor; no confiar en validaciones solo del navegador.
- `assets/brand/` y `public/brand/`: recursos de identidad visual.

Si algún archivo indicado no existe en la rama actual, buscar su nombre real y actualizar esta guía en el mismo cambio de documentación.

## 7. Arquitectura funcional y reglas importantes

La aplicación cubre catálogo por agencia, carrito, registro y seguimiento de pedidos, panel de caja, cocina, reparto, cobros, liquidaciones y conteos de caja. Hay tres agencias: Plaza Balcones, Ciudad Peronia y Ciudad Satélite.

- El servidor debe ser la autoridad para precios, permisos, alcance de agencia, disponibilidad, horario, cobertura, estado del pedido y totales.
- El rol Maestro general administra las agencias; Encargado tiene alcance limitado a su agencia.
- Usuarios operativos tienen usuario individual y PIN de ocho dígitos. No hay PIN predeterminado en el repositorio.
- El registro inicial de Maestro está diseñado para cerrarse tras el primer uso; confirmar el estado real antes de abrir acceso público.
- Los pedidos pueden solicitar confirmación manual por WhatsApp: la aplicación no envía el mensaje automáticamente; el usuario debe pulsar enviar.
- La página no procesa pagos con tarjeta. Registrar tarjeta solo después de verificar el pago en el POS.
- No marcar dinero como recibido hasta que se haya contado físicamente. Los movimientos financieros y auditoría deben conservar integridad e historial.
- Hay reglas de productos por agencia, incluyendo el módulo de comida china restringido a Plaza Balcones. No eliminar las validaciones del servidor aunque exista una restricción visual en el catálogo.
- La dirección/ubicación de entrega es información sensible: limitarla al personal que la necesita y no exponerla al seguimiento público.
- Consultar el `README.md` para los precios, combos, ingredientes confirmados, horarios y excepciones de cada agencia. No inventar precios ni componentes.

## 8. Seguridad y privacidad

La documentación del proyecto describe:
- Cookies de sesión HttpOnly, Secure y SameSite Strict.
- PIN almacenado como derivación PBKDF2-SHA256 con sal individual; limitación de intentos.
- Protección de origen para mutaciones.
- Control de roles y agencia en servidor.
- Revisiones optimistas para evitar actualizaciones concurrentes incompatibles.
- Auditoría y movimientos financieros con garantías transaccionales.
- Códigos públicos de seguimiento que no deben revelar teléfono ni dirección.

Tratar estas características como expectativas documentadas y verificarlas en el código al hacer cambios de seguridad. No registrar PIN, cookies, tokens ni ubicaciones privadas en logs. No añadir credenciales reales a README, issues, commits o código.

## 9. Procedimiento recomendado para cada cambio

1. Leer el README y localizar los módulos afectados.
2. Confirmar rama, commit actual y estado limpio del árbol de trabajo.
3. Crear una rama descriptiva para el cambio.
4. Implementar la modificación mínima y agregar/actualizar pruebas.
5. Ejecutar pruebas, TypeScript, lint y build según sea posible.
6. Revisar que la validación crítica ocurra en el servidor y que las restricciones por agencia sigan aplicándose.
7. Revisar el diff buscando secretos, datos personales, cambios accidentales y migraciones destructivas.
8. Documentar cualquier cambio de variables, bindings, migraciones, despliegue o comportamiento.
9. Hacer commit y pull request o merge siguiendo los permisos del repositorio.
10. Desplegar solo después de confirmar cuenta, Worker, binding D1 y entorno de destino.
11. Verificar URL, logs y un flujo de prueba seguro después del despliegue. No usar pedidos reales ni cobros reales para pruebas.

## 10. Datos que se deben confirmar en cada sesión de mantenimiento

- HEAD de `main` y commit desplegado.
- Nombre del Worker y cuenta Cloudflare donde vive.
- Dominio activo y estado HTTPS.
- Nombre y UUID de la base D1 realmente enlazada como `DB` (consultar Cloudflare; no poner el UUID aquí si no es necesario).
- Variables y secretos requeridos, sus nombres y dónde se configuran, nunca sus valores.
- Migraciones aplicadas en producción.
- Estado de acceso privado/protección del sitio.
- Resultado de pruebas, compilación y smoke test.
- Fecha, responsable, cambios realizados y procedimiento de reversión.

## 11. Estado conocido al redactar esta guía

- La aplicación llegó a desplegarse y abrirse en el dominio anterior con una versión de Worker identificada como `252d2b61`.
- Se corrigió previamente un binding D1 que usaba un ID placeholder.
- El propietario cambió el subdominio de cuenta de Workers de `carloslopezmed` a `noahspedidos`.
- La URL nueva deseada es `https://noahs.noahspedidos.workers.dev/`; el último error reportado fue `ERR_SSL_VERSION_OR_CIPHER_MISMATCH`. El estado debe comprobarse en Cloudflare, no darse por resuelto solo porque el panel muestre el nombre.
- La compilación y pruebas de servicio se habían reportado como verificadas; la revisión visual completa en navegador quedaba pendiente.
- Este documento resume datos conocidos y puntos de verificación. No sustituye una inspección actual de Cloudflare ni garantiza que cada binding o URL siga vigente.

## 12. Enlaces útiles

- Repositorio: https://github.com/Carloslopezmed/Noahs
- README: https://github.com/Carloslopezmed/Noahs/blob/main/README.md
- Package scripts/dependencias: https://github.com/Carloslopezmed/Noahs/blob/main/package.json
- Cloudflare Workers dashboard: https://dash.cloudflare.com/
