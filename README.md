# WhatsApp Personal Assistant

Un asistente personal para WhatsApp que monitorea mensajes entrantes, registra todas las conversaciones, y responde automáticamente cuando el usuario no responde dentro de un tiempo específico.

## Características

- 🤖 **Respuesta automática**: Configura tiempos de respuesta por contacto
- 📱 **Monitoreo completo**: Registra todos los mensajes entrantes y salientes
- 👥 **Gestión de contactos**: Diccionario personalizable con mensajes predefinidos
- 🚨 **Mensajes urgentes**: Notificaciones inmediatas para contactos prioritarios
- 🗄️ **Base de datos flexible**: Soporte para SQLite y PostgreSQL
- 🏗️ **Arquitectura limpia**: Código mantenible y escalable
- 🔧 **API REST**: Gestión completa via endpoints HTTP

## Arquitectura

El proyecto sigue los principios de Clean Architecture con separación clara de responsabilidades:

- **Domain Layer**: Entidades de negocio, servicios de dominio, interfaces de repositorios
- **Application Layer**: Casos de uso, DTOs, puertos para dependencias externas
- **Infrastructure Layer**: Adaptadores, base de datos, servicios externos
- **Presentation Layer**: Controladores HTTP, CLI, middleware

## Requisitos

- Node.js 18+ LTS
- npm o yarn
- SQLite (incluido) o PostgreSQL (opcional)

## Instalación

1. Clona el repositorio:
```bash
git clone <repository-url>
cd whatsapp-personal-assistant
```

2. Instala las dependencias:
```bash
npm install
```

3. Copia el archivo de configuración:
```bash
cp .env.example .env
```

4. Configura las variables de entorno en `.env`

5. Construye el proyecto:
```bash
npm run build
```

## Uso

### Desarrollo
```bash
npm run dev
```

### Producción
```bash
npm start
```

### Tests
```bash
npm test
npm run test:watch
```

### Linting y formato
```bash
npm run lint
npm run lint:fix
npm run format
```

## Configuración

El sistema usa archivos JSON para configuración por ambiente:

- `config/default.json` - Configuración base
- `config/production.json` - Configuración de producción
- `config/test.json` - Configuración de pruebas

### Base de datos

Por defecto usa SQLite para desarrollo. Para producción se recomienda PostgreSQL:

```json
{
  "database": {
    "type": "postgresql",
    "postgresql": {
      "host": "localhost",
      "port": 5432,
      "database": "whatsapp_assistant",
      "username": "user",
      "password": "password"
    }
  }
}
```

## API Endpoints

- `GET /api/messages/:contactId` - Historial de mensajes
- `GET /api/messages` - Buscar mensajes
- `POST /api/contacts` - Crear contacto
- `PUT /api/contacts/:id` - Actualizar contacto
- `GET /api/contacts` - Listar contactos
- `DELETE /api/contacts/:id` - Eliminar contacto
- `GET /api/config` - Obtener configuración
- `PUT /api/config` - Actualizar configuración
- `GET /api/status` - Estado del sistema

## Estructura del proyecto

```
src/
├── domain/           # Capa de dominio
│   ├── entities/     # Entidades de negocio
│   ├── repositories/ # Interfaces de repositorios
│   ├── services/     # Servicios de dominio
│   └── value-objects/# Objetos de valor
├── application/      # Capa de aplicación
│   ├── use-cases/    # Casos de uso
│   ├── dtos/         # Objetos de transferencia
│   └── ports/        # Puertos para dependencias
├── infrastructure/   # Capa de infraestructura
│   ├── adapters/     # Adaptadores
│   ├── database/     # Implementaciones de BD
│   └── config/       # Gestión de configuración
├── presentation/     # Capa de presentación
│   ├── controllers/  # Controladores HTTP
│   ├── middleware/   # Middleware Express
│   └── cli/          # Comandos CLI
└── shared/           # Utilidades compartidas
    ├── constants/    # Constantes
    ├── types/        # Tipos TypeScript
    └── utils/        # Utilidades
```

## Licencia

MIT