import neo4j, { Driver } from 'neo4j-driver';

const NEO4J_URI = process.env.NEO4J_URI ?? 'bolt://localhost:7687';
const NEO4J_USERNAME = process.env.NEO4J_USERNAME ?? 'neo4j';
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD ?? 'password123';
const NEO4J_DATABASE = process.env.NEO4J_DATABASE ?? 'neo4j';

export const NEO4J_DRIVER = Symbol('NEO4J_DRIVER');
export const NEO4J_DATABASE_NAME = Symbol('NEO4J_DATABASE_NAME');

export const neo4jProvider = {
  provide: NEO4J_DRIVER,
  useFactory: (): Driver => {
    const auth = neo4j.auth.basic(NEO4J_USERNAME, NEO4J_PASSWORD);
    return neo4j.driver(NEO4J_URI, auth);
  },
};

export const neo4jDatabaseProvider = {
  provide: NEO4J_DATABASE_NAME,
  useValue: NEO4J_DATABASE,
};
