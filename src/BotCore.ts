import {CurrencyCore} from './CurrencyCore';
import {CtrlT} from "./types";
import {TradingCore} from "./TradingCore";


export class BotCore {

    constructor(ctrl: CtrlT) {

        const currencyCore = new CurrencyCore(ctrl);
        ctrl.currencyCore = currencyCore

        const tradingCore = new TradingCore(ctrl.options.trading, currencyCore);

        ctrl.storage.streamTick = (stream: any, streamID: string): void => {
            ctrl.storage.streams[streamID] = stream;

            if (streamID === 'allMarketTickers') {
                if (!ctrl.currencyCore) {
                    ctrl.logger.info('Warning: currencyCore not initialized when streamTick received data.');
                    return;
                }

                ctrl.storage.candidates = currencyCore.getDynamicCandidatesFromStream(stream, ctrl.options.arbitrage);

                if (tradingCore) {
                    tradingCore.updateCandidateQueue(stream, ctrl.storage.candidates, ctrl.storage.trading.queue);
                }

                ctrl.UI.updateArbitrageOpportunities(ctrl.storage.candidates);

            }
        };

        ctrl.logger.info('--- Starting Currency Streams');


    }
};
