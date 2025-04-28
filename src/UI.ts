import CLI, {LineBuffer} from 'clui';
import clc from 'cli-color';
import {BotOptions, Ticker} from "./types";

const Line: typeof CLI.Line = CLI.Line;


interface Tickers {
    [key: string]: Ticker;
}

export class UI {
    options: BotOptions
    outputBuffer: any
    message: any
    blankLine: any
    cols: number[] = []
    line: any;
    maxRows: number = 0

    constructor(options: BotOptions) {
        console.log(1111, options)
        this.options = options;

        this.outputBuffer = new LineBuffer({
            x: 0,
            y: 0,
            width: 'console',
            height: 'console'
        });

        this.message = new Line(this.outputBuffer)
            .column(this.options.UI.title, this.options.UI.title.length, [clc.green])
            .fill()
            .store();

        this.blankLine = new Line(this.outputBuffer)
            .fill()
            .store();

        this.blankLine.cols = [10, 10, 20];

        this.blankLine.header = new Line(this.outputBuffer)
            .column('Step A', this.cols[0], [clc.cyan])
            .column('Step B', this.cols[0], [clc.cyan])
            .column('Step C', this.cols[0], [clc.cyan])

            .column('Rate', this.cols[1], [clc.cyan])

            .column('Fees BnB', this.cols[1], [clc.cyan])
            .column('(Rate - BnB Fee)', 20, [clc.green])

            .column('Fees Normal', 17, [clc.cyan])
            .column('(Rate - Fee)', 20, [clc.green])

            .fill()
            .store();

        this.line;

        const maxRowsStr: string | undefined = process.env.maxRows;

        if (maxRowsStr) {
            // Ensure that maxRows is a number
            const maxRowsNum: number = parseInt(maxRowsStr);
            if (!isNaN(maxRowsNum)) {
                this.maxRows = maxRowsNum;
            }
        }

        this.outputBuffer.output();

    }

    updateArbitageOpportunities(tickers: Ticker[]) {
        if (!this.outputBuffer || !tickers) {
            return;
        }

        this.outputBuffer.lines.splice(3, this.outputBuffer.lines.length - 3);

        for (let i = 0; i < this.maxRows; i++) {
            const ticker: Ticker | undefined = tickers[i];
            if (!ticker) {
                return
            }


            if (ticker.a) {

                let color: typeof clc.green | typeof clc.red = clc.green;

                if (ticker.rate && ticker.rate < 1) color = clc.red;

                const rate: number = ((ticker.rate - 1) * 100);
                const fees1: number = rate * 0.05;
                const fRate1: number = rate - fees1;

                const fees2: number = rate * 0.1;
                const fRate2: number = rate - fees2;

                this.line = new Line(this.outputBuffer)
                    .column(ticker.a.key.toString(), this.cols[0], [clc.cyan])
                    .column(ticker.b?.stepFrom?.toString() || '', this.cols[0], [clc.cyan])
                    .column(ticker.c?.stepFrom?.toString() || '', this.cols[0], [clc.cyan])

                    .column(rate.toFixed(3).toString() + '%', this.cols[1], [clc.cyan])
                    .column(fees1.toFixed(3).toString() + '%', this.cols[1], [clc.cyan])
                    .column(fRate1.toFixed(3).toString() + '%', 20, [color])

                    .column(fees2.toFixed(3).toString() + '%', 17, [clc.cyan])
                    .column(fRate2.toFixed(3).toString() + '%', 20, [color])

                    .fill()
                    .store();
            } else {
                this.line = new Line(this.outputBuffer)
                    .fill()
                    .store();
            }
        }

        this.outputBuffer.output();
    }

    updateTickers(tickers: Tickers) {
        if (!this.outputBuffer || !tickers) {
            return;
        }

        const keys: string[] = Object.keys(tickers).sort();
        if (this.outputBuffer.lines.length >= keys.length) {
            // Adjust the splice count based on the current length of lines.
            // This assumes you want to keep at least three lines above the updated lines.
            const spliceCount: number = Math.max(keys.length - 3, 0);
            console.log(spliceCount);
            console.log(keys.length);
            console.log(this.outputBuffer.lines.length);
            console.log("splicing");

            // Splicing old lines
            // It will remove old entries and allow space for new ones
            // If there are more than needed it will clear up the excess.

            // Remove entries starting from index `3` to maximum of `spliceCount`
            // Only do this when we have sufficient elements in output buffer

        }

        for (let i = 0; i < keys.length; i++) {
            const ticker: Ticker | undefined = tickers[keys[i]];

            if (!ticker) {
                return
            }


            // Create line entry for each ticker
            let lineEntry = new Line(this.outputBuffer)
            //. Add columns with respective data points

            lineEntry.column(ticker.E.toString(), this.cols[0]);
            lineEntry.column(ticker.s.toString(), this.cols[1]);

            lineEntry.column(ticker.b.toString(), this.cols[2]);
            lineEntry.column(ticker.B.toString(), this.cols[3]);

            lineEntry.column(ticker.a.toString(), this.cols[2]);
            lineEntry.column(ticker.A.toString(), this.cols[3]);

            lineEntry.column(ticker.n.toString(), this.cols[1]);

            //. Fill and store created entry into output buffer
            lineEntry.fill().store();

        }
    }
}



