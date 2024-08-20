import docker
import io
import tarfile
from fastapi import FastAPI, WebSocket, WebSocketDisconnect

app = FastAPI()
docker_client = docker.from_env()


def compile(flick_source: str):
    """Create a docker container and compile `flick_source`.
     
    Returns:
        The compiler output
    """
    # place flick source in a file on container

    pass


@app.websocket("/ws/compiler")
async def compiler(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            flick_source = await websocket.receive_text()

            # BEGIN COMPILER CODE:
            try:
                print("Creating container")
                container = docker_client.containers.run("compiler", tty=True, detach=True)
                print("Container created")

                tar_stream = io.BytesIO()
                with tarfile.open(fileobj=tar_stream, mode='w') as tar:
                    tarinfo = tarfile.TarInfo(name="main.fl")
                    tarinfo.size = len(flick_source)
                    tar.addfile(tarinfo, io.BytesIO(flick_source.encode('utf-8')))
                tar_stream.seek(0)
                container.put_archive(".", tar_stream)

                print("Running flick")
                exit_code, output = container.exec_run("./flick main.fl", workdir="/app")
                if exit_code != 0:
                    print(output)
                    await websocket.send_text(output.decode('utf-8'))
                    continue

                print("Running main")
                _, output = container.exec_run("./main", stream=True)
                for line in output:
                    await websocket.send_text(f"{line.decode('utf-8')}\n")
            finally:
                container.stop()
                container.remove()

            # END COMPILER CODE:

            # if exit_status != 0:
            #     # send compilation issue and freeze
            #     pass

                
            # compile the source

            # send compiler output

            # run the source



    except WebSocketDisconnect:
        pass
