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

  async createCompanyRelation(
    payload: CreateCompanyRelationRequest,
  ): Promise<Record<string, unknown>> {
    const relType = this.clearRelationshipType(payload.relation_type);

    const query = `
      MERGE (c1:Company {name: $source_company_name})
      ON CREATE SET c1.created_at = timestamp()
      MERGE (c2:Company {name: $target_company_name})
      ON CREATE SET c2.created_at = timestamp()
      MERGE (c1)-[r:${relType}]->(c2)
      RETURN
        elementId(c1) AS source_id,
        c1.name AS source_name,
        elementId(c2) AS target_id,
        c2.name AS target_name,
        elementId(r) AS relation_id,
        type(r) AS relation_type
    `;

    const result = await this.makeRequest(query, {
      source_company_name: payload.source_company_name,
      target_company_name: payload.target_company_name,
    });

    if (result.records.length === 0) {
      throw new HttpException(
        'Failed to create relation',
        HttpStatus.BAD_REQUEST,
      );
    }

    const record = result.records[0];

    return {
      message: 'Relation created successfully',
      source_company: {
        id: record.get('source_id'),
        name: record.get('source_name'),
      },
      target_company: {
        id: record.get('target_id'),
        name: record.get('target_name'),
      },
      relationship: {
        id: record.get('relation_id'),
        type: record.get('relation_type'),
      },
    };
  }

  // async getCompanies(): Promise<CompanyResponse[]> {
  //   const query = `
  //     MATCH (c:Company)
  //     RETURN
  //       elementId(c) AS id,
  //       c.name AS name
  //     ORDER BY c.name
  //   `;
  //
  //   const result = await this.makeRequest(query);
  //
  //   return result.records.map((record) => ({
  //     id: record.get('id'),
  //     name: record.get('name'),
  //   }));
  // }

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
    MATCH (startNode)
    WHERE startNode.ticker IN $entity_ids
    // Traverse 1 or more hops
    MATCH (startNode)-[*1..]-(connectedNode)
    // Return distinct pairs to avoid duplicates from multiple paths
    RETURN DISTINCT startNode.id AS source_id, connectedNode.id AS target_id
    `;
    result = await this.makeRequest(query, { entity_ids: entity_ids });

    const entity_to_percent = filters.reduce(
      (acc, item) => {
        acc[item.entity_id] = item.percent;
        return acc;
      },
      {} as Record<string, number>,
    );

    const company_to_percents_used = result.records.reduce(
      (acc, record) => {
        acc[record.get('target_id')] = acc[record.get('target_id')] ?? 0;
        acc[record.get('target_id')] +=
          entity_to_percent[record.get('source_id')] ?? 0;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      nodes: Array.from(nodesMap.values()),
      edges: Array.from(edgesMap.values()),
      company_to_percents: company_to_percents_used,
    };
  }

  async createEdge(payload: CreateEdgeDto): Promise<Record<string, unknown>> {
    const query = `
      MERGE (source:Company {name: $source})
      ON CREATE SET source.created_at = timestamp()
      MERGE (target:Company {name: $target})
      ON CREATE SET target.created_at = timestamp()
      MERGE (source)-[r:RELATED_TO]->(target)
      RETURN
        elementId(source) AS source_id,
        source.name AS source_name,
        elementId(target) AS target_id,
        target.name AS target_name,
        elementId(r) AS relation_id,
        type(r) AS relation_type
    `;

    const result = await this.makeRequest(query, {
      source: payload.source,
      target: payload.target,
    });

    if (result.records.length === 0) {
      throw new HttpException('Failed to create edge', HttpStatus.BAD_REQUEST);
    }

    const record = result.records[0];

    return {
      message: 'Edge created successfully',
      source_company: {
        id: record.get('source_id'),
        name: record.get('source_name'),
      },
      target_company: {
        id: record.get('target_id'),
        name: record.get('target_name'),
      },
      relationship: {
        id: record.get('relation_id'),
        type: record.get('relation_type'),
      },
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

    const response = this.makeRequest(query, {
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
