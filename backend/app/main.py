from fastapi import FastAPI, WebSocket, WebSocketDisconnect

app = FastAPI()


@app.websocket("/ws/compiler")
async def compiler(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            flick_source = await websocket.receive_text()

            container = setup_compilation_docker()

            container.write_file("~/input.fl", flick_source)
            exit_status, compiler_output = container.run(f"flick ~/input.fl -o output")

            if exit_status != 0:
                # send compilation issue and freeze
                pass

                
            # compile the source

            # send compiler output

            # run the source

            for _ in range(3):
                await websocket.send_text(f"Message text was: {flick_source}\n")
    except WebSocketDisconnect:
        pass
