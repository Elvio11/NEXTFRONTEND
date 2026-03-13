import os
import pytest

# Global test environment variables for Server 2
os.environ["SUPABASE_URL"]              = "https://test.supabase.co"
os.environ["SUPABASE_SERVICE_ROLE_KEY"] = "test-service-role-key"
os.environ["SARVAM_API_URL"]            = "http://localhost:9999"
os.environ["SARVAM_API_KEY"]            = "test-sarvam-key"
os.environ["GEMINI_API_KEY"]            = "test-gemini-key"
os.environ["AGENT_SECRET"]              = "test-agent-secret"
os.environ["SERVER1_URL"]               = "http://localhost:3000"
os.environ["S4_URL"]                    = "http://test-s3:9000"
os.environ["MINIO_ACCESS_KEY"]          = "test-access-key"
os.environ["MINIO_SECRET_KEY"]          = "test-secret-key"
os.environ["MINIO_BUCKET"]              = "talvix"
os.environ["FOUNDER_PHONE"]             = "919999999999"
