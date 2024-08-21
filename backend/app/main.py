import io
import docker
import tarfile
from fastapi import FastAPI, WebSocket, WebSocketDisconnect

app = FastAPI()
docker_client = docker.from_env()


@app.websocket("/ws/compiler")
async def compiler(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            flick_source = await websocket.receive_text()

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
                    print(output)
                    await websocket.send_text(output.decode('utf-8'))
                    continue

                _, output = container.exec_run("./main", stream=True)
                for line in output:
                    await websocket.send_text(f"{line.decode('utf-8')}\n")
            finally:
                container.stop()
                container.remove()
    except WebSocketDisconnect:
        pass
