import "./App.css";
import { ExperienceProvider, useExperience } from "./state/ExperienceContext";
import { LoadingScene } from "./scenes/LoadingScene";
import { PhotoboothScene } from "./scenes/PhotoboothScene";

function Experience() {
  const { phase } = useExperience();

  return (
    <>
      {phase === "loading" && <LoadingScene />}
      {phase !== "loading" && <PhotoboothScene />}
    </>
  );
}

function App() {
  return (
    <main className="app-shell">
      <ExperienceProvider>
        <Experience />
      </ExperienceProvider>
    </main>
  );
}

export default App;
