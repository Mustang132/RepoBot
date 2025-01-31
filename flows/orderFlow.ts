import { addKeyword, EVENTS } from '@builderbot/bot';
import { updateLastInteraction } from '../utils/updateLastInteraction';

export const orderFlow = addKeyword([EVENTS.ACTION], {sensitive: true})
    .addAction(async (ctx, { flowDynamic }) => {
        await updateLastInteraction(ctx.from);
        await flowDynamic('Ha accedido a orderFlow');
    });