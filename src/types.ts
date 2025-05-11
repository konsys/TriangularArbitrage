import {Logger} from "winston";
import {CurrencyCore} from "./CurrencyCore";


export type SocketsT = {
    allMarketTickerStream?: WebSocket
}
export type EventsT = { onAllTickerStream: (stream: CurrencyValueT[]) => void }
export type UIOptions =
    {
        title: string;
    };

export type CurrencyNameT = 'BTC' | 'USDT' | 'BNB' | 'ETH' |
    'AXL' | 'JPY' | 'DOGE' | 'HBAR' |
    'BCH' | 'TRY' | 'ZRO' | 'EUR' |
    'SSV' | 'SLF' | 'STPT' | 'SOL' |
    'PYR' | 'BICO' | 'LOKA' | 'NMR' |
    'KAITO' | 'ETC' |
    'AVAX' | 'ZEC' | 'OP' | 'PLN' |
    'ADA' | 'SUI' | 'ARKM' | 'WLD' |
    'WAN' | 'SFP' | 'FDUSD' | 'ZEN' |
    'OM' | 'VET' | 'USDC' | 'RONIN'

export type SideT = 'SELL' | 'BUY'

type DoubleName = `${CurrencyNameT}${CurrencyNameT}`;

type Trading = {
    paperOnly: boolean
    minQueuePercentageThreshold: number
    minHitsThreshold: number
}

export type PathOptions = { paths: [CurrencyNameT, CurrencyNameT, CurrencyNameT], start: CurrencyNameT }

export type BotOptions = {
    UI: UIOptions,
    arbitrage: PathOptions,
    storage: Storage,
    trading: Trading
}
export type StreamIdT = 'allMarketTickers'
export type Storage = {
    trading: { queue: CandidateQueueObject | null; active: string[] }
    candidates: CandidateT[]
    streams: Record<StreamIdT, AllMarketTickersT>[]
    pairRanks: Pair[]
    streamTick?: (stream: AllMarketTickersT, streamID: StreamIdT) => void
    rate: number;
    a_step_from: string; // Assuming these are strings based on key generation
    b_step_from: string;
    c_step_from: string;
    rates?: number[];
    hits?: number;

    // Add other potential properties if known
}
export type CtrlT = {
    options: BotOptions,
    storage: Storage,
    logger: Logger,
    exchange: BinanceRestT
    currencyCore?: CurrencyCore
    UI?: UIOptions
}


export interface Pair {
    id: string;
    step_a: string;
    step_b: string;
    step_c: string;
    step_d: string;
    rate: number;
    date: Date;
}


export interface TradingCoreOptions {
    minQueuePercentageThreshold?: number;
    minHitsThreshold?: number;
    // Add other potential options if known
}


// Interface for the return value of getArbitrageRate
export interface ArbitrageRateResult {
    rate: number;
    // Add other potential properties if known
}


// Interface for the structure used as the queue (object keyed by string)
export type CandidateQueueObject = Record<DoubleName, CandidateT>

interface Cand {
    a_step_from: CurrencyNameT;
    a_step_to: CurrencyNameT;
    b_step_from: CurrencyNameT
    b_step_to: CurrencyNameT;
    c_step_from: CurrencyNameT;
    c_step_to: CurrencyNameT;
    rate: number
    rates?: number[]
    hits?: number
}

export type CandidateT = Cand & {
    ws_ts: number
    ts: number
    dt: Date
    a: CurrencyValueT
    a_symbol: DoubleName
    a_step_type: SideT
    a_bid_price: string // '93887.99000000'
    a_bid_quantity: string // '5.25872000'
    a_ask_price: string // 93888.00000000'
    a_ask_quantity: string // '1.58963000'
    a_volume: string // '14143.14544000'
    a_trades: number
    b: CurrencyValueT
    b_symbol: DoubleName // 'RVNUSDT'
    b_step_type: SideT
    b_bid_price: string // '0.01028000'
    b_bid_quantity: string // '74432.30000000'
    b_ask_price: string //  '0.01029000'
    b_ask_quantity: string // '76849.00000000'
    b_volume: string // '123062925.30000000'
    b_trades: number
    c: CurrencyValueT
    c_symbol: DoubleName // 'RVNBTC'
    c_step_type: SideT
    c_bid_price: string // '0.00000010'
    c_bid_quantity: string // '5499885.00000000'
    c_ask_price: string // '0.00000011'
    c_ask_quantity: string // '1432512.00000000'
    c_volume: string // '2978415.00000000'
    c_trades: number

}


// Define the structure of the exchangeAPI object for type safety
export interface ExchangeWebSocketAPI {
    onDepthUpdate: (key: CurrencyNameT, callback: (data: any) => void) => any;
    onAggTrade: (key: CurrencyNameT, callback: (data: any) => void) => any;
    onKline: (key: CurrencyNameT, interval: string, callback: (data: any) => void) => any;
}

export interface ExchangeAPI {
    WS: ExchangeWebSocketAPI;
}

export type  BinanceRestT = {
    key?: CurrencyNameT
    secret?: string
    recvWindow: number // 10000
    timeout: number //15000
    disableBeautification: boolean
    handleDrift: boolean
    requestOptions: any
    WS: {
        onAllTickers: any
        streams: {
            depth: () => void;
            depthLevel: () => void;
            kline: () => void;
            aggTrade: () => void;
            trade: () => void;
            ticker: () => void;
            allTickers: () => void;
        }
    }
}

export type CurrencyValueT = {
    e: string // '24hrTicker',
    E: number // 1746382298495,
    s: DoubleName // 'PYTHFDUSD',
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


export type CurrencyT = CurrencyValueT & {
    rate: number;
    flipped: boolean;
    stepFrom: CurrencyNameT
    stepTo: CurrencyNameT
    tradeInfo: {
        symbol: DoubleName
        side: SideT
        type: string
        quantity: number
    }
}

export type PairT = CurrencyT & {
    key: CurrencyNameT;
    startsWithKey: boolean;
    endsWithKey: boolean
}


export type AllMarketTickersT = {
    arr: CurrencyValueT[]
    obj: CurrencyDataT | {};
    markets: CurrencyValueT[];
}
export type StreamsT = {
    allMarketTickers: AllMarketTickersT
}

export type CurrencyDataT = Record<CurrencyNameT, CurrencyValueT>

export type StepA = 'a'
export type StepB = 'b'
export type StepC = 'c'

export type StepCurrencyT = Record<StepA | StepB | StepC, CurrencyNameT>

export type ComparisonT = {
    a: CurrencyT
    b: CurrencyT
    c: CurrencyT
    rate: number
}

export type MatchesT = CandidateT & {
    a: CurrencyT
    b: CurrencyT
    c: CurrencyT
}

