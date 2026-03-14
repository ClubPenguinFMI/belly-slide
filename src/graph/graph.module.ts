import { Module } from '@nestjs/common';
import { GraphController } from './graph.controller';
import { GraphService } from './graph.service';
import { neo4jDatabaseProvider, neo4jProvider } from './neo4j.provider';

@Module({
  controllers: [GraphController],
  providers: [GraphService, neo4jProvider, neo4jDatabaseProvider],
})
export class GraphModule {}
