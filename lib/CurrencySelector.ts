import { ExchangeAPI } from './types'; // Assuming a types file exists for ExchangeAPI

interface ModuleObj {
    selectorRaw: string;
    splitSelector: string[];
    key: string;
    asset: string;
    selector: string;
    interval: string;
    exchangeAPI: ExchangeAPI;
    events: Record<string, any>;
    trades: Record<string, any>;
    orderBook: Record<string, any>;
    sockets: Record<string, any>;
    handleEvent: () => void;
}

const moduleObj: Partial<ModuleObj> = {};

moduleObj.init = (selectorRaw: string, exchangeAPI: ExchangeAPI): ModuleObj => {
    moduleObj.selectorRaw = selectorRaw;
    moduleObj.splitSelector = moduleObj.selectorRaw.split('-');
    moduleObj.key = moduleObj.splitSelector.join('');
    moduleObj.asset = moduleObj.splitSelector[0];
    moduleObj.selector = moduleObj.splitSelector[1];

    moduleObj.interval = '30s';
    moduleObj.exchangeAPI = exchangeAPI;

    moduleObj.events = {};
    moduleObj.trades = {};
    moduleObj.orderBook = {};
    moduleObj.sockets = {};

    moduleObj.handleEvent = () => {};

    return <ModuleObj>moduleObj;
};

moduleObj.startWSockets = (): void => {

    moduleObj.sockets.depth = moduleObj.exchangeAPI.WS.onDepthUpdate(
        moduleObj.key,
        moduleObj.handleEvent
    );

    moduleObj.sockets.trade = moduleObj.exchangeAPI.WS.onAggTrade(
        moduleObj.key,
        moduleObj.handleEvent
    );

    moduleObj.sockets.kline = moduleObj.exchangeAPI.WS.onKline(
        moduleObj.key,
        moduleObj.interval,
        moduleObj.handleEvent
    );
};

export default <(selectorRaw: string, exchangeAPI: ExchangeAPI) => Module Obj>moduleObject.init;
