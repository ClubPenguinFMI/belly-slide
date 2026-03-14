import { Module } from '@nestjs/common';
import { GraphController } from './graph.controller';
import { GraphService } from './graph.service';
import { neo4jDatabaseProvider, neo4jProvider } from './neo4j.provider';
import { StockModule } from '../stock/stock.module';

@Module({
  controllers: [GraphController],
  providers: [GraphService, neo4jProvider, neo4jDatabaseProvider],
  imports: [StockModule],
})
export class GraphModule {}
