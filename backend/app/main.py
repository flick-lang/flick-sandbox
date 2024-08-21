import io
import docker
import asyncio
import tarfile
from fastapi import FastAPI, WebSocket, WebSocketDisconnect

app = FastAPI()
docker_client = docker.from_env()


async def send_text(websocket: WebSocket, text: str):
    await websocket.send_text(text)
    await asyncio.sleep(0)


@app.websocket("/ws/compiler")
async def compiler(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            flick_source = await websocket.receive_text()
            await send_text(websocket, "Compiling...\n")

            container = docker_client.containers.run("compiler", tty=True, detach=True)

            try:
                tar_stream = io.BytesIO()
                with tarfile.open(fileobj=tar_stream, mode='w') as tar:
                    tarinfo = tarfile.TarInfo(name="main.fl")
                    tarinfo.size = len(flick_source)
                    tar.addfile(tarinfo, io.BytesIO(flick_source.encode('utf-8')))
                tar_stream.seek(0)
                container.put_archive("/app", tar_stream)

                exit_code, output = container.exec_run("./flick main.fl")
                if exit_code != 0:
                    await send_text(websocket, f"Compilation failed:\n{output.decode('utf-8')}\n")
                    continue

                _, output = container.exec_run("timeout 5s ./main", stream=True)
                for line in output:
                    await send_text(websocket, f"{line.decode('utf-8')}\n")
            finally:
                container.remove(force=True)
    except WebSocketDisconnect:
        pass
