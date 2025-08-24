import type { Config}  from "drizzle-kit"


export default{
    schema:"./src/db/schema.ts",
    out:"./drizzle",
    driver:"postgresql",
    dbCredentials:{
        conetionString: process.env.DATABASE_URL || "postgresql://postgres:prostgres@localhost: 5432/social_scraper",

    },
    
} satisfies Config;