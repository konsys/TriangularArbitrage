import fs from 'fs';
const logDir: string = 'log';
// Create the log directory if it does not exist
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}
type IntfoT = {
    timestamp:string;
    label:string;
    level:number;
    message:string
}
// prepare logging
import { createLogger, format, transports } from 'winston';
const { combine, timestamp, label, printf } = format;

const tsFormat: () => string = () => (new Date()).toLocaleTimeString();
const myFormat: (info: IntfoT) => string = printf(info => {
    return `${info.timestamp} [${info.label}] ${info.level}: ${info.message}`;
});

const logger = createLogger({
    format: combine(
        label({ label: '' }),
        timestamp(),
        myFormat
    ),
    transports: [
        // colorize the output to the console
        new transports.File({
            timestamp: tsFormat,
            filename: `${logDir}/error.log`,
            level: 'error'
        }),
        new transports.File({
            timestamp: tsFormat,
            filename: `${logDir}/combined.log`,
            level: 'info'
        }),
        new transports.File({
            filename: `${logDir}/debug.log`,
            timestamp: tsFormat,
            level: 'debug'
        })
    ]
});

export default logger;
