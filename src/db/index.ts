import {drizzle} from  "drizzle-orm/postgres-js"
import postgres from "postgres"
import  * as  schema from "./schema"

const conectionString= process.env.DATABASE_URL || "postgres://user:password@localhost:5432/social_media";


const client = postgres(conectionString);
 export  const db = drizzle(client, {schema})