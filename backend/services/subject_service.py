import json
import os

DATA_DIR = os.path.join(os.path.dirname(__file__), '../data')

def get_subject_data(subject: str, data_type: str):
    file_path = os.path.join(DATA_DIR, subject, f"{data_type}.json")
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"No data for {subject}/{data_type}")
    with open(file_path, "r") as f:
        return json.load(f) 