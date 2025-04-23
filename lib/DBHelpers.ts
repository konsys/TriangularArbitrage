import { MongoClient, InsertManyResult } from 'mongodb';
import { Logger } from 'some-logger-library'; // replace with actual logger library import

interface Row {
    [key: string]: any; // Replace with more specific type if known
}

class DBHelpers {
    saveRawTick(rows: Row[], db: MongoClient, logger: Logger, cb?: (err: Error | null, result?: InsertManyResult) => boolean): boolean {
        const rawTicksTable = db.collection(process.env.rawTicksTable as string);

        rawTicksTable.insertMany(rows, (err: Error | null, result: InsertManyResult) => {
            if (err) {
                logger.error('--- MongoDB Error in saveRawTick(): ' + err);
                return cb ? cb(err, result) : false;
            }

            logger.debug('----- Logged ' + result.result.n + ' raw ticks to DB');
            return cb ? cb(err, result) : true;
        });
    }

    saveArbRows(rows: Row[], db: MongoClient, logger: Logger, cb?: (err: Error | null, result?: InsertManyResult) => boolean): boolean {
        const arbitrageTicksTable = db.collection(process.env.arbitrageTicksTable as string);

        arbitrageTicksTable.insertMany(rows, (err: Error | null, result: InsertManyResult) => {
            if (err) {
                logger.error('--- MongoDB Error in saveArbRows(): ' + err);
                return cb ? cb(err, result) : false;
            }

            logger.debug('----- Logged ' + result.result.n + ' arbitrage rows to DB');
            return cb ? cb(err, result) : true;
        });
    }
}

export { DBHelpers };
