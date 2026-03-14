import { Module } from '@nestjs/common';
import { PortfolioModule } from './portfolio/portfolio.module';
import { ConfigModule } from '@nestjs/config';
import { GraphModule } from './graph/graph.module';

@Module({
  imports: [ConfigModule.forRoot(), PortfolioModule, GraphModule],
})
export class AppModule {}
