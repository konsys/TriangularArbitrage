import {logger} from './LoggerCore';
import rest from 'binance/lib/rest';
import ws from 'binance/lib/ws';
import {BinanceRestT, BotOptions, CtrlT, CurrencyNameT, Storage} from "./types";

import dotenv from 'dotenv';
import {BotCore} from "./BotCore";
import {UI} from "./UI";


dotenv.config({path: '../.env'});


const start = async () => {
    logger.info('--- Loading Exchange API');
    logger.info('--- \tActive Exchange:' + process.env.activeExchange);
    const beautifyResponse: boolean = false;
    let exchangeAPI: BinanceRestT = new rest({
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
            paths: process.env?.binanceColumns?.split(',') as [CurrencyNameT, CurrencyNameT, CurrencyNameT],
            start: process.env.binanceStartingPoint as CurrencyNameT
        },
        storage: {} as Storage,
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
                queue: null,
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
        exchange: exchangeAPI,
    };

    const showUi = true

    if (showUi) {
        ctrl.UI = new UI(ctrl.options)
    }
    new BotCore(ctrl);

    logger.info('----- Bot Startup Finished -----');

}

start().then()
