// Required Dependencies: None explicitly mentioned, but assumes a WebSocket library is used by the 'exchange' object.
// Also assumes the existence of './CurrencySelector.js'

// --- Type Definitions ---

// Represents a single ticker object from the Binance stream
import {CurrencySelector} from "./CurrencySelector";

interface ITicker {
    s: string; // Symbol (e.g., "ETHBTC")
    a: number; // Ask price
    b: number; // Bid price
    A: number; // Ask quantity
    B: number; // Bid quantity
    v: number; // Total traded base asset volume
    n: number; // Total number of trades
    E: number; // Event time (timestamp)
    // Note: The original JS code treats these as numbers directly.
    // If the actual API returns strings, parsing (e.g., parseFloat) would be needed.
    [key: string]: any; // Allow other potential properties from the API
}

// Represents trade information derived for an arbitrage step
interface ITradeInfo {
    symbol: string;
    side: 'BUY' | 'SELL';
    type: 'MARKET';
    quantity: number;
}

// Represents processed currency information for a single arbitrage step
interface ICurrencyInfo extends ITicker {
    flipped: boolean; // Indicates if the pair was reversed (e.g., using BTCXXX for XXX->BTC)
    rate: number;   // The calculated exchange rate for the step direction
    stepFrom: string; // The currency being converted from
    stepTo: string;   // The currency being converted to
    tradeInfo: ITradeInfo; // Information needed to execute the trade for this step
}

// Represents the result of calculating a 3-step arbitrage path
interface IArbitrageResult {
    a: ICurrencyInfo | false | undefined; // Step 1 (e.g., A -> B)
    b: ICurrencyInfo | false | undefined; // Step 2 (e.g., B -> C)
    c: ICurrencyInfo | false | undefined; // Step 3 (e.g., C -> A)
    rate?: number; // Overall arbitrage rate (product of step rates)
}

// Represents a potential arbitrage triangle opportunity
interface ITriangle {
    ws_ts: number; // WebSocket event timestamp from the first step's ticker
    ts: number;    // Local processing timestamp
    dt: Date;      // Local processing Date object

    // Step A details
    a: ICurrencyInfo;
    a_symbol: string;
    a_step_from: string;
    a_step_to: string;
    a_step_type: 'BUY' | 'SELL';
    a_bid_price: number;
    a_bid_quantity: number;
    a_ask_price: number;
    a_ask_quantity: number;
    a_volume: number;
    a_trades: number;

    // Step B details
    b: ICurrencyInfo;
    b_symbol: string;
    b_step_from: string;
    b_step_to: string;
    b_step_type: 'BUY' | 'SELL';
    b_bid_price: number;
    b_bid_quantity: number;
    b_ask_price: number;
    b_ask_quantity: number;
    b_volume: number;
    b_trades: number;

    // Step C details
    c: ICurrencyInfo;
    c_symbol: string;
    c_step_from: string;
    c_step_to: string;
    c_step_type: 'BUY' | 'SELL';
    c_bid_price: number;
    c_bid_quantity: number;
    c_ask_price: number;
    c_ask_quantity: number;
    c_volume: number;
    c_trades: number;

    rate: number; // Overall arbitrage rate
}

// Represents the structured data for the '!ticker@arr' stream
interface IStreamData {
    arr: ITicker[]; // Raw array of tickers from the stream
    obj: { [symbol: string]: ITicker }; // Tickers mapped by symbol (e.g., "ETHBTC")
    markets: { [baseCurrency: string]: ITicker[] }; // Tickers filtered by base currency (e.g., "BTC")
}

// Represents the WebSocket interface provided by the exchange connector
interface IExchangeWebSocket {
    // Defines the method to subscribe to all market tickers
    onAllTickers: (callback: (event: ITicker[]) => void) => any; // Return type depends on the specific WebSocket library implementation
}

// Represents the exchange connector object
interface IExchange {
    WS: IExchangeWebSocket;
    // Potentially other exchange methods/properties (e.g., REST API methods)
}

// Represents the storage interface provided by the controller
interface IControllerStorage {
    // Optional method called on each stream tick
    streamTick?: (streamData: IStreamData, key: string) => void;
    // Potentially other storage methods/properties
}

// Represents the main controller object passed to CurrencyCore.init
interface IController {
    exchange: IExchange; // The exchange connector instance
    storage: IControllerStorage; // The storage handler instance
    events?: { // Optional events object
        wsEvent?: (event: any) => void; // Handler for individual WebSocket events (type 'any' as structure isn't defined)
    };
    // Potentially other controller methods/properties
}

// Represents the structure returned by CurrencySelector.js
// This interface assumes the structure based on its usage in startWSockets
interface ICurrencySelector {
    key: string; // Unique key for the selector (e.g., "BTC/USD")
    handleEvent: (event: any) => void; // Function to handle WebSocket events for this selector
    startWSockets: (events: IController['events']) => void; // Function to start WebSocket streams for this selector
}


// Import the module (even though it's declared, an import might be needed depending on module system)

// Represents the options for finding dynamic arbitrage candidates
interface IDynamicCandidatesOptions {
    start: string; // The starting currency (e.g., "BTC")
    paths: string[]; // The intermediate currencies to check paths through (e.g., ["ETH", "BNB"])
}

// Represents the main CurrencyCore module structure
interface ICurrencyCore {
    events: {
        onAllTickerStream: (stream: ITicker[]) => void;
    };
    init: (ctrl: IController) => ICurrencyCore; // Make init return ICurrencyCore for chaining/assignment
    currencies: { [key: string]: ICurrencySelector };
    sockets: {
        allMarketTickerStream?: any; // Type depends on WebSocket library return value
        [key: string]: any; // Allow storing other socket references
    };
    streams: {
        allMarketTickers?: IStreamData;
        [key: string]: any; // Allow storing other stream data
    };
    steps: string[]; // Base currencies for market filtering
    queueTicker: (interval?: number) => void;
    tick: () => void;
    getCurrencyFromStream: (stream: IStreamData, fromCur: string, toCur: string) => ICurrencyInfo | false | undefined;
    getArbitageRate: (stream: IStreamData, step1: string, step2: string, step3: string) => IArbitrageResult | undefined;
    getCandidatesFromStreamViaPath: (stream: IStreamData, aPair: string, bPair: string) => ITriangle[];
    getDynamicCandidatesFromStream: (stream: IStreamData, options: IDynamicCandidatesOptions) => ITriangle[];
    // The return type reflects the structure created within the function
    getBTCETHCandidatesFromStream: (stream: IStreamData) => {
        a: string;
        b: string;
        c: string;
        rate: IArbitrageResult | undefined
    }[];
    // candidates obj maps symbol to ticker, similar to stream.obj
    simpleArbitrageMath: (stream: IStreamData, candidates: { [key: string]: ITicker }) => number | undefined;
    startAllTickerStream: (exchange: IExchange) => void;
    startWSockets: (exchange: IExchange, ctrl: IController) => void;
    selectors?: string[]; // Optional list of selectors used by startWSockets
}


// --- Implementation ---

const CurrencyCore: Partial<ICurrencyCore> = {}; // Use Partial initially as properties are added incrementally
let controller: IController = {} as IController; // Initialize controller, will be set in init

CurrencyCore.events = {
    onAllTickerStream: (stream: ITicker[]) => {
    } // Define structure, implementation assigned later
};

// constructor
CurrencyCore.init = (ctrl: IController): ICurrencyCore => {
    if (!ctrl.exchange) {
        throw new Error('Undefined currency exchange connector. Will not be able to communicate with exchange API.'); // Use Error object
    }

    // Stores - Assign properties to the CurrencyCore object
    CurrencyCore.currencies = {};
    CurrencyCore.sockets = {};
    CurrencyCore.streams = {};
    controller = ctrl; // Assign the passed controller to the module-scoped variable
    CurrencyCore.steps = ['BTC', 'ETH', 'BNB', 'USDT'];

    // Initialize streams.allMarketTickers structure here before starting the stream
    CurrencyCore.streams.allMarketTickers = {
        arr: [],
        obj: {},
        markets: {} // Initialize markets as an object
    };


    //CurrencyCore.startWSockets(exchange, ctrl); // This line was commented out in JS
    // @ts-ignore
    CurrencyCore.startAllTickerStream(ctrl.exchange); // Pass only exchange as per function signature
    // @ts-ignore
    CurrencyCore.queueTicker(5000);

    // Assign the actual implementation for the event handler now that dependencies (controller, streams) are set
    // @ts-ignore
    CurrencyCore.events.onAllTickerStream = (stream: ITicker[]) => {
        const key = 'allMarketTickers';
        const streamData = CurrencyCore.streams![key] as IStreamData; // Assert non-null with !

        if (!streamData) {
            return;
        }// Should not happen if init is called first

        // Basic array from api arr[0].s = ETHBTC
        streamData.arr = stream;

        // Mapped object arr[ETHBTC]
        streamData.obj = stream.reduce<{ [symbol: string]: ITicker }>((acc, current) => {
            acc[current.s] = current;
            return acc;
        }, {});

        // Sub objects with only data on specific markets
        // Ensure markets is initialized
        streamData.markets = streamData.markets || {};
        for (let i = 0; i < CurrencyCore.steps!.length; i++) { // Assert non-null steps
            const step = CurrencyCore.steps![i];
            streamData.markets[step] = stream.filter(e => {
                return (e.s.endsWith(step) || e.s.startsWith(step));
            });
        }

        // something's wrong here. The BNB tree doesn't have BTC, although the BTC tree does. (Preserved comment)

        if (controller && controller.storage.streamTick) {
            controller.storage.streamTick(streamData, key);
        }
    };


    return CurrencyCore as ICurrencyCore; // Cast to ICurrencyCore as all required parts are now assigned
};

CurrencyCore.queueTicker = (interval?: number): void => {
    if (!interval) interval = 3000;
    setTimeout(() => {
        CurrencyCore.queueTicker!(interval); // Assert non-null CurrencyCore.queueTicker
    }, interval);
    CurrencyCore.tick!(); // Assert non-null CurrencyCore.tick
};

CurrencyCore.tick = (): void => {
    //debugger;
};

CurrencyCore.getCurrencyFromStream = (stream: IStreamData, fromCur: string, toCur: string): ICurrencyInfo | false | undefined => {
    if (!stream || !fromCur || !toCur) return undefined; // Return undefined for invalid input

    /*
     Binance uses xxxBTC notation. If we're looking at xxxBTC and we want to go from BTC to xxx, that means we're buying, vice versa for selling.
    */
    let currencyObj = stream.obj[toCur + fromCur];
    let currency: Partial<ICurrencyInfo> = {}; // Use Partial for incremental assignment

    if (currencyObj) {
        // found a match using reversed binance syntax, meaning we're buying if we're going from->to (btc->xxx in xxxBTC ticker) using a fromCurtoCur ticker.
        currency = {...currencyObj}; // Copy properties from ticker object
        currency.flipped = false;
        // Use Ask price for buying (A->B means buying B)
        currency.rate = currency.a; // Assuming 'a' is ask price

        // BNBBTC
        // ask == trying to buy BNB with BTC
    } else {
        currencyObj = stream.obj[fromCur + toCur];
        if (!currencyObj) {
            return false; // Return false if no pair found in either direction
        }
        currency = {...currencyObj}; // Copy properties from ticker object
        currency.flipped = true;
        // Use Bid price for selling (A->B means selling A), rate is 1 / bid price of B/A pair
        currency.rate = (1 / currency.b!); // Assert non-null 'b' (bid price)

        // BTCBNB
        // bid == im trying to sell BTC for BNB. Rate is 1/bid(BTC/BNB) to get rate for BNB->BTC
    }

    // Ensure rate is a valid number
    if (isNaN(currency.rate!) || !isFinite(currency.rate!)) {
        // console.warn(`Invalid rate calculated for ${fromCur}->${toCur} from symbol ${currency.s}`);
        return false; // Or handle invalid rate appropriately
    }


    currency.stepFrom = fromCur;
    currency.stepTo = toCur;

    currency.tradeInfo = {
        symbol: currency.s!, // Assert non-null symbol
        side: (currency.flipped === true) ? 'SELL' : 'BUY',
        type: 'MARKET',
        quantity: 1 // Default quantity, might need adjustment based on strategy
    };
    // console.log('getCurrencyFromStream: from/to: ', currency.stepFrom, currency.stepTo);

    // Cast to full ICurrencyInfo before returning, assuming all required fields are now present
    return currency as ICurrencyInfo;
};

CurrencyCore.getArbitageRate = (stream: IStreamData, step1: string, step2: string, step3: string): IArbitrageResult | undefined => {
    if (!stream || !step1 || !step2 || !step3) return undefined;

    const ret: IArbitrageResult = {
        a: CurrencyCore.getCurrencyFromStream!(stream, step1, step2), // Assert non-null getCurrencyFromStream
        b: CurrencyCore.getCurrencyFromStream!(stream, step2, step3), // Assert non-null getCurrencyFromStream
        c: CurrencyCore.getCurrencyFromStream!(stream, step3, step1)  // Assert non-null getCurrencyFromStream
    };

    // Check if all steps returned valid currency info (not false or undefined)
    if (!ret.a || !ret.b || !ret.c) return undefined; // Return undefined if any step failed

    // Ensure rates are valid numbers before multiplying
    if (isNaN(ret.a.rate) || isNaN(ret.b.rate) || isNaN(ret.c.rate) ||
        !isFinite(ret.a.rate) || !isFinite(ret.b.rate) || !isFinite(ret.c.rate)) {
        // console.warn(`Invalid rate found in arbitrage calculation: ${step1}>${step2}>${step3}`);
        return undefined; // Cannot calculate arbitrage rate
    }

    ret.rate = (ret.a.rate) * (ret.b.rate) * (ret.c.rate);
    return ret;
};

// Helper type for intermediate object in getCandidatesFromStreamViaPath
interface ITempBPairTicker extends ITicker {
    key: string;
    startsWithKey?: boolean;
    endsWithKey?: boolean;
}

CurrencyCore.getCandidatesFromStreamViaPath = (stream: IStreamData, aPair: string, bPair: string): ITriangle[] => {
    const keys = {
        a: aPair.toUpperCase(),
        b: bPair.toUpperCase(),
        c: 'findme'.toUpperCase(), // Placeholder, will be updated
    };

    // Ensure the markets exist before trying to access them
    if (!stream.markets || !stream.markets[keys.a] || !stream.markets[keys.b]) {
        // console.warn(`Market data missing for ${keys.a} or ${keys.b}`);
        return [];
    }

    const apairs: ITicker[] = stream.markets[keys.a];
    const bpairs: ITicker[] = stream.markets[keys.b];

    // Use Record<string, ITicker> for better typing
    const akeys: Record<string, ITicker> = {};
    apairs.forEach((obj) => {
        akeys[obj.s.replace(keys.a, '')] = obj;
    }); // Use forEach instead of map for side effects

    // prevent 1-steps (A -> B -> A)
    delete akeys[keys.b];

    /*
      Loop through BPairs
        for each bpair key, check if apair has it too.
        If it does, run arbitrage math
    */
    const bmatches: ITriangle[] = [];
    for (let i = 0; i < bpairs.length; i++) {
        const bPairTicker: ITempBPairTicker = {...bpairs[i], key: ''}; // Add key property
        bPairTicker.key = bPairTicker.s.replace(keys.b, '');

        // Skip if the key is empty (e.g., replacing BTC in BTCUSDT results in USDT, but replacing BTC in BTC results in empty string)
        if (!bPairTicker.key) continue;

        // from B to C (e.g., ETHXXX, key is XXX)
        bPairTicker.startsWithKey = bPairTicker.s.startsWith(keys.b);

        // from C to B (e.g., XXXETH, key is XXX)
        bPairTicker.endsWithKey = bPairTicker.s.endsWith(keys.b);

        // Check if a path exists from C (bPairTicker.key) back to A (keys.a) via the akeys map
        if (akeys[bPairTicker.key]) {
            const match = bPairTicker; // This is the ticker for B <-> C leg

            // Now, check the C -> A leg explicitly using getCurrencyFromStream
            // This confirms the full triangle path A -> B -> C -> A
            const stepCtoA = CurrencyCore.getCurrencyFromStream!(stream, match.key, keys.a); // Assert non-null

            // only do this if we definitely found a path. Some paths are impossible, so will result in an empty stepC quote.
            if (stepCtoA) { // Check if stepCtoA is valid (not false or undefined)
                keys.c = match.key; // Found the third currency

                // Calculate the full arbitrage rate A -> B -> C -> A
                const comparison = CurrencyCore.getArbitageRate!(stream, keys.a, keys.b, keys.c); // Assert non-null

                if (comparison && comparison.a && comparison.b && comparison.c && comparison.rate !== undefined) { // Ensure comparison and all steps are valid
                    // console.log('getCandidatesFromStreamViaPath: from/to a: ', comparison.a.stepFrom, comparison.a.stepTo);
                    // console.log('getCandidatesFromStreamViaPath: from/to b: ', comparison.b.stepFrom, comparison.b.stepTo);
                    // console.log('getCandidatesFromStreamViaPath: from/to c: ', comparison.c.stepFrom, comparison.c.stepTo);

                    const dt = new Date();
                    const triangle: ITriangle = {
                        ws_ts: comparison.a.E, // Use timestamp from the first leg's ticker data
                        ts: +dt, // Convert Date to timestamp number
                        dt: dt,

                        // Step A details (A -> B)
                        a: comparison.a,
                        a_symbol: comparison.a.s,
                        a_step_from: comparison.a.stepFrom,
                        a_step_to: comparison.a.stepTo,
                        a_step_type: comparison.a.tradeInfo.side,
                        a_bid_price: comparison.a.b,
                        a_bid_quantity: comparison.a.B,
                        a_ask_price: comparison.a.a,
                        a_ask_quantity: comparison.a.A,
                        a_volume: comparison.a.v,
                        a_trades: comparison.a.n,

                        // Step B details (B -> C)
                        b: comparison.b,
                        b_symbol: comparison.b.s,
                        b_step_from: comparison.b.stepFrom,
                        b_step_to: comparison.b.stepTo,
                        b_step_type: comparison.b.tradeInfo.side,
                        b_bid_price: comparison.b.b,
                        b_bid_quantity: comparison.b.B,
                        b_ask_price: comparison.b.a,
                        b_ask_quantity: comparison.b.A,
                        b_volume: comparison.b.v,
                        b_trades: comparison.b.n,

                        // Step C details (C -> A)
                        c: comparison.c,
                        c_symbol: comparison.c.s,
                        c_step_from: comparison.c.stepFrom,
                        c_step_to: comparison.c.stepTo,
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

                    // console.log('getCandidatesFromStreamViaPath: from/to a: ', triangle.a_step_from, triangle.a_step_to);
                    // console.log('getCandidatesFromStreamViaPath: from/to b: ', triangle.b_step_from, triangle.b_step_to);
                    // console.log('getCandidatesFromStreamViaPath: from/to c: ', triangle.c_step_from, triangle.c_step_to);
                }
            }
        }
    }

    if (bmatches.length) {
        // Sort by rate descending
        bmatches.sort((a, b) => b.rate - a.rate);
    }

    return bmatches;
};

CurrencyCore.getDynamicCandidatesFromStream = (stream: IStreamData, options: IDynamicCandidatesOptions): ITriangle[] => {
    let matches: ITriangle[] = [];

    for (let i = 0; i < options.paths.length; i++) {
        // Assert non-null getCandidatesFromStreamViaPath
        const pMatches = CurrencyCore.getCandidatesFromStreamViaPath!(stream, options.start, options.paths[i]);
        matches = matches.concat(pMatches);
        // console.log("adding: " + pMatches.length + " to : " + matches.length);
    }

    if (matches.length) {
        // Sort by rate descending
        matches.sort((a, b) => b.rate - a.rate);
    }

    return matches;
};

/*
  starts at btc
  assumes purchase of eth via btc
  looks for a purhase via eth that leads back to btc.
*/
// Define the specific return type for this function
type BTCETHCandidate = { a: string; b: string; c: string; rate: IArbitrageResult | undefined };

CurrencyCore.getBTCETHCandidatesFromStream = (stream: IStreamData): BTCETHCandidate[] => {
    const keys = {
        a: 'btc'.toUpperCase(),
        b: 'eth'.toUpperCase(),
        c: 'findme'.toUpperCase(), // Placeholder
    };

    // Ensure markets exist
    if (!stream.markets || !stream.markets[keys.a] || !stream.markets[keys.b]) {
        // console.warn(`Market data missing for ${keys.a} or ${keys.b}`);
        return [];
    }

    const apairs: ITicker[] = stream.markets[keys.a]; // Tickers involving BTC
    const bpairs: ITicker[] = stream.markets[keys.b]; // Tickers involving ETH

    const akeys: Record<string, ITicker> = {};
    apairs.forEach((obj) => {
        // Determine the other currency in the pair involving 'A' (BTC)
        let otherCurrency = '';
        if (obj.s.startsWith(keys.a)) {
            otherCurrency = obj.s.substring(keys.a.length);
        } else if (obj.s.endsWith(keys.a)) {
            otherCurrency = obj.s.substring(0, obj.s.length - keys.a.length);
        }
        if (otherCurrency) {
            akeys[otherCurrency] = obj;
        }
    });


    // prevent 1-steps (BTC -> ETH -> BTC)
    delete akeys[keys.b]; // Remove ETH from potential third currencies if found via BTC pairs

    /*
      Loop through BPairs (ETH pairs)
        for each bpair key (the currency paired with ETH), check if apair (BTC pairs) has it too.
        If it does, run arbitrage math for BTC -> ETH -> C -> BTC
    */
    const bmatches: BTCETHCandidate[] = [];
    for (let i = 0; i < bpairs.length; i++) {
        const bPairTicker = bpairs[i];
        let thirdCurrency = ''; // This is 'C'

        // Determine the third currency ('C') paired with 'B' (ETH)
        if (bPairTicker.s.startsWith(keys.b)) {
            thirdCurrency = bPairTicker.s.substring(keys.b.length);
        } else if (bPairTicker.s.endsWith(keys.b)) {
            thirdCurrency = bPairTicker.s.substring(0, bPairTicker.s.length - keys.b.length);
        }

        // Skip if third currency is empty or same as starting currency 'A' (BTC)
        if (!thirdCurrency || thirdCurrency === keys.a) continue;

        // Check if this third currency ('C') also pairs with 'A' (BTC)
        if (akeys[thirdCurrency]) {
            // We found a potential triangle: A -> B -> C -> A (BTC -> ETH -> thirdCurrency -> BTC)
            keys.c = thirdCurrency;

            // Calculate the arbitrage rate for this triangle
            const rateResult = CurrencyCore.getArbitageRate!(stream, keys.a, keys.b, keys.c); // Assert non-null

            // We store the result even if the rate calculation fails (rateResult might be undefined)
            const triangle: BTCETHCandidate = {
                a: keys.a,
                b: keys.b,
                c: keys.c,
                rate: rateResult // Store the IArbitrageResult or undefined
            };
            // debugger;
            bmatches.push(triangle);
        }
    }

    if (bmatches.length) {
        // Sort by rate descending, handling cases where rate might be undefined or invalid
        bmatches.sort((a, b) => {
            const rateA = a.rate?.rate ?? -Infinity; // Default to -Infinity if rate is missing/invalid
            const rateB = b.rate?.rate ?? -Infinity;
            return rateB - rateA;
        });
    }
    return bmatches;
};


CurrencyCore.simpleArbitrageMath = (stream: IStreamData, candidates: {
    [key: string]: ITicker
}): number | undefined => {
    if (!stream || !candidates) return undefined;
    //EURUSD * (1/GBPUSD) * (1/EURGBP) = 1 (Comment preserved)

    //start btc
    //via xUSDT
    //end btc

    // Example calculation: BTC -> USDT -> ETH -> BTC
    const a = candidates['BTCUSDT']; // Rate for BTC -> USDT (use bid price as we sell BTC)
    const b = candidates['ETHUSDT']; // Rate for ETH -> USDT (use bid price as we sell ETH)
    const c = candidates['ETHBTC'];  // Rate for ETH -> BTC (use bid price as we sell ETH)

    // Check if all necessary tickers exist and have valid bid prices ('b')
    if (!a?.b || isNaN(a.b) || !b?.b || isNaN(b.b) || !c?.b || isNaN(c.b)) return undefined;

    // Calculation:
    // Rate(BTC -> USDT) = a.b (Bid price of BTCUSDT)
    // Rate(USDT -> ETH) = 1 / b.a (Inverse of Ask price of ETHUSDT, as we buy ETH with USDT) - Original comment implies using bid, let's stick to original logic first.
    // Rate(USDT -> ETH) = 1 / b.b (Inverse of Bid price of ETHUSDT) - Following the original JS code's apparent logic (using .b for all)
    // Rate(ETH -> BTC) = c.b (Bid price of ETHBTC)
    // Combined Rate = Rate(BTC->USDT) * Rate(USDT->ETH) * Rate(ETH->BTC)
    // Combined Rate = a.b * (1 / b.b) * c.b

    const d = (a.b) * (1 / b.b) * (c.b);
    //debugger;

    if (isNaN(d) || !isFinite(d)) return undefined; // Check for invalid result

    return d;
};

// Note: The actual implementation of onAllTickerStream was moved into the init function
// to ensure necessary components like controller and streams are initialized first.
// The initial assignment in CurrencyCore.events remains as a placeholder for the structure.


// starts one global stream for all selectors. Stream feeds back info every second:
// https://github.com/binance-exchange/binance-official-api-docs/blob/master/web-socket-streams.md#all-market-tickers-stream
CurrencyCore.startAllTickerStream = function (exchange: IExchange): void {
    // Ensure the stream structure is initialized (should be done in init, but double-check)
    if (!CurrencyCore.streams!.allMarketTickers) {
        CurrencyCore.streams!.allMarketTickers = {
            arr: [],
            obj: {},
            markets: {}
        };
    }

    // Subscribe using the exchange's WS interface, passing the event handler
    // Assert non-null on events and onAllTickerStream
    CurrencyCore.sockets!.allMarketTickerStream = exchange.WS.onAllTickers(
        (event: ITicker[]) => CurrencyCore.events!.onAllTickerStream!(event)
    );
};

// starts streams for specific selectors
CurrencyCore.startWSockets = function (exchange: IExchange, ctrl: IController): void {
    // Check if selectors are defined
    if (!CurrencyCore.selectors || CurrencyCore.selectors.length === 0) {
        console.warn("CurrencyCore.selectors is not defined or empty. Cannot start individual sockets.");
        return;
    }
    // Check if controller events are defined
    if (!ctrl.events?.wsEvent) {
        console.warn("Controller events or wsEvent handler is not defined. Cannot assign handleEvent.");
        // Decide if this is critical - perhaps proceed without assigning handleEvent?
        // For now, let's return to prevent errors later.
        return;
    }

    // loop through provided csv selectors, and initiate trades & orderBook sockets for each
    for (let i = 0; i < CurrencyCore.selectors.length; i++) {
        // Use the imported function/constructor for CurrencySelector
        // Assert non-null selectors
        const createCurrencySelector = CurrencySelector.init
        // @ts-ignore
        let selector: ICurrencySelector = createCurrencySelector(CurrencyCore.selectors[i], exchange);

        CurrencyCore.currencies![selector.key] = selector; // Assert non-null currencies
        // Assign the event handler from the controller
        CurrencyCore.currencies![selector.key].handleEvent = ctrl.events.wsEvent;
        // Start the WebSocket for this specific selector
        CurrencyCore.currencies![selector.key].startWSockets(ctrl.events);
    }
};


// Export the init function as the default export for the module
export default CurrencyCore.init;
