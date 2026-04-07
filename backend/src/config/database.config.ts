import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  postgres: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'veeparts',
    password: process.env.DB_PASSWORD || 'veeparts_secret',
    database: process.env.DB_DATABASE || 'veeparts',
  },
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/veeparts_catalog',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
  },
  elasticsearch: {
    node: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200',
  },
}));
