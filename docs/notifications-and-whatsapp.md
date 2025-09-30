# Notificaciones por correo y WhatsApp

## ¿Qué hace cada función?
- **`send-quote-response`** actualiza la fila de la cotización, arma un correo HTML con el precio aprobado y, si hay credenciales de WhatsApp, envía el mismo resumen al cliente y a la lista interna del negocio. El helper compartido normaliza los teléfonos y decide entre plantilla aprobada o mensaje de texto simple.【F:supabase/functions/send-quote-response/index.ts†L1-L200】【F:supabase/functions/_shared/whatsapp.ts†L1-L120】
- **`send-notification-email`** centraliza los correos de estados de orden. Con el parámetro `type` recibe tanto eventos de clientes (confirmación, pago listo, recogida) como alertas internas (`business_new_order`). Después de mandar el correo mediante Resend, reusa el helper de WhatsApp para escribir al cliente y a todos los números del negocio configurados, incluyendo los cambios de estado como "orden lista para pagar".【F:supabase/functions/send-notification-email/index.ts†L1-L240】【F:supabase/functions/send-notification-email/index.ts†L980-L1056】
- **`notifyBusinessAboutOrder`** en el frontend crea un único llamado a `send-notification-email` con todos los correos internos juntos. Así se evita duplicar las alertas por WhatsApp cuando entra una orden nueva y se mantiene un registro uniforme del resultado para cada destinatario.【F:lib/orderNotifications.ts†L1-L120】

## Configurar las credenciales de WhatsApp Business
Guarda estos secretos en Supabase (`supabase secrets set --env-file supabase/.env.whatsapp` o desde *Project Settings → API → Edge Function Secrets*):

| Variable | Uso |
| --- | --- |
| `WHATSAPP_TOKEN` | Token permanente/larga duración de la Cloud API. |
| `WHATSAPP_PHONE_NUMBER_ID` | `phone_number_id` del número verificado que enviará los mensajes. |
| `WHATSAPP_GRAPH_VERSION` | Opcional. Versión del endpoint (por defecto `v18.0`). |
| `WHATSAPP_TEMPLATE_LANGUAGE` | Idioma por defecto de las plantillas (por defecto `es`). |
| `WHATSAPP_TEMPLATE_CUSTOMER_ORDER_CONFIRMATION` | Nombre/ID de la plantilla aprobada para confirmar órdenes al cliente. |
| `WHATSAPP_TEMPLATE_CUSTOMER_QUOTE_CONFIRMATION` | Plantilla para confirmar la recepción de una cotización. |
| `WHATSAPP_TEMPLATE_CUSTOMER_ORDER_PAYMENT_READY` | Plantilla para avisar que la orden está lista para pagar. |
| `WHATSAPP_TEMPLATE_CUSTOMER_ORDER_READY_FOR_PICKUP` | Plantilla para avisar que la orden está lista para recoger. |
| `WHATSAPP_TEMPLATE_BUSINESS_ORDER_ALERT` | Plantilla para avisos internos (nueva orden, pago, recogida). |
| `WHATSAPP_TEMPLATE_BUSINESS_QUOTE_ALERT` | Plantilla interna para nuevas cotizaciones. |
| `WHATSAPP_BUSINESS_RECIPIENTS` | Lista separada por comas o saltos de línea con los números del negocio que deben recibir cada alerta. |

Si omites alguna plantilla, la función cae automáticamente a un mensaje de texto simple utilizando la misma información del correo. Para los correos internos y fallback de WhatsApp asegúrate de definir también en el frontend `NEXT_PUBLIC_BUSINESS_NOTIFICATION_EMAIL` y `NEXT_PUBLIC_EMPLOYEE_NOTIFICATION_EMAILS` (separadas por comas).【F:lib/orderNotifications.ts†L8-L57】

## Flujo de mensajes que recibe el negocio
1. **Nueva orden** – Al crear una orden personalizada desde el formulario, `notifyBusinessAboutOrder` envía un correo a todas las direcciones configuradas y un único mensaje de WhatsApp a cada número de `WHATSAPP_BUSINESS_RECIPIENTS` con el resumen de la orden.【F:app/order/OrderForm.tsx†L856-L928】【F:lib/orderNotifications.ts†L58-L120】
2. **Precio aprobado / orden lista para pagar** – El tablero administrativo actualiza la orden, llama a `send-notification-email` con `type: 'customer_order_payment_ready'` y se dispara el correo al cliente y el WhatsApp tanto al cliente como al negocio.【F:app/dashboard/page.tsx†L408-L488】【F:supabase/functions/send-notification-email/index.ts†L200-L320】
3. **Otros estados** – Puedes reutilizar la misma función para confirmar órdenes (`type: 'order_confirmation'`) o avisar que está lista para recoger (`type: 'customer_order_ready_for_pickup'`); en todos los casos los números del negocio reciben el push automáticamente si `WHATSAPP_BUSINESS_RECIPIENTS` está configurado.【F:supabase/functions/send-notification-email/index.ts†L60-L200】【F:supabase/functions/send-notification-email/index.ts†L200-L320】

## Cómo probar rápidamente
- **Simulación sin credenciales**: si `RESEND_API_KEY` o las claves de WhatsApp no están presentes, la función devuelve un JSON indicando que simuló el envío e incluye el payload que habría salido. Útil para pruebas locales sin consumir conversaciones.【F:supabase/functions/send-notification-email/index.ts†L240-L320】
- **Prueba con curl**:
  ```bash
  curl -X POST "https://<SUPABASE_URL>/functions/v1/send-notification-email" \
    -H "Authorization: Bearer <ANON_KEY>" \
    -H "Content-Type: application/json" \
    -d '{
      "to": ["panaderia@ejemplo.com"],
      "type": "customer_order_payment_ready",
      "language": "es",
      "orderData": {
        "id": "1234",
        "customer_name": "Maria",
        "customer_phone": "+1 973 555 0101",
        "total": 85,
        "payment_url": "https://app.rangersbakery.com/order?orderId=1234"
      }
    }'
  ```
  Revisa el panel de WhatsApp Business para confirmar que los números listados recibieron la plantilla o el texto.
