import { addKeyword } from '@builderbot/bot';
import { updateLastInteraction } from '../utils/updateLastInteraction';
import { EVENTS } from '@builderbot/bot';
import { dbConnection } from '../database/dbConnection';
import { RowDataPacket } from 'mysql2/promise';
import { customerFlow } from './customerFlow';
import { errorMessage } from '../utils/errorMessage';



export const addressFlow = addKeyword(EVENTS.ACTION)

.addAction(async (ctx, { state, flowDynamic, gotoFlow }) => {

    //console.log('Entrando en addAction 1 de addressFlow');
    /*
        // Obtener ID del cliente
        const idCliente = state.get('idCliente');
        try {

        // Consultar direcciones principales
        const [direcciones] = await dbConnection.query<DireccionRow[]>(
            'SELECT id, direccion, es_principal FROM direccion WHERE id_cliente = ? AND es_principal > 0 ORDER BY es_principal',
            [idCliente]
        );

        let mensaje = '¡Tienes hasta tres ~deseos~... direcciones a las qué enviarte la magia! ¿Cual deseas ajustar?\n\n';
        
        // Generar listado de direcciones
        for (let i = 1; i <= 3; i++) {
            const dir = direcciones.find(d => d.es_principal === i);
            mensaje += `${i}. ${dir.direccion}\n`;
        }
        mensaje += '4. Volver↩️';
        await state.update({ mensajeDireccionesCliente: mensaje });

        await flowDynamic(mensaje);

        
    }
    catch (error) {
        console.error('Error al obtener direcciones principales:', error);
        await flowDynamic('Hubo un problema al obtener tus datos. Por favor, intenta nuevamente más tarde. 🙏');
        return gotoFlow(addressFlow);
    }
    */
   await flowDynamic('escribe 1 o 2');
    })
    .addAction({ capture: true }, async (ctx, { flowDynamic, state, gotoFlow, fallBack }) => {await flowDynamic(ctx.body)}) //addAction de prueba para ver comportamiento
    //.addAnswer('muy bien 2'); //addAnswer de prueba para ver comportamiento

    /**
     * Captura selección de dirección principal a actualizar y maneja opciones iniciales
     
    .addAction(
        
        { capture: true },
        async (ctx, { flowDynamic, state, gotoFlow, fallBack }) => {
            
            console.log('Entrando en addAction 2 de addressFlow');
            await updateLastInteraction(ctx.from);
            const response = ctx.body.toLowerCase();
            //volver a flujo anterior
            if (response === '4' || response === 'volver') {
                return gotoFlow(customerFlow);
            }
            //No dejar que tome el fallBack cuando el usuario quiere activar flujo Bienvenida
            else if (response === 'hola' || response === 'buenos' || response === 'buenas' || response === 'ola') {
                return;
            }
            //Si el usuario selecciona una opción de la lista de direcciones principales
            else if (response === '1' || response === '2' || response === '3') {
            const selectedOption = parseInt(response);
            await state.update({ selectedPositionAddress: selectedOption });
            const mensaje = '*Escribe la nueva dirección '+selectedOption+' para editarla*\n👉*Eliminar* para eliminar la dirección'+selectedOption+'\n👉1️⃣Volver atras ↩️';
            await flowDynamic(mensaje,{delay: 800});
            }
            //Si el usuario no selecciona ninguna opción válida
            else {
            const mensajeError = await errorMessage();
            const mensajeMenuAnterior = state.get('mensajeDireccionesCliente');
            await state.update({ mensajeDireccionesCliente: null });
            const mensajeCompleto = `${mensajeError}\n\n${mensajeMenuAnterior}`;
            return fallBack(mensajeCompleto);
            }
        })
        .addAction(async(_,{flowDynamic}) => await flowDynamic('muy bien 3')) //addAction de prueba para ver comportamiento
        .addAnswer('muy bien 4') //addAnswer de prueba para ver comportamiento

        /* 
        .addAction(
        
            { capture: true },
            async (ctx, { flowDynamic, state, gotoFlow, fallBack }) => {

            console.log('Entrando en addAction 3 de addressFlow');
            await updateLastInteraction(ctx.from);
            const response = ctx.body.toLowerCase();

            if (response === 'eliminar') {
                const position = state.get('selectedPositionAddress');
                const idCliente = state.get('idCliente');
                await dbConnection.query(
                    'UPDATE direccion SET es_principal = 0 WHERE id_cliente = ? AND es_principal = ?',
                    [idCliente, position]
                );
                await flowDynamic([{ body: 'Todo ha salido perfecto! Dirección eliminada 😉', delay: 800 }]);
                return gotoFlow(addressFlow);
            }
          

            else if (response === '1') 
                {
                await flowDynamic([{ body: '¡No te preocupes! Volvamos a ver la lista de direcciones 🥸', delay: 800}]);
                return gotoFlow(addressFlow);

                }

            else if (response === 'hola' || response === 'buenos' || response === 'buenas' || response === 'ola') {
                return;
            }

            else {
                await state.update({ direccionTemp: response });
                const [municipios] = await dbConnection.query<MunicipioRow[]>(
                    'SELECT id,nombre, habilitado FROM municipio WHERE habilitado = 1'
                );
                let mensaje = 'Interesante dirección 😎, cuentanos en qué municipio es esta dirección ?\n\n';
                // Generar listado de municipios
                for (let i = 1; i <= municipios.length; i++) {
                    const mun = municipios.find(h => h.id === i);
                    mensaje += `${i}. ${mun ? mun.nombre :'Error'}\n`;
                }
    
                await flowDynamic([{ body: mensaje, delay: 800 }]);

                }

            }
        ).addAction(
            
            { capture: true },
            async (ctx, { flowDynamic, state, fallBack }) => {

            console.log('Entrando en addAction 4 de addressFlow');
            const response = ctx.body.toLowerCase();
            await updateLastInteraction(ctx.from);

            

            if (response === '1' || response === '2' || response === '3' || response === '4') {
                const selectedOption = parseInt(response);
                await state.update({ 

                    idSelectedMunicipio: selectedOption 
                                                    
                });

                await flowDynamic([{ body: 'Definitivamente el mejor vividero de Santander 😍 /n/n Ahora escribe el nombre del barrio', delay: 800 }]);
                
            }

            else if (response === 'hola' || response === 'buenos' || response === 'buenas' || response === 'ola') {
                return;
            }

            else {

                const mensajeError = await errorMessage();
                const mensajeMenuAnterior = state.get('mensajeDireccionesCliente');
                await state.update({ mensajeDireccionesCliente: null });
                const mensajeCompleto = `${mensajeError}\n\n${mensajeMenuAnterior}`;
                return fallBack(mensajeCompleto);

            }


        }

        
        //Finaliza el proceso guardando la nueva dirección
         
        ).addAction( { capture : true }, async (ctx, { flowDynamic, state, gotoFlow }) => {
            console.log('Entrando en addAction 5 de addressFlow');
                const response = ctx.body.toLowerCase();
                await updateLastInteraction(ctx.from);
                const idMunicipio = state.get('idSelectedMunicipio');

                try {
                    const [idBarrio] = await dbConnection.query<BarrioRow[]>( 'select id from barrio where nombre = ?', [response]);
                    if (idBarrio.length > 0) {

                        await state.update({idBarrio: idBarrio[0].id_barrio});
                    }

                    else {
                        await dbConnection.query( 'INSERT INTO barrio (nombre, id_municipio_barrio) VALUES (?, ?)', [response, idMunicipio]);
                        const idBarrioNuevo = await dbConnection.query<BarrioRow[]>( 'select id from barrio where nombre = ?', [response]);
                        await state.update({idBarrio: idBarrioNuevo[0]});

                    }

                    const idDireccionPrincipal = state.get('selectedPositionAddress');
                    const direccionNueva = state.get('direccionTemp');

                    const idCliente = state.get('idCliente');
                    const idBarrioDireccion = state.get('idBarrio');

                    // Obtener todas las direcciones principales del usuario ordenadas por prioridad
                    const [direcciones] = await dbConnection.query<DireccionRow[]>(
                        'SELECT id, direccion, es_principal FROM direccion WHERE id_cliente = ? AND es_principal > 0 ORDER BY es_principal',
                        [idCliente]
                    );

                    // Buscar si la dirección seleccionada existe dentro del listado
                    const direccionExistente = direcciones.find(d => d.es_principal === idDireccionPrincipal);

                    if (direccionExistente) {
                        // Si la dirección seleccionada existe, la actualizamos para quitarle la propiedad de "principal"
                        await dbConnection.query(
                            'UPDATE direccion SET es_principal = 0 WHERE id_cliente = ? AND es_principal = ?',
                            [idCliente, idDireccionPrincipal]
                        );
                    }

                    // Insertar la nueva dirección y marcarla como principal con su número correspondiente
                    await dbConnection.query(
                        'INSERT INTO direccion (id_cliente, direccion, id_barrio, id_municipio, es_principal) VALUES (?, ?, ?, ?, ?)',
                        [idCliente, direccionNueva, idBarrioDireccion, idMunicipio, idDireccionPrincipal]
                    );

                    await flowDynamic('🛵💨 Tus pedidos volarán a esta dirección 📦🍔 \n\n *Actualizaste correctamente la dirección*)')
                    return gotoFlow(addressFlow);
                    
                } catch (error) {
                    console.error('Error al registrar cliente:', error);
                    await flowDynamic(
                        'Hubo un problema al registrar tus datos. Por favor, intenta nuevamente más tarde. 🙏'
                    );
                    return gotoFlow(addressFlow);
                }


    
            }
        )
        */