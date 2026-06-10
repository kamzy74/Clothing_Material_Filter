import { PrismaClient } from "@/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";

// In Python terms: this is like creating a SQLAlchemy engine once and storing
// it in a module-level variable so every import shares the same connection.
// In Next.js we attach it to `globalThis` to survive hot-reload in dev mode
// (otherwise you'd create hundreds of connections during development).

// DB lives at the project root (web/dev.db), matching DATABASE_URL in .env
const dbPath = path.resolve(process.cwd(), "dev.db");

function createClient() {
  const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
  return new PrismaClient({ adapter });
}

declare global {
  // eslint-disable-next-line no-var
  var prisma: ReturnType<typeof createClient> | undefined;
}

const prisma = globalThis.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = prisma;
}

export default prisma;
