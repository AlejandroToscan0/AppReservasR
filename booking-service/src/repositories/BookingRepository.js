import Booking from '../models/Booking.js';
import { Op } from 'sequelize';

/**
 * BookingRepository - Capa de acceso a datos para Booking
 * Abstrae todas las operaciones con la base de datos
 */
export class BookingRepository {
    /**
     * Obtener todas las reservas de un usuario
     */
    async findByUserId(userId) {
        return await Booking.findAll({
            where: { userId },
            order: [['fecha', 'ASC']],
        });
    }

    /**
     * Obtener una reserva por ID y verificar que pertenezca al usuario
     */
    async findByIdAndUserId(id, userId) {
        return await Booking.findOne({
            where: { id, userId },
        });
    }

    /**
     * Obtener próximas 5 reservas activas (fecha >= hoy)
     */
    async findUpcomingBookings(userId) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return await Booking.findAll({
            where: {
                userId,
                estado: 'activo',
                fecha: { [Op.gte]: today },
            },
            order: [['fecha', 'ASC']],
            limit: 5,
        });
    }

    /**
     * Obtener reservas canceladas de un usuario
     */
    async findCancelledBookings(userId) {
        return await Booking.findAll({
            where: { userId, estado: 'cancelada' },
            order: [['canceladaEn', 'ASC']],
        });
    }

    /**
     * Crear una nueva reserva
     */
    async create(userId, fecha, servicio) {
        return await Booking.create({
            userId,
            fecha,
            servicio,
            estado: 'activo',
        });
    }

    /**
     * Actualizar estado de reserva a cancelada
     */
    async cancelBooking(id, userId) {
        const booking = await this.findByIdAndUserId(id, userId);
        if (!booking) return null;

        booking.estado = 'cancelada';
        booking.canceladaEn = new Date();
        await booking.save();

        return booking;
    }

    /**
     * Eliminar reserva por ID
     */
    async delete(id, userId) {
        const booking = await this.findByIdAndUserId(id, userId);
        if (!booking) return null;

        await booking.destroy();
        return booking;
    }

    /**
     * Eliminar múltiples reservas por IDs (usado para limpiar canceladas)
     */
    async deleteMultiple(ids) {
        return await Booking.destroy({
            where: { id: { [Op.in]: ids } },
        });
    }

    /**
     * Obtener número de reservas canceladas de un usuario
     */
    async countCancelledByUserId(userId) {
        return await Booking.count({
            where: { userId, estado: 'cancelada' },
        });
    }

    /**
     * Obtener la reserva cancelada más antigua de un usuario
     */
    async findOldestCancelledByUserId(userId, limit = 5) {
        return await Booking.findAll({
            where: { userId, estado: 'cancelada' },
            order: [['canceladaEn', 'ASC']],
            limit,
        });
    }
}

// Instancia singleton
export const bookingRepository = new BookingRepository();
