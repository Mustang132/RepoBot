/**
 * @fileoverview Flujo de menú para el chatbot de Smartfood
 * Maneja la presentación de productos y promociones
 */

import { addKeyword } from '@builderbot/bot';
import { EVENTS } from '@builderbot/bot';
import { updateLastInteraction } from '../utils/updateLastInteraction';
import { dbConnection } from '../database/dbConnection';
import { RowDataPacket } from 'mysql2/promise';
import { welcomeFlow } from './welcomeFlow';
import { readMessages } from '../utils/readMessages';
import { join } from 'path';
import * as fs from 'fs';

/**
 * Interface para la estructura de datos de productos
 */
interface ProductRow extends RowDataPacket {
    id: number;
    nombre: string;
    precio: number;
    disponibilidad: number;
    id_linea_producto: number;
    promocion: number;
}

/**
 * Carga de mensajes desde archivos
 */
const menuWelcomeMessages = readMessages('dmsgMenuWelcome_menuFlow.txt');
const menuEndMessages = readMessages('dmsgMenuEnd_menuFlow.txt');

export const menuFlow = addKeyword(EVENTS.ACTION)

.addAction(async (ctx, { state, flowDynamic, gotoFlow }) => {

    // Mensaje de bienvenida aleatorio
    const randomIndex = Math.floor(Math.random() * menuWelcomeMessages.length);
    await flowDynamic([
        {
            body: menuWelcomeMessages[randomIndex],
            delay: 1000
        }
    ]);

    try {
        // Consulta de productos regulares
        const [products] = await dbConnection.query<ProductRow[]>(
            'SELECT id, nombre, precio FROM producto WHERE disponibilidad = 1 AND id_linea_producto < 10 AND promocion = 0'
        );

        // Mostrar productos regulares
        for (const product of products) {
            const imagePath = join(process.cwd(), 'media', `${product.id}`);
            let imageExists = false;
            let fullImagePath = '';

            if (fs.existsSync(`${imagePath}.jpeg`)) {
                imageExists = true;
                fullImagePath = `${imagePath}.jpeg`;
            } else if (fs.existsSync(`${imagePath}.png`)) {
                imageExists = true;
                fullImagePath = `${imagePath}.png`;
            }

            const formattedPrice = new Intl.NumberFormat('es-CO', {
                style: 'currency',
                currency: 'COP'
            }).format(product.precio);

            if (imageExists) {
                await flowDynamic([
                    {
                        body: `*${product.nombre}*\nPrecio: ${formattedPrice}`,
                        media: fullImagePath,
                        delay: 1000
                    }
                ]);
            } else {
                await flowDynamic([
                    {
                        body: `*${product.nombre}*\nPrecio: ${formattedPrice}`,
                        delay: 1000
                    }
                ]);
            }
        }

        // Consulta de productos en promoción
        const [promoProducts] = await dbConnection.query<ProductRow[]>(
            'SELECT id, nombre, precio FROM producto WHERE disponibilidad = 1 AND id_linea_producto < 10 AND promocion > 0'
        );

        // Mostrar productos en promoción
        if (promoProducts.length > 0) {
            await flowDynamic([
                {
                    body: "⚠️ 🚨 PROMOS VIGENTES 🚨 ⚠️",
                    delay: 1000
                }
            ]);

            for (const product of promoProducts) {
                const imagePath = join(process.cwd(), 'media', `${product.id}`);
                let imageExists = false;
                let fullImagePath = '';

                if (fs.existsSync(`${imagePath}.jpeg`)) {
                    imageExists = true;
                    fullImagePath = `${imagePath}.jpeg`;
                } else if (fs.existsSync(`${imagePath}.png`)) {
                    imageExists = true;
                    fullImagePath = `${imagePath}.png`;
                }

                const formattedPrice = new Intl.NumberFormat('es-CO', {
                    style: 'currency',
                    currency: 'COP'
                }).format(product.precio);

                if (imageExists) {
                    await flowDynamic([
                        {
                            body: `*${product.nombre}*\nPrecio: ${formattedPrice}`,
                            media: fullImagePath,
                            delay: 1000
                        }
                    ]);
                }
            }
        }

        // Mensaje final aleatorio
        const randomEndIndex = Math.floor(Math.random() * menuEndMessages.length);
        await flowDynamic([
            {
                body: menuEndMessages[randomEndIndex],
                delay: 1000
            }
        ]);

        // Limpiar estado y volver a welcomeFlow
        await state.update({ currentFlow: null });
        return gotoFlow(welcomeFlow);

    } catch (error) {
        console.error('Error al obtener productos:', error);
        await flowDynamic([
            {
                body: 'Lo siento, hubo un error al cargar el menú. Por favor, intenta nuevamente.',
                delay: 1000
            }
        ]);
        
        // En caso de error, limpiar estado y volver a welcomeFlow
        await state.update({ currentFlow: null });
        return gotoFlow(welcomeFlow);
    }
});