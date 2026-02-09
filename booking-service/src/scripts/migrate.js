/**
 * Script de Migraciones DDL para Booking Service
 * Ejecutar con: npm run migrate
 * 
 * Este script crea el esquema relacional en PostgreSQL
 */

import { sequelize } from '../config/database.js';
import Booking from '../models/Booking.js';

async function runMigrations() {
    try {
        console.log('🔄 Iniciando migraciones...');

        // Conectar a la BD
        await sequelize.authenticate();
        console.log('✅ Conectado a PostgreSQL');

        // Sincronizar modelos (crea tablas si no existen)
        await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
        console.log('✅ Tablas sincronizadas');

        // Log del esquema creado
        console.log('\n📊 Esquema creado:');
        console.log(`
        CREATE TABLE bookings (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            userId VARCHAR(255) NOT NULL,
            fecha TIMESTAMP NOT NULL,
            servicio VARCHAR(255) NOT NULL,
            estado ENUM('activo', 'cancelada') DEFAULT 'activo',
            canceladaEn TIMESTAMP,
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX idx_userId ON bookings(userId);
        CREATE INDEX idx_estado ON bookings(estado);
        CREATE INDEX idx_fecha ON bookings(fecha);
        CREATE INDEX idx_userId_estado ON bookings(userId, estado);
        `);

        console.log('✅ Migraciones completadas exitosamente');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error durante migraciones:', error);
        process.exit(1);
    }
}

// Ejecutar migraciones
runMigrations();
