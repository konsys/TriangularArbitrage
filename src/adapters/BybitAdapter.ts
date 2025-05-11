import {BybitCurrencyValueT} from "./types";
import {CurrencyAdaptedValueT, DoubleName} from "../types";

export const fromtBybit = (value: BybitCurrencyValueT): CurrencyAdaptedValueT => {
    return {
        symbol: value.s as DoubleName,
        bidPrice: Number.parseFloat(value.b),
        bidQuantity: Number.parseFloat(value.B),
        askPrice: Number.parseFloat(value.a),
        askQuantity: Number.parseFloat(value.A),
        volume: Number.parseFloat(value.v),
        trades: value.n,
    }

};