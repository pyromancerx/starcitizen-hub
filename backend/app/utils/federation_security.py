import hmac
import hashlib
import base64
import time
from typing import Optional
from fastapi import Request, HTTPException, Header

class FederationSecurity:
    HEADER_SIGNATURE = "X-Hub-Signature"
    HEADER_TIMESTAMP = "X-Hub-Timestamp"
    HEADER_SOURCE_HOST = "X-Hub-Source-Host"
    
    @staticmethod
    def generate_signature(api_key: str, method: str, path: str, timestamp: str, body: bytes = b"") -> str:
        """
        Generate HMAC-SHA256 signature.
        Format: method + path + timestamp + body
        """
        payload = f"{method.upper()}{path}{timestamp}".encode("utf-8") + body
        signature = hmac.new(
            api_key.encode("utf-8"),
            payload,
            hashlib.sha256
        ).digest()
        return base64.b64encode(signature).decode("utf-8")

    @staticmethod
    async def verify_request(request: Request, api_key: str):
        """
        Verify the request signature.
        """
        signature = request.headers.get(FederationSecurity.HEADER_SIGNATURE)
        timestamp = request.headers.get(FederationSecurity.HEADER_TIMESTAMP)
        
        if not signature or not timestamp:
            raise HTTPException(status_code=401, detail="Missing federation headers")
            
        # Verify timestamp (prevent replay attacks, e.g., 5 minute window)
        try:
            req_ts = float(timestamp)
            if abs(time.time() - req_ts) > 300:
                raise HTTPException(status_code=401, detail="Request expired")
        except ValueError:
            raise HTTPException(status_code=401, detail="Invalid timestamp")

        # Reconstruct payload
        body = await request.body()
        expected_signature = FederationSecurity.generate_signature(
            api_key, 
            request.method, 
            request.url.path, 
            timestamp, 
            body
        )
        
        if not hmac.compare_digest(signature, expected_signature):
            raise HTTPException(status_code=401, detail="Invalid signature")
