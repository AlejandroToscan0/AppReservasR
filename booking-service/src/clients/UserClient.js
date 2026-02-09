import axios from 'axios';

/**
 * UserClient - Cliente para comunicarse con user-service
 * Responsable de validar usuarios y obtener información
 */
export class UserClient {
    constructor(baseURL = process.env.USER_SERVICE_URL || 'http://user-service:5001') {
        this.client = axios.create({
            baseURL,
            timeout: 5000,
        });
    }

    /**
     * Validar que un usuario existe y obtener sus datos
     */
    async validateUser(userId, token) {
        try {
            const response = await this.client.get(`/users/${userId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            return {
                success: true,
                user: response.data,
            };
        } catch (error) {
            console.error('❌ Error validando usuario:', error.message);
            return {
                success: false,
                error: error.response?.data?.message || 'Usuario no válido',
            };
        }
    }

    /**
     * Verificar que el token es válido
     */
    async verifyToken(token) {
        try {
            const response = await this.client.post('/auth/verify', {
                token,
            });
            return {
                success: true,
                user: response.data,
            };
        } catch (error) {
            console.error('❌ Error verificando token:', error.message);
            return {
                success: false,
                error: 'Token inválido',
            };
        }
    }
}

export const userClient = new UserClient();
