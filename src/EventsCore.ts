// Define interfaces for better type safety

// Interface for the UI object expected within ctrl
interface IUI {
    // Define methods/properties expected on UI based on usage
    // Example based on commented out code:
    // addTrade(eventTime: any, symbol: any, tradeId: any, price: any, quantity: any): void;
    // Using 'any' for now as the exact types are unknown from the snippet
    addTrade: (eventTime: any, symbol: any, tradeId: any, price: any, quantity: any) => void;

    // Add other potential UI methods/properties if known
    [key: string]: any; // Allow other properties if UI structure is not fully known
}

// Interface for the ctrl object passed to init
interface ICtrl {
    UI: IUI;

    // Add other potential ctrl methods/properties if known
    [key: string]: any; // Allow other properties if ctrl structure is not fully known
}

// Interface for the event object passed to wsEvent
interface IWsEvent {
    eventType?: string; // eventType might be optional or present
    // Define other potential event properties based on usage
    // Example based on commented out code:
    eventTime?: any;
    symbol?: any;
    tradeId?: any;
    price?: any;
    quantity?: any;

    // Add other potential event properties if known
    [key: string]: any; // Allow other properties if event structure is not fully known
}

// Interface for the moduleObj structure
interface IModuleObj {
    ctrl?: ICtrl; // ctrl is assigned in init, so it might be undefined initially
    UI?: IUI;     // UI is assigned in init, so it might be undefined initially
    init: (ctrl: ICtrl) => IModuleObj;
    wsEvent: (event: IWsEvent) => void;
}

const moduleObj: IModuleObj = {
    // ctrl and UI will be assigned in init
    ctrl: undefined,
    UI: undefined,

    init: (ctrl: ICtrl): IModuleObj => {
        moduleObj.ctrl = ctrl;
        moduleObj.UI = ctrl.UI;
        return moduleObj;
    },

    // universal events processor
    // currently unused
    wsEvent: (event: IWsEvent): void => {

        // return;
        //debugger;

        if (event.eventType) {
            const type: string = event.eventType;
            if (type == 'depthUpdate') {
                //
            } else if (type == 'aggTrade') {
                // moduleObj.UI.addTrade(event.eventTime, event.symbol, event.tradeId, event.price, event.quantity);
                // console.log("handle.wsEvent().aggTrade(): ", event);
            } else {
                //console.log("handle.wsEvent(): ", event);
            }
        }
    }
};

export const EventsCore = moduleObj.init
