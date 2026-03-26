import { GoogleGenAI } from "@google/genai";

// Platforma tərəfindən təmin edilən API açarını əldə etmək üçün funksiya
const getApiKey = () => {
  // AI Studio Build mühitində açar adətən process.env.GEMINI_API_KEY-də olur
  const key = process.env.GEMINI_API_KEY;
  
  // Əgər mühitdə açar tapılmazsa (məsələn, Shared App-də), istifadəçinin təqdim etdiyi açarı ehtiyat kimi istifadə edirik
  const fallbackKey = "AIzaSyDXtCcbeuQ30UUWwSoQCWj_C6qJm5503ss";
  
  return key && key !== "MY_GEMINI_API_KEY" ? key : fallbackKey;
};

export async function getAgroAdvice(prompt: string) {
  const apiKey = getApiKey();
  
  if (!apiKey) {
    return "Xəta: API açarı tapılmadı. Zəhmət olmasa tətbiqin mühit tənzimləmələrini yoxlayın.";
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-flash-latest",
      contents: prompt,
      config: {
        systemInstruction: "Sən kənd təsərrüfatı üzrə mütəxəssis (aqronom) köməkçisisən. YALNIZ kənd təsərrüfatı, bitkiçilik, heyvandarlıq və quşçuluq sahəsində suallara cavab verirsən. Cavablarını Azərbaycan dilində, aydın və strukturlaşdırılmış şəkildə təqdim et.",
      },
    });
    
    return response.text || "Bağışlayın, cavab ala bilmədim.";
  } catch (error: any) {
    console.error("Gemini Advice Error:", error);
    return `Xəta: ${error.message || "Texniki xəta baş verdi."}`;
  }
}

export async function generateAgroImage(prompt: string) {
  const apiKey = getApiKey();
  
  if (!apiKey) {
    throw new Error("API açarı tapılmadı. Zəhmət olmasa tətbiqin mühit tənzimləmələrini yoxlayın.");
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-image-preview',
      contents: {
        parts: [
          {
            text: `Professional high-quality realistic agricultural/farming image of: ${prompt}. Cinematic lighting, detailed textures, 4k resolution.`,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
          imageSize: "1K"
        },
      },
    });

    if (response.candidates && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
    throw new Error("Şəkil yaradıla bilmədi (AI cavabında şəkil tapılmadı).");
  } catch (error: any) {
    console.error("Gemini Image Error:", error);
    
    // Kvota xətası üçün daha aydın mesaj
    if (error.message?.includes("429") || error.message?.includes("quota")) {
      throw new Error("Bu API açarının şəkil yaratma limiti dolub. Zəhmət olmasa bir az sonra yenidən yoxlayın və ya fərqli bir API açarı istifadə edin.");
    }
    
    throw new Error(`Şəkil xətası: ${error.message || "Bilinməyən xəta"}`);
  }
}
