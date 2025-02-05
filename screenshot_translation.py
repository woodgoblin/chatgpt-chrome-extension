# Originally authored by Seedofpanic in JS, translated to Python by Copilot

import asyncio
import threading
import io
import websockets
import keyboard
import pygetwindow as gw
from PIL import ImageGrab

# Global variable to store the active websocket connection
ws_client = None

async def ws_handler(websocket, path=None):
    global ws_client
    ws_client = websocket
    try:
        # Keep connection open until client disconnects.
        async for _ in websocket:
            pass
    finally:
        ws_client = None

def capture_and_send(loop):
    global ws_client
    if ws_client is None:
        print("No client connected.")
        return

    active = gw.getActiveWindow()
    if active is None:
        print("Could not get the active window.")
        return

    # Grab full screenshot and crop to active window's bounds.
    left, top, width, height = active.left, active.top, active.width, active.height
    screenshot = ImageGrab.grab()
    box = (left, top, left + width, top + height)
    cropped = screenshot.crop(box)

    # Save to a JPEG in memory.
    buf = io.BytesIO()
    cropped.save(buf, format="JPEG")
    data = buf.getvalue()

    # Schedule sending the data on the asyncio loop.
    asyncio.run_coroutine_threadsafe(ws_client.send(data), loop)
    print("Screenshot sent.")

def keyboard_listener(loop):
    # Bind the END key.
    keyboard.add_hotkey('end', lambda: capture_and_send(loop))
    # Keep the listener running.
    keyboard.wait()

async def main():
    async with websockets.serve(ws_handler, 'localhost', 8080):
        print("WebSocket server started on ws://localhost:8080")
        await asyncio.Future()  # Run forever.

if __name__ == '__main__':
    loop = asyncio.get_event_loop()
    # Start the keyboard listener in a separate thread.
    threading.Thread(target=keyboard_listener, args=(loop,), daemon=True).start()
    try:
        loop.run_until_complete(main())
    except KeyboardInterrupt:
        print("Exiting...")