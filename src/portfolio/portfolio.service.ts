import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Position, TickerData } from './dto/trading-response.dto';
import { typedFetch } from 'src/utils/typedFetch';

@Injectable()
export class PortfolioService {
  private readonly TRADING_AUTH: string;
  private readonly TRADING_DEMO_AUTH: string;

  private static buildToken(token: string, secret: string) {
    return btoa(`${token}:${secret}`);
  }

  constructor(private readonly configService: ConfigService) {
    this.TRADING_AUTH = PortfolioService.buildToken(
      this.configService.get<string>('TRADING_TOKEN')!,
      this.configService.get<string>('TRADING_SECRET')!,
    );
    this.TRADING_DEMO_AUTH = PortfolioService.buildToken(
      this.configService.get<string>('TRADING_DEMO_TOKEN')!,
      this.configService.get<string>('TRADING_DEMO_SECRET')!,
    );
  }

  private async getTickerData(): Promise<Map<string, string>> {
    const tickerData = await typedFetch<[TickerData]>(
      'https://demo.trading212.com/api/v0/equity/metadata/instruments',
      {
        method: 'GET',
        headers: {
          Authorization: `Basic ${this.TRADING_DEMO_AUTH}`,
        },
      },
    );

    return new Map(tickerData.map((data) => [data.ticker, data.shortName]));
  }

  public async getRealPortfolio() {
    const tradingData = await typedFetch<[Position]>(
      'https://demo.trading212.com/api/v0/equity/positions',
      {
        method: 'GET',
        headers: {
          Authorization: `Basic ${this.TRADING_DEMO_AUTH}`,
        },
      },
    );

    const totalInvestment = tradingData.reduce(
      (prev: number, curr: Position) =>
        prev + curr.quantity * curr.currentPrice,
      0,
    );

    const tickerMap = await this.getTickerData();

    return tradingData.map((pos: Position) => ({
      ticker: tickerMap.get(pos.instrument.ticker) || pos.instrument.ticker,
      valueInvested: pos.quantity * pos.currentPrice,
      percentage:
        totalInvestment > 0
          ? (pos.quantity * pos.currentPrice * 100) / totalInvestment
          : 0,
    }));
  }
}
