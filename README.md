<div align="center">
  <img width="800" alt="Somnus Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

<h1 align="center">
 SOMNUS PROJECT
</h1>

<p align="center">
  <b>Un thriller psihologic 2D, stil Top-Down Maze</b>
</p>

## 🎮 Despre Joc
Somnus este un joc de acțiune și supraviețuire minimalist setat într-un mediu digital. Jucătorul preia rolul Subiectului #42, având sarcina de a naviga printr-o simulare coruptă. Obiectivul tău este de a parcurge labirintul, a colecta "memorii" pierdute și a evita **Umbra (The Shadow)** înainte ca sistemul să te asimileze definitiv.

## ⚙️ Arhitectură
Proiectul folosește un stack modern de Web Development pentru a rula fluid direct din browser:
- **React 19** pentru structura jocului.
- **Vite** pentru performanță extrem de rapidă în timpul dezvoltării.
- **TypeScript** pentru un cod organizat și sigur la standarde din industrie.
- **Framer Motion** pentru animații cinematice (tranziții de meniu glitchy, scanlines).
- **Tailwind CSS** pentru un stil modern și foarte curat integrat "in-line".

## 🚀 Instalare și Rulare Locală

Pentru a rula proiectul pe propriul sistem, urmează acești pași:

1. Instalează dependențele proiectului (necesită Node.js):
   ```bash
   npm install
   ```

2. Pornește serverul local de dezvoltare:
   ```bash
   npm run dev
   ```

Jocul va deveni disponibil local (ex: la adresa `http://localhost:3000` sau în funcție de porturile libere).

## 📂 Structura Proiectului
Acest proiect respectă principiile "Clean Architecture":
- `/src/components` - Componente de interfață și logica per-instanță reutilizabilă.
- `/src/utils` - Funcții matematice sau de helper pentru interacțiuni.
- `/src/constants` - Elemente configurabile ale jocului la nivel modular.
- `/src/types.ts` - Tiparea datelor structurate (ex: `GameState`).
- `/src/App.tsx` - Sistemul central de stări (`MENU`, `PLAYING`, `GAMEOVER`, `WIN`).

---

