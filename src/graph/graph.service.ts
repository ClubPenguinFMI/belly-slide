import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { Driver, QueryResult } from 'neo4j-driver';
import {
  CreateCompanyRelationRequest,
  CreateEdgeDto,
  GraphEdge,
  GraphFilterItem,
  GraphNode,
  GraphResponse,
  PostCompanyRequest,
} from './dto/graph.dto';
import { NEO4J_DATABASE_NAME, NEO4J_DRIVER } from './neo4j.provider';
import { CompanySector, GraphRelationshipType } from './dto/graph.enums';

@Injectable()
export class GraphService {
  constructor(
    @Inject(NEO4J_DRIVER) private readonly driver: Driver,
    @Inject(NEO4J_DATABASE_NAME) private readonly database: string,
  ) {}

  private async makeRequest(
    query: string,
    parameters: Record<string, unknown> = {},
  ): Promise<QueryResult> {
    const session = this.driver.session({ database: this.database });
    try {
      return await session.run(query, parameters);
    } finally {
      await session.close();
    }
  }

  private clearRelationshipType(value: string): string {
    const cleaned = value
      .split('')
      .filter((ch) => /[0-9a-z_]/i.test(ch))
      .join('')
      .toUpperCase();

    if (!cleaned) {
      throw new HttpException(
        'Invalid relationship type',
        HttpStatus.BAD_REQUEST,
      );
    }

    return cleaned;
  }

  async getGraph(filters: GraphFilterItem[]): Promise<GraphResponse> {
    let query = `
      MATCH (seed:Company)
      WHERE seed.ticker IN $entity_ids
      MATCH (seed)-[*0..]-(n:Company)
      WITH collect(DISTINCT n) AS nodes
      UNWIND nodes AS n
      OPTIONAL MATCH (n)-[r]->(m:Company)
      WHERE m IN nodes
      RETURN
        elementId(n) AS source_id,
        properties(n) AS source_props,
        elementId(m) AS target_id,
        properties(m) AS target_props,
        elementId(r) AS relation_id,
        type(r) AS relation_type,
        properties(r) AS relation_props
    `;

    const entity_ids = filters.map((f) => f.entity_id);
    let result = await this.makeRequest(query, { entity_ids: entity_ids });

    console.log(result.records);

    const nodesMap = new Map<string, GraphNode>();
    const edgesMap = new Map<string, GraphEdge>();

    for (const record of result.records) {
      const sourceId = record.get('source_id') as string;
      const sourceProps =
        (record.get('source_props') as Record<string, unknown>) ?? {};

      if (!nodesMap.has(sourceId)) {
        nodesMap.set(sourceId, {
          id: sourceId,
          name: String(sourceProps['name']),
          properties: sourceProps,
        });
      }

      const targetId = record.get('target_id') as string | null;
      const targetProps = record.get('target_props') as Record<
        string,
        unknown
      > | null;

      if (targetId && !nodesMap.has(targetId)) {
        nodesMap.set(targetId, {
          id: targetId,
          name: String(targetProps?.['name']),
          properties: targetProps ?? {},
        });
      }

      const relationId = record.get('relation_id') as string | null;

      if (relationId && targetId) {
        edgesMap.set(relationId, {
          id: relationId,
          source: sourceId,
          target: targetId,
          type: record.get('relation_type'),
          properties:
            (record.get('relation_props') as Record<string, unknown>) ?? {},
        });
      }
    }

    query = `
      MATCH (startNode:Company)
      WHERE startNode.ticker IN $entity_ids
      MATCH (startNode)-[*1..3]-(connectedNode)
      WHERE startNode <> connectedNode
      RETURN connectedNode.ticker AS common_node_ticker, 
             count(DISTINCT startNode) AS neighbor_count
      ORDER BY neighbor_count DESC
      LIMIT 5
    `;
    result = await this.makeRequest(query, { entity_ids: entity_ids });

    const connectedNodes = result.records.map(
      (record) => record.get('common_node_ticker') as string,
    );

    return {
      nodes: Array.from(nodesMap.values()),
      edges: Array.from(edgesMap.values()),
      company_to_percents: {},
    };
  }

  async createCompany(payload: PostCompanyRequest) {
    const query = `
    // 1. Create or match the main company node
    MERGE (main:Company {ticker: $company_ticker})
    // 2. Set/update the sector for the main company
    SET main.sector = $company_sector
    SET main.name = $company_name
    
    // 3. Process the "sells_to" array
    FOREACH (ticker IN $sells_to |
        // Match or create the target company
        MERGE (target:Company {ticker: $ticker})
        // ONLY if it was just created, set the sector to Unknown
        ON CREATE SET target.sector = $default_sector
        // Match or create the relationship
        MERGE (main)-[:${GraphRelationshipType.SELLS_TO}]->(target)
    )
    
    // 4. Process the "buys_from" array
    FOREACH (ticker IN $buys_from |
        // Match or create the supplier company
        MERGE (supplier:Company {ticker: $ticker})
        // ONLY if it was just created, set the sector to Unknown
        ON CREATE SET supplier.sector = $default_sector
        // Match or create the relationship
        MERGE (main)-[:${GraphRelationshipType.BUYS_FROM}]->(supplier)
    )
    `;

    await this.makeRequest(query, {
      company_ticker: payload.ticker,
      company_name: payload.name,
      company_sector: payload.sector,
      sells_to: payload.sells_to,
      buys_from: payload.buys_from,
      default_sector: CompanySector.UNKNOWN,
    });

    return {
      id: payload.ticker,
      name: payload.name,
      sector: payload.sector,
    };
  }
}
