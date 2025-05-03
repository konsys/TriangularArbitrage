// Required dependencies (assuming these files exist in the specified paths and are compatible)
// Assuming DBHelpers is a class
import {PairRanker} from './PairRanker'; // Assuming PairRanker is a class
import {CurrencyCore} from './CurrencyCore';
import {CtrlT} from "./types";
import {TradingCore} from "./TradingCore";

// The exported function
export const BotCore = (ctrl: CtrlT) => {


    const pairRanker = new PairRanker();

    // Define the streamTick function and assign it to ctrl.storage
    ctrl.storage.streamTick = (stream: any, streamID: string): void => {
        ctrl.storage.streams[streamID] = stream;

        if (streamID === 'allMarketTickers') {
            if (!ctrl.currencyCore) {
                ctrl.logger.info('Warning: currencyCore not initialized when streamTick received data.');
                return;
            }

            ctrl.storage.candidates = currencyCore.getDynamicCandidatesFromStream(stream, ctrl.options.arbitrage);

            const pairToTrade = pairRanker.getPairRanking(ctrl.storage.candidates, ctrl.storage.pairRanks, ctrl);

            if (tradingCore) {
                tradingCore.updateCandidateQueue(stream, ctrl.storage.candidates, ctrl.storage.trading.queue);
            }


            ctrl.UI.updateArbitageOpportunities(ctrl.storage.candidates);

        }
    };

    ctrl.logger.info('--- Starting Currency Streams');


    const currencyCore = new CurrencyCore(ctrl);
    ctrl.currencyCore = currencyCore

    const tradingCore = new TradingCore(ctrl.options.trading, currencyCore);
};
