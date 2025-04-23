class PairRanker {
    static getPairRanking(candidates: Array<{ [key: string]: any }>, pairRanks: Array<{ id: string; step_a: any; step_b: any; step_c: any; step_d: any; rate: number; date: Date }>, ctrl: { storage: { pairRanks: Array<any> } }): string {
        for (let i = 0; i < candidates.length; i++) {
            const candidate = candidates[i];
            const id = candidate['a_step_from'] + candidate['a_step_to'] + candidate['b_step_to'] + candidate['c_step_to'];
            const date = new Date();
            const pair = {
                id,
                step_a: candidate['a_step_from'],
                step_b: candidate['a_step_to'],
                step_c: candidate['b_step_to'],
                step_d: candidate['c_step_to'],
                rate: candidate['rate'],
                date
            };
            pairRanks.push(pair);
        }
        pairRanks = PairRanker.cleanPairingArray(pairRanks);

        let check = false;
        let k = -1;
        let returnValue = 'none';
        while (!check && k < 5 && candidates[0].rate > parseFloat(process.env.minimalProfit)) {
            k++;
            check = PairRanker.getTopPairs(candidates[k], pairRanks);
            returnValue = candidates[k];
        }

        ctrl.storage.pairRanks = pairRanks;

        return returnValue;
    }

    static cleanPairingArray(pairRanks: Array<{ date: Date }>): Array<{ date: Date }> {
        const cleanArray = pairRanks.filter((pair) => {
            return pair.date > new Date(Date.now() - Number(process.env.pairTimer));
        });
        return cleanArray;
    }

    static getTopPairs(pairToCheck: { [key: string]: any }, pairRanks: Array<{ id: string; rate?: number }>): boolean {
        let check = false;
        const id = pairToCheck['a_step_from'] + pairToCheck['a_step_to'] + pairToCheck['b_step_to'] + pairToCheck['c_step_to'];
        const pairsToCheck = pairRanks.filter((pair) => {
            return pair.id === id;
        });

        let rate = 0;
        for (let i = 0; i < pairsToCheck.length; i++) {
            rate += pairsToCheck[i].rate || 0;
        }

        if (pairsToCheck.length > 0) {
            rate /= pairsToCheck.length;

            if (rate > parseFloat(process.env.minimalProfit)) {
                check = true;
            }
        }

        return check;
    }
}

export { PairRanker };
