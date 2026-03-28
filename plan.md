# Plan de Refactorizare - Proiectul Somnus

Acest document descrie pașii necesari pentru a transforma prototipul actual într-o aplicație robustă, organizată conform principiilor *Clean Code* și optimizată din punct de vedere algoritmic.

## 1. Arhitectură și Organizare (Code Clean)
Vom separa responsabilitățile în fișiere și directoare dedicate:
- `src/types/`: Interfețe și tipuri TypeScript globale.
- `src/constants/`: Date statice (configurații niveluri, setări joc).
- `src/utils/`: Algoritmi pur (Pathfinding, Math helpers).
- `src/hooks/`: Logica de stare a jocului (Game Loop, Input handling).
- `src/components/game/`: Componente UI atomice (HUD, Canvas, Modals).

## 2. Optimizare Algoritmică (A*)
Vom înlocui algoritmul BFS (Breadth-First Search) cu **A* (A-Star)** pentru inteligența artificială a Umbrei:
- **Heuristică:** Distanța Manhattan sau Euclideană pentru a prioritiza explorarea către jucător.
- **Performanță:** Utilizarea unei cozi de prioritate (Priority Queue) sau a unei liste sortate pentru setul deschis.
- **Delimitare:** Algoritmul va fi extras într-un utilitar pur, ușor de testat unitar.

## 3. Delimitarea Logică (Separation of Concerns)
- **Renderer:** O componentă dedicată exclusiv desenării pe Canvas, primind starea ca props.
- **Engine:** Un hook personalizat care gestionează `requestAnimationFrame`, coliziunile și actualizarea pozițiilor.
- **UI/HUD:** Componente React care afișează starea (Coherence, Perks, Logs) fără a interfera cu ciclul de randare al jocului.

## 4. Testabilitate și Mentenanță
- Structurarea algoritmilor ca funcții pure: `findPath(map, start, end) -> Path`.
- Extragerea logicii de coliziune în funcții utilitare: `checkCollision(pos, map) -> boolean`.
- Pregătirea structurii pentru teste unitare (ex: Jest/Vitest).

## 5. Roadmap Implementare
1. **Pasul 1:** Crearea fișierelor de tipuri și constante.
2. **Pasul 2:** Implementarea utilitarului A* în `src/utils/pathfinding.ts`.
3. **Pasul 3:** Extragerea HUD-ului în componente separate.
4. **Pasul 4:** Refactorizarea `SomnusGame.tsx` pentru a utiliza noile structuri.
5. **Pasul 5:** Verificarea finală și curățarea codului rezidual.
