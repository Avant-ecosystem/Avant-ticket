# Avant Ticket Backend API

Backend RESTful API construido con NestJS para el sistema de tickets NFT en blockchain Vara/Polkadot. El backend orquesta y sincroniza datos con smart contracts existentes (Tickets + Marketplace), actuando como capa de abstracción y sincronización.

## 📋 Tabla de Contenidos

- [Características](#características)
- [Tecnologías](#tecnologías)
- [Configuración Inicial](#configuración-inicial)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Autenticación](#autenticación)
- [Endpoints](#endpoints)
  - [Autenticación](#autenticación-1)
  - [Usuarios](#usuarios)
  - [Eventos](#eventos)
  - [Tickets](#tickets)
  - [Marketplace](#marketplace)
  - [Scanner](#scanner)
  - [Blockchain](#blockchain)
- [Roles y Permisos](#roles-y-permisos)
- [Códigos de Estado HTTP](#códigos-de-estado-http)
- [Validaciones](#validaciones)
- [Sincronización Blockchain](#sincronización-blockchain)

## ✨ Características

- 🔐 Autenticación JWT con email/username + contraseña
- 👥 Sistema de roles (USER, ORGANIZER, ADMIN, SCANNER)
- 🎫 Gestión completa de eventos y tickets NFT
- 🛒 Marketplace integrado con smart contracts
- 📱 Generación y verificación de QR codes firmados
- 🔄 Sincronización automática con blockchain via workers
- 📊 Estadísticas y reportes
- ✅ Validaciones robustas y manejo de errores
- 📄 Paginación en todos los listados
- 🚀 Preparado para producción

## 🛠 Tecnologías

- **Framework**: NestJS 11.x
- **ORM**: Prisma 7.x
- **Base de Datos**: PostgreSQL
- **Cache/Queue**: Redis + BullMQ
- **Blockchain**: Vara/Polkadot (GearApi, SailsProgram)
- **Autenticación**: JWT (Passport)
- **Validación**: class-validator, class-transformer
- **QR Codes**: qrcode + tweetnacl (firma digital)

## 🚀 Configuración Inicial

### Prerrequisitos

- Node.js >= 18.x
- PostgreSQL >= 14.x
- Redis >= 6.x
- npm o yarn

### Instalación

```bash
# Clonar repositorio
git clone <repository-url>
cd backend

# Instalar dependencias
npm install
# o
yarn install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus configuraciones
```

### Variables de Entorno

```env
# Base de Datos
DATABASE_URL="postgresql://user:password@localhost:5432/avant_ticket?schema=public"

# JWT
JWT_SECRET="your-super-secret-jwt-key-min-32-chars"

# QR Codes
QR_SECRET_KEY="your-qr-secret-key-32-bytes"

# Redis
REDIS_URL="redis://localhost:6379"

# Servidor
PORT=3000
FRONTEND_URL="http://localhost:3001"
NODE_ENV="development"

# Blockchain
BLOCKCHAIN_PROVIDER="wss://testnet.vara-network.io"
ACCOUNT_SEED="your-account-seed-phrase"
CONTRACT_ADDRESS="0x..."

# Desarrollo
SKIP_SIGNATURE_VALIDATION="true" # Solo para desarrollo
```

### Migraciones de Base de Datos

```bash
# Generar Prisma Client
npx prisma generate

# Ejecutar migraciones
npx prisma migrate dev

# (Opcional) Seed inicial
npx prisma db seed
```

### Ejecutar la Aplicación

```bash
# Desarrollo
npm run start:dev

# Producción
npm run build
npm run start:prod

# Con Docker
docker-compose up -d
```

## 📁 Estructura del Proyecto

```
backend/
├── src/
│   ├── auth/                 # Módulo de autenticación
│   │   ├── dto/
│   │   ├── strategies/
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   └── auth.module.ts
│   ├── users/                # Módulo de usuarios
│   ├── events/               # Módulo de eventos
│   ├── tickets/              # Módulo de tickets
│   ├── marketplace/          # Módulo de marketplace
│   ├── scanner/              # Módulo de scanner
│   ├── blockchain/           # Módulo blockchain
│   │   ├── blockchain-connection.service.ts
│   │   ├── blockchain-actions.service.ts
│   │   ├── blockchain-sync.service.ts
│   │   ├── blockchain-worker.service.ts
│   │   └── blockchain-event-listener.service.ts
│   ├── prisma/               # Servicio Prisma
│   └── common/               # Módulos compartidos
│       ├── decorators/
│       ├── guards/
│       ├── filters/
│       ├── interceptors/
│       └── services/
├── prisma/
│   ├── schema.prisma         # Schema de Prisma
│   └── migrations/           # Migraciones
├── .env.example
├── docker-compose.yml
└── README.md
```

## 🔐 Autenticación

### Flujo de Autenticación

1. **Registro**: El usuario proporciona email, contraseña, DNI y datos de dirección
2. **Validación**: El backend valida los datos y hashea la contraseña con bcrypt
3. **Login**: El usuario se autentica con email/username + contraseña
4. **Verificación**: El backend compara la contraseña hasheada
5. **Token JWT**: Se emite un token JWT con la información del usuario
6. **Autorización**: El token se envía en el header `Authorization: Bearer <token>`

### Formato del Token

```typescript
{
  sub: "user-uuid",
  email: "user@example.com",
  role: "USER"
}
```

### Requisitos de Contraseña

- Mínimo 8 caracteres
- Máximo 64 caracteres
- Al menos una letra mayúscula
- Al menos un número
- Al menos un caracter especial (!@#$%^&*()_+-=[]{};':"\\|,.<>/?)

### Ejemplo de Uso

```bash
# 1. Registrar nuevo usuario
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "MiPassword123!",
    "dni": "12345678",
    "username": "johndoe",
    "pais": "Argentina",
    "provincia": "Buenos Aires",
    "ciudad": "La Plata",
    "calle": "Av. 7",
    "numero": "1234",
    "codigoPostal": "1900"
  }'

# 2. Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "emailOrUsername": "user@example.com",
    "password": "MiPassword123!"
  }'

# 3. Guardar el token de la respuesta
export TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# 4. Usar el token en requests
curl -X GET http://localhost:3000/api/users/me \
  -H "Authorization: Bearer $TOKEN"
```

## 📚 Endpoints

**Base URL**: `http://localhost:3000/api`

### Autenticación

#### POST `/auth/register`

Registra un nuevo usuario con email, contraseña y datos personales.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "MiPassword123!",
  "dni": "12345678",
  "username": "johndoe",
  "pais": "Argentina",
  "provincia": "Buenos Aires",
  "ciudad": "La Plata",
  "calle": "Av. 7",
  "numero": "1234",
  "codigoPostal": "1900",
  "walletAddress": "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"
}
```

**Campos:**
- `email` (requerido): Email válido y único
- `password` (requerido): Contraseña con al menos 8 caracteres, 1 mayúscula, 1 número y 1 caracter especial
- `dni` (requerido): DNI único del usuario
- `username` (opcional): Username único, máximo 64 caracteres
- `pais` (requerido): País de residencia
- `provincia` (requerido): Provincia/estado
- `ciudad` (requerido): Ciudad
- `calle` (requerido): Nombre de la calle
- `numero` (requerido): Número de dirección
- `codigoPostal` (requerido): Código postal
- `walletAddress` (opcional): Dirección de wallet para uso futuro

**Validaciones:**
- Email debe ser único
- DNI debe ser único
- Username debe ser único (si se proporciona)
- Contraseña debe cumplir los requisitos de seguridad
- WalletAddress debe tener formato válido (si se proporciona)

**Response 201:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": "7d",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "johndoe",
    "role": "USER",
    "walletAddress": "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"
  }
}
```

**Errores:**
- `400 Bad Request`: Email, DNI o username ya existe
- `400 Bad Request`: Contraseña no cumple requisitos
- `400 Bad Request`: WalletAddress formato inválido (si se proporciona)

#### POST `/auth/login`

Autentica un usuario existente con email/username + contraseña.

**Body:**
```json
{
  "emailOrUsername": "user@example.com",
  "password": "MiPassword123!"
}
```

**Campos:**
- `emailOrUsername` (requerido): Email o username del usuario
- `password` (requerido): Contraseña del usuario

**Comportamiento:**
- Busca primero por email, si no encuentra busca por username
- Compara la contraseña proporcionada con el hash almacenado usando bcrypt
- Genera un JWT token si las credenciales son válidas

**Response 200:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": "7d",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "johndoe",
    "role": "USER",
    "walletAddress": "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"
  }
}
```

**Errores:**
- `401 Unauthorized`: Credenciales inválidas (email/username o contraseña incorrectos)

---

### Usuarios

#### GET `/users`

Obtiene lista de usuarios (solo ADMIN).

**Headers:** `Authorization: Bearer <token>`

**Query Params:**
- `page` (opcional): número de página (default: 1)
- `limit` (opcional): items por página (default: 10, max: 100)

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "walletAddress": "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
      "email": "user@example.com",
      "username": "johndoe",
      "role": "USER",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

#### GET `/users/me`

Obtiene el perfil del usuario autenticado.

**Headers:** `Authorization: Bearer <token>`

**Response 200:**
```json
{
  "id": "uuid",
  "walletAddress": "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
  "email": "user@example.com",
  "username": "johndoe",
  "role": "USER",
  "organizedEvents": [...],
  "ownedTickets": [...]
}
```

#### GET `/users/:id`

Obtiene un usuario por ID.

**Headers:** `Authorization: Bearer <token>`

#### PATCH `/users/:id`

Actualiza un usuario (solo propio perfil o ADMIN).

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "email": "newemail@example.com",
  "username": "newusername"
}
```

#### DELETE `/users/:id`

Elimina un usuario (solo ADMIN).

**Headers:** `Authorization: Bearer <token>`

---

### Eventos

#### POST `/events`

Crea un nuevo evento (ORGANIZER o ADMIN).

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "blockchainEventId": "1", // Opcional, se genera si no se proporciona
  "metadataHash": "0x1234567890abcdef...",
  "name": "Concierto de Rock",
  "description": "Gran concierto de rock",
  "eventStartTime": "2024-12-31T20:00:00Z",
  "ticketsTotal": 1000,
  "resaleEnabled": true,
  "maxResalePrice": 5000000000000, // En smallest unit
  "resaleStartTime": "2024-12-01T00:00:00Z",
  "resaleEndTime": "2024-12-30T23:59:59Z",
  "sellerPercentage": 8500, // 85%
  "organizerPercentage": 1000, // 10%
  "platformPercentage": 500 // 5%
}
```

**Response 201:**
```json
{
  "id": "uuid",
  "blockchainEventId": "1",
  "metadataHash": "0x1234...",
  "name": "Concierto de Rock",
  "organizerId": "uuid",
  "active": true,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

#### GET `/events`

Lista todos los eventos (público).

**Query Params:**
- `page` (opcional): número de página
- `limit` (opcional): items por página

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Concierto de Rock",
      "eventStartTime": "2024-12-31T20:00:00Z",
      "organizer": {
        "id": "uuid",
        "walletAddress": "5Grwva...",
        "username": "organizer"
      },
      "_count": {
        "tickets": 500
      }
    }
  ],
  "pagination": { ... }
}
```

#### GET `/events/:id`

Obtiene un evento por ID (público).

**Response 200:**
```json
{
  "id": "uuid",
  "blockchainEventId": "1",
  "name": "Concierto de Rock",
  "description": "...",
  "eventStartTime": "2024-12-31T20:00:00Z",
  "ticketsTotal": "1000",
  "active": true,
  "organizer": { ... },
  "tickets": [ ... ]
}
```

#### GET `/events/:id/stats`

Obtiene estadísticas de un evento.

**Headers:** `Authorization: Bearer <token>`

**Response 200 (Organizer/Admin):**
```json
{
  "eventId": "uuid",
  "blockchainEventId": "1",
  "name": "Concierto de Rock",
  "totalTickets": "1000",
  "ticketsMinted": "500",
  "ticketsRemaining": "500",
  "mintPercentage": "50.00",
  "activeTickets": 480,
  "usedTickets": 20,
  "cancelledTickets": 0,
  "totalListings": 25,
  "soldListings": 10,
  "activeListings": 15,
  "eventStartTime": "2024-12-31T20:00:00Z",
  "resaleEnabled": true,
  "active": true,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**Response 200 (Público):**
```json
{
  "eventId": "uuid",
  "name": "Concierto de Rock",
  "totalTickets": "1000",
  "ticketsMinted": "500",
  "ticketsRemaining": "500",
  "eventStartTime": "2024-12-31T20:00:00Z",
  "resaleEnabled": true,
  "active": true
}
```

#### POST `/events/:id/mint-tickets`

Mintea tickets para un evento (ORGANIZER o ADMIN).

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "amount": 10,
  "buyerWalletAddress": "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY", // Opcional, usa el del token si no se proporciona
  "zones": ["VIP", "General"] // Opcional
}
```

**Response 201:**
```json
{
  "success": true,
  "message": "Tickets are being minted. They will appear in your account once the transaction is confirmed.",
  "blockchainTxHash": "0x1234...",
  "blockHash": "0xabcd...",
  "amount": 10,
  "eventId": "uuid",
  "blockchainEventId": "1"
}
```

#### PATCH `/events/:id`

Actualiza un evento (solo organizador).

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "name": "Nuevo nombre",
  "active": false
}
```

#### DELETE `/events/:id`

Elimina un evento (solo organizador).

**Headers:** `Authorization: Bearer <token>`

---

### Tickets

#### GET `/tickets`

Lista tickets (ADMIN u ORGANIZER).

**Headers:** `Authorization: Bearer <token>`

**Query Params:**
- `eventId` (opcional): filtrar por evento
- `ownerId` (opcional): filtrar por propietario
- `page` (opcional): número de página
- `limit` (opcional): items por página

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "blockchainTicketId": "1",
      "eventId": "uuid",
      "ownerId": "uuid",
      "status": "ACTIVE",
      "zone": "VIP",
      "mintedAt": "2024-01-01T00:00:00.000Z",
      "event": { ... },
      "owner": { ... }
    }
  ],
  "pagination": { ... }
}
```

#### GET `/tickets/my-tickets`

Lista los tickets del usuario autenticado.

**Headers:** `Authorization: Bearer <token>`

**Query Params:**
- `page` (opcional)
- `limit` (opcional)

#### GET `/tickets/stats`

Obtiene estadísticas generales de tickets (ADMIN u ORGANIZER).

**Headers:** `Authorization: Bearer <token>`

**Response 200:**
```json
{
  "totalTickets": 1000,
  "activeTickets": 900,
  "usedTickets": 80,
  "cancelledTickets": 20,
  "usedPercentage": "8.00",
  "activePercentage": "90.00",
  "totalListings": 50,
  "activeListings": 30,
  "soldListings": 20,
  "eventsWithTickets": 5,
  "uniqueOwners": 450,
  "userTickets": 5 // Solo si el usuario es el autenticado
}
```

#### GET `/tickets/:id`

Obtiene un ticket por ID.

**Headers:** `Authorization: Bearer <token>`

#### GET `/tickets/:id/qr`

Genera el QR code de un ticket (solo propietario).

**Headers:** `Authorization: Bearer <token>`

**Response 200:**
```json
{
  "qrData": "ticket-uuid-signed-data",
  "qrImage": "data:image/png;base64,iVBORw0KGgoAAAANS..."
}
```

---

### Marketplace

#### GET `/marketplace`

Lista listings activos del marketplace.

**Query Params:**
- `eventId` (opcional): filtrar por evento
- `page` (opcional): número de página
- `limit` (opcional): items por página

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "ticketId": "uuid",
      "sellerId": "uuid",
      "price": "1000000000000",
      "status": "ACTIVE",
      "listedAt": "2024-01-01T00:00:00.000Z",
      "ticket": {
        "id": "uuid",
        "blockchainTicketId": "1",
        "event": { ... },
        "owner": { ... }
      },
      "seller": { ... }
    }
  ],
  "pagination": { ... }
}
```

#### GET `/marketplace/:id`

Obtiene un listing por ID.

#### POST `/marketplace/listings`

Crea un listing para vender un ticket.

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "ticketId": "uuid",
  "price": 1000000000000 // En smallest unit
}
```

**Response 201:**
```json
{
  "id": "uuid",
  "ticketId": "uuid",
  "sellerId": "uuid",
  "price": "1000000000000",
  "status": "ACTIVE",
  "blockchainTxHash": "0x1234...",
  "listedAt": "2024-01-01T00:00:00.000Z"
}
```

#### POST `/marketplace/purchase`

Compra un ticket del marketplace.

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "listingId": "uuid",
  "blockchainTxHash": "0x1234..." // Opcional
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Purchase transaction submitted. The ticket will be transferred once confirmed.",
  "blockchainTxHash": "0x1234...",
  "blockHash": "0xabcd...",
  "listingId": "uuid",
  "ticketId": "uuid"
}
```

#### DELETE `/marketplace/listings/:id`

Cancela un listing (solo el vendedor).

**Headers:** `Authorization: Bearer <token>`

---

### Scanner

#### POST `/scanner/scan`

Escanea un ticket QR para marcarlo como usado.

**Headers:** `Authorization: Bearer <token>` (SCANNER, ADMIN u ORGANIZER)

**Body:**
```json
{
  "qrData": "ticket-uuid-signed-data"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Ticket marked as used",
  "ticket": {
    "id": "uuid",
    "blockchainTicketId": "1",
    "status": "USED",
    "usedAt": "2024-01-01T00:00:00.000Z",
    "event": { ... }
  },
  "scannedBy": {
    "id": "uuid",
    "walletAddress": "5Grwva..."
  }
}
```

#### GET `/scanner/verify`

Verifica un ticket sin marcarlo como usado.

**Headers:** `Authorization: Bearer <token>` (SCANNER, ADMIN u ORGANIZER)

**Query Params:**
- `qr`: QR data del ticket

**Response 200:**
```json
{
  "valid": true,
  "ticket": {
    "id": "uuid",
    "blockchainTicketId": "1",
    "status": "ACTIVE",
    "event": {
      "id": "uuid",
      "name": "Concierto de Rock",
      "eventStartTime": "2024-12-31T20:00:00Z"
    },
    "owner": { ... }
  }
}
```

---

### Blockchain

#### GET `/blockchain/balance`

Obtiene el balance del usuario autenticado.

**Headers:** `Authorization: Bearer <token>`

**Response 200:**
```json
{
  "address": "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
  "balance": "1000000000000000",
  "balanceFormatted": "1.0"
}
```

#### GET `/blockchain/balance/:address`

Obtiene el balance de una dirección específica (solo ADMIN).

**Headers:** `Authorization: Bearer <token>`

#### GET `/blockchain/account`

Obtiene información de la cuenta del servidor.

**Headers:** `Authorization: Bearer <token>`

**Response 200:**
```json
{
  "address": "5Grwva...",
  "publicKey": "0x1234...",
  "userWalletAddress": "5Grwva..." // Del usuario autenticado
}
```

#### GET `/blockchain/connection-status`

Verifica el estado de la conexión blockchain (solo ADMIN).

**Headers:** `Authorization: Bearer <token>`

**Response 200:**
```json
{
  "connected": true,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### GET `/blockchain/event/:eventId`

Consulta un evento desde la blockchain.

**Headers:** `Authorization: Bearer <token>`

#### GET `/blockchain/ticket/:ticketId`

Consulta un ticket desde la blockchain.

**Headers:** `Authorization: Bearer <token>`

#### GET `/blockchain/user/:address/tickets`

Obtiene todos los tickets de un usuario desde la blockchain.

**Headers:** `Authorization: Bearer <token>`

#### GET `/blockchain/marketplace/listings`

Obtiene todos los listings activos desde la blockchain.

**Headers:** `Authorization: Bearer <token>`

#### GET `/blockchain/marketplace/listing/:ticketId`

Obtiene un listing específico desde la blockchain.

**Headers:** `Authorization: Bearer <token>`

#### GET `/blockchain/check/organizer/:address`

Verifica si una dirección es organizador.

**Headers:** `Authorization: Bearer <token>`

**Response 200:**
```json
{
  "address": "5Grwva...",
  "isOrganizer": true
}
```

#### GET `/blockchain/check/scanner/:address`

Verifica si una dirección es scanner.

**Headers:** `Authorization: Bearer <token>`

---

## 🔑 Roles y Permisos

### USER
- Ver eventos públicos
- Ver sus propios tickets
- Ver marketplace
- Comprar tickets del marketplace
- Generar QR de sus tickets

### ORGANIZER
- Todo lo de USER
- Crear y gestionar eventos
- Mintear tickets para sus eventos
- Ver estadísticas de sus eventos
- Escanear tickets

### SCANNER
- Escanear y verificar tickets
- Ver información de tickets

### ADMIN
- Todo lo anterior
- Ver todos los usuarios
- Ver todos los tickets
- Ver estadísticas globales
- Consultar balances de cualquier dirección
- Gestionar conexión blockchain

## 📊 Códigos de Estado HTTP

- `200 OK`: Operación exitosa
- `201 Created`: Recurso creado exitosamente
- `204 No Content`: Operación exitosa sin contenido
- `400 Bad Request`: Error de validación o solicitud incorrecta
- `401 Unauthorized`: No autenticado o token inválido
- `403 Forbidden`: Sin permisos para la operación
- `404 Not Found`: Recurso no encontrado
- `429 Too Many Requests`: Rate limit excedido
- `500 Internal Server Error`: Error del servidor

## ✅ Validaciones

### Email
- Formato válido de email
- Debe ser único en el sistema

### Contraseña
- Mínimo 8 caracteres, máximo 64 caracteres
- Al menos una letra mayúscula
- Al menos un número
- Al menos un caracter especial
- Regex: `/^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/`

### DNI
- Debe ser único en el sistema
- Sin validación de formato específico

### Username
- Máximo 64 caracteres
- Solo letras, números, guiones bajos y guiones
- Regex: `/^[a-zA-Z0-9_-]+$/`
- Opcional pero único si se proporciona

### Wallet Address (Opcional)
- Formato válido de Polkadot/Substrate address
- Regex: `/^[0-9a-fA-F]{64}$|^5[a-km-zA-HJ-NP-Z1-9]{47,48}$/`

### UUIDs
- Validación estricta con `ParseUUIDPipe`

### Números
- Ranges específicos (min/max)
- Transformación automática de strings a números

### Fechas
- Formato ISO 8601
- Validación de fechas futuras donde aplica

### Strings
- Longitud mínima y máxima
- Patrones regex donde aplica

## 🔄 Sincronización Blockchain

El backend sincroniza automáticamente con la blockchain mediante:

1. **Event Listeners**: Escuchan eventos on-chain (EventCreated, TicketsMinted, etc.)
2. **Workers**: Procesan eventos de forma asíncrona usando BullMQ
3. **Sync Service**: Sincroniza datos desde blockchain a la base de datos

### Eventos Sincronizados

- `EventCreated`: Crea/actualiza eventos
- `TicketsMinted`: Crea tickets en la DB
- `TicketResold`: Actualiza propietario del ticket
- `TicketUsed`: Marca ticket como usado
- `TicketListed`: Crea listing en marketplace
- `ListingCancelled`: Cancela listing

### Flujo de Operaciones

1. **Crear Evento**:
   - Usuario → POST `/events`
   - Backend → Transacción blockchain
   - Event Listener → Recibe `EventCreated`
   - Worker → Sincroniza en DB

2. **Mintear Tickets**:
   - ORGANIZER → POST `/events/:id/mint-tickets`
   - Backend → Transacción blockchain
   - Event Listener → Recibe `TicketsMinted`
   - Worker → Crea tickets en DB

3. **Comprar en Marketplace**:
   - Usuario → POST `/marketplace/purchase`
   - Backend → Transacción blockchain
   - Event Listener → Recibe `TicketResold`
   - Worker → Actualiza propietario

## 🔒 Seguridad

- **JWT Tokens**: Expiración de 7 días
- **Password Hashing**: bcrypt con salt rounds = 10
- **Validación de Contraseñas**: Requisitos estrictos de seguridad
- **Rate Limiting**: Preparado (implementar con Redis)
- **CORS**: Configurado con origins permitidas
- **Validation Pipes**: Validación estricta de entrada
- **Role-based Access**: Guards en todos los endpoints protegidos
- **Datos Sensibles**: Password nunca se retorna en respuestas

## 📝 Notas Importantes

1. **El backend NO es la fuente de verdad**: La blockchain es la autoridad final
2. **Sincronización asíncrona**: Los cambios en blockchain pueden tardar en reflejarse
3. **Autenticación tradicional**: El sistema usa email/username + contraseña, no firma de wallet
4. **Wallet Address opcional**: Puede proporcionarse durante el registro para uso futuro
5. **BigInt**: Los valores de precios y balances usan BigInt para precisión
6. **QR Codes**: Incluyen firma digital para verificación offline
7. **Password Security**: Las contraseñas se hashean con bcrypt y nunca se exponen

## 🐛 Troubleshooting

### Error: "Cannot connect to blockchain"
- Verificar `BLOCKCHAIN_PROVIDER` en `.env`
- Verificar conexión de red
- Revisar logs del `BlockchainConnectionService`

### Error: "Prisma Client not generated"
```bash
npx prisma generate
```

### Error: "Redis connection failed"
- Verificar `REDIS_URL` en `.env`
- Asegurar que Redis esté corriendo

### Error: "JWT Secret not set"
- Configurar `JWT_SECRET` en `.env` (mínimo 32 caracteres)

## 🔄 Flujo Completo de Uso

### Flujo 1: Crear Evento y Mintear Tickets

```bash
# 1. Login como ORGANIZER
POST /api/auth/login
Body: { emailOrUsername: "organizer@example.com", password: "Password123!" }
Response: { access_token: "...", user: { role: "ORGANIZER" } }

# 2. Crear evento
POST /api/events
Headers: Authorization: Bearer <token>
Body: { name, eventStartTime, ticketsTotal, ... }
Response: { id: "event-uuid", blockchainEventId: "1", ... }

# 3. Mintear tickets
POST /api/events/{eventId}/mint-tickets
Headers: Authorization: Bearer <token>
Body: { amount: 100, zones: ["VIP", "General"] }
Response: { blockchainTxHash: "0x...", message: "Tickets are being minted..." }

# 4. (Automático) El sistema sincroniza los tickets desde blockchain
# Los tickets aparecen cuando el worker procesa el evento TicketsMinted
```

### Flujo 2: Comprar y Vender en Marketplace

```bash
# 1. Usuario A: Listar ticket en marketplace
POST /api/marketplace/listings
Headers: Authorization: Bearer <token-user-a>
Body: { ticketId: "ticket-uuid", price: 1000000000000 }
Response: { id: "listing-uuid", blockchainTxHash: "0x...", status: "ACTIVE" }

# 2. Usuario B: Ver listings disponibles
GET /api/marketplace?eventId=event-uuid
Response: { data: [{ id: "listing-uuid", price: "1000000000000", ... }] }

# 3. Usuario B: Comprar ticket
POST /api/marketplace/purchase
Headers: Authorization: Bearer <token-user-b>
Body: { listingId: "listing-uuid" }
Response: { blockchainTxHash: "0x...", message: "Purchase transaction submitted..." }

# 4. (Automático) El sistema sincroniza el cambio de propietario
# Cuando el worker procesa el evento TicketResold
```

### Flujo 3: Escanear Ticket en Evento

```bash
# 1. Scanner: Login como SCANNER
POST /api/auth/login
Body: { emailOrUsername: "scanner@example.com", password: "Password123!" }
Response: { access_token: "...", user: { role: "SCANNER" } }

# 2. Usuario: Obtener QR de su ticket
GET /api/tickets/{ticketId}/qr
Headers: Authorization: Bearer <token-user>
Response: { qrData: "signed-data", qrImage: "data:image/png;base64..." }

# 3. Scanner: Escanear ticket
POST /api/scanner/scan
Headers: Authorization: Bearer <token-scanner>
Body: { qrData: "signed-data" }
Response: { success: true, ticket: { status: "USED", ... } }

# 4. (Automático) El sistema marca el ticket como usado en blockchain
# Cuando el worker procesa el evento TicketUsed
```

## 📋 Ejemplos de Código

### JavaScript/TypeScript (Fetch API)

```typescript
// Configuración base
const API_BASE_URL = 'http://localhost:3000/api';

// Login
async function login(emailOrUsername: string, password: string) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ emailOrUsername, password }),
  });
  if (!response.ok) {
    throw new Error('Invalid credentials');
  }
  const data = await response.json();
  localStorage.setItem('token', data.access_token);
  return data;
}

// Registro
async function register(userData: {
  email: string;
  password: string;
  dni: string;
  username?: string;
  pais: string;
  provincia: string;
  ciudad: string;
  calle: string;
  numero: string;
  codigoPostal: string;
  walletAddress?: string;
}) {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Registration failed');
  }
  const data = await response.json();
  localStorage.setItem('token', data.access_token);
  return data;
}

// Crear evento (requiere token)
async function createEvent(eventData: any) {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/events`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(eventData),
  });
  return response.json();
}

// Mintear tickets
async function mintTickets(eventId: string, amount: number) {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/events/${eventId}/mint-tickets`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ amount }),
  });
  return response.json();
}

// Obtener mis tickets
async function getMyTickets(page = 1, limit = 10) {
  const token = localStorage.getItem('token');
  const response = await fetch(
    `${API_BASE_URL}/tickets/my-tickets?page=${page}&limit=${limit}`,
    {
      headers: { 'Authorization': `Bearer ${token}` },
    }
  );
  return response.json();
}
```

### cURL Ejemplos

```bash
# Registro
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "MiPassword123!",
    "dni": "12345678",
    "username": "johndoe",
    "pais": "Argentina",
    "provincia": "Buenos Aires",
    "ciudad": "La Plata",
    "calle": "Av. 7",
    "numero": "1234",
    "codigoPostal": "1900"
  }'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "emailOrUsername": "user@example.com",
    "password": "MiPassword123!"
  }'

# Crear evento
curl -X POST http://localhost:3000/api/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "metadataHash": "0x1234567890abcdef...",
    "name": "Concierto de Rock",
    "eventStartTime": "2024-12-31T20:00:00Z",
    "ticketsTotal": 1000
  }'

# Mintear tickets
curl -X POST http://localhost:3000/api/events/EVENT_UUID/mint-tickets \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "amount": 10,
    "zones": ["VIP", "General"]
  }'

# Obtener eventos con paginación
curl "http://localhost:3000/api/events?page=1&limit=10"

# Comprar en marketplace
curl -X POST http://localhost:3000/api/marketplace/purchase \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "listingId": "LISTING_UUID"
  }'
```

## 📞 Soporte

Para más información o soporte, contactar al equipo de desarrollo.

---

**Última actualización**: 2025-01-12
