// Required dependencies (assuming these files exist in the specified paths and are compatible)
import {TradingCore} from './TradingCore'; // Assuming TradingCore is a class or constructor function
import {DBHelpers} from './DBHelpers'; // Assuming DBHelpers is a class
import {PairRanker} from './PairRanker'; // Assuming PairRanker is a class
import {CurrencyCore} from './CurrencyCore';

// Type Definitions (already provided in TypeScript format)
type TradingCoreOptions = {} // Assuming this might be more detailed elsewhere

interface Ctrl {
    storage: {
        streamTick: (stream: any, streamID: string) => void;
        streams: Record<string, any>;
        candidates: any[];
        pairRanks: any[];
        trading: {
            queue: any[];
        };
        db: any; // Assuming 'db' has a specific type, using 'any' for now
    };
    options: {
        trading: TradingCoreOptions;
        arbitrage: boolean;
        storage: {
            logHistory: boolean;
        };
    };
    UI: {
        updateArbitageOpportunities: (candidates: any[]) => void;
    };
    logger: {
        info: (message: string) => void;
    };
    currencyCore?: any; // Assuming the type for CurrencyCore is defined elsewhere, using 'any' for now
}

// The exported function
export const BotCore = (ctrl: Ctrl): void => {

    const dbHelpers = new DBHelpers();
    const pairRanker = new PairRanker();

    // Define the streamTick function and assign it to ctrl.storage
    ctrl.storage.streamTick = (stream: any, streamID: string): void => {
        ctrl.storage.streams[streamID] = stream;

        if (streamID === 'allMarketTickers') {
            // Ensure currencyCore is initialized before accessing its methods
            // Note: In the original JS, currencyCore is initialized later,
            // but streamTick is likely called asynchronously after initialization.
            // TypeScript might raise strict errors if currencyCore could be undefined here.
            // Adding an explicit check, although the original logic flow implies it's set.
            if (!ctrl.currencyCore) {
                ctrl.logger.info('Warning: currencyCore not initialized when streamTick received data.');
                return; // Or handle appropriately
            }

            ctrl.storage.candidates = ctrl.currencyCore.getDynamicCandidatesFromStream(stream, ctrl.options.arbitrage);

            const pairToTrade = pairRanker.getPairRanking(ctrl.storage.candidates, ctrl.storage.pairRanks, ctrl);
            if (pairToTrade !== 'none') {
                // Original code had an empty block here, preserving it.
            }

            // Check if tradingCore is initialized before using it
            // This check is important because tradingCore is initialized after this function definition.
            if (tradingCore) {
                // @ts-ignore
                tradingCore.updateCandidateQueue(stream, ctrl.storage.candidates, ctrl.storage.trading.queue);
            }

            ctrl.UI.updateArbitageOpportunities(ctrl.storage.candidates);

            if (ctrl.options.storage.logHistory) {
                // @ts-ignore
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

    // Initialize currencyCore using require, preserving original behavior
    // Note: Using 'require' in TypeScript is possible but often less preferred than 'import'.
    // This assumes './CurrencyCore' exports a function that accepts 'ctrl'.
    // The type of the required module is inferred as 'any' due to 'require'.
    // Explicit typing would be better if the structure of CurrencyCore module is known.




    ctrl.currencyCore = new CurrencyCore(ctrl);

    // Initialize tradingCore after currencyCore is initialized
    const tradingCore = new TradingCore(ctrl.options.trading, ctrl.currencyCore);
};
