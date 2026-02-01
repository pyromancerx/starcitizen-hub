from fastapi import FastAPI

app = FastAPI(
    title="Star Citizen Hub",
    description="Social and logistics hub for Star Citizen communities",
    version="0.1.0",
)


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
