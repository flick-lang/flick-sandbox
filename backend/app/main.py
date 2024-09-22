import io
import docker
import asyncio
import tarfile
from pathlib import Path
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from .logger import logger
from .models import Response, Stage, Status


app = FastAPI()
docker_client = docker.from_env()

# logger.info("Building image")
# docker_file_path = str(Path(__file__).parent.parent)
# image, _ = docker_client.images.build(path=docker_file_path, tag="flick-compiler")
# logger.info("Done building image")


async def send_response(websocket: WebSocket, response: Response):
    await websocket.send_text(response.model_dump_json())
    await asyncio.sleep(0)  # this flushes the web socket's text buffer


@app.websocket("/ws/compiler")
async def compiler(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            flick_source = await websocket.receive_text()

            container = docker_client.containers.run(
                "ghcr.io/flick-lang/flick-compiler", tty=True, detach=True, network_disabled=True
            )

            try:
                tar_stream = io.BytesIO()
                with tarfile.open(fileobj=tar_stream, mode="w") as tar:
                    tarinfo = tarfile.TarInfo(name="main.fl")
                    tarinfo.size = len(flick_source)
                    tar.addfile(tarinfo, io.BytesIO(flick_source.encode("utf-8")))
                tar_stream.seek(0)
                container.put_archive("/sandbox", tar_stream)

                response = Response(
                    stage=Stage.COMPILING,
                    description="Compiling...",
                    status=Status.STARTED,
                    output=None,
                )
                await send_response(websocket, response)

                response.status = Status.IN_PROGRESS
                exec_id = docker_client.api.exec_create(container.id, "./flick main.fl")
                exec_output = docker_client.api.exec_start(exec_id, stream=True)
                for line in exec_output:
                    response.output = line.decode('utf-8')
                    await send_response(websocket, response)
                
                exit_code = docker_client.api.exec_inspect(exec_id)['ExitCode']
                if exit_code != 0:
                    response = Response(
                        stage=Stage.COMPILING,
                        description=f"Compilation failed with exit code {exit_code}",
                        status=Status.ERROR,
                        output=None,
                    )
                    await send_response(websocket, response)
                    continue

                response = Response(
                    stage=Stage.COMPILING,
                    description="Finished compiling",
                    status=Status.SUCCESS,
                    output=None,
                )
                await send_response(websocket, response)

                response = Response(
                    stage=Stage.RUNNING,
                    description="Running program...",
                    status=Status.STARTED,
                    output=None,
                )
                await send_response(websocket, response)

                # TODO: Decompose from here (taking timeout 5s ./main as a 'command') and same above
                response.status = Status.IN_PROGRESS
                exec_id = docker_client.api.exec_create(container.id, "timeout 5s ./main")
                exec_output = docker_client.api.exec_start(exec_id, stream=True)
                for line in exec_output:
                    response.output = line.decode('utf-8')
                    await send_response(websocket, response)

                exit_code = docker_client.api.exec_inspect(exec_id)['ExitCode']
                # To here and return exit_code
                if exit_code != 0:
                    response = Response(
                        stage=Stage.RUNNING,
                        description=f"Program failed with exit code {exit_code}",
                        status=Status.ERROR,
                        output=None,
                    )
                    await send_response(websocket, response)
                    continue

                response = Response(
                    stage=Stage.RUNNING,
                    description="Finished running program",
                    status=Status.SUCCESS,
                    output=None,
                )

                await send_response(websocket, response)
            finally:
                container.remove(force=True)
    except WebSocketDisconnect:
        pass
