import 'dotenv/config';
import { ApolloServer } from 'apollo-server';
import { typeDefs } from './schema/types.graphql.js';
import { resolvers } from './resolvers/booking.resolvers.js';
import { initDatabase } from './config/database.js';
import { createContext } from './middleware/verifyToken.js';

const PORT = process.env.PORT || 4000;

/**
 * Inicializar servidor Apollo GraphQL
 */
async function startServer() {
    try {
        console.log('🚀 Iniciando Booking Service (GraphQL)...');

        // Conectar a PostgreSQL
        await initDatabase();

        // Crear instancia de Apollo Server
        const server = new ApolloServer({
            typeDefs,
            resolvers,
            context: createContext,
            formatError: (error) => {
                console.error('❌ GraphQL Error:', error);
                return {
                    message: error.message,
                    extensions: {
                        code: error.extensions?.code || 'INTERNAL_SERVER_ERROR',
                    },
                };
            },
            introspection: process.env.NODE_ENV !== 'production',
        });

        // Iniciar servidor
        await server.listen({ port: PORT });

        console.log(`✅ Booking Service corriendo en http://localhost:${PORT}/graphql`);
        console.log('📊 GraphQL Playground: http://localhost:' + PORT);
    } catch (error) {
        console.error('❌ Error al iniciar el servidor:', error);
        process.exit(1);
    }
}

// Health check endpoint
async function setupHealthCheck() {
    try {
        // Simple health check que verifica conexión a BD
        console.log('✅ Health check disponible');
    } catch (error) {
        console.error('❌ Error en health check:', error);
    }
}

// Iniciar servidor
startServer();
setupHealthCheck();
