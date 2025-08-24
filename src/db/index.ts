import {drizzle} from  "drizzle-orm/postgres-js"
import postgres from "postgres"
import  * as  schema from "./schema"

export const conectionString = process.env.DATABASE_URL || "postgres://user:password@localhost:5432/social_media";

export const client = postgres(conectionString, {  max: 1});
export  const db = drizzle(client, {schema})