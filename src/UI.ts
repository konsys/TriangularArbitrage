import {Line, LineBuffer} from 'clui';
import {cyan, green, red} from 'cli-color';
import {CandidateT} from "./types";

export class UI {
    options: any
    outputBuffer: any
    cols: number[]
    maxRows: number = 5

    constructor(options) {
        this.options = options;

        console.log(options)
        console.log()

        this.outputBuffer = new LineBuffer({
            x: 0,
            y: 0,
            width: 'console',
            height: 'console'
        });

        new Line(this.outputBuffer)
            .column(this.options.UI.title, this.options.UI.title.length, [green])
            .fill()
            .store();

        new Line(this.outputBuffer)
            .fill()
            .store();

        this.cols = [10, 10, 20];


        new Line(this.outputBuffer)
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

        this.outputBuffer.output();

    };

    updateArbitrageOpportunities = (tickers?: CandidateT) => {


        if (!this.outputBuffer || !tickers) {
            return;
        }

        this.outputBuffer.lines.splice(3, this.outputBuffer.lines.length - 3);

        for (let i = 0; i < this.maxRows; i++) {
            const ticker = tickers[i];
            if (!ticker) {
                return;
            }

            if (ticker.a) {

                let color = green;
                if (ticker.rate && ticker.rate < 1) {
                    color = red
                }


                const rate = ((ticker.rate - 1) * 100);
                const fees1 = rate * 0.05; //bnb
                const fRate1 = rate - fees1;

                const fees2 = rate * 0.1; //other
                const fRate2 = rate - fees2;

                new Line(this.outputBuffer)
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
                new Line(this.outputBuffer)
                    .fill()
                    .store();
            }
        }

        this.outputBuffer.output();
    };


}
