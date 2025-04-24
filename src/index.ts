import {logger} from './LoggerCore';
import UI from './UI';
import {EventsCore} from './EventsCore';
import {BotCore} from './BotCore';

let exchangeAPI: any = {};

logger.info('--- Loading Exchange API');

if (process.env.activeExchange === 'binance') {
    logger.info('--- \tActive Exchange:' + process.env.activeExchange);

    const api = require('binance');
    const beautifyResponse: boolean = false;
    exchangeAPI = new api.BinanceRest({
        timeout: parseInt(process.env.restTimeout as string),
        recvWindow: parseInt(process.env.restRecvWindow as string),
        disableBeautification: beautifyResponse
    });
    exchangeAPI.WS = new api.BinanceWS(beautifyResponse);
}

interface BotOptions {
    UI: {
        title: string;
    };
    arbitrage: {
        paths: string[];
        start: string;
    };
    storage: {
        logHistory: boolean;
    };
    trading: {
        paperOnly: boolean;
        minQueuePercentageThreshold: number;
        minHitsThreshold: number;
    };
}

const botOptions: BotOptions = {
    UI: {
        title: 'Top Potential Arbitrage Triplets, via: ' + process.env.binanceColumns
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

interface Storage {
    trading: {
        queue: any[];
        active: any[];
    };
    candidates: any[];
    streams: any[];
    pairRanks: any[];
}

interface Ctrl {
    options: BotOptions;
    storage: Storage;
    logger: any;
    exchange: any;
    UI?: any;
    events?: any;
}

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
