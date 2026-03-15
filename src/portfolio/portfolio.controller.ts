import { Controller, Get, Query } from '@nestjs/common';
import { PortfolioService } from './portfolio.service';
import precomputedData from './data/precomputed.json';

@Controller('portfolio')
export class PortfolioController {
  constructor(private readonly portfolioService: PortfolioService) {}

  @Get('real')
  public getRealPortfolio(
    @Query('token') token: string,
    @Query('secret') secret: string,
    @Query('server') server: string,
  ) {
    return this.portfolioService.getRealPortfolio(token, secret, server);
  }

  @Get('precomputed')
  public getPrecomputedPortfolio() {
    return precomputedData as unknown as {
      ticker: string;
      name: string;
      valueInvested: number;
      percentage: number;
    }[];
  }
}
