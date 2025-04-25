import {logger} from './LoggerCore';
import UI from './UI';
import {EventsCore} from './EventsCore';
import {BotCore} from './BotCore';
import api from 'binance';
import {BotOptions, Ctrl} from "./types";

let exchangeAPI: any = {};

logger.info('--- Loading Exchange API');

if (process.env.activeExchange === 'binance') {
    logger.info('--- \tActive Exchange:' + process.env.activeExchange);


    const beautifyResponse: boolean = false;
    exchangeAPI = new api.BinanceRest({
        timeout: parseInt(process.env.restTimeout as string),
        recvWindow: parseInt(process.env.restRecvWindow as string),
        disableBeautification: beautifyResponse
    });


    exchangeAPI.WS = new api.BinanceWS(beautifyResponse);
}

console.log(1111, api)
const botOptions: BotOptions = {
    UI: {
        title: 'Top Potential Arbitrage Triplets, via: ' + process.env.binanceColumns + JSON.stringify(api)
    },
    arbitrage: {
        paths: [''],
        start: process.env.binanceStartingPoint as string
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

const ctrl: Ctrl = {
    options: botOptions,
    storage: {
        trading: {
            queue: [],
            active: []
        },
        candidates: [],
        streams: [],
        pairRanks: []
    },
    logger: logger,
    exchange: exchangeAPI
};

UI(ctrl.options);
// @ts-ignore
EventsCore(ctrl);

// @ts-ignore
BotCore(ctrl);

ctrl.logger.info('----- Bot Startup Finished -----');
