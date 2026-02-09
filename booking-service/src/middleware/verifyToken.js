import jwt from 'jsonwebtoken';

/**
 * Middleware para verificar JWT en contexto GraphQL
 * Extrae el token del header Authorization y lo decodifica
 */
export function authMiddleware(req) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new Error('Token no proporcionado');
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secreto-super-seguro');
        return {
            token,
            user: decoded,
        };
    } catch (err) {
        throw new Error('Token inválido o expirado');
    }
}

/**
 * Función auxiliar para crear contexto de GraphQL
 * Se ejecuta con cada request
 */
export async function createContext({ req }) {
    try {
        const auth = req?.headers?.authorization ? authMiddleware(req) : null;
        return {
            user: auth?.user || null,
            token: auth?.token || null,
        };
    } catch (error) {
        console.error('❌ Error en autenticación:', error.message);
        return {
            user: null,
            token: null,
            authError: error.message,
        };
    }
}
