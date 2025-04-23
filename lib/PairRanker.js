const PairRanker = function() {};

//Stores each Unique pair in an object and keeps track of the average rating
PairRanker.prototype.getPairRanking = (candidates, pairRanks, ctrl) => {

  for (let i = 0; i < candidates.length; i++) {
    const candidate = candidates[i];
    //create the unique ID so we can filter it from the Array
    const id = candidate['a_step_from'] + candidate['a_step_to'] + candidate['b_step_to'] + candidate['c_step_to'];
    const date = new Date;
    const pair = {
      id: id,
      step_a: candidate['a_step_from'],
      step_b: candidate['a_step_to'],
      step_c: candidate['b_step_to'],
      step_d: candidate['c_step_to'],
      rate: candidate['rate'],
      date: date
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
};

///everything older then X time will be removed.
PairRanker.cleanPairingArray = (pairRanks) => {

  const cleanArray = pairRanks.filter(function(pair) {
    return pair.date > new Date - process.env.pairTimer;
  });
  return cleanArray;
};

///checks the top candidate against the pair Array
PairRanker.getTopPairs = (pairToCheck, pairRanks) => {

  let check = false;
  const id = pairToCheck['a_step_from'] + pairToCheck['a_step_to'] + pairToCheck['b_step_to'] + pairToCheck['c_step_to'];
  const pairsToCheck = pairRanks.filter(function(pair) {
    return pair.id == id;
  });
  let rate = 0;
  for (let i = 0; i < pairsToCheck.length; i++) {
    rate += pairsToCheck[i].rate;
  }
  rate = rate / pairsToCheck.length;
  if (rate > parseFloat(process.env.minimalProfit)) {
    check = true;
  }
  return check;
};

exports.PairRanker = PairRanker;
