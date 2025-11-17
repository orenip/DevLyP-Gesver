# 1. Instalar dependencias cuando sea necesario
FROM node:20-alpine AS deps
# Instalar libc6-compat para soportar algunas dependencias nativas
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Instalar dependencias
COPY package.json package-lock.json* ./
RUN npm ci

# 2. Reconstruir el código fuente solo cuando cambie
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Esto construirá la aplicación para producción.
RUN npm run build

# 3. Producción
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
# Copia el directorio 'app' que contiene los archivos estáticos de Next.js
COPY src/app/favicon.ico ./app/favicon.ico
COPY src/app/globals.css ./app/globals.css
# Si tienes más archivos estáticos directamente en 'src/app', añádelos aquí
# O copia toda la carpeta 'src' y luego ajusta las rutas de trabajo si es más fácil.
# Puedes configurar un usuario no-root por razones de seguridad
# RUN addgroup --system --gid 1001 nodejs
# RUN adduser --system --uid 1001 nextjs
# USER nextjs

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/data ./data

# El puerto por defecto para una aplicación Next.js es 3000
EXPOSE 3000

CMD ["npm", "start"]
