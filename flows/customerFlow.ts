/**
 * @fileoverview Flujo de gestión del perfil del cliente para el chatbot de Smartfood
 * Permite a los usuarios gestionar sus direcciones, información personal y ver historial de pedidos
 * @author TuNombre
 * @version 1.0.0
 */

import { addKeyword } from '@builderbot/bot';
import { EVENTS } from '@builderbot/bot';
import { updateLastInteraction } from '../utils/updateLastInteraction';
import { dbConnection } from '../database/dbConnection';
import { RowDataPacket } from 'mysql2/promise';
import { welcomeFlow } from './welcomeFlow';
import { addressFlow } from './addressFlow';
import { readMessages } from '../utils/readMessages';
import { delay } from '@builderbot/bot/dist/utils';

/**
 * Interface para la estructura de direcciones en la base de datos
 * @interface DireccionRow
 * @extends {RowDataPacket}
 */
interface DireccionRow extends RowDataPacket {
    id: number;
    direccion: string;
    es_principal: number;
}


const nonRegisteredMessages = readMessages('dmsgnonregistered_customerflow.txt');
const menuPrincipalCustomerFlow = readMessages('msgMenuCustomerFlow.txt');
const curiosidadReccordUser = readMessages('msgCuriosidad_reccordUserFlow.txt');

/**
 * Flujo principal de gestión del perfil del cliente
 * Permite acceder a diferentes opciones de gestión personal
 */
export const customerFlow = addKeyword(EVENTS.ACTION)
    .addAction(async (ctx, { state, flowDynamic }) => {

                
    })
    .addAnswer(
        // Mostrar menú principal
        menuPrincipalCustomerFlow, 
        { capture: true, delay: 800 },
        async (ctx, { flowDynamic, state, gotoFlow, fallBack  }) => {


 
             const response = ctx.body.toLowerCase();
             await updateLastInteraction(ctx.from);
             
             // Control de navegación basado en respuestas específicas
             if (response === '1' || response === 'Direcciones' || response === 'direcciones') {

                return gotoFlow(addressFlow);                
             }     
             else if (response === '2' || response === 'nombre' || response === 'usuario') {
             const randomIndex = Math.floor(Math.random() * nonRegisteredMessages.length);

             await flowDynamic([{ body: nonRegisteredMessages[randomIndex] , delay: 800}]);
             return gotoFlow(nameUserFlow);

             }
             else if (response === '3' || response === 'pedidos') {
                const randomIndex = Math.floor(Math.random() * nonRegisteredMessages.length);

                await flowDynamic([{ body: curiosidadReccordUser[randomIndex] , delay: 800}]);
                return gotoFlow(reccordUserFlow);
             }
             else if (response === '4' || response === 'volver') {
                return gotoFlow(welcomeFlow);
            }
            else if (response === 'hola' || response === 'buenos' || response === 'buenas' || response === 'ola') {
                return ;
            }
            else {
             return fallBack('Oye oye, despacio cerebrito! Elige una opción válida 🥸'+`
                
1. Direcciones📍
2. Actualizar Nombre 👤
3. Pedidos 📦
4. Volver ↩️`);
            }

        }
    )
    
    export const nameUserFlow = addKeyword(EVENTS.ACTION).addAction(
        // Capturar nombre del cliente
        { capture: true },
        async (ctx, { state, flowDynamic, gotoFlow }) => {

            await updateLastInteraction(ctx.from);
            const name = ctx.body;

            if (!name) {
                await flowDynamic('Por favor, ingresa tu nombre.');
                return gotoFlow(nameUserFlow);
            }
        try {
            await dbConnection.query(
                'UPDATE cliente SET nombre = ? WHERE contacto = ?',
                [name, ctx.from]                
            );

            await flowDynamic([{ body:`¡${name}! 🎉 Lo único con más sabor aquí, es tu nombre 😉
¡Claro que te recordaremos!`, delay: 800 }]);
            await state.update({ nombre: name });
            return gotoFlow(customerFlow);

        } catch (error) {
            console.error('Error al registrar cliente:', error);
            await flowDynamic('Hubo un problema al registrar tus datos. Por favor, intenta nuevamente más tarde. 🙏');
            return gotoFlow(customerFlow);
        }

        }
    )
    
    
    export const reccordUserFlow = addKeyword(EVENTS.ACTION).addAction(
        { capture: false },
        async (ctx, { state, flowDynamic, gotoFlow }) => {

            await updateLastInteraction(ctx.from);

            const monthNames = [
                'Enero 🥳', // Año Nuevo, fiestas de comienzo de año
                'Febrero 🎭', // Carnavales como el de Barranquilla
                'Marzo 🌸', // Inicio de la primavera (aunque en Colombia no hay estaciones, representa renovación)
                'Abril 🌧️', // Mes lluvioso en varias regiones
                'Mayo 🌷', // Mes de las flores y del Día de la Madre
                'Junio 🌤️', // Mitad de año, vacaciones escolares y clima cálido
                'Julio 🎆', // Celebración del 20 de Julio, Día de la Independencia
                'Agosto 🪁', // Mes del viento y las cometas
                'Septiembre 📚', // Mes del amor, la amistad y regreso a clases
                'Octubre 🎃', // Halloween y disfraces
                'Noviembre 🕊️', // Mes de las celebraciones religiosas y las velitas
                'Diciembre 🎄'  // Navidad, fin de año y celebraciones familiares
            ];
    
            const clienteId = state.get('idCliente');
    
            try {
                const currentYear = new Date().getFullYear();
                const currentMonth = new Date().getMonth() + 1; // Los meses en JavaScript son 0-indexados
    
                // Consulta única para verificar si el cliente tiene pedidos y obtener la cantidad de órdenes confirmadas en el año y mes en curso
                const query = `
                    SELECT 
                        COUNT(*) as totalOrders,
                        SUM(CASE WHEN ep.estado = 'Confirmado' AND YEAR(o.fecha_creacion) = ? THEN 1 ELSE 0 END) as yearlyCount,
                        SUM(CASE WHEN ep.estado = 'Confirmado' AND YEAR(o.fecha_creacion) = ? AND MONTH(o.fecha_creacion) = ? THEN 1 ELSE 0 END) as monthlyCount
                    FROM orden o
                    JOIN historial_orden ho ON o.id = ho.id_orden
                    JOIN estado_pago ep ON ho.id_estado_pago = ep.id
                    WHERE o.id_cliente = ?
                `;
                const [rows] = await dbConnection.query<RowDataPacket[]>(query, [currentYear, currentYear, currentMonth, clienteId]);
                const totalOrders = rows[0].totalOrders;
                const yearlyOrdersCount = rows[0].yearlyCount;
                const monthlyOrdersCount = rows[0].monthlyCount;
    
                if (totalOrders === 0) {
                    await flowDynamic([{ body: 'Ni un solo pedido en tu historial... Eso duele más que el hambre. 💥', delay: 800}]);
                    return gotoFlow(customerFlow);
                }
    
                const mensaje = `Pedidos año [${currentYear}]: ${yearlyOrdersCount}\nPedidos mes [${monthNames[currentMonth-1]}]: ${monthlyOrdersCount}`;

    
                // Consulta para obtener el ranking de usuarios
                const rankingQuery = `
                    SELECT 
                        o.id_cliente,
                        COUNT(*) as totalOrders,
                        MAX(o.fecha_creacion) as lastOrderDate
                    FROM orden o
                    JOIN historial_orden ho ON o.id = ho.id_orden
                    JOIN estado_pago ep ON ho.id_estado_pago = ep.id
                    WHERE ep.estado = 'Confirmado'
                    GROUP BY o.id_cliente
                    ORDER BY totalOrders DESC, lastOrderDate ASC
                `;
                const [rankingRows] = await dbConnection.query<RowDataPacket[]>(rankingQuery);
                const ranking = rankingRows.map((row, index) => ({ clienteId: row.id_cliente, rank: index + 1 }));
    
                const clientRank = ranking.find(r => r.clienteId === clienteId)?.rank;
    
                if (clientRank) {
                    if (clientRank <= 10) {
                        await flowDynamic([{ body: mensaje +`\n\n*¡Felicidades🎉!* Haces parte del 🔝10 de clientes💥\n*Tu posición: #${clientRank}*🏆`, delay: 800 }]);
                    } else if (clientRank <= 20) {
                        await flowDynamic([{ body: mensaje +'\n\n*Estás en el 🔝20 de nuestros clientes* 💥\nMuy cerca de la gloria 🎖️', delay: 800 }]);
                    } else if (clientRank <= 30) {
                        await flowDynamic([{ body: mensaje +'\n\n*Estás en el 🔝30 de nuestros clientes* 💥\nSabíamos que lo lograrías 🏅', delay: 800 }]);
                    } else if (clientRank <= 40) {
                        await flowDynamic([{ body: mensaje +'\n\n*Estás en el 🔝40 de nuestros clientes* 💥\nNo te rindas 📈', delay: 800 }]);
                    } else if (clientRank <= 50) {
                        await flowDynamic([{ body: mensaje +'\n\n*Estás en el 🔝50 de nuestros clientes* 🏅\nGracias por preferirnos 🥺', delay: 800 }]);
                    } else {
                        await flowDynamic([{ body: mensaje +'\n\n*Estás muy cerca del 🔝50 de clientes* 💪', delay: 800 }]);
                    }
                } else {
                    await flowDynamic([{ body: 'No se pudo determinar tu posición en el ranking.', delay: 800 }]);
                }
    
                return gotoFlow(customerFlow);
            } catch (error) {
                console.error('Error al obtener las órdenes del cliente:', error);
                await flowDynamic('Hubo un problema al obtener tus datos. Por favor, intenta nuevamente más tarde. 🙏');
            }
        }
    );