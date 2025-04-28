import {logger} from './LoggerCore';

import rest from 'binance/lib/rest';
import ws from 'binance/lib/ws';
import {BotOptions, CtrlT, Currency} from "./types";
import env from 'node-env-file';
import {UI} from "./UI";
import {BotCore} from "./BotCore";

try {
    env(__dirname + '/.keys');
} catch (e) {
    console.warn('No .keys was provided, running with defaults.');
}
env(__dirname + '/conf.ini');

async function start() {

    logger.info('--- Loading Exchange API');

    // if (process.env.activeExchange === 'binance') {
    logger.info('--- \tActive Exchange:' + process.env.activeExchange);


    const beautifyResponse: boolean = false;
    let exchangeAPI = new rest({
        timeout: parseInt(process.env.restTimeout as string),
        recvWindow: parseInt(process.env.restRecvWindow as string),
        disableBeautification: beautifyResponse
    });
    exchangeAPI.WS = new ws(beautifyResponse);

    const botOptions: BotOptions = {
        UI: {
            title: 'Top Potential Arbitrage Triplets, via: ' + process.env.binanceColumns
        },
        arbitrage: {
            paths: process.env?.binanceColumns?.split(',') as string[],
            start: process.env.binanceStartingPoint as Currency
        },
        storage: {
            logHistory: false
        },
        trading: {
            paperOnly: true,
            minQueuePercentageThreshold: 3,
            minHitsThreshold: 5
        }
    };

    const ctrl: CtrlT = {
        options: botOptions,
        storage: {
            trading: {
                queue: {},
                active: []
            },
            candidates: [],
            streams: [],
            pairRanks: [],
            rate: 0,
            a_step_from: '',
            b_step_from: '',
            c_step_from: '',
        },
        logger: logger,
        exchange: exchangeAPI,
    };

    ctrl.UI = new UI(ctrl.options)

    BotCore(ctrl);

    ctrl.logger.info('----- Bot Startup Finished -----');

}

start().then()
