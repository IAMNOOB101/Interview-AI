# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

# InterviewAI – AI-Powered Interview Preparation Platform

InterviewAI is a full-stack AI-driven interview practice platform that simulates real interview scenarios, evaluates candidate responses, and provides actionable feedback.

## Features
- JWT-based authentication with HttpOnly cookies
- Role-based authorization (User / Admin)
- Domain & salary-aware interview questions
- Multilingual AI support
- AI-powered answer evaluation (content, clarity, confidence)
- Interview history & performance analytics
- Admin dashboard with user & score analytics

## Tech Stack
- Frontend: React, Vite, Axios
- Backend: Node.js, Express
- Database: MongoDB
- AI: OpenRouter (OpenAI-compatible LLMs)
- Auth: JWT, Cookies

## Admin Capabilities
- View all users
- View interview attempts
- Analyze average scores per domain

## 📌 Architecture
Client → React → Axios → Express → MongoDB  
AI via OpenRouter (LLM abstraction)

## Future Enhancements
- Speech-to-text evaluation
- Body language analysis
- Deployment (Docker, AWS)

## Author
Aadarsh Agrawal
