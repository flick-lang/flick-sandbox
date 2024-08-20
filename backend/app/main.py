from fastapi import FastAPI, WebSocket, WebSocketDisconnect

app = FastAPI()


@app.websocket("/ws/compiler")
async def compiler(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            flick_source = await websocket.receive_text()

            # compile the source

            # send compiler output

            # run the source

            for _ in range(3):
                await websocket.send_text(f"Message text was: {flick_source}\n")
    except WebSocketDisconnect:
        pass
