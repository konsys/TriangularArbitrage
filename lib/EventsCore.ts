var moduleObj: { init: (ctrl: any) => typeof moduleObj; ctrl?: any; UI?: any; wsEvent: (event: { eventType?: string; eventTime?: number; symbol?: string; tradeId?: string; price?: number; quantity?: number }) => void } = {};

moduleObj.init = (ctrl: any): typeof moduleObj => {
    moduleObj.ctrl = ctrl;
    moduleObj.UI = ctrl.UI;
    return moduleObj;
};

moduleObj.wsEvent = (event: { eventType?: string; eventTime?: number; symbol?: string; tradeId?: string; price?: number; quantity?: number }): void => {
    if (event.eventType) {
        var type: string = event.eventType;
        if (type === 'depthUpdate') {
            //
        } else if (type === 'aggTrade') {
            // moduleObj.UI.addTrade(event.eventTime, event.symbol, event.tradeId, event.price, event.quantity);
            // console.log("handle.wsEvent().aggTrade(): ", event);
        } else {
            // console.log("handle.wsEvent(): ", event);
        }
    }
};

export default moduleObj.init;
