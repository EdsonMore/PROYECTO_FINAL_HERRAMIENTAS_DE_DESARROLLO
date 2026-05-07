# JWT Completo - Implementación

## 📋 Resumen

Se implementó un sistema JWT completo con:
- ✅ Expiración de tokens (15 minutos para access token)
- ✅ Validación automática
- ✅ Renovación automática
- ✅ Monitoreo de expiración
- ✅ API endpoints para verificar y renovar tokens

## 🔧 Cambios Realizados

### 1. **lib/jwt-utils.ts** (NUEVO)
Utilidades centrales para JWT:
```typescript
- createJWT()          // Crear JWT con expiración
- verifyJWT()          // Verificar y decodificar token
- validateJWT()        // Validación completa con refresh check
- getJWTFromCookies()  // Obtener token de cookies
- isTokenNearExpiry()  // Verificar si está próximo a expirar
- getTokenTimeRemaining() // Tiempo restante en segundos
```

**Características:**
- Configuración flexible de expiración (env vars: `JWT_ACCESS_EXPIRY`, `JWT_REFRESH_EXPIRY`)
- JWT ID único (`jti`) para invalidación
- Timestamps estándar (`iat`, `exp`)

### 2. **lib/auth.ts** (MODIFICADO)
Mejorado el callback `jwt`:
```typescript
- Agrega timestamps de expiración (iat, exp)
- Token válido por 15 minutos
- Renovación automática si está próximo a expirar (<60 segundos)
- Mantiene compatibilidad con providers Google OAuth
```

### 3. **middleware.ts** (MEJORADO)
Validación de JWT en rutas protegidas:
```typescript
- Verifica existencia del token
- Valida expiración
- Rechaza tokens expirados con redirect a /login?expired=true
- Headers informativos (X-Token-Expiring-Soon)
```

### 4. **types/next-auth.d.ts** (ACTUALIZADO)
Agregados campos JWT:
```typescript
interface JWT {
  id: string;
  email?: string;
  image?: string;
  iat: number;  // Issued At
  exp: number;  // Expiration Time
  jti?: string; // JWT ID
}
```

### 5. **hooks/use-token-expiry.ts** (NUEVO)
Hook de cliente para monitoreo:
```typescript
- Verifica expiración cada 30 segundos
- Logout automático si no hay sesión
- Limpieza de timers
```

### 6. **app/api/auth/token-status/route.ts** (NUEVO)
Endpoint para verificar estado del token:
```
GET /api/auth/token-status

Response:
{
  isValid: boolean,
  isExpiring: boolean,           // < 5 minutos
  isExpired: boolean,
  expiresAt: number,             // Unix timestamp
  secondsUntilExpiry: number,
  percentageRemaining: number,
  user: { id, email, name }
}
```

### 7. **app/api/auth/refresh/route.ts** (NUEVO)
Endpoint para renovar sesión:
```
POST /api/auth/refresh

Response:
{
  success: boolean,
  message: string,
  expiresAt: number,
  willRenewAt?: number
}
```

## ⚙️ Configuración

### Variables de Entorno (`.env.local`)
```env
# Existente
NEXTAUTH_SECRET=tu_clave_ultra_segura

# Opcionales (si no se definen, usa defaults)
JWT_ACCESS_EXPIRY=15m          # Default: 15 minutos
JWT_REFRESH_EXPIRY=7d          # Default: 7 días
```

### Tiempos de Expiración
- **Access Token**: 15 minutos
- **Renovación Automática**: Si < 60 segundos restantes
- **Aviso de Expiración Próxima**: < 5 minutos (header X-Token-Expiring-Soon)
- **Check de Expiración Cliente**: Cada 30 segundos

## 🔄 Flujo de Validación

```
1. Usuario hace login
   ↓
2. NextAuth crea JWT con exp = ahora + 15m
   ↓
3. Middleware valida en cada request
   ├─ Token válido? → Continuar
   ├─ Token próximo a expirar? → Header X-Token-Expiring-Soon
   ├─ Token expirado? → Redirect /login?expired=true
   └─ Sin token? → Redirect /login
   ↓
4. Si token < 60 segundos → Auto-renovar
   ↓
5. Cliente monitorea cada 30s con /api/auth/token-status
```

## 📝 Cómo Usar en Componentes

### Verificar estado del token
```typescript
const response = await fetch('/api/auth/token-status');
const { isValid, secondsUntilExpiry } = await response.json();

if (!isValid) {
  // Token expirado
}
```

### Usar el hook de monitoreo
```typescript
import { useTokenExpiry } from '@/hooks/use-token-expiry';

export function MyComponent() {
  useTokenExpiry(); // Monitorea automáticamente
  
  return <div>Contenido protegido</div>;
}
```

### Renovar manualmente (raro)
```typescript
const response = await fetch('/api/auth/refresh', { method: 'POST' });
const data = await response.json();
```

## 🔐 Seguridad

✅ **Implementado:**
- Tokens firmados con NEXTAUTH_SECRET (HS256)
- Expiración automática
- JWT ID único (`jti`) para invalidación
- Validación en middleware
- HttpOnly cookies (NextAuth por defecto)
- CSRF protection (NextAuth por defecto)

✅ **Renovación Segura:**
- Auto-renovación transparente
- Sin necesidad de refresh tokens separados
- Expiración corta (15 min) reduce ventana de ataque

## 🧪 Testing

Para verificar que funciona:

```bash
# 1. Login
# 2. Abrir DevTools → Network
# 3. Verificar cookies: next-auth.session-token
# 4. Hacer request a /api/auth/token-status
# 5. Esperar 15 minutos para ver renovación automática
```

## 📦 Dependencias Agregadas

```json
"jose": "^5.x" // Para funciones criptográficas de JWT
```

## 🚀 Próximos Pasos (Opcionales)

- [ ] Agregar logging de renovaciones de token
- [ ] Implementar blacklist de tokens (para logout inmediato)
- [ ] Agregar métricas de expiración
- [ ] Implementar refresh token rotation
- [ ] Agregar UI de aviso de expiración próxima

## ⚠️ Notas Importantes

1. **Compatibilidad**: Completamente compatible con Google OAuth
2. **Sin Breaking Changes**: Solo agregan campos a JWT existente
3. **Auto-renovación**: Transparente al usuario
4. **Formato de Duración**: "15m", "1h", "7d", "30s"
5. **Timestamps**: En segundos (Unix timestamp)

---
**Estado**: ✅ Implementación completada y lista para producción
