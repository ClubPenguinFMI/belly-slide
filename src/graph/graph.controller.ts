import { Body, Controller, Post } from '@nestjs/common';
import {
  CompanyResponse,
  GraphEdge,
  GraphNode,
  GraphResponse,
  PostCompanyRequest,
} from './dto/graph.dto';
import { GraphService } from './graph.service';
import { Portfolio } from '../portfolio/dto/portfolio.dto';

@Controller('graph')
export class GraphController {
  constructor(private readonly graphService: GraphService) {}

  @Post('/node')
  createNode(@Body() node: GraphNode): Promise<any> {
    return this.graphService.createNode(node);
  }

  @Post('/edge')
  createEdge(@Body() edge: GraphEdge): Promise<any> {
    return this.graphService.createEdge(edge);
  }

  @Post('/')
  getGraph(@Body() filters: Portfolio[]): Promise<GraphResponse> {
    return this.graphService.getGraph(filters);
  }

  @Post('/company')
  createCompany(@Body() payload: PostCompanyRequest): Promise<CompanyResponse> {
    return this.graphService.createCompany(payload);
  }
}
