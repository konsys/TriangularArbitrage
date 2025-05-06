import {Logger} from "winston";
import {CurrencyCore} from "./CurrencyCore";


export type UIOptions =
    {
        title: string;
    };

export type CurrencyNameT = 'BTC' | 'USDT' | 'BNB' | 'ETH' | 'AXL' | 'JPY' | 'DOGE' | 'HBAR' |
    'BCH' | 'TRY' | 'ZRO' | 'EUR' |
    'SSV' | 'SLF' | 'STPT' | 'SOL' |
    'PYR' | 'BICO' | 'LOKA' | 'NMR' |
    'KAITO' | 'ETC' |
    'AVAX' | 'ZEC' | 'OP' | 'PLN' |
    'ADA' | 'SUI' | 'ARKM' | 'WLD' |
    'WAN' | 'SFP' | 'FDUSD' | 'ZEN' |
    'OM' | 'VET' | 'USDC' | 'RONIN'


type Trading = {
    paperOnly: boolean
    minQueuePercentageThreshold: number
    minHitsThreshold: number
}

export type BotOptions = {
    UI: UIOptions,
    arbitrage: { paths?: CurrencyNameT[], start?: CurrencyNameT },
    storage: { logHistory: boolean },
    trading: Trading
}
type Storage = {
    trading: { queue: CandidateQueueObject; active: string[] }
    candidates: Candidate[]
    streams: string[]
    pairRanks: Pair[]
    streamTick?: (stream: any, streamID: string) => any
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
    UI?: any
}

export interface Candidate {
    a_step_from: string;
    a_step_to: string;
    b_step_from: string
    b_step_to: string;
    c_step_from: string;
    c_step_to: string;
    rate: number; // Assuming rate is consistently a number
    rates: number[]
    hits: number
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
export interface CandidateQueueObject {
    [key: string]: Candidate;
}

// Define the structure of the exchangeAPI object for type safety
export interface ExchangeWebSocketAPI {
    onDepthUpdate: (key: string, callback: (data: any) => void) => any;
    onAggTrade: (key: string, callback: (data: any) => void) => any;
    onKline: (key: string, interval: string, callback: (data: any) => void) => any;
}

export interface ExchangeAPI {
    WS: ExchangeWebSocketAPI;
}

export type  BinanceRestT = {
    key?: string
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

export type BinanceRespT = {
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

export type CurrencyT = BinanceRespT & {
    flipped?: boolean;
    rate?: number;
    stepFrom?: string
    stepTo?: string
    tradeInfo?: {
        symbol: string
        side: 'SELL' | 'BUY'
        type: string
        quantity: number
    }
}

export type PairT = CurrencyT & {
    key: string;
    startsWithKey: boolean;
    endsWithKey: boolean
}

export type CurrencyDataT = Record<CurrencyNameT, BinanceRespT>

export type AllMarketTickersT = {
    arr: BinanceRespT[]
    obj: CurrencyDataT | {};
    markets: any;
}
export type StreamsT = {
    allMarketTickers: AllMarketTickersT
}
export type StepA = 'a'
export type StepB = 'b'
export type StepC = 'c'

export type StepCurrencyT = Record<StepA | StepB | StepC, CurrencyNameT | FindMeT>

export type FindMeT = 'FINDME'