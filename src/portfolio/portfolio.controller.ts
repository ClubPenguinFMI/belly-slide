import { Controller, Get } from '@nestjs/common';
import { PortfolioService } from './portfolio.service';

@Controller('portfolio')
export class PortfolioController {
  constructor(private readonly portfolioService: PortfolioService) {}

  @Get('real')
  public getRealPortfolio() {
    return this.portfolioService.getRealPortfolio();
  }
}
