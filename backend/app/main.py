from fastapi import FastAPI
from app.routers import auth_router, stockpile_router

app = FastAPI(
    title="Star Citizen Hub",
    description="Social and logistics hub for Star Citizen communities",
    version="0.1.0",
)

app.include_router(auth_router)
app.include_router(stockpile_router)


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
