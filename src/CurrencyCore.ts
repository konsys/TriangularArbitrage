import {
    AllMarketTickersT,
    BinanceRestT,
    ComparisonT,
    CtrlT,
    CurrencyAdaptedValueT,
    CurrencyDataT,
    CurrencyNameT,
    CurrencyT,
    DynamicCandidateT,
    EventsT,
    PairT,
    PathOptions,
    SocketsT,
    StepCurrencyT,
    StreamIdT,
    StreamsT
} from "./types";
import {BinanceCurrencyValueT} from "./adapters/types";
import {fromBinance} from "./adapters/BinanceAdapter";


const streamsDefault: StreamsT = {
    allMarketTickers: {
        arr: [],
        obj: {},
        markets: []
    }
}

export class CurrencyCore {
    sockets: SocketsT = {}
    streams: StreamsT = streamsDefault
    steps: CurrencyNameT[] = ['BTC', 'ETH', 'BNB', 'USDT'];
    events: EventsT = {
        onAllTickerStream: () => undefined
    };

    controller: CtrlT;

    constructor(ctrl: CtrlT) {
        if (!ctrl.exchange) {
            throw 'Undefined currency exchange connector. Will not be able to communicate with exchange API.';
        }

        this.controller = ctrl

        this.startBinanceAllTickerStream(ctrl.exchange);
        this.queueTicker(5000);

        this.events.onAllTickerStream = this.onTicket;


    }

    startBinanceAllTickerStream(exchange: BinanceRestT) {
        if (!this.streams.allMarketTickers) {
            this.streams = streamsDefault;
        }

        this.sockets.allMarketTickerStream = exchange.WS.onAllTickers((event: BinanceCurrencyValueT[]) => {
                return this.events.onAllTickerStream(event.map(fromBinance))
            }
        );
    };

    onTicket = (adaptedStream: CurrencyAdaptedValueT[]) => {
        const key: StreamIdT = 'allMarketTickers';
        this.streams.allMarketTickers.arr = adaptedStream;
        this.streams.allMarketTickers.obj = adaptedStream.reduce((acc, current) => {
            acc[current.symbol] = current;
            return acc;
        }, {});


        // Sub objects with only data on specific markets
        for (let i = 0; i < this.steps.length; i++)
            this.streams.allMarketTickers.markets[this.steps[i]] = adaptedStream.filter(e => {
                return (e.symbol.endsWith(this.steps[i]) || e.symbol.startsWith(this.steps[i]));
            });

        if (this.controller && this.controller.storage.streamTick) {
            this.controller.storage.streamTick(this.streams[key], key);
        }
    }


    queueTicker = (interval: number) => {
        if (!interval) {
            interval = 3000;
        }

        setTimeout(() => {
            this.queueTicker(interval);
        }, interval);
    };


    // Called from BorCore
    getDynamicCandidatesFromStream = (stream: AllMarketTickersT, options: PathOptions) => {
        let matches: DynamicCandidateT[] = [];

        for (let i = 0; i < options.paths.length; i++) {
            const pMatches: DynamicCandidateT[] = this.getCandidatesFromStreamViaPath(stream, options.start, options.paths[i]);
            matches = matches.concat(pMatches);
        }

        if (matches.length) {
            matches.sort((a: DynamicCandidateT, b: DynamicCandidateT) => {
                return b.rate - a.rate;
            });
        }


        return matches;
    };

    getCandidatesFromStreamViaPath = (stream: AllMarketTickersT, aPair: CurrencyNameT, bPair: CurrencyNameT) => {

        const keys: StepCurrencyT = {
            a: aPair,
            b: bPair,
            c: aPair
        };

        const aPairs: PairT[] = stream.markets[keys.a];
        const bPairs: PairT[] = stream.markets[keys.b];


        const aKeys: CurrencyDataT[] = [];

        aPairs.map((obj) => {
            aKeys[obj.symbol.replace(keys.a, '')] = obj;
        });


        // prevent 1-steps
        delete aKeys[keys.b];

        /*
          Loop through bPairs
            for each bpair key, check if apair has it too.
            If it does, run arbitrage math
        */
        const bMatches: DynamicCandidateT[] = [];


        for (let i = 0; i < bPairs.length; i++) {
            const bPairTicker = bPairs[i];


            bPairTicker.key = bPairTicker.symbol.replace(keys.b, '') as CurrencyNameT;


            // from B to C
            bPairTicker.startsWithKey = bPairTicker.symbol.startsWith(keys.b);

            // from C to B
            bPairTicker.endsWithKey = bPairTicker.symbol.endsWith(keys.b);

            if (aKeys[bPairTicker.key]) {
                const match = bPairTicker;


                const stepC = this.getCurrencyFromStream(stream, match.key, keys.a);

                // only do this if we definitely found a path. Some paths are impossible, so will result in an empty stepC quote.
                if (stepC) {
                    keys.c = match.key;

                    const comparison = this.getArbitrageRate(stream, keys.a, keys.b, keys.c);

                    if (comparison) {

                        const dt = new Date();
                        const triangle: DynamicCandidateT = {
                            ws_ts: comparison.a.timestamp,
                            ts: +dt,
                            dt: dt,
                            // these are for storage later
                            a: comparison.a,//full ticker for first pair (BTC->BNB)
                            a_symbol: comparison.a.symbol,
                            a_step_from: comparison.a.stepFrom,//btc
                            a_step_to: comparison.a.stepTo,//bnb
                            a_step_type: comparison.a.tradeInfo?.side,
                            a_bid_price: comparison.a.bidPrice,
                            a_bid_quantity: comparison.a.bidQuantity,
                            a_ask_price: comparison.a.askPrice,
                            a_ask_quantity: comparison.a.askQuantity,
                            a_volume: comparison.a.volume,
                            a_trades: comparison.a.trades,
                            b: comparison.b,
                            b_symbol: comparison.b.symbol,
                            b_step_from: comparison.b.stepFrom,
                            b_step_to: comparison.b.stepTo,
                            b_step_type: comparison.b.tradeInfo.side,
                            b_bid_price: comparison.b.bidPrice,
                            b_bid_quantity: comparison.b.bidQuantity,
                            b_ask_price: comparison.b.askPrice,
                            b_ask_quantity: comparison.b.askQuantity,
                            b_volume: comparison.b.volume,
                            b_trades: comparison.b.trades,
                            c: comparison.c,
                            c_symbol: comparison.c.symbol,
                            c_step_from: comparison.c.stepFrom,
                            c_step_to: comparison.c.stepTo,
                            c_step_type: comparison.c.tradeInfo.side,
                            c_bid_price: comparison.c.bidPrice,
                            c_bid_quantity: comparison.c.bidQuantity,
                            c_ask_price: comparison.c.askPrice,
                            c_ask_quantity: comparison.c.askQuantity,
                            c_volume: comparison.c.volume,
                            c_trades: comparison.c.trades,
                            rate: comparison.rate,
                        };
                        // debugger;
                        bMatches.push(triangle);
                    }
                }
            }
        }

        if (bMatches.length) {
            bMatches.sort((a, b) => {
                return (b.rate) - (a.rate);
            });
        }

        return bMatches;
    };

    getCurrencyFromStream = (stream: AllMarketTickersT, fromCur: CurrencyNameT, toCur: CurrencyNameT) => {

        if (!stream || !fromCur || !toCur) {
            return;
        }

        /*
         Binance uses xxxBTC notation. If we're looking at xxxBTC and we want to go from BTC to xxx, that means we're buying, vice versa for selling.
        */
        let currency: CurrencyT = stream.obj[toCur + fromCur];


        if (currency) {
            // found a match using reversed binance syntax, meaning we're buying if we're going from->to (btc->xxx in xxxBTC ticker) using a fromCurtoCur ticker.
            currency.flipped = false;
            currency.rate = +currency.askPrice;

        } else {
            currency = stream.obj[fromCur + toCur];
            if (!currency) {
                return;
            }
            currency.flipped = true;
            currency.rate = (1 / +currency.bidPrice);

        }
        currency.stepFrom = fromCur;
        currency.stepTo = toCur;


        currency.tradeInfo = {
            symbol: currency.symbol,
            side: currency.flipped ? 'SELL' : 'BUY',
            type: 'MARKET',
            quantity: 1
        };

        return currency;
    };


    getArbitrageRate = (stream: AllMarketTickersT, step1: CurrencyNameT, step2: CurrencyNameT, step3: CurrencyNameT) => {
        if (!stream || !step1 || !step2 || !step3) {
            return
        }

        const a = this.getCurrencyFromStream(stream, step1, step2)
        const b = this.getCurrencyFromStream(stream, step2, step3)
        const c = this.getCurrencyFromStream(stream, step3, step1)

        if (!a || !b || !c) {
            return;
        }

        const ret: ComparisonT = {
            a,
            b,
            c,
            rate: 0
        };

        ret.rate = (ret.a.rate) * (ret.b.rate) * (ret.c.rate);

        return ret;
    };

}

