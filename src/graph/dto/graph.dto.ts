import { CompanySector } from './graph.enums';

export class CreateCompanyRelationRequest {
  source_company_name!: string;
  target_company_name!: string;
  relation_type!: string;
}

export class CompanyResponse {
  id!: string;
  name!: string;
  sector!: CompanySector;
}

export class GraphNode {
  id?: string;
  name!: string;
  sector?: CompanySector;
  ticker!: string;
  properties!: Record<string, unknown>;
}

export class GraphEdge {
  id!: string;
  source!: string;
  target!: string;
  type!: string;
  properties!: Record<string, unknown>;
}

export class GraphResponse {
  nodes!: GraphNode[];
  edges!: GraphEdge[];
  correlations!: Map<string, number>;
  portfolioCorrelations!: Map<string, number>;
  portfolioDiversificationIndex!: number;
}

export class CreateEdgeDto {
  source!: string;
  target!: string;
}

export class PostCompanyRequest {
  ticker!: string;
  name!: string;
  sector!: CompanySector;
  buys_from!: string[];
  sells_to!: string[];
}

export class GraphFilterItem {
  entity_id!: string;
  percent!: number;
}
