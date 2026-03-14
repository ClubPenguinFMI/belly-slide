import { Injectable } from '@nestjs/common';
import { Portfolio } from 'src/portfolio/dto/portfolio.dto';

import amzn from './data/AMZN.json';
import googl from './data/GOOGL.json';
import nvda from './data/NVDA.json';

const convertTickerData = (tickerJson: typeof amzn) => {
  return Object.entries(tickerJson['Time Series (Daily)']).map(([, v]) =>
    Number(v['4. close']),
  );
};

const tickerMap = {
  AMZN: convertTickerData(amzn),
  GOOGL: convertTickerData(googl),
  NVDA: convertTickerData(nvda),
} as const;

@Injectable()
export class StockService {
  public corelations(
    portfolio: Portfolio[],
    trackedTickers: string[],
  ): Map<string, number> {
    const account_data: number[] = [];
    for (let i = 0; i < portfolio.length; i++) {
      const { ticker, quantity } = portfolio[i];
      const data = this.getStockData(ticker);
      for (let j = 0; j < data.length; j++) {
        account_data[j] = (account_data[j] || 0) + data[j] * quantity;
      }
    }

    const n = account_data.length;
    const mean_acc = account_data.reduce((a, b) => a + b, 0) / n;

    return trackedTickers.reduce(
      (acc, ticker) => {
        const stock_data = this.getStockData(ticker);
        const mean_stock =
          stock_data.reduce((a, b) => a + b, 0) / stock_data.length;
        let num = 0; // Numerator: sum of (x - mx)(y - my)
        let den_x = 0; // Sum of (x - mx)^2
        let den_y = 0; // Sum of (y - my)^2

        for (let i = 0; i < n; i++) {
          const xDiff = account_data[i] - mean_acc;
          const yDiff = (stock_data[i] || 0) - mean_stock;

          num += xDiff * yDiff;
          den_x += xDiff ** 2;
          den_y += yDiff ** 2;
        }

        const r = num / (Math.sqrt(den_x) * Math.sqrt(den_y));
        acc[ticker] = isNaN(r) ? 0 : r;

        return acc;
      },
      {} as Map<string, number>,
    );
  }

  public getStockData(ticker: string): number[] {
    return tickerMap[ticker as keyof typeof tickerMap];
  }
}
