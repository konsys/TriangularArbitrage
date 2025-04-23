import TradingCore from './TradingCore';
import {DBHelpers} from './DBHelpers';
import {PairRanker} from './PairRanker';

interface Ctrl {
    storage: {
        streamTick: (stream: any, streamID: string) => void;
        streams: Record<string, any>;
        candidates: any[];
        pairRanks: any[];
        trading: {
            queue: any[];
        };
        db: any;
    };
    options: {
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
    currencyCore?: any; // Assuming the type for CurrencyCore is defined elsewhere
}

export default (ctrl: Ctrl): void => {
    const dbHelpers = new DBHelpers();
    const pairRanker = new PairRanker();

    ctrl.storage.streamTick = (stream: any, streamID: string): void => {
        ctrl.storage.streams[streamID] = stream;

        if (streamID === 'allMarketTickers') {
            ctrl.storage.candidates = ctrl.currencyCore.getDynamicCandidatesFromStream(stream, ctrl.options.arbitrage);

            const pairToTrade = pairRanker.getPairRanking(ctrl.storage.candidates, ctrl.storage.pairRanks, ctrl, ctrl.logger);
            if (pairToTrade !== 'none') {
            }

            if (tradingCore)
                tradingCore.updateCandidateQueue(stream, ctrl.storage.candidates, ctrl.storage.trading.queue);

            ctrl.UI.updateArbitageOpportunities(ctrl.storage.candidates);

            if (ctrl.options.storage.logHistory) {
                dbHelpers.saveArbRows(ctrl.storage.candidates, ctrl.storage.db, ctrl.logger);
                dbHelpers.saveRawTick(stream.arr, ctrl.storage.db, ctrl.logger);
            }

        }
    };

    ctrl.logger.info('--- Starting Currency Streams');
    ctrl.currencyCore = require('./CurrencyCore')(ctrl);

    const tradingCore = TradingCore(ctrl.options.trading, ctrl.currencyCore);
};
