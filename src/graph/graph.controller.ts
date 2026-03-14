import { Body, Controller, Post } from '@nestjs/common';
import {
  CompanyResponse,
  GraphFilterItem,
  GraphResponse,
  PostCompanyRequest,
} from './dto/graph.dto';
import { GraphService } from './graph.service';
import { Portfolio } from '../portfolio/dto/portfolio.dto';

@Controller()
export class GraphController {
  constructor(private readonly graphService: GraphService) {}

  @Post('/graph')
  getGraph(@Body() filters: Portfolio[]): Promise<GraphResponse> {
    return this.graphService.getGraph(filters);
  }

  @Post('/company')
  getCompany(@Body() payload: PostCompanyRequest): Promise<CompanyResponse> {
    return this.graphService.createCompany(payload);
  }
}
