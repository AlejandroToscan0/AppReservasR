import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

export const sequelize = new Sequelize(
    process.env.DB_NAME || 'bookingdb',
    process.env.DB_USER || 'postgres',
    process.env.DB_PASSWORD || 'postgres',
    {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        dialect: 'postgres',
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
        pool: {
            max: 10,
            min: 2,
            acquire: 30000,
            idle: 10000,
        },
    }
);

export async function initDatabase() {
    try {
        await sequelize.authenticate();
        console.log('✅ Conectado a PostgreSQL (Booking Service)');
        await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
        console.log('✅ Modelos sincronizados con la BD');
    } catch (error) {
        console.error('❌ Error al conectar a PostgreSQL:', error);
        throw error;
    }
}
