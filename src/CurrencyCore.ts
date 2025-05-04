// Required Dependencies: None explicitly mentioned, but assumes a WebSocket library is used by the 'exchange' object.
// Also assumes the existence of './CurrencySelector.js'

import {AllMarketTickersT, BinanceRespT, BinanceRestT, CtrlT, CurrencyT, StepT, StreamsT} from "./types";


type SocketsT = {
    allMarketTickerStream?: WebSocket
}


type EventsT = { onAllTickerStream: (stream: BinanceRespT[]) => void }
const streamsDefault: StreamsT = {
    allMarketTickers: {
        arr: [],
        obj: {},
        markets: {}
    }
}


export class CurrencyCore {

    sockets: SocketsT = {}
    streams: StreamsT = streamsDefault
    steps: string[] = ['BTC', 'ETH', 'BNB', 'USDT'];
    events: EventsT = {
        onAllTickerStream: (stream: any) => undefined
    };

    controller: CtrlT;


    constructor(ctrl: CtrlT) {
        if (!ctrl.exchange) {
            throw 'Undefined currency exchange connector. Will not be able to communicate with exchange API.';
        }

        this.controller = ctrl

        //CurrencyCore.startWSockets(exchange, ctrl);
        this.startAllTickerStream(ctrl.exchange);
        this.queueTicker(5000);

        this.events.onAllTickerStream = (stream) => {

            const key = 'allMarketTickers';

            // Basic array from api arr[0].s = ETHBTC
            this.streams.allMarketTickers.arr = stream;

            // Mapped object arr[ETHBTC]
            this.streams.allMarketTickers.obj = stream.reduce(function (array, current) {
                array[current.s] = current;
                return array;
            }, {});

            // Sub objects with only data on specific markets
            for (let i = 0; i < this.steps.length; i++)
                this.streams.allMarketTickers.markets[this.steps[i]] = stream.filter(e => {
                    return (e.s.endsWith(this.steps[i]) || e.s.startsWith(this.steps[i]));
                });

            // something's wrong here. The BNB tree doesn't have BTC, although the BTC tree does.

            if (this.controller && this.controller.storage.streamTick) {
                this.controller.storage.streamTick(this.streams[key], key);
            }
        };

    }


    queueTicker = (interval: number) => {
        if (!interval) {
            interval = 3000;
        }

        setTimeout(() => {
            this.queueTicker(interval);
        }, interval);
        this.tick();
    };

    tick = () => {
        //debugger;
    };

    getCurrencyFromStream = (stream: AllMarketTickersT, fromCur, toCur) => {
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
            currency.rate = +currency.a;

            // BNBBTC
            // ask == trying to buy
        } else {
            currency = stream.obj[fromCur + toCur];
            if (!currency) {
                return;
            }
            currency.flipped = true;
            currency.rate = (1 / +currency.b);

            // BTCBNB
            // bid == im trying to sell.
        }
        currency.stepFrom = fromCur;
        currency.stepTo = toCur;

        currency.tradeInfo = {
            symbol: currency.s,
            side: currency.flipped ? 'SELL' : 'BUY',
            type: 'MARKET',
            quantity: 1
        };

        return currency;
    };

    getArbitrageRate = (stream: AllMarketTickersT, step1: StepT[], step2: StepT[], step3: StepT[]) => {

        if (!stream || !step1 || !step2 || !step3) {
            return
        }

        const ret: any = {
            a: this.getCurrencyFromStream(stream, step1, step2),
            b: this.getCurrencyFromStream(stream, step2, step3),
            c: this.getCurrencyFromStream(stream, step3, step1)
        };

        if (!ret.a || !ret.b || !ret.c) {
            return;
        }

        ret.rate = (ret.a.rate) * (ret.b.rate) * (ret.c.rate);

        console.log(1111, ret)
        return ret;
    };

    getCandidatesFromStreamViaPath = (stream: AllMarketTickersT, aPair, bPair) => {

        const keys = {
            a: aPair.toUpperCase(),
            b: bPair.toUpperCase(),
            c: 'findme'.toUpperCase(),
        };

        const apairs = stream.markets[keys.a];
        const bpairs = stream.markets[keys.b];

        const akeys: any[] = [];
        apairs.map((obj, i, array) => {
            akeys[obj.s.replace(keys.a, '')] = obj;
        });

        // prevent 1-steps
        delete akeys[keys.b];

        /*
          Loop through BPairs
            for each bpair key, check if apair has it too.
            If it does, run arbitrage math
        */
        const bmatches: any[] = [];
        for (let i = 0; i < bpairs.length; i++) {
            const bPairTicker = bpairs[i];
            bPairTicker.key = bPairTicker.s.replace(keys.b, '');

            // from B to C
            bPairTicker.startsWithKey = bPairTicker.s.startsWith(keys.b);

            // from C to B
            bPairTicker.endsWithKey = bPairTicker.s.endsWith(keys.b);

            if (akeys[bPairTicker.key]) {
                const match = bPairTicker;
                // check price from bPairTicker.key to keys.a

                const stepC = this.getCurrencyFromStream(stream, match.key, keys.a);

                // only do this if we definitely found a path. Some paths are impossible, so will result in an empty stepC quote.
                if (stepC) {
                    keys.c = match.key;

                    const comparison: any = this.getArbitrageRate(stream, keys.a, keys.b, keys.c);


                    if (comparison) {

                        const dt = new Date();
                        const triangle = {
                            ws_ts: comparison.a.E,
                            ts: +dt,
                            dt: dt,

                            // these are for storage later
                            a: comparison.a,//full ticker for first pair (BTC->BNB)
                            a_symbol: comparison.a.s,
                            a_step_from: comparison.a.stepFrom,//btc
                            a_step_to: comparison.a.stepTo,//bnb
                            a_step_type: comparison.a.tradeInfo.side,
                            a_bid_price: comparison.a.b,
                            a_bid_quantity: comparison.a.B,
                            a_ask_price: comparison.a.a,
                            a_ask_quantity: comparison.a.A,
                            a_volume: comparison.a.v,
                            a_trades: comparison.a.n,

                            b: comparison.b,//full ticker for second pair (BNB->XMR)
                            b_symbol: comparison.b.s,
                            b_step_from: comparison.b.stepFrom,//bnb
                            b_step_to: comparison.b.stepTo,//xmr
                            b_step_type: comparison.b.tradeInfo.side,
                            b_bid_price: comparison.b.b,
                            b_bid_quantity: comparison.b.B,
                            b_ask_price: comparison.b.a,
                            b_ask_quantity: comparison.b.A,
                            b_volume: comparison.b.v,
                            b_trades: comparison.b.n,

                            c: comparison.c,////full ticker for third pair (XMR->BTC)
                            c_symbol: comparison.c.s,
                            c_step_from: comparison.c.stepFrom,//xmr
                            c_step_to: comparison.c.stepTo,//btc
                            c_step_type: comparison.c.tradeInfo.side,
                            c_bid_price: comparison.c.b,
                            c_bid_quantity: comparison.c.B,
                            c_ask_price: comparison.c.a,
                            c_ask_quantity: comparison.c.A,
                            c_volume: comparison.c.v,
                            c_trades: comparison.c.n,

                            rate: comparison.rate
                        };
                        // debugger;
                        bmatches.push(triangle);

                    }


                }
            }
        }

        if (bmatches.length) {
            bmatches.sort(function (a, b) {
                return parseFloat(b.rate) - parseFloat(a.rate);
            });
        }

        return bmatches;
    };

    getDynamicCandidatesFromStream = (stream: AllMarketTickersT, options) => {
        let matches: any[] = [];


        for (let i = 0; i < options.paths.length; i++) {
            const pMatches: any[] = this.getCandidatesFromStreamViaPath(stream, options.start, options.paths[i]);
            matches = matches.concat(pMatches);
        }

        if (matches.length) {
            matches.sort(function (a: any, b: any) {
                return parseFloat(b.rate) - parseFloat(a.rate);
            });
        }

        return matches;
    };

    startAllTickerStream(exchange: BinanceRestT) {

        if (!this.streams.allMarketTickers) {
            this.streams = streamsDefault;
        }

        this.sockets.allMarketTickerStream = exchange.WS.onAllTickers((event: BinanceRespT[]) => {


                return this.events.onAllTickerStream(event)
            }
        );
    };


}

