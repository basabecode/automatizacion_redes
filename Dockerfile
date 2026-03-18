FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache libc6-compat openssl

# Instalar pnpm globalmente
RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm exec prisma generate

EXPOSE 3000

CMD ["sh", "-c", "pnpm exec prisma migrate deploy && pnpm dev"]
