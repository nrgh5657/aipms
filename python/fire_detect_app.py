from flask import Flask, request, jsonify, Response
from ultralytics import YOLO
import cv2
import threading
import requests
import os
from datetime import datetime
import numpy as np
import time

app = Flask(__name__)
model = YOLO("yolov8-fire.pt")

CONFIDENCE_THRESHOLD = 0.5
IMAGE_SAVE_DIR = "./detected_images"
os.makedirs(IMAGE_SAVE_DIR, exist_ok=True)

fire_status_map = {}

# 📷 웹캠 스트리밍용 VideoCapture (공유용으로 한 번만 엶)
stream_camera = cv2.VideoCapture(0)

stream_camera.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
stream_camera.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)

# 📡 Spring <img src="/video_feed_pc"> 용 영상 송출
def generate_pc_frames():
    while True:
        success, frame = stream_camera.read()
        if not success:
            continue
        _, buffer = cv2.imencode('.jpg', frame)
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')

@app.route("/video_feed_pc")
def video_feed_pc():
    return Response(generate_pc_frames(),
                    mimetype='multipart/x-mixed-replace; boundary=frame')

def detect_fire_from_frames(frame_generator, callback_url, camera_id, video_url):
    names = model.names
    fire_status_map[camera_id] = False

    for frame in frame_generator:
        if frame is None or not isinstance(frame, np.ndarray):
            print(f"⚠️ [{camera_id}] 유효하지 않은 프레임. 재시도 중...")
            time.sleep(0.2)
            continue

        try:
            results = model.predict(frame)
        except Exception as e:
            print(f"❌ [{camera_id}] YOLO 예측 실패: {e}")
            continue

        for r in results:
            for box in r.boxes:
                label = names[int(box.cls.cpu().numpy()[0])]
                conf = float(box.conf.cpu().numpy()[0])
                print(f"🔍 [{camera_id}] 감지 결과: {label} (신뢰도: {conf})")

                if label == "fire" and conf >= CONFIDENCE_THRESHOLD:
                    fire_status_map[camera_id] = True

                    # 이미지 저장
                    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                    filename = f"fire_{camera_id}_{timestamp}.jpg"
                    filepath = os.path.join(IMAGE_SAVE_DIR, filename)
                    cv2.imwrite(filepath, frame)

                    detected_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

                    # Spring 서버에 POST
                    try:
                        headers = {"Content-Type": "application/json"}
                        response = requests.post(callback_url, json={

                            "label": label,
                            "confidence": round(conf, 3),
                            "camera_id": camera_id,
                            "video_url": video_url if video_url and video_url.startswith("http") else "LOCAL",
                            "image_path": filename,
                            "detected_at": detected_time,
                            "alert_time": detected_time
                        }, headers=headers)
                        print("📡 POST 응답 상태:", response.status_code)
                        print("📡 응답 내용:", response.text)
                    except Exception as e:
                        print(f"❌ Spring 전송 실패: {e}")

                    print(f"🛑 [{camera_id}] 화재 감지 완료 → 감시 종료")
                    return

        fire_status_map[camera_id] = False

# 🔁 감지 요청 처리
@app.route("/stream-fire-detect", methods=["POST"])
def start_detection():
    data = request.json
    video_url = data.get("video_url")
    callback_url = data.get("callback_url")
    camera_id = str(data.get("camera_id"))

    print(f"📥 감지 요청 수신: [{camera_id}] {video_url}")

    if camera_id == "2":
        # 공유된 웹캠 프레임 사용
        def shared_webcam_generator():
            while True:
                success, frame = stream_camera.read()
                if not success:
                    time.sleep(0.1)
                    continue
                yield frame
        frame_gen = shared_webcam_generator()

    elif video_url.startswith("http"):
        cap = cv2.VideoCapture(video_url)

        def ipcam_frame_generator():
            while cap.isOpened():
                ret, frame = cap.read()
                if not ret:
                    break
                yield frame
            cap.release()
        frame_gen = ipcam_frame_generator()

    else:
        cap = cv2.VideoCapture(int(video_url))

        def webcam_frame_generator():
            while cap.isOpened():
                ret, frame = cap.read()
                if not ret:
                    break
                yield frame
            cap.release()
        frame_gen = webcam_frame_generator()

    thread = threading.Thread(
        target=detect_fire_from_frames,
        args=(frame_gen, callback_url, camera_id, video_url)
    )
    thread.start()

    return jsonify({"message": f"카메라 {camera_id} 감지 시작됨"}), 202

# 🔍 감지 상태 확인
@app.route("/fire-status", methods=["GET"])
def get_fire_status():
    camera_id = request.args.get("camera")
    return jsonify({"fire": fire_status_map.get(camera_id, False)})

# 🔄 감지 상태 초기화
@app.route("/reset-fire", methods=["GET"])
def reset_fire_status():
    camera_id = request.args.get("camera")
    if camera_id in fire_status_map:
        fire_status_map[camera_id] = False
        print(f"🔁 [{camera_id}] 감지 상태 리셋됨")
        return jsonify({"message": f"Camera {camera_id} fire status reset."}), 200
    return jsonify({"error": "Invalid camera_id"}), 400

if __name__ == "__main__":
    print("🚀 YOLO 화재 감지 서버 시작 (http://localhost:5000)")
    app.run(host="0.0.0.0", port=5000)
