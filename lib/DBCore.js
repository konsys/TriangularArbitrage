const DBCore = {};

DBCore.startupDB = (logger, cb)=>{
  return cb && cb(false, false);

  // logger.info('--- Preparing MongoDB Storage');
  // const authStr = '', authMechanism;

  // if (process.env.mongoUser){
  //   authStr = encodeURIComponent(process.env.mongoUser);

  //   if (process.env.mongoPass) authStr += ':' + encodeURIComponent(process.env.mongoPass);
  //   authStr += '@';

  //   // authMechanism could be a conf.ini parameter to support more mongodb authentication methods
  //   authMechanism = 'DEFAULT';
  // }

  // const u = 'mongodb://' + authStr + process.env.mongoHost + ':' + process.env.mongoPort + '/' + process.env.mongoDb + '?' + (authMechanism ? '&authMechanism=' + authMechanism : '' );

  // require('mongodb').MongoClient.connect(u, (err, client) => {
  //   if (err) {
  //     console.error('WARNING: MongoDB Connection Error: ', err);
  //     console.error('WARNING: without MongoDB some features (such as history logging & indicators) may be disabled.');
  //     console.error('Attempted authentication string: ' + u);
  //     logger.error('--- \tMongoDB connection failed, see debug.log for details');
  //     logger.debug('--- \tMongoDB connection string: ' + u);
  //     return cb(err);
  //   } else {
  //     logger.info('--- \tConnected to MongoDB');
  //   }

  //   const db = client.db(process.env.mongoDb);

  //   return cb(err, db);
  // });

};

module.exports = DBCore.startupDB;