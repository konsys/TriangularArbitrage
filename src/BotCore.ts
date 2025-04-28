// Required dependencies (assuming these files exist in the specified paths and are compatible)
import {DBHelpers} from './DBHelpers'; // Assuming DBHelpers is a class
import {PairRanker} from './PairRanker'; // Assuming PairRanker is a class
import {CurrencyCore} from './CurrencyCore';
import {CtrlT} from "./types";
import {TradingCore} from "./TradingCore";

// The exported function
export const BotCore = (ctrl: CtrlT): void => {
    const dbHelpers = new DBHelpers();
    const pairRanker = new PairRanker();

    // Define the streamTick function and assign it to ctrl.storage
    ctrl.storage.streamTick = (stream: any, streamID: string): void => {
        ctrl.storage.streams[streamID] = stream;

        if (streamID === 'allMarketTickers') {
            if (!ctrl.currencyCore) {
                ctrl.logger.info('Warning: currencyCore not initialized when streamTick received data.');
                return; // Or handle appropriately
            }

            ctrl.storage.candidates = currencyCore.getDynamicCandidatesFromStream(stream, ctrl.options.arbitrage);

            const pairToTrade = pairRanker.getPairRanking(ctrl.storage.candidates, ctrl.storage.pairRanks, ctrl);
            if (pairToTrade !== 'none') {
                // Original code had an empty block here, preserving it.
            }

            // Check if tradingCore is initialized before using it
            // This check is important because tradingCore is initialized after this function definition.
            if (tradingCore) {
                tradingCore.updateCandidateQueue(stream, ctrl.storage.candidates, ctrl.storage.trading.queue);
            }


            ctrl.UI.updateArbitageOpportunities(ctrl.storage.candidates);

            if (ctrl.options.storage.logHistory) {

                dbHelpers.saveArbRows(ctrl.storage.candidates, ctrl.storage.db, ctrl.logger);
                // Assuming stream.arr exists and is the correct data structure for saveRawTick
                if (stream && Array.isArray(stream.arr)) {
                    // @ts-ignore
                    dbHelpers.saveRawTick(stream.arr, ctrl.storage.db, ctrl.logger);
                } else {
                    // Optional: Log a warning if stream.arr is not as expected
                    // ctrl.logger.info('Warning: stream.arr not found or not an array in streamTick.');
                }
            }
        }
    };

    ctrl.logger.info('--- Starting Currency Streams');


    const currencyCore = new CurrencyCore(ctrl);
    ctrl.currencyCore = currencyCore

    const tradingCore = new TradingCore(ctrl.options.trading, currencyCore);
};
