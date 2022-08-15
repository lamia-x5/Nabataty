import { Static, Type } from '@sinclair/typebox';
import { FastifyInstance } from 'fastify';
import { upsertstockController } from '../controllers/upsert-stock';
import {Plant} from '@prisma/client';
import { prismaClient} from '../prisma';
import Fuse from 'fuse.js';
import { addAuthorization } from '../hooks/auth';
import _ from 'lodash';


const Plant = Type.Object({
name: Type.String(),
  price :Type.String(),
  description: Type.String(),

});
type Plants = Static<typeof Plant>;
const PlantParams = Type.Object({
  stock_id : Type.String(),
});
type PlantParams = Static<typeof PlantParams>;
const GetPlantsQuery = Type.Object({
	text: Type.Optional(Type.String()),
});
type GetPlantsQuery = Static<typeof GetPlantsQuery>;
export default async function (server: FastifyInstance) {
     addAuthorization(server);	
     server.route({
      method: "POST",
      url: "/Plants",
      schema: {
        summary: "Creates new Plant",
        tags: ["Plants"],
        body: Plant,
      },
      handler: async (request, reply) => {
        const Plant = request.body as any;
        await prismaClient.plant.create({ data: Plant });
        return prismaClient.plant.findMany();
      }});
    
       /// Get all Plants or search by name
        server.route({
          method: 'GET',
          url: '/Plants',
          schema: {
            summary: 'Gets all Plants search by name',
            tags: ['Plants'],
            querystring: GetPlantsQuery,
            response: {
              '2xx': Type.Array(Plant),
            },
          },
          handler: async (request, reply) => {
            const query = request.query as GetPlantsQuery;
            const Plant = await prismaClient.plant.findMany();
            if (!query.text) return Plant;
            const fuse = new Fuse(Plant, {
              includeScore: true,
              isCaseSensitive: false,
              includeMatches: true,
              findAllMatches: true,
              threshold: 1,
              keys: ['name'],
            });
            console.log(JSON.stringify(fuse.search(query.text)));
            const result: Plant[] = fuse.search(query.text).map((r) => r.item);
            return result;
          },
        });
    

   
      };
