import pytest
import asyncio
from unittest.mock import patch, MagicMock, AsyncMock
import json
from skills.mcp_wrapper import MCPWrapper

@pytest.fixture
def mcp():
    return MCPWrapper(mcporter_path="echo")

@pytest.mark.asyncio
async def test_mcp_wrapper_success(mcp):
    # Mock asyncio.create_subprocess_exec
    mock_proc = MagicMock()
    mock_proc.communicate = AsyncMock(return_value=(b'{"status": "success", "data": "test_data"}', b''))
    mock_proc.returncode = 0

    with patch('asyncio.create_subprocess_exec', new=AsyncMock(return_value=mock_proc)) as mock_exec:
        result = await mcp.run_tool("test_tool", {"arg1": "value1"})
        
        assert result == {"status": "success", "data": "test_data"}
        mock_exec.assert_called_once()
        # Ensure it called with the correct args
        args_called = mock_exec.call_args[0]
        assert "run" in args_called
        assert "test_tool" in args_called

@pytest.mark.asyncio
async def test_mcp_wrapper_retry_on_failure(mcp):
    # Mock asyncio.create_subprocess_exec to fail a few times then succeed
    mock_proc_fail = MagicMock()
    mock_proc_fail.communicate = AsyncMock(return_value=(b'', b'Simulated error output'))
    mock_proc_fail.returncode = 1
    
    mock_proc_success = MagicMock()
    mock_proc_success.communicate = AsyncMock(return_value=(b'{"success": true}', b''))
    mock_proc_success.returncode = 0

    # We patch create_subprocess_exec to return fail, fail, then success
    mock_exec = AsyncMock(side_effect=[mock_proc_fail, mock_proc_fail, mock_proc_success])

    with patch('asyncio.create_subprocess_exec', mock_exec):
        # We need to test the @retry decorator on run_tool. 
        # By default, wait_exponential will wait around 4 seconds, so we mock sleep to speed up.
        with patch('asyncio.sleep', AsyncMock()):
            result = await mcp.run_tool("flaky_tool", {})
            assert result == {"success": True}
            assert mock_exec.call_count == 3  # Failed twice, succeeded on 3rd try

@pytest.mark.asyncio
async def test_browse_page(mcp):
    with patch.object(mcp, 'run_tool', new=AsyncMock(return_value={"browsed": True})) as mock_run:
        res = await mcp.browse_page(task="Click login", url="http://example.com")
        assert res["browsed"] is True
        mock_run.assert_called_once_with("playwright", {"task": "Click login", "url": "http://example.com"})
