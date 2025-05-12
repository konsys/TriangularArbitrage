import {CurrencyCore} from './CurrencyCore';
import {AllMarketTickersT, CtrlT, StreamIdT} from "./types";
import {TradingCore} from "./TradingCore";
import {logger} from './LoggerCore';

export class BotCore {
    constructor(ctrl: CtrlT) {
        const currencyCore = new CurrencyCore(ctrl);
        ctrl.currencyCore = currencyCore
        const tradingCore = new TradingCore(ctrl.options.trading, currencyCore);

        ctrl.storage.streamTick = (stream: AllMarketTickersT, streamID: StreamIdT): void => {

            ctrl.storage.streams[streamID] = stream;

            if (streamID === 'allMarketTickers') {
                if (!ctrl.currencyCore) {
                    logger.info('Warning: currencyCore not initialized when streamTick received data.');
                    return;
                }

                ctrl.storage.candidates = currencyCore.getDynamicCandidatesFromStream(stream, ctrl.options.arbitrage);

                if (tradingCore) {
                    tradingCore.updateCandidateQueue(stream, ctrl.storage.candidates, ctrl.storage.trading.queue);
                }

                if (ctrl.UI) {
                    ctrl.UI.updateArbitrageOpportunities(ctrl.storage.candidates);
                }

            }
        };
        logger.info('--- Starting Currency Streams');

    }
}
