// load logger library
const {Logger} = require('../LoggerCore');


Logger.info('\n\n\n----- Bot Starting : -----\n\n\n');

let exchangeAPI = {};

Logger.info('--- Loading Exchange API');

// make exchange module dynamic later

Logger.info('--- \tActive Exchange:' + process.env.activeExchange);
// activePairs = process.env.binancePairs;

const api = require('binance');
const beautifyResponse = false;
exchangeAPI = new api.BinanceRest({
  timeout: parseInt(process.env.restTimeout), // Optional, defaults to 15000, is the request time out in milliseconds
  recvWindow: parseInt(process.env.restRecvWindow), // Optional, defaults to 5000, increase if you're getting timestamp errors
  disableBeautification: beautifyResponse
});
exchangeAPI.WS = new api.BinanceWS(beautifyResponse);


const botOptions = {
    UI: {
      title: 'Top Potential Arbitrage Triplets, via: ' + process.env.binanceColumns
    },
    arbitrage: {
      paths: process.env.binanceColumns.split(','),
      start: process.env.binanceStartingPoint
    },
    storage: {
      logHistory: false
    },
    trading: {
      paperOnly: true,
      // only candidates with over x% gain potential are queued for trading
      minQueuePercentageThreshold: 3,
      // how many times we need to see the same opportunity before deciding to act on it
      minHitsThreshold: 5
    }
  },
  ctrl = {
    options: botOptions,
    storage: {
      trading: {
        // queued triplets
        queue: [],
        // actively trading triplets
        active: []
      },
      candidates: [],
      streams: [],
      pairRanks: []
    },
    logger: Logger,
    exchange: exchangeAPI
  };

ctrl.UI = require('../UI')(ctrl.options),
ctrl.events = require('../EventsCore')(ctrl);

// We're ready to start. Load up the webhook streams and start making it rain.
require('../BotCore')(ctrl);

ctrl.Logger.info('----- Bot Startup Finished -----');
