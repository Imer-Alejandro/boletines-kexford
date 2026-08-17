# Entregabilidad de correo (SPF, DKIM, DMARC)

Este servidor envía boletines usando el SMTP corporativo de Kexford. Para producción, el dominio del remitente debe tener registros DNS correctos.

## Remitente

- Configurar `SMTP_USER` con una cuenta autorizada del dominio (por ejemplo `servicioalcliente@kexford.com`).
- El dominio visible en `From` debe coincidir con el dominio autenticado.

## SPF

Publicar un registro TXT en el dominio raíz:

```txt
v=spf1 include:_spf.kexford.com ~all
```

Ajustar el `include` al proveedor/hosting SMTP real. Solo deben autorizarse los servidores que envían correo.

## DKIM

1. Generar par de claves DKIM en el servidor SMTP o proveedor de correo.
2. Publicar el selector en DNS:

```txt
default._domainkey.kexford.com. TXT "v=DKIM1; k=rsa; p=..."
```

3. Verificar que el servidor firme los mensajes salientes.

## DMARC

Publicar política en `_dmarc.kexford.com`:

```txt
v=DMARC1; p=quarantine; rua=mailto:dmarc@kexford.com; fo=1
```

Empezar con `p=none` en pruebas y subir a `quarantine` o `reject` cuando SPF/DKIM estén estables.

## Checklist previo a producción

- [ ] SPF validado con herramienta externa (MXToolbox, Google Admin Check)
- [ ] DKIM activo y alineado con el dominio From
- [ ] DMARC publicado
- [ ] Enlace de baja operativo (`APP_BASE_URL/unsubscribe/:token`)
- [ ] Política de privacidad accesible (`PRIVACY_POLICY_URL`)
- [ ] Prueba de envío a Gmail, Outlook y Yahoo
- [ ] Footer legal con derechos reservados a Sanchez Business & Cop
