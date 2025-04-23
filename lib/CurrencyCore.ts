var CurrencyCore: any = {};
var controller: any = {};

CurrencyCore.events = {};
CurrencyCore.events.onAllTickerStream = (): void => {},

    CurrencyCore.init = (ctrl: { exchange: any }): typeof CurrencyCore => {
        if (!ctrl.exchange){
            throw 'Undefined currency exchange connector. Will not be able to communicate with exchange API.';
        }

        CurrencyCore.currencies = {},
            CurrencyCore.sockets = {},
            CurrencyCore.streams = {},
            controller = ctrl,
            CurrencyCore.steps = ['BTC','ETH','BNB','USDT'];

        CurrencyCore.startAllTickerStream(ctrl.exchange, ctrl);
        CurrencyCore.queueTicker(5000);

        return CurrencyCore;
    };

CurrencyCore.queueTicker = (interval: number): void => {
    if (!interval) interval = 3000;
    setTimeout(()=>{
        CurrencyCore.queueTicker(interval);
    }, interval);
    CurrencyCore.tick();
};

CurrencyCore.tick = (): void => {
};

CurrencyCore.getCurrencyFromStream = (stream: any, fromCur: string, toCur: string): any | undefined => {
    if (!stream || !fromCur || !toCur) return;

    var currency: any = stream.obj[toCur + fromCur];

    if (currency){
        currency.flipped = false;
        currency.rate = currency.a;

    } else {
        currency = stream.obj[fromCur + toCur];
        if (!currency){
            return false;
        }
        currency.flipped = true;
        currency.rate = (1/currency.b);

    }

    currency.stepFrom = fromCur;
    currency.stepTo = toCur;

    currency.tradeInfo = {
        symbol: currency.s,
        side: (currency.flipped == true) ? 'SELL' : 'BUY',
        type: 'MARKET',
        quantity: 1
    };

    return currency;
};

CurrencyCore.getArbitageRate = (stream: any, step1: string, step2: string, step3: string): any | undefined => {

    if (!stream || !step1 || !step2 || !step3) return;

    var ret: { a?: any; b?: any; c?: any; rate?: number }= {
        a: CurrencyCore.getCurrencyFromStream(stream, step1, step2),
        b: CurrencyCore.getCurrencyFromStream(stream, step2, step3),
        c: CurrencyCore.getCurrencyFromStream(stream, step3, step1)
    };

    if (!ret.a || !ret.b || !ret.c) return;

    ret.rate = (ret.a.rate) * (ret.b.rate) * (ret.c.rate);
    return ret;
};

CurrencyCore.getCandidatesFromStreamViaPath= (stream:any, aPair:string,bPair:string):any[]=>{

    var keys:{a:string;b:string;c:string}={
        a:aPair.toUpperCase(),
        b:bPair.toUpperCase(),
        c:'findme'.toUpperCase(),
    };

    var apairs:any[]|undefined= stream.markets[keys.a];
    var bpairs:any[]|undefined= stream.markets[keys.b];

    var akeys:{[key:string]:any}=[];
    apairs.map((obj)=>{ akeys[obj.s.replace(keys.a,'')]={...obj}; });

    delete akeys[keys.b];

    var bmatches:any[]=[];

    for(let i=0;i<bpairs.length;i++){
        var bPairTicker=bpairs[i];
        bPairTicker.key=bPairTicker.s.replace(keys.b,'');

        bPairTicker.startsWithKey=bPairTicker.s.startsWith(keys.b);
        bPairTicker.endsWithKey=bPairTicker.s.endsWith(keys.b);

        if(akeys[bPairTicker.key]){
            var match=bPairTicker;

            var stepC=CurrencyCore.getCurrencyFromStream(stream,match.key,keys.a);

            if(stepC){
                keys.c=match.key;

                var comparison=CurrencyCore.getArbitageRate(stream,keys.a,keys.b,keys.c);

                if(comparison){

                    var dt=new Date();
                    var triangle={
                        ws_ts:comparison.a.E,
                        ts:+dt,
                        dt,

                        a:comparison.a,
                        a_symbol:comparison.a.s,
                        a_step_from:comparison.a.stepFrom,
                        a_step_to:comparison.a.stepTo,
                        a_step_type:comparison.a.tradeInfo.side,
                        a_bid_price:comparison.a.b,
                        a_bid_quantity:comparison.a.B,
                        a_ask_price:comparison.a.a,
                        a_ask_quantity:comparison.a.A,
                        a_volume:comparison.a.v,
                        a_trades:comparison.a.n,

                        b : comparison.b ,
                        b_symbol : comparison.b.s ,
                        b_step_from : comparison.b.stepFrom ,
                        b_step_to : comparison.b.stepTo ,
                        b_step_type : comparison.b.tradeInfo.side ,
                        b_bid_price : comparison.b.b ,
                        b_bid_quantity : comparison.b.B ,
                        b_ask_price : comparison.b.a ,
                        b_ask_quantity : comparison.b.A ,
                        b_volume : comparison.b.v ,
                        b_trades : comparison.b.n ,

                        c : comparison.c ,
                        c_symbol : comparison.c.s ,
                        c_step_from : comparison.c.stepFrom ,
                        c_step_to : comparison.c.stepTo ,
                        c_step_type : comparison.c.tradeInfo.side ,
                        c_bid_price : comparison.c.b ,
                        c_bid_quantity : comparison.c.B ,
                        c_ask_price : comparison.c.a ,
                        c_ask_quantity : comparison.c.A ,
                        c_volume : comparison.c.v ,
                        c_trades : comparison.c.n ,

                        rate:(comparison as {rate:number}).rate
                    };
                    bmatches.push(triangle);
                }
            }
        }
    }

    if(bmatches.length){
        bmatches.sort(function(a,b){ return parseFloat(b.rate)-parseFloat(a.rate); });
    }
    return bmatches;
};


CurrencyCore.getDynamicCandidatesFromStream=(stream:any,options:{paths:string[],start:string}):any[]=>{

    var matches:any[]=[];

    for(let i=0;i<options.paths.length;i++){
        var pMatches=CurrencyCore.getCandidatesFromStreamViaPath(stream,options.start,options.paths[i]);
        matches=matches.concat(pMatches);
    }

    if(matches.length){
        matches.sort(function(a,b){ return parseFloat(b.rate)-parseFloat(a.rate); });
    }

    return matches;
};


CurrencyCore.getBTCETHCandidatesFromStream=(stream:any):any[]=>{

    var keys:{
        a:string;
        b:string;
        c:string;}={
        a:'btc'.toUpperCase(),
        b:'eth'.toUpperCase(),
        c:'findme'.toUpperCase(),
    };

    var apairs:any[]=stream.markets.BTC;
    var bpairs:any[]=stream.markets.ETH;

    var akeys:{[key:string]:any}=[];
    apairs.map((obj)=>{ akeys[obj.s.replace(keys.a,'')]={...obj}; });

    delete akeys[keys.b];

    var bmatches:any[]=[];

    for(let i=0;i<bpairs.length;i++){
        var bPairTicker=bpairs[i];
        bPairTicker.key=bPairTicker.s.replace(keys.b,'');

        keys.c=bPairTicker.key;

        var rate=CurrencyCore.getArbitageRate(stream,keysa,keysb,c.keys);

        var triangle={
            a:keysa,a:b:keysb,c:c.keys,rates
    };
        bmatches.push(triangle);

    }
    if(bmatches.length){
        bmatches.sort(function(a,b){return parseFloat(b.rate)-parseFloat(a.rate)});
    }
    return bmatches;
};


Currencycore.simpleArbitragemath=(stream:any,candidates:{[key:string]:number})=>{

    if(!stream||! candidates)return;

//start btc
//via xUSDT
//end btc

    const [A,B,C]=['BTCUSDT','ETHUSDT','ETHBTC'].map(key=> candidates[key]);

    if(!A||isNaN(A)||!B||isNaN(B)||!C||isNaN(C))return;

//btcusd:(flip/usdEth):ethbtc
    const d=A*b*1/C.B;
//debugger
    return d;}
;


currencycore.events.onalltickerstreamevent=>{

    const key='allMarketTickers';

    // Basic array from api arr[0].s=ETHBTC
    currencies.streams.allMarketTickers.arr==event

    // Mapped object arr[ETHBTC]
    currencies.streams.allMarketTickers.obj==event.reduce((array,current)=>{
        array[current.s]=current ;
        return array ;},{});

    // Sub objects with only data on specific markets
    for(let i=0;i<currencysteps.length;i++)
        currencies.streams.allMarketTickers.markets[currencysteps[i]]=event.filter(e=>{
            e,s.endswith(currencies.steps[i])||e,s.startswith(currencies.steps[i])
        });

    // something's wrong here.
    if(controller&&controller.storage.streamtick)
        controller.storage.streamtick(currencycore.streams[key],key)
}


currencycore.startalltickerstreams=function(exchange){

    if(!currencystreams.allmarkettickers)
    {
        currencystreams.allmarkettickers={};
        currencystreams.allmarkettickers.arr=[],currencystreams.allmarkettickers.obj={},currencystreams.allmarkettickers.markets=[]
    }
    currencycoresockets.allmarkettickerstreams=
        exchange.WS.onAllTickers(event=>currencycore.events.onAlltickerStreams(event));
}

// starts streams for specific selectors
currencycore.startWSockets=function(exchange.ctrl){

    for(let i=0;i<currencies.selectors.Length();i++){

        let selector=require('./CurrenccySelector')(currencies.selectors(i),exchange)

        currencies.currencyselector.key]=selector.handleEvent(ctrl.events.wsEvent).startWSockets(ctrl.events)
    }
}

module.exports=currencycore.init
