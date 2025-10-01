# Ranger's Bakery Web App — Auditoría de Código

## Hallazgos Críticos

1. **Simulación silenciosa de pagos Square** (resuelto)
   Cuando las variables `SQUARE_ACCESS_TOKEN` o `SQUARE_APPLICATION_ID` no estaban configuradas, la función Edge `square-payment` marcaba los pagos como completados con datos simulados. En producción, una mala configuración podía permitir confirmar pagos sin haber cobrado realmente, lo que representaba un riesgo financiero severo. **Actualización:** la función ahora devuelve un error explícito cuando faltan las credenciales, evitando cualquier simulación silenciosa.
2. **Política CORS demasiado restrictiva por defecto**  
   Tanto `square-payment` como `p2p-payment` bloquean cualquier origen cuando `ALLOWED_ORIGIN` no está definido (valor por defecto `''` en producción). Esto provoca errores 403 en clientes legítimos si la variable no se configura perfectamente, afectando disponibilidad. Conviene usar una lista segura de orígenes permitidos y proporcionar mensajes de configuración claros o fallar durante el despliegue.
3. **Gestión incorrecta de errores al actualizar roles**  
   En `UserManagement`, si la API `/api/users` responde con error al actualizar el rol, la interfaz igualmente informa éxito y muta el estado local. Esto genera un desajuste con los permisos reales y puede confundir a administradores. Debe mostrarse el error real y evitar modificar el estado o mostrar notificaciones de éxito cuando la operación falla.
4. **Validación insuficiente de `newRole` en la API**  
   El endpoint `/api/users` acepta cualquier cadena como `newRole`, lo que podría permitir roles no previstos (p. ej. `"admin"`) y dejar datos inconsistentes. Debe validarse contra un conjunto fijo (`owner`, `employee`, `customer`, etc.) antes de ejecutar la actualización.
5. **Registro en consola de datos sensibles de autenticación**  
   La página `/auth` registra en consola correos electrónicos y errores detallados de Supabase. En producción, estos logs pueden exponer datos de usuarios y credenciales parcialmente. Se recomienda limitar el logging sensible o habilitarlo únicamente en entornos de desarrollo.

## Observaciones Adicionales

- El helper `createUnavailableClient` devuelve un cliente de Supabase que siempre responde éxito silencioso. Aunque evita fallos, puede enmascarar configuraciones incorrectas y dificultar la detección de errores. 
- Las funciones Edge deberían compartir un módulo común para cabeceras CORS y validaciones de origen con mensajes de diagnóstico más visibles. 
- Considere añadir pruebas automatizadas (unitarias y de integración) para los flujos de pago y gestión de usuarios, ya que actualmente no se encontraron suites de test. 
- Documentar explícitamente las variables de entorno obligatorias en README o `.env.example` ayudaría a prevenir despliegues incompletos.
