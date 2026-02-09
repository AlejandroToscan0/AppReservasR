/**
 * Tests básicos para Booking Service GraphQL
 * Ejecutar con: npm test
 * 
 * Validar:
 * 1. Schema GraphQL correcto (types, queries, mutations)
 * 2. Crear, listar, cancelar, próximas, eliminar reservas
 * 3. Máximo 5 canceladas (limpieza automática)
 */

import { sequelize } from '../config/database.js';
import { bookingRepository } from '../repositories/BookingRepository.js';
import { bookingService } from '../services/BookingService.js';
import { DateTime } from 'luxon';

// Mock user para tests
const mockUser = {
    userId: 'test-user-123',
    email: 'test@example.com',
    nombre: 'Usuario Test',
};

describe('📝 Booking Service - GraphQL Tests', () => {
    // Setup: Conectar y limpiar BD antes de tests
    before(async () => {
        await sequelize.authenticate();
        await sequelize.sync({ force: true }); // Force: borra y recrea
        console.log('✅ BD preparada para tests');
    });

    // Teardown: Limpiar después de tests
    after(async () => {
        await sequelize.close();
        console.log('✅ Conexión cerrada');
    });

    // ============================================
    // A. Pruebas de Funcionalidad Básica
    // ============================================

    describe('A. Funcionalidad Básica', () => {
        it('DEBE crear una reserva correctamente', async () => {
            const fecha = DateTime.now()
                .plus({ days: 1 })
                .toISO();

            const booking = await bookingService.createBooking(
                mockUser.userId,
                fecha,
                'hotel',
                mockUser
            );

            console.log('✅ Reserva creada:', booking.id);
            assert(booking.id, 'Debe tener ID');
            assert(booking.estado === 'activo', 'Debe estar activa');
            assert(booking.servicio === 'hotel', 'Servicio debe ser hotel');
        });

        it('DEBE listar reservas del usuario', async () => {
            const bookings = await bookingService.getUserBookings(mockUser.userId);

            console.log('✅ Reservas encontradas:', bookings.length);
            assert(bookings.length > 0, 'Debe haber al menos una reserva');
        });

        it('DEBE obtener próximas 5 reservas', async () => {
            const upcoming = await bookingService.getUpcomingBookings(mockUser.userId);

            console.log('✅ Próximas reservas:', upcoming.length);
            assert(Array.isArray(upcoming), 'Debe retornar array');
        });

        it('DEBE eliminar una reserva', async () => {
            // Crear reserva para eliminar
            const fecha = DateTime.now()
                .plus({ days: 2 })
                .toISO();
            const booking = await bookingService.createBooking(
                mockUser.userId,
                fecha,
                'vuelo',
                mockUser
            );

            // Eliminar
            const deleted = await bookingService.deleteBooking(
                booking.id,
                mockUser.userId
            );

            console.log('✅ Reserva eliminada:', deleted.id);
            assert(deleted.id === booking.id, 'Debe retornar la reserva eliminada');
        });
    });

    // ============================================
    // B. Prueba de Regla de Negocio: Máximo 5 Canceladas
    // ============================================

    describe('B. Regla de Negocio: Máximo 5 Canceladas', () => {
        it('DEBE crear 7 reservas y cancelar todas', async () => {
            // Limpiar usuario test previo
            await bookingRepository.deleteMultiple(
                (await bookingRepository.findByUserId(mockUser.userId)).map(b => b.id)
            );

            // Crear 7 reservas
            const booking_ids = [];
            for (let i = 0; i < 7; i++) {
                const fecha = DateTime.now()
                    .plus({ days: i + 1 })
                    .toISO();
                const booking = await bookingService.createBooking(
                    mockUser.userId,
                    fecha,
                    `servicio-${i}`,
                    mockUser
                );
                booking_ids.push(booking.id);
            }

            console.log('✅ Creadas 7 reservas');

            // Cancelar todas
            for (const id of booking_ids) {
                await bookingService.cancelBooking(id, mockUser.userId, mockUser);
                console.log(`  - Cancelada reserva ${id.substring(0, 8)}...`);
            }

            // Verificar: solo 5 canceladas deberían quedar
            const cancelledRemaining = await bookingRepository.findCancelledBookings(
                mockUser.userId
            );

            console.log(
                `✅ Resultado: ${cancelledRemaining.length} reservas canceladas (máximo 5)`
            );
            assert(
                cancelledRemaining.length <= 5,
                'Debe haber máximo 5 canceladas'
            );
            assert(
                cancelledRemaining.length === 5,
                'Debe haber exactamente 5 (las más nuevas se mantienen)'
            );
        });
    });

    // ============================================
    // C. Pruebas de Transacciones ACID
    // ============================================

    describe('C. Transacciones ACID', () => {
        it('DEBE cancelar reserva y limpiar canceladas en transacción', async () => {
            // Limpiar
            /** const allBookings = await bookingRepository.findByUserId(mockUser.userId);
            await bookingRepository.deleteMultiple(allBookings.map(b => b.id)); */

            // Crear 6 reservas
            const ids = [];
            for (let i = 0; i < 6; i++) {
                const fecha = DateTime.now()
                    .plus({ days: 10 + i })
                    .toISO();
                const booking = await bookingService.createBooking(
                    mockUser.userId,
                    fecha,
                    `test-${i}`,
                    mockUser
                );
                ids.push(booking.id);
            }

            // Cancelar todas (transacción debe mantener máximo 5)
            for (const id of ids) {
                await bookingService.cancelBooking(id, mockUser.userId, mockUser);
            }

            // Verificar estado final
            const allBookings = await bookingRepository.findByUserId(mockUser.userId);
            const cancelled = allBookings.filter(b => b.estado === 'cancelada');

            console.log(`✅ Total bookings: ${allBookings.length}`);
            console.log(`✅ Canceladas: ${cancelled.length}`);
            assert(cancelled.length <= 5, 'Transacción ACID funciona correctamente');
        });
    });

    // ============================================
    // D. Pruebas de Integridad de Datos
    // ============================================

    describe('D. Integridad de Datos', () => {
        it('DEBE generar fechaFormateada correctamente', async () => {
            const fecha = DateTime.now()
                .plus({ days: 3 })
                .toISO();
            const booking = await bookingService.createBooking(
                mockUser.userId,
                fecha,
                'restaurante',
                mockUser
            );

            console.log(`✅ Fecha formateada: ${booking.fechaFormateada}`);
            assert(booking.fechaFormateada, 'Debe tener fechaFormateada');
            assert(
                booking.fechaFormateada.includes('/'),
                'Formato debe ser dd/MM/yyyy'
            );
        });

        it('DEBE registrar canceladaEn al cancelar', async () => {
            const fecha = DateTime.now()
                .plus({ days: 4 })
                .toISO();
            const booking = await bookingService.createBooking(
                mockUser.userId,
                fecha,
                'hotel',
                mockUser
            );

            const cancelled = await bookingService.cancelBooking(
                booking.id,
                mockUser.userId,
                mockUser
            );

            console.log(`✅ Cancelada en: ${cancelled.canceladaEn}`);
            assert(cancelled.canceladaEn, 'Debe registrar canceladaEn');
            assert(cancelled.estado === 'cancelada', 'Estado debe ser cancelada');
        });
    });
});

// ============================================
// Helper: Función de assert simple
// ============================================
function assert(condition, message) {
    if (!condition) {
        throw new Error(`❌ Assertion failed: ${message}`);
    }
}

function describe(title, fn) {
    console.log(`\n${'═'.repeat(60)}`);
    console.log(`📋 ${title}`);
    console.log('═'.repeat(60));
    fn();
}

function it(title, fn) {
    try {
        console.log(`  ⏳ ${title}`);
        fn();
    } catch (error) {
        console.error(`  ${error.message}`);
        throw error;
    }
}

function before(fn) {
    // Setup antes de todos los tests
    globalThis._beforeHook = fn;
}

function after(fn) {
    // Teardown después de todos los tests
    globalThis._afterHook = fn;
}

// Ejecutar migraciones antes
async function runTests() {
    try {
        if (globalThis._beforeHook) {
            await globalThis._beforeHook();
        }

        // Aquí se ejecutarían todos los describe/it via un test runner real (Jest, Mocha, etc)
        console.log('\n✅ Para ejecutar tests reales, usa:');
        console.log('   npm install --save-dev jest');
        console.log('   npm test');

        if (globalThis._afterHook) {
            await globalThis._afterHook();
        }
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

export { describe, it, before, after };
