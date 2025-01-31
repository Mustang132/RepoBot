import { dbConnection } from '../database/dbConnection';
import { RowDataPacket } from 'mysql2/promise';

interface ClienteRow extends RowDataPacket {
    nombre: string;
    ultima_interaccion?: Date;
}
export async function searchNameClient(phoneNumber: string, state: any): Promise<void> {
    try {
        const [rows] = await dbConnection.query<ClienteRow[]>(
            'SELECT nombre, id, ultima_interaccion FROM cliente WHERE contacto = ?',
            [phoneNumber]
        );

        if (rows.length > 0) {
            // Cliente existe, actualizar estado con el nombre
            await state.update({ nombreCliente: rows[0].nombre });
            await state.update({ clienteNuevo: 0 }); // Asegurarse de que clienteNuevo se actualice correctamente
            await state.update({ idCliente: rows[0].id });
            await state.update({ ultima_interaccion_cliente: rows[0].ultima_interaccion });


        } else {
            // Cliente no existe, crear nuevo registro con nombre vacío
            const ahora = new Date();
            try {
                await dbConnection.query(
                    'INSERT INTO cliente (contacto, nombre, ultima_interaccion) VALUES (?, ?, ?)',
                    [phoneNumber, '', ahora]
                );
                await state.update({ nombreCliente: '', clienteNuevo: 1 });
            } catch (error) {
                console.error('Error al registrar nuevo cliente:', error);
                await state.update({ nombreCliente: '', clienteNuevo: 0 });
            }
        }
    } catch (error) {
        console.error('Error en searchNameClient:', error);
    }
}