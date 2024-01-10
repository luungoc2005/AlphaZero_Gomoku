
from fastapi import FastAPI, exceptions
from typing import Union
from os import path, listdir
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse, FileResponse
from uuid import uuid4
import json

app = FastAPI()
GAMES_FILE = './games.json'
STATIC_DIR = './viewer/dist/'

app.mount("/assets", StaticFiles(directory=path.join(STATIC_DIR, 'assets')), name="static")

@app.get("/")
async def root():
    return FileResponse(path.join(STATIC_DIR, 'index.html'))

@app.get("/{item_path}")
async def root_assets(item_path: str):
    return RedirectResponse(url=f'/assets/{item_path}')

@app.get("/items/")
async def items_root():
    with open(GAMES_FILE, 'r') as input_file:
        return {
            "items": [json.loads(item)['name'] for item in input_file.readlines()]
        }

@app.get("/items/{item_id}")
async def item_read(item_id: str, q: Union[str, None] = None):
    with open(GAMES_FILE, 'r') as input_file:
        for line in input_file.readlines():
            json_object = json.loads(line)
            if json_object['name'] == item_id:
                return json_object
    raise exceptions.HTTPException(status_code=404, detail="Item not found")
    
GAMES = {}
from game import Board, Game

@app.post("/play/new_game")
async def new_game():
    game_id = uuid4().hex

    board = Board(width=15, height=15, n_in_row=5)
    board.init_board(0)
    GAMES[game_id] = board

    return {"game_id": game_id}

@app.post("/play/{game_id}/{move}")
async def game_move(game_id: str, move: str):
    if game_id in GAMES:
        board = GAMES[game_id]
        board.do_move(int(move))
        end, winner, winning_line = board.game_end()
        return {"end": end, "winner": winner, "winning_line": winning_line}
    else:
        raise exceptions.HTTPException(status_code=404, detail="Game not found")

if __name__ == '__main__':
    import uvicorn
    origins = ["*"]

    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    uvicorn.run(app, host="0.0.0.0", port=3000)