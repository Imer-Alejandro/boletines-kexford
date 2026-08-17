# Server Boletín Kexford

## Etapa 1 — Diseño y definición de la arquitectura

Este proyecto es un servidor Node.js para administrar campañas de boletines y enviar correos programados usando Supabase como fuente de verdad.

### Objetivo
- Backend API para campañas y clientes
- Worker de envío de correos
- Persistencia total en PostgreSQL/Prisma
- Scheduler compatible con Vercel
- SMTP corporativo con Nodemailer

### Componentes iniciales
- `src/index.js`: servidor Express básico
- `src/routes/campaigns.js`: endpoints de campañas
- `src/routes/customers.js`: endpoints de clientes
- `src/worker.js`: lógica de procesamiento de envíos
- `src/lib/prismaClient.js`: cliente Prisma
- `src/lib/emailSender.js`: transportador SMTP Nodemailer
- `src/lib/emailTemplate.js`: plantilla HTML de correo
- `prisma/schema.prisma`: definición de tablas e índices
- `api/worker.js`: wrapper para Vercel Scheduled Function

### Flujos principales
1. Crear campaña y generar `campaign_recipients` en Supabase.
2. Worker programado lee destinatarios `PENDING`.
3. Marca registros `PROCESSING`, envía con SMTP, actualiza `SENT` / `FAILED`.
4. Si el servidor se reinicia, la base de datos mantiene el estado.

### Próximos pasos de la primera iteración
1. Definir tablas y migraciones en Supabase.
2. Implementar API para creación de campaña.
3. Crear generación de horarios y cola de envíos.
4. Configurar worker de envío.
5. Ajustar scheduler Vercel.

### Variables de entorno esperadas
- `DATABASE_URL`
- `DIRECT_URL`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASSWORD`
- `APP_BASE_URL`
- `PRIVACY_POLICY_URL`
- `MAX_ATTEMPTS`
- `PROCESSING_TIMEOUT_SECONDS`
- `RECOVERY_LIMIT_PER_RUN`
- `RECIPIENT_BATCH_SIZE`
- `IMPORT_BATCH_SIZE`

### Endpoints de campañas
- `GET /campaigns` — listar campañas
- `POST /campaigns` — crear campaña (solo si no hay otra activa)
- `GET /campaigns/:id` — detalle
- `GET /campaigns/:id/recipients` — destinatarios
- `POST /campaigns/:id/pause` — pausar envíos
- `POST /campaigns/:id/resume` — reanudar envíos
- `POST /campaigns/:id/cancel` — cancelar campaña y pendientes
- `POST /campaigns/:id/retry-failed` — reprogramar fallidos

### Baja de boletines
- `GET /unsubscribe/:token` — confirmación HTML
- `POST /unsubscribe/:token` — marcar correo como dado de baja en DB

Ver también `docs/EMAIL_DELIVERABILITY.md` para SPF/DKIM/DMARC.

---

## Notas
- No usar `setInterval()` ni `setTimeout` como mecanismo principal de programación.
- El estado debe almacenarse en Supabase.
- El worker debe procesar solo tareas con `scheduled_at <= NOW()` y priorizar envíos atrasados de forma progresiva.
