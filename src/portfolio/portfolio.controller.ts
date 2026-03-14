import { Controller, Get } from '@nestjs/common';
import { PortfolioService } from './portfolio.service';
import precomputedData from './data/precomputed.json';

@Controller('portfolio')
export class PortfolioController {
  constructor(private readonly portfolioService: PortfolioService) {}

  @Get('real')
  public getRealPortfolio() {
    return this.portfolioService.getRealPortfolio();
  }

  @Get('precomputed')
  public getPrecomputedPortfolio() {
    return precomputedData as unknown as {
      ticker: string;
      valueInvested: number;
      percentage: number;
    }[];
  }
}
