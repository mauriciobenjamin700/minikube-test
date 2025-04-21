import { Pool } from "pg";
import { settings } from "@/core"


const pool = new Pool({
    user: settings.DB_USER,
    host: settings.DB_HOST,
    database: settings.DB_NAME,
    password: settings.DB_PASSWORD,
    port: settings.DB_PORT
});

export default pool;