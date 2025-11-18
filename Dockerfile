# 1. Instalar dependencias
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# ---------------------------------------------------------------------

# 2. Compilar la aplicación
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---------------------------------------------------------------------

# 3. Producción (Runner)
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# --- CORRECCIÓN AQUÍ ---
# Comenta o borra esta línea porque NO tienes carpeta public
# COPY --from=builder /app/public ./public

# 2. Copia la lógica del servidor
COPY --from=builder /app/.next/standalone ./

# 3. ¡CRÍTICO! Copia los estilos y scripts (CSS/JS)
COPY --from=builder /app/.next/static ./.next/static

# Copia tus datos SQL
COPY --from=builder /app/data ./data

EXPOSE 3000

CMD ["node", "server.js"]