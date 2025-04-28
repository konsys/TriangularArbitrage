// Required Dependencies:
// Node.js environment with process.env defined
// TypeScript compiler (tsc)

// Type definitions for Node.js process environment (usually available via @types/node)
// No explicit imports needed if @types/node is installed or if running in a standard Node.js environment.

// Define interfaces for better type safety


import {Candidate, Pair} from "./types";

interface Controller {
    storage: {
        pairRanks: Pair[];
    };
}

class PairRanker {
    constructor() {
    }

    //Stores each Unique pair in an object and keeps track of the average rating
    // Note: In the original JS, this was assigned to the prototype using an arrow function.

    // Note: In the original JS, this was assigned directly to the PairRanker function (static).
    static cleanPairingArray(pairRanks: Pair[]): Pair[] {

        const pairTimerEnv = process.env.pairTimer;
        const pairTimerMs = pairTimerEnv ? Number(pairTimerEnv) : NaN;

        if (isNaN(pairTimerMs)) {
            console.error("Error: process.env.pairTimer is not a valid number string. Cannot clean array by time.");
            return pairRanks; // Return original array if timer is invalid
        }

        const timeThreshold = Date.now() - pairTimerMs; // Calculate threshold beforehand

        const cleanArray = pairRanks.filter(function (pair: Pair) {
            // Ensure pair.date is a valid Date object before comparison
            return pair.date instanceof Date && pair.date.getTime() > timeThreshold;
        });
        return cleanArray;
    }

    ///everything older then X time will be removed.

    // Note: In the original JS, this was assigned directly to the PairRanker function (static).
    static getTopPairs(pairToCheck: Candidate, pairRanks: Pair[]): boolean {

        let check: boolean = false;
        const id: string = pairToCheck['a_step_from'] + pairToCheck['a_step_to'] + pairToCheck['b_step_to'] + pairToCheck['c_step_to'];

        const pairsToCheck: Pair[] = pairRanks.filter(function (pair: Pair) {
            return pair.id === id;
        });

        let totalRate: number = 0;
        if (pairsToCheck.length > 0) {
            for (let i = 0; i < pairsToCheck.length; i++) {
                totalRate += pairsToCheck[i].rate;
            }
            const averageRate: number = totalRate / pairsToCheck.length;

            const minimalProfit = process.env.minimalProfit ? parseFloat(process.env.minimalProfit) : NaN;
            if (isNaN(minimalProfit)) {
                console.error("Error: process.env.minimalProfit is not a valid number string. Cannot compare average rate.");
                // Decide behavior: return false or throw? Original would compare with NaN (likely false).
                return false;
            }

            if (averageRate > minimalProfit) {
                check = true;
            }
        }
        // If pairsToCheck is empty, averageRate remains 0, check remains false.

        return check;
    }

    ///checks the top candidate against the pair Array

    // Translated as a standard instance method in the class.
    getPairRanking(candidates: Candidate[], pairRanks: Pair[], ctrl: Controller): Candidate | 'none' {

        // Create a mutable copy of pairRanks to work with locally if needed,
        // but the original code modifies the passed array reference via ctrl.storage.pairRanks later.
        // Let's stick to modifying the local variable `pairRanks` first, then assigning it back.
        let currentPairRanks = [...pairRanks]; // Use spread to avoid modifying the original array directly initially

        for (let i = 0; i < candidates.length; i++) {
            const candidate = candidates[i];
            //create the unique ID so we can filter it from the Array
            const id: string = candidate['a_step_from'] + candidate['a_step_to'] + candidate['b_step_to'] + candidate['c_step_to'];
            const date: Date = new Date();
            const pair: Pair = {
                id: id,
                step_a: candidate['a_step_from'],
                step_b: candidate['a_step_to'],
                step_c: candidate['b_step_to'],
                step_d: candidate['c_step_to'],
                rate: candidate['rate'],
                date: date
            };
            currentPairRanks.push(pair);
        }
        // The original code reassigns the local pairRanks variable.
        // We assign the cleaned array back to our working copy.
        currentPairRanks = PairRanker.cleanPairingArray(currentPairRanks);

        let check: boolean = false;
        let k: number = -1;
        let returnValue: Candidate | 'none' = 'none';

        // Ensure candidates array is not empty and minimalProfit is a valid number string
        const minimalProfit = process.env.minimalProfit ? parseFloat(process.env.minimalProfit) : NaN;
        if (isNaN(minimalProfit)) {
            console.error("Error: process.env.minimalProfit is not a valid number string.");
            // Handle error appropriately, maybe return 'none' or throw
            // For exact translation, we proceed, potentially comparing with NaN
        }

        // Check if candidates array has elements before accessing candidates[0]
        if (candidates.length > 0 && !isNaN(minimalProfit)) {
            while (!check && k < 5 && k < candidates.length - 1 && candidates[0].rate > minimalProfit) {
                k++;
                // Check if candidates[k] exists before passing it
                if (candidates[k]) {
                    check = PairRanker.getTopPairs(candidates[k], currentPairRanks);
                    if (check) { // Assign returnValue only if check becomes true
                        returnValue = candidates[k];
                    }
                } else {
                    // Break if k goes out of bounds unexpectedly (shouldn't happen with loop condition)
                    break;
                }
            }
        } else if (candidates.length === 0) {
            // Handle empty candidates array if necessary
            // console.warn("getPairRanking called with empty candidates array.");
        }


        // Update the controller's storage with the potentially modified array
        ctrl.storage.pairRanks = currentPairRanks;

        return returnValue;
    }
}

// Export the class using TypeScript syntax
export {PairRanker};
