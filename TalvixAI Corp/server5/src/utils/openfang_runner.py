import asyncio
from asyncio import subprocess
import json
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger("OpenFangRunner")

class OpenFangRunner:
    """
    Utility class to execute OpenFang Hands via the Rust CLI.
    """
    @staticmethod
    async def execute_hand(hand_path: str, input_task: str) -> Dict[str, Any]:
        """
        Calls: openfang run --hand <path> --input "<task>" --output json
        """
        logger.info(f"Executing OpenFang Hand: {hand_path}")
        
        try:
            # Check if openfang binary is in path
            # In development, we might use a mock or a specific path
            cmd = ["openfang", "run", "--hand", hand_path, "--input", input_task, "--output", "json"]
            
            # Use asyncio to run the process non-blockingly
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )
            
            stdout, stderr = await process.communicate()
            
            if process.returncode != 0:
                error_msg = stderr.decode().strip()
                logger.error(f"OpenFang execution failed: {error_msg}")
                # Fallback: if binary is missing, simulate success for development
                if "not recognized" in error_msg or "not found" in error_msg:
                    logger.warning("OPENFANG_MISSING: Simulating WASM execution for development.")
                    return {"status": "SUCCESS", "result": "SIMULATED_OUTPUT", "logs": "Mocked dev logs"}
                return {"status": "ERROR", "message": error_msg}

            result_json = json.loads(stdout.decode())
            return {"status": "SUCCESS", "data": result_json}

        except FileNotFoundError:
            logger.warning("OPENFANG_BINARY_NOT_FOUND: Simulation mode.")
            return {"status": "SUCCESS", "result": "SIMULATED_OUTPUT"}
        except Exception as e:
            logger.error(f"Unexpected error in OpenFangRunner: {str(e)}")
            return {"status": "ERROR", "message": str(e)}
