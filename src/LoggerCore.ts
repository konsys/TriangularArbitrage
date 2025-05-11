// Dependencies:
// npm install winston
// npm install --save-dev @types/node

import * as fs from 'fs';
import * as path from 'path'; // Import path for robust directory joining
import {createLogger, format, Logger, transports} from 'winston';
import {TransformableInfo} from 'logform'; // Import type for info object

const logDir: string = 'log';
// Create the log directory if it does not exist
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}

// prepare logging
const {combine, timestamp, label, printf} = format;

const myFormat = printf((info: TransformableInfo): string => {
    // Note: Accessing info properties directly as they are expected from the format pipeline.
    // Winston's format pipeline (combine, timestamp, label) ensures these properties exist.
    return `${info.timestamp} [${info.label}] ${info.level}: ${info.message}`;
});

export const logger: Logger = createLogger({
    format: combine(
        label({label: ''}),
        timestamp(), // This adds the timestamp property used by myFormat
        myFormat
    ),
    transports: [
        // colorize the output to the console
        new transports.File({
            // Note: The 'timestamp' option directly on transports is deprecated in Winston v3+
            // in favor of format.timestamp(). Preserving original code structure.
            // timestamp: tsFormat, // This function provides a timestamp string format.
            filename: path.join(logDir, 'error.log'), // Use path.join for cross-platform compatibility
            level: 'error'
        }),
        new transports.File({
            // Note: The 'timestamp' option directly on transports is deprecated in Winston v3+
            // timestamp: tsFormat, // This function provides a timestamp string format.
            filename: path.join(logDir, 'combined.log'), // Use path.join
            level: 'info'
        }),
        new transports.File({
            filename: path.join(logDir, 'debug.log'), // Use path.join
            // Note: The 'timestamp' option directly on transports is deprecated in Winston v3+
            // timestamp: tsFormat, // This function provides a timestamp string format.
            level: 'debug'
        })
    ]
});

