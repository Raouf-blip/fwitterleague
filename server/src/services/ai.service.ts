import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

// Initialize Gemini Flash model lazily inside the function to avoid startup errors if key is missing
// and to ensure better error messaging.

export interface AnalyzeResult {
  pseudo: string;
  champion: string;
  kills: number;
  deaths: number;
  assists: number;
  cs: number;
  cs_min?: number;
  side?: "blue" | "red";
  win?: boolean;
  game_duration?: number;
}

export async function analyzeScreenshot(
  imageUrl: string,
  participants: string[],
): Promise<AnalyzeResult[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Erreur: La variable GEMINI_API_KEY est manquante dans le fichier .env du serveur.",
    );
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `
    Tu es un expert analyste de League of Legends.
    Ta mission est d'extraire les statistiques de cette capture d'écran de tableau des scores.
    
    Voici la liste des joueurs attendus dans la partie (participants connus) :
    ${participants.join(", ")}

    Règles strictes :
    1. Essaie de repérer la durée de la partie (ex: "25:30"). Si trouvée, convertis en secondes.
    2. Pour chaque ligne de joueur, essaie de faire correspondre le pseudo avec la liste des participants.
    3. Si le pseudo lu ressemble fortement à un participant, utilise le nom exact du participant.
    4. Récupère : Champion, Kills, Morts, Assists, Sbires (CS).
    5. Si CS/min est visible, récupère-le. Sinon, calcule-le si la durée est connue (CS / DuréeEnMinutes).
    6. Détermine l'équipe (Bleue ou Rouge) selon la position (généralement 5 premiers = Bleue, 5 suivants = Rouge).
    7. Détermine qui a gagné si possible (Victory/Defeat visible ?). Sinon mets null.

    Format de sortie JSON uniquement :
    {
      "duree_secondes": 0 | null,
      "joueurs": [
        {
          "pseudo": "NomExactParticipantOuLu",
          "champion": "NomChampion",
          "kills": 0,
          "morts": 0,
          "assists": 0,
          "sbires": 0,
          "cs_min": 0.0,
          "equipe": "blue" | "red",
          "resultat": "victoire" | "defaite" | null
        }
      ]
    }
  `;

  try {
    // Fetch image
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Prepare for Gemini
    const imagePart = {
      inlineData: {
        data: buffer.toString("base64"),
        mimeType: response.headers.get("content-type") || "image/png",
      },
    };

    const result = await model.generateContent([prompt, imagePart]);
    const response2 = await result.response;
    const text = response2.text();

    console.log("Raw Gemini Output:", text);

    // Clean markdown code blocks if present
    const cleanJson = text.replace(/```json|```/g, "").trim();

    const data = JSON.parse(cleanJson);
    const players = data.joueurs || (Array.isArray(data) ? data : []);
    const duration = data.duree_secondes || null;

    return players.map((d: any) => ({
      pseudo: d.pseudo,
      champion: d.champion,
      kills: d.kills,
      deaths: d.morts || d.deaths,
      assists: d.assists,
      cs: d.sbires || d.cs,
      cs_min: d.cs_min,
      side: d.equipe,
      win: d.resultat === "victoire" || d.resultat === true,
      game_duration: duration,
    }));
  } catch (error: any) {
    console.error("Gemini Analysis Error:", error);
    throw new Error("Erreur d'analyse IA: " + error.message);
  }
}
