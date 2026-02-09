/**
 * Script de testing básico para la API GraphQL
 * Ejecutar con: node src/scripts/test-graphql.js
 */

import axios from 'axios';

const GRAPHQL_ENDPOINT = process.env.GRAPHQL_URL || 'http://localhost:4000/graphql';
const TEST_TOKEN = process.env.TEST_TOKEN || 'tu_token_jwt_aqui';

const graphqlClient = {
    async query(query, variables = {}) {
        try {
            const response = await axios.post(GRAPHQL_ENDPOINT, {
                query,
                variables,
            }, {
                headers: {
                    'Authorization': `Bearer ${TEST_TOKEN}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.data.errors) {
                console.error('❌ GraphQL Error:', response.data.errors);
                return null;
            }

            return response.data.data;
        } catch (error) {
            console.error('❌ Error al consultar GraphQL:', error.message);
            return null;
        }
    },
};

async function runTests() {
    console.log('🧪 Testing Booking Service GraphQL API\n');

    // Test 1: Obtener todas las reservas
    console.log('📝 Test 1: Obtener todas las reservas');
    const bookingsResult = await graphqlClient.query(`
        query {
            bookings {
                success
                message
                bookings {
                    id
                    servicio
                    fecha
                    estado
                }
            }
        }
    `);
    console.log('Resultado:', JSON.stringify(bookingsResult, null, 2));

    // Test 2: Obtener próximas 5 reservas
    console.log('\n📝 Test 2: Obtener próximas 5 reservas');
    const upcomingResult = await graphqlClient.query(`
        query {
            upcomingBookings {
                success
                bookings {
                    id
                    servicio
                    fechaFormateada
                }
            }
        }
    `);
    console.log('Resultado:', JSON.stringify(upcomingResult, null, 2));

    // Test 3: Crear una reserva
    console.log('\n📝 Test 3: Crear una reserva');
    const mañana = new Date();
    mañana.setDate(mañana.getDate() + 1);

    const createResult = await graphqlClient.query(`
        mutation CreateBooking($fecha: String!, $servicio: String!) {
            createBooking(fecha: $fecha, servicio: $servicio) {
                success
                message
                booking {
                    id
                    servicio
                    estado
                }
            }
        }
    `, {
        fecha: mañana.toISOString(),
        servicio: 'hotel',
    });
    console.log('Resultado:', JSON.stringify(createResult, null, 2));

    console.log('\n✅ Tests completados');
}

runTests().catch(console.error);
