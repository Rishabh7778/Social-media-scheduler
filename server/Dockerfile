# =========================
# Stage 1: Build
# =========================
FROM node:20 AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .

# =========================
# Stage 2: Production
# =========================
FROM node:20

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY --from=builder /app .

EXPOSE 5000

CMD ["npm", "run", "dev"]