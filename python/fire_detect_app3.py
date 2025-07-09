from flask import Flask, request, jsonify
from ultralytics import YOLO
import cv2
import threading
import requests
import os
from datetime import datetime

app = Flask(__name__)
model = YOLO("yolov8-fire.pt")

CONFIDENCE_THRESHOLD = 0.5
IMAGE_SAVE_DIR = "./detected_images"
os.makedirs(IMAGE_SAVE_DIR, exist_ok=True)

# 🔥 감지 상태 저장용 (camera_id: True/False)
fire_status_map = {}


def detect_fire_stream(video_url, callback_url, camera_id):
    cap = cv2.VideoCapture(int(video_url)) if video_url.isdigit() else cv2.VideoCapture(video_url)
    if not cap.isOpened():
        print(f"❌ [{camera_id}] 스트리밍 열기 실패:", video_url)
        fire_status_map[camera_id] = False
        return

    print(f"🔥 [{camera_id}] 실시간 감지 시작")
    fire_status_map[camera_id] = False  # 초기 상태

    names = model.names

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            print(f"⚠️ [{camera_id}] 프레임 수신 실패")
            break

        results = model.predict(frame)
        fire_detected = False

        for r in results:
            for box in r.boxes:
                label = names[int(box.cls.cpu().numpy()[0])]
                conf = float(box.conf.cpu().numpy()[0])

                print(f"🔍 [{camera_id}] 감지 결과: {label} (신뢰도: {conf})")

                if label == "fire" and conf >= CONFIDENCE_THRESHOLD:
                    fire_detected = True
                    fire_status_map[camera_id] = True

                    # 🔸 이미지 저장
                    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                    filename = f"fire_{camera_id}_{timestamp}.jpg"
                    filepath = os.path.join(IMAGE_SAVE_DIR, filename)
                    cv2.imwrite(filepath, frame)

                    # 🔸 Spring 서버로 전송
                    try:
                        response = requests.post(callback_url, json={
                            "label": label,
                            "confidence": round(conf, 3),
                            "video_url": video_url,
                            "image_path": filename
                        })
                        print("📡 POST 응답 상태:", response.status_code)
                        print("📡 POST 응답 내용:", response.text)
                    except Exception as e:
                        print(f"❌ Spring 전송 실패: {e}")

                    print(f"🛑 [{camera_id}] 감지 완료 → 감시 종료")
                    cap.release()
                    return  # 🔚 감지 후 종료

        # 화재가 없으면 계속 감시 유지
        fire_status_map[camera_id] = False

    cap.release()



@app.route("/stream-fire-detect", methods=["POST"])
def start_detection():
    data = request.json
    video_url = data.get("video_url")
    callback_url = data.get("callback_url")
    camera_id = data.get("camera_id") or video_url  # camera_id 없으면 video_url을 대체 키로 사용

    print(f"📥 감지 요청 수신: [{camera_id}] {video_url}")

    thread = threading.Thread(
        target=detect_fire_stream,
        args=(video_url, callback_url, camera_id)
    )
    thread.start()

    return jsonify({"message": f"카메라 {camera_id} 감지 시작됨"}), 202


@app.route("/fire-status", methods=["GET"])
def get_fire_status():
    camera_id = request.args.get("camera")
    status = fire_status_map.get(camera_id, False)  # 기본값: False
    return jsonify({"fire": status})


@app.route("/reset-fire", methods=["GET"])
def reset_fire_status():
    camera_id = request.args.get("camera")
    if camera_id in fire_status_map:
        fire_status_map[camera_id] = False
        print(f"🔁 [{camera_id}] 감지 상태 리셋됨")
        return jsonify({"message": f"Camera {camera_id} fire status reset."}), 200
    else:
        return jsonify({"error": "Invalid camera_id"}), 400    

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)


