import { dbConnection } from '../database/dbConnection';

export const updateLastInteraction = async (phoneNumber: string) => {
    try {
        const ahora = new Date();
        await dbConnection.query(
            'UPDATE cliente SET ultima_interaccion = ? WHERE contacto = ?',
            [ahora, phoneNumber]
        );
    } catch (error) {
        console.log('Error actualizando última interacción:');
        console.error('Error actualizando última interacción:', error);
    }
};