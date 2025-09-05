# 🚗 AIPMS (AI Parking Management System)

## 📑 목차
1. [프로젝트 소개](#-프로젝트-소개)  
2. [프로젝트 구성](#-프로젝트-구성)  
3. [사용 기술 스택](#-사용-기술-스택)  
4. [학습 내용 정리](#-학습-내용-정리)  
5. [화면 예시](#-화면-예시)  

---

## 📝 프로젝트 소개
AIPMS는 **주차 관리 + 화재 감지 기능**을 통합한 AI 기반 스마트 주차 관리 시스템입니다.  
Spring Boot와 React를 기반으로 하여 **예약/결제, 관리자 알림, 화재 감지** 기능을 제공하며,  
YOLOv8을 활용한 화재 탐지 모델을 통해 안전한 주차 환경을 구축하는 것을 목표로 합니다.  

---

## 📂 프로젝트 구성
### 1️⃣ 사용자 서비스
- Kakao OAuth2 로그인 (소셜 로그인)  
- 주차장 예약 및 결제 (Iamport 연동)  
- 예약 내역 확인 및 취소  

### 2️⃣ 관리자 서비스
- YOLOv8 기반 화재 감지 → 실시간 알림  
- 주차장 상태 모니터링 대시보드  
- 예약/결제 관리  

---

## 🔧 사용 기술 스택
- **Language**: Java 17, Python  
- **Backend**: Spring Boot 3.x, Flask  
- **Frontend**: React.js, Chart.js  
- **AI/ML**: YOLOv8 (화재 감지), OpenCV  
- **DB**: MySQL  
- **Auth/Payment**: Kakao OAuth2, Iamport  
- **Infra**: Docker, GitHub Actions (배포/빌드)  
- **IDE**: IntelliJ IDEA, VS Code  
- **Build Tool**: Gradle  

---

## 📚 학습 내용 정리
- **AI + 웹 통합**: YOLOv8 화재 감지 모델을 Flask로 서비스화하고, Spring Boot와 연동  
- **API 연동 경험**: Kakao OAuth2 로그인, Iamport 결제 API 적용  
- **풀스택 경험**: React를 통한 프론트엔드, Spring Boot를 통한 백엔드, DB 설계까지 전 과정 경험  
- **실시간 알림 처리**: 화재 감지 이벤트 발생 시 관리자에게 알림 전달  

---

## 📸 화면 예시
> (서비스 실행 화면, 로그인/예약 페이지, 화재 감지 알림 화면 등을 이미지로 첨부하면 좋습니다)  
