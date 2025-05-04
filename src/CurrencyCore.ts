// Required Dependencies: None explicitly mentioned, but assumes a WebSocket library is used by the 'exchange' object.
// Also assumes the existence of './CurrencySelector.js'

import {CtrlT} from "./types";

type Resp = {
    e: string // '24hrTicker',
    E: number // 1746382298495,
    s: string // 'PYTHFDUSD',
    p: string // '-0.00450000',
    P: string // '-3.165',
    w: string // '0.14089887',
    x: string // '0.14210000',
    c: string // '0.13770000',
    Q: string // '1597.70000000',
    b: string // '0.13710000',
    B: string // '3750.70000000',
    a: string // '0.13720000',
    A: string // '5248.20000000',
    o: string // '0.14220000',
    h: string // '0.14500000',
    l: string // '0.13690000',
    v: string // '502061.80000000',
    q: string // '70739.93821000',
    O: number // 1746295898316,
    C: number // 1746382298316,
    F: number // 911668,
    L: number // 912156,
    n: number // 489

}
type SocketsT = {
    allMarketTickerStream?: WebSocket
}
type StreamsT = {
    allMarketTickers: {
        arr: Resp[]
        obj: Record<string, Resp>;
        markets: any;
    }
}

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
    events: any = {
        onAllTickerStream: () => {
        }
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


    queueTicker = (interval) => {
        if (!interval) {
            interval = 3000;
        }
        console.log(111, this.streams.allMarketTickers.markets.length && this.streams.allMarketTickers.markets)
        setTimeout(() => {
            this.queueTicker(interval);
        }, interval);
        this.tick();
    };

    tick = () => {
        //debugger;
    };

    getCurrencyFromStream = (stream, fromCur, toCur) => {
        if (!stream || !fromCur || !toCur) {
            return;
        }

        /*
         Binance uses xxxBTC notation. If we're looking at xxxBTC and we want to go from BTC to xxx, that means we're buying, vice versa for selling.
        */
        let currency = stream.obj[toCur + fromCur];
        if (currency) {
            // found a match using reversed binance syntax, meaning we're buying if we're going from->to (btc->xxx in xxxBTC ticker) using a fromCurtoCur ticker.
            currency.flipped = false;
            currency.rate = currency.a;

            // BNBBTC
            // ask == trying to buy
        } else {
            currency = stream.obj[fromCur + toCur];
            if (!currency) {
                return false;
            }
            currency.flipped = true;
            currency.rate = (1 / currency.b);

            // BTCBNB
            // bid == im trying to sell.
        }
        currency.stepFrom = fromCur;
        currency.stepTo = toCur;

        currency.tradeInfo = {
            symbol: currency.s,
            side: (currency.flipped == true) ? 'SELL' : 'BUY',
            type: 'MARKET',
            quantity: 1
        };

        return currency;
    };
    getArbitrageRate = (stream, step1, step2, step3) => {
        if (!stream || !step1 || !step2 || !step3) return;
        const ret: any = {
            a: this.getCurrencyFromStream(stream, step1, step2),
            b: this.getCurrencyFromStream(stream, step2, step3),
            c: this.getCurrencyFromStream(stream, step3, step1)
        };

        if (!ret.a || !ret.b || !ret.c) return;

        ret.rate = (ret.a.rate) * (ret.b.rate) * (ret.c.rate);
        return ret;
    };

    getCandidatesFromStreamViaPath = (stream, aPair, bPair) => {

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
    getDynamicCandidatesFromStream = (stream, options) => {
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

    startAllTickerStream(exchange) {
        if (!this.streams.allMarketTickers) {
            this.streams = streamsDefault;
        }

        this.sockets.allMarketTickerStream = exchange.WS.onAllTickers(event => this.events.onAllTickerStream(event));
    };


}

