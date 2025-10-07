import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Check if pinnacle-backend is running
    const backendUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const response = await fetch(`${backendUrl}/health`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Backend health check failed: ${response.status}`);
    }

    const backendHealth = await response.json();

    return NextResponse.json({
      status: "healthy",
      frontend: {
        status: "healthy",
        timestamp: new Date().toISOString(),
      },
      backend: backendHealth,
    });
  } catch (error) {
    console.error("Health check failed:", error);
    return NextResponse.json(
      {
        status: "unhealthy",
        frontend: {
          status: "healthy",
          timestamp: new Date().toISOString(),
        },
        backend: {
          status: "unhealthy",
          error: error instanceof Error ? error.message : "Unknown error",
        },
      },
      { status: 503 }
    );
  }
}
