# WhatsApp Personal Assistant

Un asistente personal para WhatsApp que responde mensajes automáticamente con configuración personalizada por contacto.

## 🚀 Características

- **Respuestas automáticas personalizadas** por contacto
- **Sistema de temporizadores** configurable para cada contacto
- **Detección de mensajes urgentes** con notificaciones especiales
- **API REST completa** para gestión remota
- **Arquitectura limpia** con separación de responsabilidades
- **Soporte multi-base de datos** (SQLite para desarrollo, PostgreSQL para producción)
- **Interfaz CLI** para gestión desde línea de comandos
- **Monitoreo y logging** completo
- **Despliegue con Docker** y PM2

## 📋 Requisitos

- Node.js 18+
- npm o yarn
- PostgreSQL 12+ (producción) o SQLite (desarrollo)
- Docker y Docker Compose (opcional)

## 🛠️ Instalación

### Instalación Rápida con Docker

```bash
# Clonar el repositorio
git clone <repository-url>
cd whatsapp-personal-assistant

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus configuraciones

# Iniciar con Docker Compose
docker-compose up -d
```

### Instalación Manual

```bash
# Instalar dependencias
npm install

# Configurar entorno
cp .env.example .env
# Editar .env con tus configuraciones

# Construir la aplicación
npm run build

# Iniciar la aplicación
npm start
```

## ⚙️ Configuración

### Variables de Entorno

Copia el archivo de configuración apropiado:

```bash
# Para desarrollo
cp .env.development .env

# Para producción
cp .env.production .env
```

### Configuración Principal

```env
# Entorno de la aplicación
NODE_ENV=production
PORT=3000

# Base de datos
DB_TYPE=postgresql  # o sqlite
DB_HOST=localhost
DB_PORT=5432
DB_NAME=whatsapp_assistant
DB_USER=assistant_user
DB_PASSWORD=tu_password_seguro

# Seguridad API
API_KEY=tu_api_key_aqui
JWT_SECRET=tu_jwt_secret_aqui

# WhatsApp
WHATSAPP_SESSION_NAME=default
WHATSAPP_HEADLESS=true

# Respuestas automáticas
DEFAULT_AUTO_RESPONSE_DELAY=300
DEFAULT_AUTO_RESPONSE_MESSAGE=Gracias por tu mensaje. Te responderé pronto.
```

## 🚀 Uso

### Iniciar la Aplicación

```bash
# Desarrollo
npm run dev

# Producción
npm start

# Con PM2
npm run pm2:start

# Con Docker
docker-compose up -d
```

### Conectar WhatsApp

1. Inicia la aplicación
2. Escanea el código QR que aparece en la consola con WhatsApp Web
3. La aplicación se conectará automáticamente

### Gestión de Contactos

```bash
# CLI - Agregar contacto
npm run cli contact add --phone "+1234567890" --name "Juan Pérez" --delay 300

# CLI - Listar contactos
npm run cli contact list

# API - Crear contacto
curl -X POST http://localhost:3000/api/contacts \
  -H "X-API-Key: tu_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+1234567890",
    "name": "Juan Pérez",
    "autoResponseEnabled": true,
    "autoResponseDelay": 300,
    "autoResponseMessage": "Hola! Te responderé pronto."
  }'
```

## 📚 Documentación

- [Guía de Despliegue](docs/DEPLOYMENT.md)
- [Documentación de API](docs/API.md)
- [Solución de Problemas](docs/TROUBLESHOOTING.md)

## 🏗️ Arquitectura

El proyecto sigue los principios de **Clean Architecture**:

```
src/
├── domain/           # Entidades y lógica de negocio
├── application/      # Casos de uso
├── infrastructure/   # Adaptadores (DB, WhatsApp, etc.)
└── presentation/     # Controladores y API
```

### Capas de la Arquitectura

- **Domain**: Entidades, objetos de valor, servicios de dominio
- **Application**: Casos de uso, DTOs, interfaces de puertos
- **Infrastructure**: Implementaciones de repositorios, adaptadores externos
- **Presentation**: Controladores REST, CLI, middleware

## 🔧 Desarrollo

### Scripts Disponibles

```bash
# Desarrollo
npm run dev              # Iniciar en modo desarrollo
npm run dev:debug        # Iniciar con debugger

# Construcción
npm run build            # Construir aplicación
npm run build:clean      # Limpiar y construir

# Testing
npm test                 # Ejecutar tests
npm run test:watch       # Tests en modo watch
npm run test:coverage    # Tests con cobertura

# Calidad de código
npm run lint             # Linter
npm run lint:fix         # Arreglar problemas de lint
npm run format           # Formatear código
npm run typecheck        # Verificar tipos

# Docker
npm run docker:build     # Construir imagen Docker
npm run docker:run       # Ejecutar contenedor
npm run docker:compose   # Docker Compose

# PM2
npm run pm2:start        # Iniciar con PM2
npm run pm2:stop         # Detener PM2
npm run pm2:restart      # Reiniciar PM2
npm run pm2:logs         # Ver logs PM2
```

### Estructura del Proyecto

```
whatsapp-personal-assistant/
├── src/
│   ├── domain/
│   │   ├── entities/
│   │   ├── value-objects/
│   │   ├── services/
│   │   └── repositories/
│   ├── application/
│   │   ├── use-cases/
│   │   ├── dtos/
│   │   └── ports/
│   ├── infrastructure/
│   │   ├── database/
│   │   ├── whatsapp/
│   │   ├── repositories/
│   │   └── config/
│   ├── presentation/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   └── routes/
│   ├── cli.ts
│   ├── Application.ts
│   └── index.ts
├── docs/
├── config/
├── data/
├── logs/
├── sessions/
├── Dockerfile
├── docker-compose.yml
├── ecosystem.config.js
└── package.json
```

## 🔌 API

La aplicación expone una API REST completa:

### Endpoints Principales

- `GET /api/status` - Estado del sistema
- `GET /api/messages` - Obtener mensajes
- `POST /api/messages` - Enviar mensaje
- `GET /api/contacts` - Listar contactos
- `POST /api/contacts` - Crear contacto
- `PUT /api/contacts/:id` - Actualizar contacto
- `GET /api/config` - Configuración del sistema
- `PUT /api/config` - Actualizar configuración

### Autenticación

Todas las peticiones requieren el header:
```
X-API-Key: tu_api_key_aqui
```

Ver [documentación completa de la API](docs/API.md) para más detalles.

## 🐳 Despliegue

### Docker Compose (Recomendado)

```bash
# Producción con PostgreSQL
docker-compose up -d

# Desarrollo con SQLite
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

### PM2

```bash
# Instalar PM2 globalmente
npm install -g pm2

# Iniciar aplicación
npm run pm2:start

# Monitorear
pm2 monit
```

### Systemd (Linux)

```bash
# Copiar archivo de servicio
sudo cp whatsapp-assistant.service /etc/systemd/system/

# Habilitar e iniciar servicio
sudo systemctl enable whatsapp-assistant
sudo systemctl start whatsapp-assistant
```

Ver [guía completa de despliegue](docs/DEPLOYMENT.md) para más opciones.

## 🔍 Monitoreo

### Health Check

```bash
curl http://localhost:3000/health
```

### Logs

```bash
# Logs de aplicación
tail -f logs/combined.log

# Logs de PM2
pm2 logs whatsapp-assistant

# Logs de Docker
docker-compose logs -f

# Logs de systemd
sudo journalctl -u whatsapp-assistant -f
```

## 🛡️ Seguridad

### Protección contra Grupos
**CRÍTICO**: El sistema NUNCA responde automáticamente a mensajes de grupos. Esta es una característica de seguridad fundamental que:
- Previene spam en grupos
- Evita respuestas automáticas embarazosas
- Mantiene la etiqueta de grupos
- Protege contra restricciones de cuenta

### Mejores Prácticas
- Cambiar claves API y secretos por defecto
- Usar HTTPS en producción
- Configurar firewall apropiadamente
- Actualizaciones regulares de seguridad
- Monitorear logs por actividad sospechosa
- Revisar configuraciones de contactos regularmente

## 🤝 Contribuir

1. Fork el proyecto
2. Crear rama de feature (`git checkout -b feature/nueva-caracteristica`)
3. Commit cambios (`git commit -am 'Agregar nueva característica'`)
4. Push a la rama (`git push origin feature/nueva-caracteristica`)
5. Crear Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo [LICENSE](LICENSE) para más detalles.

## 🆘 Soporte

- [Documentación](docs/)
- [Issues](https://github.com/tu-usuario/whatsapp-personal-assistant/issues)
- [Discusiones](https://github.com/tu-usuario/whatsapp-personal-assistant/discussions)

## 🙏 Agradecimientos

- [whatsapp-web.js](https://github.com/pedroslopez/whatsapp-web.js) - Librería para WhatsApp Web
- [Express.js](https://expressjs.com/) - Framework web
- [TypeScript](https://www.typescriptlang.org/) - Lenguaje tipado
- [Inversify](https://inversify.io/) - Inyección de dependencias