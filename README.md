# MediLink: AI-Powered Emergency Response Platform

🚀 **Live Application:** [MediLink Live Demo](https://medilink-ai-s7ckpqijva-uc.a.run.app)

MediLink is a next-generation emergency response and triage platform designed to bridge the gap between patients, emergency dispatchers, and medical professionals. Leveraging real-time data synchronization, AI-driven triage, and precise geolocation, MediLink ensures rapid and accurate emergency response.

## ✨ Key Features

- **Multi-Dashboard Interface**: Dedicated portals for Patients, Emergency Dispatchers, and Doctors.
- **AI-Powered Triage**: Intelligent preliminary assessment of emergency situations to prioritize critical cases effectively.
- **Real-Time Synchronization**: Cross-tab and cross-dashboard live updates using modern state management and Firebase.
- **Precise Geolocation**: Advanced location tracking integrating browser geolocation and mapping for accurate dispatch.
- **Secure Medical Data**: Doctor-controlled medicine approval workflows and sensitive protocol data hidden from unauthorized views.
- **Voice-to-Text Integration**: Streamlined patient case submission through accurate voice recognition.

## 🛠️ Technology Stack

- **Frontend Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS & Radix UI Primitives
- **Animations**: Framer Motion
- **Backend/Database**: Firebase (Firestore) & Google Cloud Run
- **AI Integration**: Custom AI Triage Services

## 🚦 Getting Started

Follow these steps to run the application locally:

### Prerequisites
- Node.js (v18 or higher)
- npm, yarn, or pnpm
- Firebase account and project set up

### Installation

1. **Clone the repository:**
   ```bash
   git clone <your-repository-url>
   cd medilink
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Environment Variables:**
   Create a `.env.local` file in the root directory and add your Firebase and AI service API keys based on the provided `.env` examples.

4. **Run the development server:**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Open the application:**
   Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## 📝 License

This project is licensed under the MIT License.
