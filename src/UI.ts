import {Line, LineBuffer} from 'clui';
import {cyan, green, red} from 'cli-color';

export class UI {
    options: any
    outputBuffer: any
    message: any
    cols: number[]
    blankLine: any
    header: any
    maxRows: number = 4
    line: any

    constructor(options) {
        this.options = options;

        this.outputBuffer = new LineBuffer({
            x: 0,
            y: 0,
            width: 'console',
            height: 'console'
        });

        this.message = new Line(this.outputBuffer)
            .column(this.options.UI.title, this.options.UI.title.length, [green])
            .fill()
            .store();

        this.blankLine = new Line(this.outputBuffer)
            .fill()
            .store();

        this.cols = [10, 10, 20];


        this.header = new Line(this.outputBuffer)
            .column('Step A', this.cols[0], [cyan])
            .column('Step B', this.cols[0], [cyan])
            .column('Step C', this.cols[0], [cyan])

            .column('Rate', this.cols[1], [cyan])

            .column('Fees BnB', this.cols[1], [cyan])
            .column('(Rate - BnB Fee)', 20, [green])

            .column('Fees Normal', 17, [cyan])
            .column('(Rate - Fee)', 20, [green])

            .fill()
            .store();

        this.line;
        this.outputBuffer.output();

    };

    updateUI(trimOld) {
        if (trimOld && this.outputBuffer.lines.length > this.maxRows) this.outputBuffer.lines.splice(3, 1);
        this.outputBuffer.output();
    };

    updateArbitrageOpportunities = (tickers) => {


        if (!this.outputBuffer || !tickers) {
            return;
        }

        this.outputBuffer.lines.splice(3, this.outputBuffer.lines.length - 3);


        for (let i = 0; i < this.maxRows; i++) {
            let ticker = tickers[i];
            if (!ticker) return;
            if (ticker.a) {

                let color = green;
                if (ticker.rate && ticker.rate < 1) color = red;

                let rate = ((ticker.rate - 1) * 100);
                let fees1 = rate * 0.05; //bnb
                let fRate1 = rate - fees1;

                let fees2 = rate * 0.1; //other
                let fRate2 = rate - fees2;

                this.line = new Line(this.outputBuffer)
                    .column(ticker.a.key.toString(), this.cols[0], [cyan])
                    .column(ticker.b.stepFrom.toString(), this.cols[0], [cyan])
                    .column(ticker.c.stepFrom.toString(), this.cols[0], [cyan])

                    .column(rate.toFixed(3).toString() + '%', this.cols[1], [cyan])
                    .column(fees1.toFixed(3).toString() + '%', this.cols[1], [cyan])
                    .column(fRate1.toFixed(3).toString() + '%', 20, [color])

                    .column(fees2.toFixed(3).toString() + '%', 17, [cyan])
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
    };

    updateTickers(tickers) {
        if (!this.outputBuffer || !tickers) {
            return;
        }


        let keys = Object.keys(tickers).sort();
        if (this.outputBuffer.lines.length >= keys.length) {
            this.outputBuffer.lines.splice(3, keys.length);
        }


        for (let i = 0; i < keys.length; i++) {
            let ticker = tickers[keys[i]];
            if (!ticker) return;


            //*
            this.line = new Line(this.outputBuffer)
                .column(ticker.E.toString(), this.cols[0])
                .column(ticker.s.toString(), this.cols[1])
                // bid
                .column(ticker.b.toString(), this.cols[2])
                .column(ticker.B.toString(), this.cols[3])

                // ask
                .column(ticker.a.toString(), this.cols[2])
                .column(ticker.A.toString(), this.cols[3])

                .column(ticker.n.toString(), this.cols[1])
                .fill()
                .store();//*/

        }
        this.outputBuffer.output();
    };


    addTrade(time, symbol, tradeId, price, quantity) {
        this.line = new Line(this.outputBuffer)
            .column(time.toString(), this.cols[0])
            .column(symbol.toString(), this.cols[1])
            .column(price.toString(), this.cols[2])
            .column(quantity.toString(), this.cols[3])
            .fill()
            .store();

        this.updateUI(true);
    };

}
