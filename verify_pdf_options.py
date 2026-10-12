"""
Diagnostic script to test and verify both PDF print modes (Full 2-Page vs Compact 1-Page)
Multimodal AI Hackathon 2026 - Track A
"""
import json
import time
import subprocess
import requests
import websocket
import pandas as pd
import fitz  # PyMuPDF
import base64
from pathlib import Path

PROJECT_ROOT = Path("D:/Multimodal")

# 1. Fetch valid patient record
df = pd.read_csv(PROJECT_ROOT / "data" / "processed" / "cad_clean.csv")
patient = df.drop(columns=["Cath", "CAD", "LAD", "LCX", "RCA", "Exertional CP"], errors="ignore").iloc[0].to_dict()

# 2. Get predictions from live backend
pred_resp = requests.post("http://127.0.0.1:8000/predict", json=patient, timeout=10).json()

# 3. Assemble ActiveAssessment object
active_asmt = {
    "sessionId": "ASMT-PDFOPTS1",
    "timestamp": "02:40:00",
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
debug_port = 9224

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
    resp = requests.get(f"http://127.0.0.1:{debug_port}/json", timeout=5).json()
    page_targets = [t for t in resp if t.get("type") == "page"]
    ws_url = page_targets[0]["webSocketDebuggerUrl"] if page_targets else resp[0]["webSocketDebuggerUrl"]

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

    send_cdp("Page.reload")
    time.sleep(3)

    print_params = {
        "paperWidth": 8.27,    # A4 width in inches
        "paperHeight": 11.69,  # A4 height in inches
        "marginTop": 0.31,     # ~8mm margins
        "marginBottom": 0.31,
        "marginLeft": 0.31,
        "marginRight": 0.31,
        "printBackground": True,
        "preferCSSPageSize": True
    }

    # --- TEST 1: Default Full 2-Page Mode ---
    pdf_res_full = send_cdp("Page.printToPDF", print_params)
    pdf_bytes_full = base64.b64decode(pdf_res_full.get("data"))
    out_full = PROJECT_ROOT / "reports" / "test_full_mode_report.pdf"
    with open(out_full, "wb") as f:
        f.write(pdf_bytes_full)

    doc_full = fitz.open(out_full)
    print(f"\n[MODE A: FULL DOSSIER (DEFAULT)]")
    print(f"  File saved to: {out_full}")
    print(f"  Page count: {len(doc_full)}")
    for i, p in enumerate(doc_full):
        print(f"  Page {i+1} chars: {len(p.get_text())}")
    doc_full.close()

    # --- TEST 2: Switch to Compact 1-Page Mode ---
    # Click compact button in DOM
    click_js = """
    (() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const compactBtn = btns.find(b => b.textContent && b.textContent.includes('Compact'));
        if (compactBtn) {
            compactBtn.click();
            return 'CLICKED_COMPACT';
        }
        return 'COMPACT_BTN_NOT_FOUND';
    })()
    """
    click_res = send_cdp("Runtime.evaluate", {"expression": click_js})
    print(f"\nClick compact result: {click_res.get('result', {}).get('value')}")
    time.sleep(1)

    pdf_res_compact = send_cdp("Page.printToPDF", print_params)
    pdf_bytes_compact = base64.b64decode(pdf_res_compact.get("data"))
    out_compact = PROJECT_ROOT / "reports" / "test_compact_mode_report.pdf"
    with open(out_compact, "wb") as f:
        f.write(pdf_bytes_compact)

    doc_compact = fitz.open(out_compact)
    print(f"\n[MODE B: COMPACT SUMMARY]")
    print(f"  File saved to: {out_compact}")
    print(f"  Page count: {len(doc_compact)}")
    for i, p in enumerate(doc_compact):
        print(f"  Page {i+1} chars: {len(p.get_text())}")
    doc_compact.close()

    ws.close()

finally:
    proc.terminate()
    proc.wait()
