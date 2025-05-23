import {EventEmitter} from 'events';
import {ArbitrageRateResult, CandidateQueueObject, CandidateT, TradingCoreOptions} from "./types";
import {CurrencyCore} from "./CurrencyCore";

// Define interfaces for complex types to improve type safety

// Interface for the options object passed to the constructor

export class TradingCore extends EventEmitter {
    public candidateQueue: CandidateT[] = []; // Initialize as an empty array
    private _started: number;
    private _minQueuePercentageThreshold: number;
    private _minHitsThreshold: number;
    private _currencyCore: CurrencyCore;

    constructor(opts: TradingCoreOptions, currencyCore: CurrencyCore) {
        // The check `if (!(this instanceof TradingCore))` is implicit in TypeScript class constructors
        super(); // Call EventEmitter constructor

        this._started = Date.now();
        // Calculate threshold: if provided, convert percentage to factor (e.g., 5% -> 1.05), else 0
        this._minQueuePercentageThreshold = (opts.minQueuePercentageThreshold) ? (opts.minQueuePercentageThreshold / 100) + 1 : 0;
        this._minHitsThreshold = (opts.minHitsThreshold) ? opts.minHitsThreshold : 0;
        this._currencyCore = currencyCore;
        // EventEmitter.call(this); // Replaced by super()
    }


    public updateCandidateQueue(stream: any, candidates: CandidateT[], queue: CandidateQueueObject | null): CandidateT[] {
        if (!queue) {
            return []
        }

        for (let i = 0; i < candidates.length; i++) {
            let cand: CandidateT = candidates[i];

            if (cand.rate >= this._minQueuePercentageThreshold) {
                let key: string = cand.a_step_from + cand.b_step_from + cand.c_step_from;

                // store in queue using trio key. If new, initialise rates and hits. Else increment hits by 1.
                if (!queue[key]) {
                    // Create a new object reference for the queue to avoid modifying the input candidate directly
                    queue[key] = {...cand, rates: [] as number[], hits: 1};

                } else {
                    // Ensure hits is initialized if somehow missing (shouldn't happen with above logic but good practice)
                    queue[key].hits = (queue[key].hits || 0) + 1;
                }
                // Ensure rates array is initialized before pushing
                if (!queue[key].rates) {
                    queue[key].rates = [];
                }
                queue[key].rates!.push(cand.rate); // Use non-null assertion operator as we ensure rates exists

            } else {
                // results are sorted descending by rate
                // break to loop, why waste CPU if the rest in this call are definitely not past the threshold.
                break;
            }
        }

        // Convert the queue object to an array for sorting
        let queueArray: CandidateT[] = Object.values(queue);

        // place top candidates at beginning of queue
        if (queueArray.length > 0) { // Check if the array has elements before sorting
            // Sort the array based on hits
            queueArray.sort((a: CandidateT, b: CandidateT) => (b.hits ?? 0) - (a.hits ?? 0)); // Use nullish coalescing for safety

            this.candidateQueue = queueArray; // Store the sorted array
            this.emit('queueUpdated', this.candidateQueue);
            this.processQueue(this.candidateQueue, stream); // Pass the sorted array to processQueue
        } else {
            // If the queue object was empty or no candidates met the threshold, ensure candidateQueue is empty
            this.candidateQueue = [];
            // Optionally emit an empty queue update
            // this.emit('queueUpdated', this.candidateQueue);
        }


        return this.candidateQueue; // Return the updated and sorted queue (now an array)
    }


    // act on elements in the queue that
    // Changed parameter 'queue' type to Candidate[] as it receives the sorted array from updateCandidateQueue
    public processQueue(queue: CandidateT[], stream: any): void { // Added 'void' return type
        // const self = this; // 'this' is automatically scoped in TypeScript class methods

        // Iterate directly over the array
        for (let i = 0; i < queue.length; i++) {
            let cand: CandidateT = queue[i];

            // Ensure cand.hits exists and meets the threshold
            if (cand.hits && cand.hits >= this._minHitsThreshold) {

                const liveRate: ArbitrageRateResult | undefined = this._currencyCore.getArbitrageRate(stream, cand.a_step_from, cand.b_step_from, cand.c_step_from);
                // Check if liveRate is not null/undefined and its rate meets the threshold
                if (liveRate && liveRate.rate >= this._minQueuePercentageThreshold) {
                    this.emit('newTradeQueued', cand, this.time());

                }
            } else {
                // Since the queue is sorted by hits descending, if this candidate doesn't meet the threshold,
                // none of the subsequent ones will either. We can break early.
                break;
            }
        }
    }

    public time(): number {
        return this._started && Date.now() - this._started;
    }
}

