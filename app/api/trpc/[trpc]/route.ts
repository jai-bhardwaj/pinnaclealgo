import { NextRequest, NextResponse } from "next/server";

// Simple API handler that returns a basic response
// This replaces the tRPC handler since we're using mock data
const handler = (req: NextRequest) => {
  const { pathname } = new URL(req.url);

  // Basic health check or mock response
  return NextResponse.json({
    message: "Trading Frontend API is running",
    timestamp: new Date().toISOString(),
    path: pathname,
    method: req.method,
    status: "ok",
  });
};

export { handler as GET, handler as POST };
