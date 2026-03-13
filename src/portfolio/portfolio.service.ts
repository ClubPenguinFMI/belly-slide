import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Position } from './dto/trading-response.dto';
import { typedFetch } from 'src/utils/typedFetch';

@Injectable()
export class PortfolioService {
  private readonly TRADING_AUTH: string;
  private readonly TRADING_DEMO_AUTH: string;

  private buildToken(token: string, secret: string) {
    return btoa(`${token}:${secret}`);
  }

  constructor(private readonly configService: ConfigService) {
    this.TRADING_AUTH = this.buildToken(
      this.configService.get<string>('TRADING_TOKEN')!,
      this.configService.get<string>('TRADING_SECRET')!,
    );
    this.TRADING_DEMO_AUTH = this.buildToken(
      this.configService.get<string>('TRADING_DEMO_TOKEN')!,
      this.configService.get<string>('TRADING_DEMO_SECRET')!,
    );
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

    return tradingData.map((pos: Position) => ({
      ticker: pos.instrument.ticker,
      valueInvested: pos.quantity * pos.currentPrice,
    }));
  }
}
