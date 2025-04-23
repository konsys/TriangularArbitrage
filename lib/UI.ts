import CLI from 'clui';
import clc from 'cli-color';

const Line: typeof CLI.Line = CLI.Line;
const LineBuffer: typeof CLI.LineBuffer = CLI.LineBuffer;

interface UIOptions {
    UI: {
        title: string;
    };
}

interface Ticker {
    a?: { key: string; stepFrom?: string };
    b?: { stepFrom?: string };
    c?: { stepFrom?: string };
    rate?: number;
}

interface Tickers {
    [key: string]: Ticker;
}

const UI: any = {};

UI.init = (options: UIOptions) => {
    UI.options = options;

    UI.outputBuffer = new LineBuffer({
        x: 0,
        y: 0,
        width: 'console',
        height: 'console'
    });

    UI.message = new Line(UI.outputBuffer)
        .column(UI.options.UI.title, UI.options.UI.title.length, [clc.green])
        .fill()
        .store();
  
    UI.blankLine = new Line(UI.outputBuffer)
        .fill()
        .store();

    UI.cols = [10, 10, 20];

    UI.header = new Line(UI.outputBuffer)
        .column('Step A', UI.cols[0], [clc.cyan])
        .column('Step B', UI.cols[0], [clc.cyan])
        .column('Step C', UI.cols[0], [clc.cyan])

        .column('Rate', UI.cols[1], [clc.cyan])

        .column('Fees BnB', UI.cols[1], [clc.cyan])
        .column('(Rate - BnB Fee)', 20, [clc.green])

        .column('Fees Normal', 17, [clc.cyan])
        .column('(Rate - Fee)', 20, [clc.green])

        .fill()
        .store();

    UI.line;

    const maxRowsStr: string | undefined = process.env.maxRows;

    if (maxRowsStr) {
        // Ensure that maxRows is a number
        const maxRowsNum: number = parseInt(maxRowsStr);
        if (!isNaN(maxRowsNum)) {
            UI.maxRows = maxRowsNum;
        }
    }

    UI.outputBuffer.output();

    return UI;
};

UI.updateArbitageOpportunities = (tickers: Ticker[]) => {
    if (!UI.outputBuffer || !tickers) {
        return;
    }

    UI.outputBuffer.lines.splice(3, UI.outputBuffer.lines.length - 3);

    for (let i = 0; i < UI.maxRows; i++) {
        const ticker: Ticker | undefined = tickers[i];
        if (!ticker) return;

        if (ticker.a) {

            let color: typeof clc.green | typeof clc.red = clc.green;

            if (ticker.rate && ticker.rate < 1) color = clc.red;

            const rate: number = ((ticker.rate - 1) * 100);
            const fees1: number = rate * 0.05;
            const fRate1: number = rate - fees1;

            const fees2: number = rate * 0.1;
            const fRate2: number = rate - fees2;

            UI.line = new Line(UI.outputBuffer)
                .column(ticker.a.key.toString(), UI.cols[0], [clc.cyan])
                .column(ticker.b?.stepFrom?.toString() || '', UI.cols[0], [clc.cyan])
                .column(ticker.c?.stepFrom?.toString() || '', UI.cols[0], [clc.cyan])

                .column(rate.toFixed(3).toString() + '%', UI.cols[1], [clc.cyan])
                .column(fees1.toFixed(3).toString() + '%', UI.cols[1], [clc.cyan])
                .column(fRate1.toFixed(3).toString() + '%', 20, [color])

                .column(fees2.toFixed(3).toString() + '%', 17, [clc.cyan])
                .column(fRate2.toFixed(3).toString() + '%', 20, [color])

                .fill()
                .store();
        } else {
            UI.line = new Line(UI.outputBuffer)
                .fill()
                .store();
        }
    }

    UI.outputBuffer.output();
};

UI.updateTickers = (tickers: Tickers) => {
    if (!UI.outputBuffer || !tickers) {
        return;
    }

    const keys: string[] = Object.keys(tickers).sort();
    if (UI.outputBuffer.lines.length >= keys.length) {
        // Adjust the splice count based on the current length of lines.
        // This assumes you want to keep at least three lines above the updated lines.
        const spliceCount: number = Math.max(keys.length - 3, 0);
        console.log(spliceCount);
        console.log(keys.length);
        console.log(UI.outputBuffer.lines.length);
        console.log("splicing");

        // Splicing old lines
        // It will remove old entries and allow space for new ones
        // If there are more than needed it will clear up the excess.

        // Remove entries starting from index `3` to maximum of `spliceCount`
        // Only do this when we have sufficient elements in output buffer

    }

    for (let i = 0; i < keys.length; i++) {
        const ticker: Ticker | undefined = tickers[keys[i]];

        if (!ticker) return;

        // Create line entry for each ticker
        let lineEntry = new Line(UI.outputBuffer)
        //. Add columns with respective data points

        lineEntry.column(ticker.E.toString(), UI.cols[0]);
        lineEntry.column(ticker.s.toString(), UI.cols[1]);

        lineEntry.column(ticker.b.toString(), UI.cols[2]);
        lineEntry.column(ticker.B.toString(), UI.cols[3]);

        lineEntry.column(ticker.a.toString(), UI.cols[2]);
        lineEntry.column(ticker.A.toString(), UI.cols[3]);

        lineEntry.column(ticker.n.toString(), UI.cols[1]);

        //. Fill and store created entry into output buffer
        lineEntry.fill().store();

    }
}

// Function to update user interface display based on conditions or flags passed as parameters
// Trim old entries based on boolean flag received as parameter
//
/////
/////

//
////
////
////
////
/////

//

// Function to add trade details into user interface display
//
/////

// Exports initialized User Interface module
export default UI.init;
