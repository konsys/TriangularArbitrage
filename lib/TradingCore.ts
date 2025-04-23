import {EventEmitter} from 'events';

interface TradingCoreOptions {
    minQueuePercentageThreshold?: number;
    minHitsThreshold?: number;
}

interface Candidate {
    rate: number;
    a_step_from: string;
    b_step_from: string;
    c_step_from: string;
    rates?: number[];
    hits?: number;
}

class TradingCore extends EventEmitter {
    private _started: number;
    private _minQueuePercentageThreshold: number;
    private _minHitsThreshold: number;
    private _currencyCore: any; // Replace 'any' with the actual type of currencyCore if available
    private _activeTrades: Record<string, any>; // Adjust type as necessary

    constructor(opts: TradingCoreOptions, currencyCore: any) {
        super();
        this._started = Date.now();
        this._minQueuePercentageThreshold = (opts.minQueuePercentageThreshold ? opts.minQueuePercentageThreshold / 100 + 1 : 0);
        this._minHitsThreshold = (opts.minHitsThreshold ? opts.minHitsThreshold : 0);
        this._currencyCore = currencyCore;
        this._activeTrades = {};

        if (!(this instanceof TradingCore)) return new TradingCore(opts, currencyCore);
    }

    public initiateTrade(pathInfo: any): void {
        const self = this;

        /*
         -

         */
    }

    public updateCandidateQueue(stream: any, candidates: Candidate[], queue: Candidate[]): Candidate[] {
        const self = this;

        for (let i = 0; i < candidates.length; i++) {
            let cand = candidates[i];

            if (cand.rate >= this._minQueuePercentageThreshold) {
                let key = cand.a_step_from + cand.b_step_from + cand.c_step_from;

                if (!queue[key]) {
                    cand.rates = [];
                    cand.hits = 1;
                    queue[key] = cand;
                } else {
                    queue[key].hits++;
                }
                queue[key].rates.push(cand.rate);

            } else {
                break;
            }
        }

        if (queue) {
            queue.sort((a, b) => parseInt(b.hits!.toString()) - parseInt(a.hits!.toString()));

            self.candidateQueue = queue; // Ensure candidateQueue is defined in your class
            self.emit('queueUpdated', queue);
            self.processQueue(queue, stream, self.time());
        }

        return queue;
    }


// act on elements in the queue that
    public processQueue(queue: Record<string, Candidate>, stream: any): void {
        const self = this;
        let keys = Object.keys(queue);

        for (let i = 0; i < keys.length; i++) {
            let cand = queue[keys[i]];

            if (cand.hits! >= this._minHitsThreshold) {

                let liveRate = self._currencyCore.getArbitageRate(stream, cand.a_step_from, cand.b_step_from, cand.c_step_from);
                if (liveRate && liveRate.rate >= this._minQueuePercentageThreshold) {
                    self.emit('newTradeQueued', cand, self.time());

                    // begin trading logic. Plan:
                    /*


                    */
                }
            }
        }
    }

    public time(): number {
        return this._started && Date.now() - this._started!;
    }
}

export default TradingCore;
