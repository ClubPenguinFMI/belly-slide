import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Position, TickerData } from './dto/trading-response.dto';
import { typedFetch } from 'src/utils/typedFetch';
import { Portfolio } from './dto/portfolio.dto';

@Injectable()
export class PortfolioService {
  private static buildAuth(token: string, secret: string) {
    return btoa(`${token}:${secret}`);
  }

  private async getTickerData(
    auth: string,
    server: string,
  ): Promise<Map<string, string>> {
    const tickerData = await typedFetch<[TickerData]>(
      `https://${server}.trading212.com/api/v0/equity/metadata/instruments`,
      {
        method: 'GET',
        headers: {
          Authorization: `Basic ${auth}`,
        },
      },
    );

    return new Map(tickerData.map((data) => [data.ticker, data.shortName]));
  }

  public async getRealPortfolio(
    token: string,
    secret: string,
    server: string,
  ): Promise<Portfolio[]> {
    try {
      const auth = PortfolioService.buildAuth(token, secret);
      const tradingData = await typedFetch<[Position]>(
        `https://${server}.trading212.com/api/v0/equity/positions`,
        {
          method: 'GET',
          headers: {
            Authorization: `Basic ${auth}`,
          },
        },
      );

      const totalInvestment = tradingData.reduce(
        (prev: number, curr: Position) =>
          prev + curr.quantity * curr.currentPrice,
        0,
      );

      const tickerMap = await this.getTickerData(auth, server);

      return tradingData.map((pos: Position) => ({
        ticker: tickerMap.get(pos.instrument.ticker) || pos.instrument.ticker,
        valueInvested: pos.quantity * pos.currentPrice,
        percentage:
          totalInvestment > 0
            ? (pos.quantity * pos.currentPrice * 100) / totalInvestment
            : 0,
        quantity: pos.quantity,
      }));
    } catch (err) {
      throw new UnauthorizedException(
        (err as unknown as { message: string }).message,
      );
    }
  }
}
