import { bookingService } from '../services/BookingService.js';

/**
 * GraphQL Resolvers
 * Orquestación entre campos GraphQL y la capa de servicios
 */
export const resolvers = {
    Query: {
        /**
         * Query: Obtener todas las reservas del usuario autenticado
         */
        async bookings(parent, args, context) {
            if (!context.user) {
                throw new Error('Autenticación requerida');
            }

            try {
                const bookings = await bookingService.getUserBookings(context.user.userId);
                return {
                    success: true,
                    message: 'Reservas obtenidas correctamente',
                    bookings,
                };
            } catch (error) {
                console.error('❌ Error en query bookings:', error);
                throw error;
            }
        },

        /**
         * Query: Obtener próximas 5 reservas activas
         */
        async upcomingBookings(parent, args, context) {
            if (!context.user) {
                throw new Error('Autenticación requerida');
            }

            try {
                const bookings = await bookingService.getUpcomingBookings(context.user.userId);
                return {
                    success: true,
                    message: 'Próximas reservas obtenidas correctamente',
                    bookings,
                };
            } catch (error) {
                console.error('❌ Error en query upcomingBookings:', error);
                throw error;
            }
        },

        /**
         * Query: Obtener una reserva específica
         */
        async bookingById(parent, args, context) {
            if (!context.user) {
                throw new Error('Autenticación requerida');
            }

            try {
                const booking = await bookingService.getBookingById(args.id, context.user.userId);
                if (!booking) {
                    return null;
                }
                return booking;
            } catch (error) {
                console.error('❌ Error en query bookingById:', error);
                throw error;
            }
        },

        /**
         * Query: Obtener reservas canceladas (auditoría)
         */
        async cancelledBookings(parent, args, context) {
            if (!context.user) {
                throw new Error('Autenticación requerida');
            }

            try {
                const bookings = await bookingService.getCancelledBookings(context.user.userId);
                return {
                    success: true,
                    message: 'Reservas canceladas obtenidas correctamente',
                    bookings,
                };
            } catch (error) {
                console.error('❌ Error en query cancelledBookings:', error);
                throw error;
            }
        },
    },

    Mutation: {
        /**
         * Mutation: Crear una nueva reserva
         * Argumentos: fecha (ISO), servicio
         */
        async createBooking(parent, args, context) {
            if (!context.user) {
                throw new Error('Autenticación requerida');
            }

            const { fecha, servicio } = args;

            // Validación básica
            if (!fecha || !servicio) {
                throw new Error('Fecha y servicio son requeridos');
            }

            try {
                const booking = await bookingService.createBooking(
                    context.user.userId,
                    fecha,
                    servicio,
                    context.user
                );

                return {
                    success: true,
                    message: 'Reserva creada correctamente',
                    booking,
                };
            } catch (error) {
                console.error('❌ Error en mutation createBooking:', error);
                throw error;
            }
        },

        /**
         * Mutation: Cancelar una reserva
         * Argumentos: id de la reserva
         */
        async cancelBooking(parent, args, context) {
            if (!context.user) {
                throw new Error('Autenticación requerida');
            }

            const { id } = args;

            try {
                const booking = await bookingService.cancelBooking(id, context.user.userId, context.user);

                return {
                    success: true,
                    message: 'Reserva cancelada correctamente',
                    booking,
                };
            } catch (error) {
                console.error('❌ Error en mutation cancelBooking:', error);
                throw error;
            }
        },

        /**
         * Mutation: Eliminar una reserva
         * Argumentos: id de la reserva
         */
        async deleteBooking(parent, args, context) {
            if (!context.user) {
                throw new Error('Autenticación requerida');
            }

            const { id } = args;

            try {
                const booking = await bookingService.deleteBooking(id, context.user.userId);

                return {
                    success: true,
                    message: 'Reserva eliminada correctamente',
                    booking,
                };
            } catch (error) {
                console.error('❌ Error en mutation deleteBooking:', error);
                throw error;
            }
        },
    },
};
