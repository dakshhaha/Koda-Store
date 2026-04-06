import { handlers } from "@/auth"
export const { GET, POST } = handlers
export const runtime = "nodejs" // Set to nodejs as the Edge adapter for PostgreSQL is already provided in the client and handlers are enough.
