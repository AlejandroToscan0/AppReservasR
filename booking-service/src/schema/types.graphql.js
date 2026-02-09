import { gql } from 'apollo-server';

export const typeDefs = gql`
    enum BookingStatus {
        activo
        cancelada
    }

    type Booking {
        id: ID!
        userId: String!
        fecha: String!
        fechaFormateada: String!
        servicio: String!
        estado: BookingStatus!
        canceladaEn: String
        createdAt: String!
        updatedAt: String!
    }

    type BookingResponse {
        success: Boolean!
        message: String!
        booking: Booking
    }

    type BookingsListResponse {
        success: Boolean!
        message: String!
        bookings: [Booking!]!
    }

    type Query {
        # Obtener todas las reservas del usuario autenticado
        bookings: BookingsListResponse!

        # Obtener próximas 5 reservas activas
        upcomingBookings: BookingsListResponse!

        # Obtener una reserva específica por ID
        bookingById(id: ID!): Booking

        # Obtener reservas canceladas del usuario
        cancelledBookings: BookingsListResponse!
    }

    type Mutation {
        # Crear una nueva reserva
        createBooking(fecha: String!, servicio: String!): BookingResponse!

        # Cancelar una reserva (cambia estado + registra canceladaEn)
        cancelBooking(id: ID!): BookingResponse!

        # Eliminar una reserva completamente
        deleteBooking(id: ID!): BookingResponse!
    }

    type User {
        userId: String!
        email: String!
        nombre: String!
    }
`;
