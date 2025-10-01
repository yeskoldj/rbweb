# Informe de revisión de seguridad

## Resumen ejecutivo

Se identificaron tres hallazgos con impacto directo en la seguridad de la plataforma:

1. **Falta de control de acceso en notificaciones internas**: cualquier usuario autenticado puede forzar cargas de pedidos/cotizaciones mediante la función Edge `send-notification-email`, lo que permite enumerar órdenes legítimas y generar spam hacia correos del negocio.
2. **Posible inyección de HTML en plantillas de correo**: los campos controlados por usuarios (`special_requests`, `event_details`, notas de cotización, etc.) se interpolan sin sanitización en múltiples plantillas HTML, habilitando payloads de XSS/ataques de ingeniería social en los clientes de correo receptores.
3. **Subidas públicas sin restricciones al bucket `temp-uploads`**: la política de Storage permite a cualquier visitante subir archivos arbitrarios sin validaciones de tamaño/tipo, lo cual expone a abusos de almacenamiento y potencial distribución de malware.

A continuación se detallan los hallazgos y las recomendaciones específicas.

## 1. Control de acceso insuficiente en `send-notification-email`

- **Ubicación**: `supabase/functions/send-notification-email/index.ts`.
- **Descripción**: Para los tipos `business_new_order` y `new_quote` la función usa una clave `service_role` para leer pedidos/cotizaciones por ID **antes** de verificar que quien invoca sea personal autorizado. Basta con estar autenticado y conocer/derivar un UUID válido para obtener respuestas distintas (200/404), lo que confirma la existencia de registros y fuerza correos automáticos al negocio.【F:supabase/functions/send-notification-email/index.ts†L360-L410】
- **Impacto**: Enumeración de pedidos y correo no deseado a direcciones sensibles. Un atacante podría automatizar la prueba de UUIDs o reutilizar IDs observados previamente para inundar el inbox del negocio con correos falsos o provocar filtraciones indirectas de datos (vía contenido del mensaje enviado a terceros de confianza).
- **Recomendación**:
  - Exigir `isStaffRole(auth.role)` para cualquier rama `isBusinessType` antes de consultar con la clave de servicio.
  - Como defensa adicional, validar que `orderData.user_id === auth.userId` cuando el solicitante no sea staff.
  - Registrar y limitar la frecuencia (rate limiting) de este endpoint para evitar abuso.

## 2. Campos sin sanitizar en correos HTML

- **Ubicaciones**: `supabase/functions/send-notification-email/index.ts` y `supabase/functions/send-quote-response/index.ts`.
- **Descripción**: Distintos valores procedentes de usuarios (por ejemplo `special_requests`, `formattedQuoteSummary`, `adminNotesText`) se interpolan directamente en cadenas HTML dentro de los correos que se envían tanto a clientes como al negocio, sin escape ni filtrado.【F:supabase/functions/send-notification-email/index.ts†L601-L672】【F:supabase/functions/send-notification-email/index.ts†L724-L728】【F:supabase/functions/send-quote-response/index.ts†L219-L223】
- **Impacto**: Un atacante puede introducir HTML/JS malicioso en esos campos. Aunque muchos clientes de correo bloquean scripts, el contenido puede romper el diseño del correo, inyectar enlaces de phishing o activar cargas útiles en clientes menos seguros.
- **Recomendación**:
  - Escapar los valores dinámicos antes de incorporarlos en HTML (ej. usar una función `escapeHtml`).
  - Alternativamente, renderizar los correos usando plantillas que efectúen el escape automáticamente (Handlebars, MJML con expresiones seguras, etc.).
  - Validar/sanitizar la entrada en el momento del guardado (p. ej. limitar longitud, caracteres permitidos).

## 3. Subidas anónimas al bucket `temp-uploads`

- **Ubicación**: `supabase/migrations/20241015123000_temp_uploads_policies.sql`.
- **Descripción**: La política `Allow public uploads to temp-uploads` concede permiso de `insert` al rol `public` sin ninguna restricción adicional.【F:supabase/migrations/20241015123000_temp_uploads_policies.sql†L6-L12】 El front-end impone límites (5 MB) pero no existe validación en el Edge/DB, por lo que un atacante puede subir grandes cantidades de archivos o ficheros peligrosos directamente contra la API de Storage.
- **Impacto**: Riesgo de agotamiento de almacenamiento, potencial distribución de archivos maliciosos y costes adicionales.
- **Recomendación**:
  - Añadir lógica de validación en un Storage hook o Edge Function (validar tamaño/MIME y rechazar extensiones no deseadas).
  - Considerar requerir autenticación para subir y emitir URL firmadas de subida desde el backend.
  - Implementar tareas periódicas que purguen archivos antiguos del bucket temporal.

## Revisión de políticas RLS

- Las tablas críticas (`orders`, `quotes`, `profiles`) tienen RLS habilitado y políticas que limitan inserciones públicas y lectura por parte del cliente final.【F:supabase/migrations/20250315093000_strengthen_rls_policies.sql†L3-L97】
- Se recomienda complementar estas políticas con controles de auditoría (ej. triggers que registren cambios de estado de órdenes) y pruebas automáticas para garantizar que futuros cambios no relajen las condiciones actuales.

## Próximos pasos sugeridos

1. Ajustar la función `send-notification-email` para reforzar la autorización antes de cualquier consulta con la clave de servicio.
2. Introducir sanitización/escape en todas las plantillas de correo y validar contenido al persistirlo.
3. Endurecer la política de subidas a `temp-uploads` (autenticación, límites y limpieza programada).
4. Añadir pruebas de seguridad automatizadas (linting, scanners de dependencias y tests de RLS) dentro del pipeline de CI/CD.

Implementar estas medidas reducirá la superficie de ataque y alineará el proyecto con buenas prácticas de seguridad para aplicaciones sobre Supabase/Next.js.
