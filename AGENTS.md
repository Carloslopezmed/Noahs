# Noah’s

Este repositorio es independiente de Javi Pizza. Preservar project_id en .openai/hosting.json. No copiar pedidos, usuarios, PIN, sesiones, secretos ni bases de datos de otros proyectos.

Toda autorización y separación de agencias se valida en el servidor. Solo master/manager asignan órdenes. Precios, cobertura y horario se calculan en servidor. Mantener revisiones e idempotencia y no reescribir migraciones aplicadas.

No inventar precios, recetas, acompañamientos, números de WhatsApp, direcciones ni zonas. Los productos con datos pendientes no se venden. Horario confirmado 11:00–21:00 America/Guatemala. No activar fidelidad sin aclarar alcance entre agencias.

Registrar un pedido no lo confirma. WhatsApp requiere envío por el cliente. No automatizar mensajes. Registrar tarjeta solo documenta un cobro verificado fuera del sitio; no es una pasarela.

Mantener asignaciones, cobros, recepción de efectivo y conteos separados. Un conteo acumulado no es un cierre de turno. Historial y movimientos financieros inmutables. Las pruebas se ejecutan en SQLite aislado, nunca creando ventas o dinero en producción.

Antes de publicar ejecutar tests/run.mjs, TypeScript y build. No subir credenciales ni archivos de ejecución locales. Guardar documentación de pendientes en README.
