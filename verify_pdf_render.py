"""
Scratch script to verify headless browser PDF generation and measure page count.
Multimodal AI Hackathon 2026 - Track A
"""
import json
import time
import subprocess
import requests
import websocket
import pandas as pd
import fitz  # PyMuPDF
from pathlib import Path

PROJECT_ROOT = Path("D:/Multimodal")

# 1. Fetch valid patient record
df = pd.read_csv(PROJECT_ROOT / "data" / "processed" / "cad_clean.csv")
patient = df.drop(columns=["Cath", "CAD", "LAD", "LCX", "RCA", "Exertional CP"], errors="ignore").iloc[0].to_dict()

# 2. Get predictions from live backend
pred_resp = requests.post("http://127.0.0.1:8000/predict", json=patient, timeout=10).json()
explain_resp = requests.post("http://127.0.0.1:8000/predict/explain", json={"patient": patient}, timeout=10).json()

# 3. Assemble ActiveAssessment object
active_asmt = {
    "sessionId": "ASMT-SHAPTEST1",
    "timestamp": "01:45:00",
    "isSyntheticDemo": False,
    "predictionResponse": pred_resp,
    "assumptions": [
        {"canonicalField": "BMI", "assumedValue": 26.5, "category": "Biometrics", "source": "Calculated", "rationale": "Derived from anthropometrics"},
        {"canonicalField": "Obesity", "assumedValue": "Y", "category": "Biometrics", "source": "Clinical", "rationale": "BMI >= 25"}
    ],
    "measuredFields": [
        {"canonicalField": "Age", "sourceFormField": "age", "value": patient["Age"]},
        {"canonicalField": "Sex", "sourceFormField": "sex", "value": patient["Sex"]},
        {"canonicalField": "Typical Chest Pain", "sourceFormField": "typicalChestPain", "value": patient["Typical Chest Pain"]}
    ],
    "canonicalPayload": patient
}

chrome_exe = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
debug_port = 9223

# Start headless Chrome with remote debugging
proc = subprocess.Popen([
    chrome_exe,
    f"--remote-debugging-port={debug_port}",
    "--remote-allow-origins=*",
    "--headless",
    "--disable-gpu",
    "--no-sandbox"
])

time.sleep(2)

try:
    # Get WebSocket debugger URL
    resp = requests.get(f"http://127.0.0.1:{debug_port}/json", timeout=5).json()
    print("Targets found:", [(t.get("type"), t.get("title")) for t in resp])
    page_targets = [t for t in resp if t.get("type") == "page"]
    ws_url = page_targets[0]["webSocketDebuggerUrl"] if page_targets else resp[0]["webSocketDebuggerUrl"]
    print("Connecting to ws_url:", ws_url)

    ws = websocket.create_connection(ws_url)

    def send_cdp(method, params=None):
        msg_id = int(time.time() * 1000) % 1000000
        payload = {"id": msg_id, "method": method, "params": params or {}}
        ws.send(json.dumps(payload))
        while True:
            raw = ws.recv()
            res = json.loads(raw)
            if res.get("id") == msg_id:
                if "error" in res:
                    print("CDP ERROR:", res["error"])
                return res.get("result", {})

    # Navigate to app
    send_cdp("Page.enable")
    send_cdp("Page.navigate", {"url": "http://localhost:5173/#report"})
    time.sleep(2)

    # Inject sessionStorage item and reload
    asmt_json = json.dumps(active_asmt)
    js_code = f"sessionStorage.setItem('cardiovision_active_assessment_v1', {json.dumps(asmt_json)});"
    send_cdp("Runtime.evaluate", {"expression": js_code})
    time.sleep(0.5)

    # Reload page so state loads from sessionStorage
    send_cdp("Page.reload")
    time.sleep(3)

    # Print to PDF using A4 parameters
    print_params = {
        "paperWidth": 8.27,    # A4 width in inches
        "paperHeight": 11.69,  # A4 height in inches
        "marginTop": 0.4,
        "marginBottom": 0.4,
        "marginLeft": 0.4,
        "marginRight": 0.4,
        "printBackground": True,
        "preferCSSPageSize": True
    }
    pdf_res = send_cdp("Page.printToPDF", print_params)
    pdf_data = pdf_res.get("data")

    import base64
    pdf_bytes = base64.b64decode(pdf_data)
    out_pdf = PROJECT_ROOT / "reports" / "test_assessment_report.pdf"
    with open(out_pdf, "wb") as f:
        f.write(pdf_bytes)

    # Open with fitz and count pages
    doc = fitz.open(out_pdf)
    page_count = len(doc)
    print(f"SUCCESS: Generated PDF saved to {out_pdf}")
    print(f"ACTUAL PAGE COUNT: {page_count}")
    for idx, page in enumerate(doc):
        text = page.get_text()
        print(f"Page {idx+1} character count: {len(text)}, preview: {text[:100]!r}")

    doc.close()
    ws.close()

finally:
    proc.terminate()
    proc.wait()
