import { join } from 'path'
import { createBot, createProvider, createFlow, addKeyword, utils } from '@builderbot/bot';
import { MysqlAdapter as Database } from '@builderbot/database-mysql';
import { BaileysProvider as Provider } from '@builderbot/provider-baileys';
import { welcomeFlow } from '../flows/welcomeFlow';
import { menuFlow } from '../flows/menuFlow';
import { orderFlow } from '../flows/orderFlow';
import { customerFlow } from '../flows/customerFlow';
import { addressFlow } from 'flows/addressFlow';
import { nameUserFlow } from '../flows/customerFlow';
import { reccordUserFlow } from '../flows/customerFlow';
import dotenv from 'dotenv';


const PORT = process.env.PORT ?? 3008


const main = async () => {
    const adapterFlow = createFlow([welcomeFlow, customerFlow, menuFlow, orderFlow, addressFlow, nameUserFlow, reccordUserFlow]);

    const adapterProvider = createProvider(Provider)
    const adapterDB = new Database({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        port: Number(process.env.DB_PORT),
    })

    const { handleCtx, httpServer } = await createBot({
        flow: adapterFlow,
        provider: adapterProvider,
        database: adapterDB,
    }, {
        queue: {
            timeout: 20000, //TIEMPO EN MILISEGUNDOS
            concurrencyLimit: 100 //CANTIDAD DE PROCESOS SIMULTANEOS
        }
    })

    adapterProvider.server.post(
        '/v1/messages',
        handleCtx(async (bot, req, res) => {
            const { number, message, urlMedia } = req.body
            await bot.sendMessage(number, message, { media: urlMedia ?? null })
            return res.end('sended')
        })
    )

    adapterProvider.server.post(
        '/v1/register',
        handleCtx(async (bot, req, res) => {
            const { number, name } = req.body
            await bot.dispatch('REGISTER_FLOW', { from: number, name })
            return res.end('trigger')
        })
    )

    adapterProvider.server.post(
        '/v1/samples',
        handleCtx(async (bot, req, res) => {
            const { number, name } = req.body
            await bot.dispatch('SAMPLES', { from: number, name })
            return res.end('trigger')
        })
    )

    adapterProvider.server.post(
        '/v1/blacklist',
        handleCtx(async (bot, req, res) => {
            const { number, intent } = req.body
            if (intent === 'remove') bot.blacklist.remove(number)
            if (intent === 'add') bot.blacklist.add(number)

            res.writeHead(200, { 'Content-Type': 'application/json' })
            return res.end(JSON.stringify({ status: 'ok', number, intent }))
        })
    )

    httpServer(+PORT)
}

main()
