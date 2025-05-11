import {CurrencyAdaptedValueT, DoubleName} from "../types";
import {BinanceCurrencyValueT} from "./types";

export const fromBinance = (value: BinanceCurrencyValueT): CurrencyAdaptedValueT => {
    return {
        symbol: value.s as DoubleName,
        bidPrice: value.b,
        bidQuantity: value.B,
        askPrice: value.a,
        askQuantity: value.A,
        volume: value.v,
        trades: value.n,
        close: value.c,
        high: value.h,
        low: value.l,
        open: value.o,
        timestamp: value.E
    }

};