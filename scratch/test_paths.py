import os
import sys

# Define base paths
BASE_DIR = r"e:\project\Route Wise"
MRD_DIR = os.path.join(BASE_DIR, "MRD")
PRD_DIR = os.path.join(BASE_DIR, "PRD")
os.makedirs(MRD_DIR, exist_ok=True)
os.makedirs(PRD_DIR, exist_ok=True)

MRD_TITLE = "Cyber Knight - Commuters Waste Time at Congested Junctions - MRD"
PRD_TITLE = "Cyber Knight - Commuters Waste Time at Congested Junctions - PRD"

print(f"Target MRD folder: {MRD_DIR}")
print(f"Target PRD folder: {PRD_DIR}")
