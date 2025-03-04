from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from get_indicators import router as get_indicators_router  #
from get_periods import router as get_periods_router #
from get_segments import router as get_segments_router #
from get_index_attributes import router as get_index_attributes_router #
from new_get_index_tree_data import router as new_get_index_tree_data_router #
from save_data import router as save_data_router #
from get_data import router as get_data_router #
from delete_data import router as delete_data_router #
from get_user_folders import router as get_user_folders_router
from save_folder import router as save_folder_router
from update_folder import router as update_folder_router
from delete_folder import router as delete_folder_router

app = FastAPI()

origins = [
    "http://localhost:3000",
    "http://localhost:5174",
    "http://localhost",
    "https://localhost:3000",
    "https://localhost",
    "http://185.129.49.159",
    "http://185.129.49.159:3000",
    "https://185.129.49.159",
    "https://185.129.49.159:3000",
    "http://reddiamonds.kz",
    "http://www.reddiamonds.kz",
    "https://reddiamonds.kz",
    "https://www.reddiamonds.kz",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(get_indicators_router)   
app.include_router(get_periods_router)  
app.include_router(get_segments_router)   
app.include_router(get_index_attributes_router) 
app.include_router(new_get_index_tree_data_router) 
app.include_router(save_data_router) 
app.include_router(get_data_router) 
app.include_router(delete_data_router)
app.include_router(get_user_folders_router)  
app.include_router(save_folder_router)
app.include_router(update_folder_router)  
app.include_router(delete_folder_router) 
