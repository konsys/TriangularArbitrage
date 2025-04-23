import { Controller } from './Controller';
import TradingCore from './TradingCore';
import { DBHelpers } from './DBHelpers';
import { PairRanker } from './PairRanker';

interface Stream {
    arr: any[];
}

interface Storage {
    streams: Record<string, Stream>;
    candidates: any[];
    pairRanks: any;
    trading: {
        queue: any[];
    };
}

interface Options {
    arbitrage: any;
    storage: {
        logHistory: boolean;
    };
}

interface Ctrl {
    storage: Storage;
    options: Options;
    currencyCore: any;
    UI: {
        updateArbitageOpportunities(candidates: any[]): void;
    };
    logger: {
        info(message: string): void;
    };
}

export default (ctrl: Ctrl): void => {
    const dbHelpers = new DBHelpers();
    const pairRanker = new PairRanker();

    ctrl.storage.streamTick = (stream: Stream, streamID: string): void => {
        ctrl.storage.streams[streamID] = stream;

        if (streamID === 'allMarketTickers') {
            ctrl.storage.candidates = ctrl.currencyCore.getDynamicCandidatesFromStream(stream, ctrl.options.arbitrage);

            const pairToTrade = pairRanker.getPairRanking(ctrl.storage.candidates, ctrl.storage.pairRanks, ctrl, ctrl.logger);
            if (pairToTrade !== 'none') {}

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