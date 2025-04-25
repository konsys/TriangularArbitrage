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

const moduleObj: CurrencySelectorT = {} as CurrencySelectorT; // Initialize as moduleObj type

moduleObj.init = (selectorRaw: string, exchangeAPI: ExchangeAPI): CurrencySelectorT => {
    /* Currency selector stuff */
    moduleObj.selectorRaw = selectorRaw;  //XRP-ETH
    moduleObj.splitSelector = moduleObj.selectorRaw.split('-');//XRP, ETH array
    moduleObj.key = moduleObj.splitSelector.join('');//XRPETH
    moduleObj.asset = moduleObj.splitSelector[0];//XRP
    moduleObj.selector = moduleObj.splitSelector[1];//ETH

    // sockets stuff
    moduleObj.interval = '30s';
    moduleObj.exchangeAPI = exchangeAPI;

    // placeholders
    moduleObj.events = {};
    moduleObj.trades = {};
    moduleObj.orderBook = {};
    moduleObj.sockets = {};
    moduleObj.handleEvent = (data: any): void => {
    }; // Provide a default empty function matching the signature

    return moduleObj;
};

// start web sockets for this currency selector
moduleObj.startWSockets = (): void => {
    /*
    * WebSocket API
    *
    * Each call to onXXXX initiates a new websocket for the specified route, and calls your callback with
    * the payload of each message received.  Each call to onXXXX returns the instance of the websocket
    * client if you want direct access(https://www.npmjs.com/package/ws).
    */

    // Ensure properties are defined before use (checked by TypeScript if strictNullChecks is on, but good practice)
    if (!moduleObj.exchangeAPI || !moduleObj.key || !moduleObj.handleEvent || !moduleObj.sockets || !moduleObj.interval) {
        console.error("Module object not properly initialized before starting WebSockets.");
        return;
    }

    moduleObj.sockets.depth = moduleObj.exchangeAPI.WS.onDepthUpdate(
        moduleObj.key,
        moduleObj.handleEvent);

    moduleObj.sockets.trade = moduleObj.exchangeAPI.WS.onAggTrade(
        moduleObj.key,
        moduleObj.handleEvent);

    moduleObj.sockets.kline = moduleObj.exchangeAPI.WS.onKline(
        moduleObj.key,
        moduleObj.interval,
        moduleObj.handleEvent);
};


export const CurrencySelector = moduleObj.init;
