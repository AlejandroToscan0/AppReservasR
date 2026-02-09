import { bookingRepository } from '../repositories/BookingRepository.js';
import { notificationClient } from '../clients/NotificationClient.js';
import { formatInTimeZone } from 'date-fns-tz';
import { DateTime } from 'luxon';
import { sequelize } from '../config/database.js';

/**
 * BookingService - Capa de lógica de negocio
 * Contiene los casos de uso y reglas del negocio
 */
export class BookingService {
    /**
     * Obtener todas las reservas de un usuario con formato de fecha
     */
    async getUserBookings(userId) {
        const bookings = await bookingRepository.findByUserId(userId);
        return this._formatBookings(bookings);
    }

    /**
     * Obtener próximas 5 reservas activas
     */
    async getUpcomingBookings(userId) {
        const bookings = await bookingRepository.findUpcomingBookings(userId);
        return this._formatBookings(bookings);
    }

    /**
     * Obtener una reserva específica con formato de fecha
     */
    async getBookingById(id, userId) {
        const booking = await bookingRepository.findByIdAndUserId(id, userId);
        if (!booking) return null;
        return this._formatBooking(booking);
    }

    /**
     * Crear una nueva reserva
     * 1. Convierte la fecha al timezone de Guayaquil
     * 2. Crea la reserva
     * 3. Notifica al user-service que se creó la reserva
     * 4. Notifica por email al usuario
     */
    async createBooking(userId, fechaISO, servicio, user) {
        try {
            // Convertir fecha ISO a Date en timezone de América/Guayaquil
            const fechaObj = DateTime.fromISO(fechaISO, { zone: 'America/Guayaquil' }).toJSDate();

            // Crear reserva en BD
            const booking = await bookingRepository.create(userId, fechaObj, servicio);

            // Formatear fecha para notificación
            const fechaFormateada = formatInTimeZone(
                fechaObj,
                'America/Guayaquil',
                'dd/MM/yyyy HH:mm:ss'
            );

            // Enviar notificación por email
            if (user?.email) {
                await notificationClient.notifyBookingCreated(
                    user.email,
                    user.nombre || 'Usuario',
                    servicio,
                    fechaFormateada
                );
            }

            return this._formatBooking(booking);
        } catch (error) {
            console.error('❌ Error creando reserva:', error);
            throw new Error('No se pudo crear la reserva: ' + error.message);
        }
    }

    /**
     * Cancelar una reserva
     * Operación ACID: en una transacción
     * 1. Cambiar estado a 'cancelada'
     * 2. Registrar fecha de cancelación
     * 3. Si hay > 5 canceladas, eliminar las más antiguas
     * 4. Notificar por email
     */
    async cancelBooking(id, userId, user) {
        const transaction = await sequelize.transaction();

        try {
            // Cancelar la reserva
            const booking = await bookingRepository.cancelBooking(id, userId);
            if (!booking) {
                await transaction.rollback();
                throw new Error('Reserva no encontrada');
            }

            // Obtener todas las canceladas del usuario
            const cancelledBookings = await bookingRepository.findCancelledBookings(userId);

            // Si hay más de 5, eliminar las más antiguas (mantener máximo 5)
            if (cancelledBookings.length > 5) {
                const aEliminar = cancelledBookings.slice(0, cancelledBookings.length - 5);
                const idsAEliminar = aEliminar.map(b => b.id);
                await bookingRepository.deleteMultiple(idsAEliminar);
                console.log(`🗑️ Eliminadas ${idsAEliminar.length} reservas canceladas antiguas`);
            }

            await transaction.commit();

            // Enviar notificación por email
            if (user?.email) {
                const fechaFormateada = formatInTimeZone(
                    booking.fecha,
                    'America/Guayaquil',
                    'dd/MM/yyyy HH:mm:ss'
                );

                await notificationClient.notifyBookingCancelled(
                    user.email,
                    user.nombre || 'Usuario',
                    booking.servicio,
                    fechaFormateada
                );
            }

            return this._formatBooking(booking);
        } catch (error) {
            await transaction.rollback();
            console.error('❌ Error cancelando reserva:', error);
            throw new Error('No se pudo cancelar la reserva: ' + error.message);
        }
    }

    /**
     * Eliminar una reserva por completo
     */
    async deleteBooking(id, userId) {
        try {
            const booking = await bookingRepository.delete(id, userId);
            if (!booking) {
                throw new Error('Reserva no encontrada');
            }
            return this._formatBooking(booking);
        } catch (error) {
            console.error('❌ Error eliminando reserva:', error);
            throw new Error('No se pudo eliminar la reserva: ' + error.message);
        }
    }

    /**
     * Obtener reservas canceladas de un usuario (para auditoría)
     */
    async getCancelledBookings(userId) {
        const bookings = await bookingRepository.findCancelledBookings(userId);
        return this._formatBookings(bookings);
    }

    /**
     * Métodos privados de formato
     */
    _formatBooking(booking) {
        const obj = booking.toJSON();
        obj.fechaFormateada = formatInTimeZone(
            booking.fecha,
            'America/Guayaquil',
            'dd/MM/yyyy HH:mm:ss'
        );
        return obj;
    }

    _formatBookings(bookings) {
        return bookings.map(booking => this._formatBooking(booking));
    }
}

export const bookingService = new BookingService();
