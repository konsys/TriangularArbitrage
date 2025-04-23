const DBCore: { startupDB: (logger: any, cb: (err: Error | null, db?: any) => void) => void } = {};

DBCore.startupDB = (logger: any, cb: (err: Error | null, db?: any) => void): void => {
    return cb && cb(false, false);

    // logger.info('--- Preparing MongoDB Storage');
    // let authStr: string = '', authMechanism?: string;
    //
    // if (process.env.mongoUser) {
    //     authStr = encodeURIComponent(process.env.mongoUser);
    //
    //     if (process.env.mongoPass) authStr += ':' + encodeURIComponent(process.env.mongoPass);
    //     authStr += '@';
    //
    //     authMechanism = 'DEFAULT';
    // }
    //
    // const u: string = 'mongodb://' + authStr + process.env.mongoHost + ':' + process.env.mongoPort + '/' + process.env.mongoDb + '?' + (authMechanism ? '&authMechanism=' + authMechanism : '');
    //
    // require('mongodb').MongoClient.connect(u, (err: Error | null, client: any) => {
    //     if (err) {
    //         console.error('WARNING: MongoDB Connection Error: ', err);
    //         console.error('WARNING: without MongoDB some features (such as history logging & indicators) may be disabled.');
    //         console.error('Attempted authentication string: ' + u);
    //         logger.error('--- \tMongoDB connection failed, see debug.log for details');
    //         logger.debug('--- \tMongoDB connection string: ' + u);
    //         return cb(err);
    //     } else {
    //         logger.info('--- \tConnected to MongoDB');
    //     }
    //
    //     const db = client.db(process.env.mongoDb);
    //
    //     return cb(err, db);
    // });
};

export default DBCore.startupDB;
