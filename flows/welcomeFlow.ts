/**
 * @fileoverview Flujo de bienvenida para el chatbot de Smartfood
 * Maneja la lógica inicial de interacción con los usuarios
 * @author TuNombre
 * @version 1.0.0
 */

/**
 * Importación de dependencias y módulos necesarios
 */
import { addKeyword } from '@builderbot/bot';
import { dbConnection } from '../database/dbConnection';
import { RowDataPacket } from 'mysql2/promise';
import { menuFlow } from './menuFlow';
import { orderFlow } from './orderFlow';
import { customerFlow } from './customerFlow';
import { updateLastInteraction } from '../utils/updateLastInteraction';
import { readMessages } from '../utils/readMessages';
import { searchNameClient } from '../utils/searchNameClient';
import { errorMessage } from '../utils/errorMessage';

/**
 * Interface que define la estructura de datos esperada de la tabla cliente
 */
interface ClienteRow extends RowDataPacket {
    nombre: string;
    ultima_interaccion?: Date;
}

/**
 * Constante que define el intervalo de tiempo entre saludos
 */
const DOS_HORAS = 2 * 60 * 60 * 1000;

/**
 * Carga de mensajes desde archivos
 */
const registeredMessages = readMessages('dmsgRegistered_welcomeFlow.txt');
const nonRegisteredMessages = readMessages('msgNonRegistered_welcomeFlow.txt');
const menuMessages = readMessages('msgMenu1_welcomeFlow.txt');


/**
 * Flujo principal de bienvenida
 */
export const welcomeFlow = addKeyword(['hola', 'buenos', 'buenas', 'ola'], {sensitive: false})
    .addAction(async (ctx, { flowDynamic, state }) => {
        console.log('Entrando en welcomeFlow');


        const phoneNumber = ctx.from;
        

                await searchNameClient(phoneNumber, state);
                const nombreCliente = state.get('nombreCliente');
                const clienteNuevo = state.get('clienteNuevo');

                const ahora = new Date();
            
            if (!clienteNuevo) {
                const ultima_interaccion_cliente = state.get('ultima_interaccion_cliente');
                
                if (ultima_interaccion_cliente && (ahora.getTime() - ultima_interaccion_cliente.getTime()) < DOS_HORAS) {
                    // Solo mostrar menú si no han pasado 2 horas

                    return;
                    
                }

                else {
                const randomIndex = Math.floor(Math.random() * registeredMessages.length);
                

                // Enviar mensaje de bienvenida aleatorio y menú
                await flowDynamic([
                    { 
                        body: registeredMessages[randomIndex].replace('${clientName}', nombreCliente)
                    },

                ]);
                }
                await updateLastInteraction(ctx.from);
            } else {
                    // Enviar mensajes de bienvenida para nuevos usuarios y menú
                    await flowDynamic([
                        ...nonRegisteredMessages.map(msg => ({ body: msg })),
                    ]);
            }
        } 
    )
    .addAnswer(menuMessages,
        { capture: true },
        async (ctx, { gotoFlow, fallBack}) => {
            // Verificar el estado actual
            console.log('Entrando en addAnswer de welcomeFlow');

            const response = ctx.body.toLowerCase();
            await updateLastInteraction(ctx.from);
            
            // Control de navegación basado en respuestas específicas
            if (response === '1' || response === 'menu' || response === 'menú') {
                return gotoFlow(menuFlow);
            }
            else if (response === '2' || response === 'pedir' || response === 'ordenar') {
                return gotoFlow(orderFlow);
            }
            else if (response === '3' || response === 'smartfood') {
                return gotoFlow(customerFlow);
            }
            else if (response === 'hola' || response === 'buenos' || response === 'buenas' || response === 'ola') {
                return
            }
            else{
                const mensajeError = await errorMessage();
                const mensajeMenu1 = menuMessages.join('\n'); // Unir los mensajes del menú en un solo string
                const mensajeCompleto = `${mensajeError}\n\n${mensajeMenu1}`;
                return fallBack(mensajeCompleto);
            }
        }
    );