export interface BotOptions {
    UI: {
        title: string;
    };
    arbitrage: {
        paths: string[];
        start: string;    };
    storage: {
        logHistory: boolean;
    };
    trading: {
        paperOnly: boolean;
        minQueuePercentageThreshold: number;
        minHitsThreshold: number;
    };
}

export interface Storage {
    trading: {
        queue: any[];
        active: any[];
    };
    candidates: any[];
    streams: any[];
    pairRanks: any[];
}



// --- Type Definitions ---

// Represents a single ticker object from the Binance stream
import {CurrencySelector} from "./CurrencySelector";

export interface ITicker {
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
export interface ITradeInfo {
    symbol: string;
    side: 'BUY' | 'SELL';
    type: 'MARKET';
    quantity: number;
}

// Represents processed currency information for a single arbitrage step
export interface ICurrencyInfo extends ITicker {
    flipped: boolean; // Indicates if the pair was reversed (e.g., using BTCXXX for XXX->BTC)
    rate: number;   // The calculated exchange rate for the step direction
    stepFrom: string; // The currency being converted from
    stepTo: string;   // The currency being converted to
    tradeInfo: ITradeInfo; // Information needed to execute the trade for this step
}

// Represents the result of calculating a 3-step arbitrage path
export interface IArbitrageResult {
    a: ICurrencyInfo | false | undefined; // Step 1 (e.g., A -> B)
    b: ICurrencyInfo | false | undefined; // Step 2 (e.g., B -> C)
    c: ICurrencyInfo | false | undefined; // Step 3 (e.g., C -> A)
    rate?: number; // Overall arbitrage rate (product of step rates)
}

// Represents a potential arbitrage triangle opportunity
export interface ITriangle {
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
export interface IStreamData {
    arr: ITicker[]; // Raw array of tickers from the stream
    obj: { [symbol: string]: ITicker }; // Tickers mapped by symbol (e.g., "ETHBTC")
    markets: { [baseCurrency: string]: ITicker[] }; // Tickers filtered by base currency (e.g., "BTC")
}

// Represents the WebSocket interface provided by the exchange connector
export interface IExchangeWebSocket {
    // Defines the method to subscribe to all market tickers
    onAllTickers: (callback: (event: ITicker[]) => void) => any; // Return type depends on the specific WebSocket library implementation
}

// Represents the exchange connector object
export interface IExchange {
    WS: IExchangeWebSocket;
    // Potentially other exchange methods/properties (e.g., REST API methods)
}

// Represents the storage export interface provided by the controller
export interface IControllerStorage {
    // Optional method called on each stream tick
    streamTick?: (streamData: IStreamData, key: string) => void;
    // Potentially other storage methods/properties
}

// Represents the main controller object passed to init
export interface IController {
    exchange: IExchange; // The exchange connector instance
    storage: IControllerStorage; // The storage handler instance
    events?: { // Optional events object
        wsEvent?: (event: any) => void; // Handler for individual WebSocket events (type 'any' as structure isn't defined)
    };
    // Potentially other controller methods/properties
}

// Represents the structure returned by CurrencySelector.js
// This export interface assumes the structure based on its usage in startWSockets
export interface ICurrencySelector {
    key: string; // Unique key for the selector (e.g., "BTC/USD")
    handleEvent: (event: any) => void; // Function to handle WebSocket events for this selector
    startWSockets: (events: IController['events']) => void; // Function to start WebSocket streams for this selector
}

// Represents the options for finding dynamic arbitrage candidates
export interface IDynamicCandidatesOptions {
    start: string; // The starting currency (e.g., "BTC")
    paths: string[]; // The intermediate currencies to check paths through (e.g., ["ETH", "BNB"])
}

// Represents the main CurrencyCore module structure
export interface ICurrencyCore {
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



// Type Definitions (already provided in TypeScript format)
export type TradingCoreOptions = {} // Assuming this might be more detailed elsewhere

export  interface Ctrl {
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
