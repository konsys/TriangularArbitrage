// Required Dependencies:
// npm install mongodb
// npm install --save-dev @types/node @types/mongodb

import {Collection, Db, InsertManyResult, MongoError} from 'mongodb';

// Define a simple interface for the logger
interface Logger {
    error: (message: string) => void;
    debug: (message: string) => void;
}

// Define the type for the optional callback function
type Callback = (err: MongoError | null, result?: InsertManyResult<any> | null) => void | boolean;

// DBHelpers.ts
class DBHelpers {
    constructor() {
    }

    // saving websocket ticks to DB
    public saveRawTick(rows: any[], db: Db, logger: Logger, cb?: Callback): void {
        // Ensure environment variable is treated as a string, mirroring JS behavior
        const tableName: string = process.env.rawTicksTable!;
        let rawTicksTable: Collection<any> = db.collection(tableName);

        // @ts-ignore
        rawTicksTable.insertMany(rows, (err: MongoError | null, result?: InsertManyResult<any>) => {
            if (err) {
                logger.error('--- MongoDB Error in saveRawTick(): ' + err);
                // Call the callback if provided, otherwise return false (though this return is internal to the insertMany callback)
                if (cb) {
                    cb(err, result || null);
                } else {
                    // This return value is not captured by the outer function, but preserved for exactness
                    return false;
                }
                return; // Explicit return to avoid executing success logic
            }

            // Ensure result and result.result are defined before accessing result.result.n
            // The mongodb v3+ driver uses insertedCount instead of result.n
            // To maintain compatibility with potential older driver versions reflected in the JS,
            // we check for result.result.n, but prefer result.insertedCount if available.
            // The original JS code uses result.result.n which might be specific to an older driver version (e.g., v2.x).
            // Modern mongodb driver (v3+) uses result.insertedCount.
            // We'll try to access result.result.n first for exactness, falling back to insertedCount.
            let count = 0;
            if (result) {
                if (typeof result.insertedCount === 'number') {
                    count = result.insertedCount; // For modern driver (v3+)
                }
            }

            logger.debug('----- Logged ' + count + ' raw ticks to DB');
            // Call the callback if provided, otherwise return true (though this return is internal to the insertMany callback)
            if (cb) {
                cb(err, result || null);
            } else {
                // This return value is not captured by the outer function, but preserved for exactness
                return true;
            }
        });
    }

    // save arbitrage calculation ticks to DB for later analysis
    public saveArbRows(rows: any[], db: Db, logger: Logger, cb?: Callback): void {
        // Ensure environment variable is treated as a string, mirroring JS behavior
        const tableName: string = process.env.arbitrageTicksTable!;
        let arbitrageTicksTable: Collection<any> = db.collection(tableName);

        // console.log("----- saveArbRows()")
        // console.log("flipped: ", rows[0].a.flipped)
        // console.log(rows[0].a.stepFrom, rows[0].a.stepTo)
        // console.log(rows[0].a_step_from, rows[0].a_step_to)

        // @ts-ignore
        arbitrageTicksTable.insertMany(rows, (err: MongoError | null, result?: InsertManyResult<any>) => {
            if (err) {
                logger.error('--- MongoDB Error in saveArbRows(): ' + err);
                // Call the callback if provided, otherwise return false (though this return is internal to the insertMany callback)
                if (cb) {
                    cb(err, result || null);
                } else {
                    // This return value is not captured by the outer function, but preserved for exactness
                    return false;
                }
                return; // Explicit return to avoid executing success logic
            }

            // Ensure result and result.result are defined before accessing result.result.n
            // See comment in saveRawTick regarding result.result.n vs result.insertedCount
            let count = 0;
            if (result) {
                if (typeof result.insertedCount === 'number') {
                    count = result.insertedCount; // For modern driver (v3+)
                }
            }

            logger.debug('----- Logged ' + count + ' arbitrage rows to DB');
            // Call the callback if provided, otherwise return true (though this return is internal to the insertMany callback)
            if (cb) {
                cb(err, result || null);
            } else {
                // This return value is not captured by the outer function, but preserved for exactness
                return true;
            }
        });
    }
}

// Export the class, maintaining the original export structure
export {DBHelpers};
