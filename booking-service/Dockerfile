FROM node:20-alpine

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm install --production

# Copiar código fuente
COPY src ./src

# Exponer puerto GraphQL
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:4000/.well-known/apollo/server-health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Iniciar servidor
CMD ["node", "src/index.js"]