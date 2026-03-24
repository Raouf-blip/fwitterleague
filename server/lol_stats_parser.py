import google.generativeai as genai
import json
import os
from PIL import Image
import io

# ==========================================
# CONFIGURATION
# ==========================================
# Remplace par ta clé API obtenue sur Google AI Studio
API_KEY = "AIzaSyAjJCWN-RkYw1OtmWUHkVlMuiV9NeCnTRM" 

# Configurer le modèle
genai.configure(api_key=API_KEY)

# Initialiser le modèle Gemini 1.5 Flash 
# (Flash est parfait pour l'OCR : rapide, précis sur les images et moins cher)
model = genai.GenerativeModel('gemini-flash-latest', 
                                  generation_config={"response_mime_type": "application/json"})

# ==========================================
# PROMPT SYSTÈME (Le secret de la précision)
# ==========================================
PROMPT_SYSTEME = """
Tu es un expert en extraction de données de jeux vidéo (OCR). 
Analyse l'image du tableau des scores de League of Legends fournie.

REGLS D'EXTRACTION :
1. Ne pas inventer de données. Si une info est illisible, mets "null".
2. Convertis les nombres en vrais entiers (pas de chaînes de caractères).
3. La 'durée_partie' est souvent en haut à droite ou en haut au centre de l'écran global. Si elle n'est pas sur cette image, mets "inconnue".
4. Pour le KDA, sépare bien 'K/D/A'.
5. Attention à ne pas confondre la colonne 'Sbires' (CS) avec la colonne 'Or' (Golds).
6. Respecte strictement le format JSON demandé.

FORMAT JSON ATTENDU :
{
  "match_info": {
    "durée_partie": "MM:SS ou inconnue"
  },
  "equipe_bleue": [
    { "pseudo": "string", "champion": "string", "kills": int, "morts": int, "assists": int, "sbires": int }
  ],
  "equipe_rouge": [
    { "pseudo": "string", "champion": "string", "kills": int, "morts": int, "assists": int, "sbires": int }
  ]
}
"""

def optimiser_image(chemin_image):
    """
    Redimensionne l'image pour l'OCR sans perdre de qualité visuelle,
    afin de réduire le coût et le temps de traitement de l'API.
    """
    with Image.open(chemin_image) as img:
        # Si l'image est trop grande, on la réduit (ex: max 1600px de large)
        if img.width > 1600:
            nouvelle_largeur = 1600
            ratio = (nouvelle_largeur / float(img.width))
            nouvelle_hauteur = int((float(img.height) * float(ratio)))
            img = img.resize((nouvelle_largeur, nouvelle_hauteur), Image.Resampling.LANCZOS)
        
        # Convertir en bytes pour l'envoi
        img_bytes = io.BytesIO()
        # Enregistrer en JPEG pour compression (qualité 85 suffit pour l'OCR)
        img.save(img_bytes, format='JPEG', quality=85)
        return img_bytes.getvalue()

def analyser_screenshot(chemin_image):
    if not os.path.exists(chemin_image):
        print(f"Erreur : Le fichier {chemin_image} n'existe pas.")
        return None

    print(f"Analyse de l'image : {chemin_image}...")
    
    try:
        # 1. Optimiser l'image avant l'envoi
        image_data = optimiser_image(chemin_image)

        # 2. Préparer le contenu pour l'API
        payload = [
            PROMPT_SYSTEME,
            {"mime_type": "image/jpeg", "data": image_data}
        ]

        # 3. Appeler l'IA
        response = model.generate_content(payload)

        # 4. Parser la réponse textuelle en JSON
        try:
            donnees_json = json.loads(response.text)
            return donnees_json
        except json.JSONDecodeError:
            print("Erreur : L'IA n'a pas renvoyé un JSON valide.")
            print("Réponse brute de l'IA :", response.text)
            return None

    except Exception as e:
        print(f"Une erreur est survenue lors de l'appel à l'API : {e}")
        return None

# ==========================================
# EXEMPLE D'UTILISATION
# ==========================================
if __name__ == "__main__":
    # Mets ton screenshot (image_0.png par exemple) dans le même dossier
    image_a_tester = "image_0.png" 
    
    # Créer un faux fichier pour le test si nécessaire (à commenter si tu as l'image)
    if not os.path.exists(image_a_tester):
        print("Veuillez placer une image nommée 'image_0.png' dans le dossier.")
    else:
        # Lancer l'analyse
        resultat = analyser_screenshot(image_a_tester)

        if resultat:
            print("\n----- STATISTIQUES EXTRAITES (JSON) -----\n")
            # Afficher le JSON propre
            print(json.dumps(resultat, indent=2, ensure_ascii=False))
            
            # Exemple pour ton site : Comment accéder à une donnée
            # print(f"\nJoueur 1 Équipe Bleue : {resultat['equipe_bleue'][0]['pseudo']}")