import {Logger} from "winston";
import {CurrencyCore} from "./CurrencyCore";
import {Db} from "mongodb";


export type UIOptions =
    {
        title: string;
    };

export type Currency = 'BTC' | 'USDT' | 'BNB' | 'ETH';

type Trading = {
    paperOnly: boolean
    minQueuePercentageThreshold: number
    minHitsThreshold: number
}

export type BotOptions = {
    UI: UIOptions,
    arbitrage: { paths?: string[], start?: Currency },
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
    db: Db
    // Add other potential properties if known
}
export type CtrlT = {
    options: BotOptions,
    storage: Storage,
    logger: Logger,
    exchange: object
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


// Interface for the return value of getArbitageRate
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
