// Required Dependencies: None explicitly required for the translation itself,
// but the code relies on an external 'exchangeAPI' object being passed in.
// Assuming 'exchangeAPI' has a structure like:
// interface ExchangeAPI {
//   WS: {
//     onDepthUpdate: (key: string, callback: (data: any) => void) => any;
//     onAggTrade: (key: string, callback: (data: any) => void) => any;
//     onKline: (key: string, interval: string, callback: (data: any) => void) => any;
//   };
// }

// Define the structure of the exchangeAPI object for type safety
interface ExchangeWebSocketAPI {
    onDepthUpdate: (key: string, callback: (data: any) => void) => any;
    onAggTrade: (key: string, callback: (data: any) => void) => any;
    onKline: (key: string, interval: string, callback: (data: any) => void) => any;
}

interface ExchangeAPI {
    WS: ExchangeWebSocketAPI;
}

// Define the structure of the module object
interface CurrencySelectorT {
    init: (selectorRaw: string, exchangeAPI: ExchangeAPI) => CurrencySelectorT;
    startWSockets: () => void;
    selectorRaw?: string;
    splitSelector?: string[];
    key?: string;
    asset?: string;
    selector?: string;
    interval?: string;
    exchangeAPI?: ExchangeAPI;
    events?: Record<string, any>;
    trades?: Record<string, any>;
    orderBook?: Record<string, any>;
    sockets?: {
        depth?: any;
        trade?: any;
        kline?: any;
    };
    handleEvent?: (data: any) => void;
}

export const CurrencySelector: CurrencySelectorT = {} as CurrencySelectorT; // Initialize as CurrencySelector type

CurrencySelector.init = (selectorRaw: string, exchangeAPI: ExchangeAPI): CurrencySelectorT => {
    /* Currency selector stuff */
    CurrencySelector.selectorRaw = selectorRaw;  //XRP-ETH
    CurrencySelector.splitSelector = CurrencySelector.selectorRaw.split('-');//XRP, ETH array
    CurrencySelector.key = CurrencySelector.splitSelector.join('');//XRPETH
    CurrencySelector.asset = CurrencySelector.splitSelector[0];//XRP
    CurrencySelector.selector = CurrencySelector.splitSelector[1];//ETH

    // sockets stuff
    CurrencySelector.interval = '30s';
    CurrencySelector.exchangeAPI = exchangeAPI;

    // placeholders
    CurrencySelector.events = {};
    CurrencySelector.trades = {};
    CurrencySelector.orderBook = {};
    CurrencySelector.sockets = {};
    CurrencySelector.handleEvent = (data: any): void => {
    }; // Provide a default empty function matching the signature

    return CurrencySelector;
};

// start web sockets for this currency selector
CurrencySelector.startWSockets = (): void => {
    /*
    * WebSocket API
    *
    * Each call to onXXXX initiates a new websocket for the specified route, and calls your callback with
    * the payload of each message received.  Each call to onXXXX returns the instance of the websocket
    * client if you want direct access(https://www.npmjs.com/package/ws).
    */

    // Ensure properties are defined before use (checked by TypeScript if strictNullChecks is on, but good practice)
    if (!CurrencySelector.exchangeAPI || !CurrencySelector.key || !CurrencySelector.handleEvent || !CurrencySelector.sockets || !CurrencySelector.interval) {
        console.error("Module object not properly initialized before starting WebSockets.");
        return;
    }

    CurrencySelector.sockets.depth = CurrencySelector.exchangeAPI.WS.onDepthUpdate(
        CurrencySelector.key,
        CurrencySelector.handleEvent);

    CurrencySelector.sockets.trade = CurrencySelector.exchangeAPI.WS.onAggTrade(
        CurrencySelector.key,
        CurrencySelector.handleEvent);

    CurrencySelector.sockets.kline = CurrencySelector.exchangeAPI.WS.onKline(
        CurrencySelector.key,
        CurrencySelector.interval,
        CurrencySelector.handleEvent);
};

