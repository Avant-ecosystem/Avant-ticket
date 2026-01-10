# Docker Setup

## Desarrollo

Para levantar solo PostgreSQL y Redis (el backend corre localmente):

```bash
docker-compose -f docker-compose.dev.yml up -d
```

Para detener:
```bash
docker-compose -f docker-compose.dev.yml down
```

## Producción

Para levantar todo (PostgreSQL, Redis y Backend):

```bash
docker-compose up -d
```

Para detener:
```bash
docker-compose down
```

Para ver logs:
```bash
docker-compose logs -f backend
```

## Variables de entorno

Asegúrate de tener un archivo `.env` con:
- `JWT_SECRET`: Clave secreta para JWT
- `QR_SECRET_KEY`: Clave de 32 bytes en base64 para QR
- `FRONTEND_URL`: URL del frontend (opcional)

## Notas

- Los datos de PostgreSQL y Redis se persisten en volúmenes Docker
- El backend espera a que PostgreSQL y Redis estén saludables antes de iniciar
- En producción, el backend ejecuta automáticamente las migraciones de Prisma

