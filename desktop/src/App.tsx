import { useState } from "react";
import { useCapture } from "./hooks/use-capture";
import { readFile, writeTextFile } from "@tauri-apps/plugin-fs";
import axios from "axios";

function App() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { capture } = useCapture();

  const captureHandler = async () => {
    try {
      setIsLoading(true);
      const capturePath = await capture();
      if (!capturePath) return;

      const fileData = await readFile(capturePath);
      const blob = new Blob([fileData]);

      const formData = new FormData();
      formData.append("file", blob);

      const { data } = await axios.postForm(
        `http://localhost:3000/image-upload`,
        formData,
      );

      writeTextFile("C:/Users/TOSHIBA/Desktop/test-ss/hasil-ai.txt", data);

      console.log(data);
    } catch (error) {
      console.error(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main>
      <h1 className="bg-black">Interval Screenshot</h1>
      <button onClick={captureHandler}>
        {isLoading ? "Capturing..." : "Capture"}
      </button>
    </main>
  );
}

export default App;
