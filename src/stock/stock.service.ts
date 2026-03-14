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
    return new Map();
  }
}
