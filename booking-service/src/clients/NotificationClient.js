import axios from 'axios';

/**
 * NotificationClient - Cliente para comunicarse con notification-service
 * Responsable de enviar notificaciones por email
 */
export class NotificationClient {
    constructor(baseURL = process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:5002') {
        this.client = axios.create({
            baseURL,
            timeout: 5000,
        });
    }

    /**
     * Notificar creación de reserva
     */
    async notifyBookingCreated(email, nombre, servicio, fecha) {
        try {
            const response = await this.client.post('/notify/reserva', {
                email,
                nombre,
                servicio,
                fecha,
            });
            console.log('✅ Notificación de creación enviada a:', email);
            return {
                success: true,
                data: response.data,
            };
        } catch (error) {
            console.error('❌ Error enviando notificación de creación:', error.message);
            return {
                success: false,
                error: error.message,
            };
        }
    }

    /**
     * Notificar cancelación de reserva
     */
    async notifyBookingCancelled(email, nombre, servicio, fecha) {
        try {
            const response = await this.client.post('/notify/cancelacion', {
                email,
                nombre,
                servicio,
                fecha,
            });
            console.log('✅ Notificación de cancelación enviada a:', email);
            return {
                success: true,
                data: response.data,
            };
        } catch (error) {
            console.error('❌ Error enviando notificación de cancelación:', error.message);
            return {
                success: false,
                error: error.message,
            };
        }
    }
}

export const notificationClient = new NotificationClient();
