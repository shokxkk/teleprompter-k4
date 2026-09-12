"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import mammoth from "mammoth";
import {
  Play,
  Pause,
  RotateCcw,
  Upload,
  FileText,
  Video,
  VideoOff,
  Mic,
  MicOff,
  FlipHorizontal,
  FlipVertical,
  RotateCw,
  Maximize2,
  Minimize2,
  Plus,
  Trash2,
  Edit3,
  Download,
  HelpCircle,
  BookOpen,
  CheckCircle2,
  Menu,
  X,
  Settings,
  Mail,
  Send,
  ExternalLink,
  Sparkles,
  Image as ImageIcon,
  FileSpreadsheet,
  Layers,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

interface ContentItem {
  id: string;
  title?: string | null;
  type: string;
  editorialStatus: string;
  productionStatus: string;
  versions: Array<{
    id: string;
    versionNumber: number;
    payload: unknown;
  }>;
}

const DEFAULT_K4_ITEMS: ContentItem[] = [
  {
    id: "demo-script-1",
    title: "Shoxjaxon_Reels_51_100_31_kun",
    type: "reels_script",
    editorialStatus: "approved",
    productionStatus: "ready_to_shoot",
    versions: [
      {
        id: "ver-demo-1",
        versionNumber: 1,
        payload: {
          title: "Shoxjaxon_Reels_51_100_31_kun",
          spokenText: `Instagram uchunyana 50 ta Reels 2 oy [Пауза 2 сек]
51-100 ssenariylar 31-60 kunlar Marketing Markazi Sotuv bo'limi rahbari.

[Улыбнитесь!] Ushbu hujjat O'zbekistondagi biznes egalari orasida ekspertlikni ko'rsatish, sotuv bo'limini boshqarish bo'yicha foyda berish va mos murojaatlar olish uchun tayyorlandi.

[Акцент!] Asosiy auditoriya - rivojlanayotgan, katta sotuv bo'limi bor yoki qurmoqchi bo'lgan tadbirkorlar.

Har bir ssenariyda aniq struktura bor:
1. Kuchli ilmoq (Hook)
2. Asosiy muammo va yechim
3. Harakatga da'vat (CTA)

[Пауза 1 сек] Diqqat bilan o'qing va videolarni tasvirga olishni boshlang!`,
        },
      },
    ],
  },
  {
    id: "demo-script-2",
    title: "Shoxjaxon_50_Reels_30_kun",
    type: "reels_script",
    editorialStatus: "approved",
    productionStatus: "ready_to_shoot",
    versions: [
      {
        id: "ver-demo-2",
        versionNumber: 1,
        payload: {
          title: "Shoxjaxon_50_Reels_30_kun",
          spokenText: `Sotuv bo'limini 2 baravar oshirish sirlari.

[Улыбнитесь!] Salom tadbirkor! Bugun sotuvchilar KPI va motivatsiyasini qanday to'g'ri yo'lga qo'yish kerakligini ko'rib chiqamiz.

[Акцент!] 3 ta asosiy xato:
1. Rejasiz ish tutish
2. Nazorat yo'qligi
3. Skriptlarsiz gaplashish

[Пауза 2 сек] Videoni saqlab qo'ying va jamoangizga yuboring!`,
        },
      },
    ],
  },
  {
    id: "demo-script-3",
    title: "[DEMO] Keyingi aloqa narxi",
    type: "reels_script",
    editorialStatus: "approved",
    productionStatus: "ready_to_shoot",
    versions: [
      {
        id: "ver-demo-3",
        versionNumber: 1,
        payload: {
          title: "[DEMO] Keyingi aloqa narxi",
          spokenText: `Mijozlar bilan aloqa narxi va LTV.

[Пауза 1 сек] Har bir kelgan lid sizga qanchaga tushayapti?

[Акцент!] Agar siz reklama byudjetini tejamasangiz, biznes zarariga ishlaydi.

[Улыбнитесь!] Batafsil ma'lumot olish uchun profilga o'ting!`,
        },
      },
    ],
  },
];

export function ShootingPageClient({ readyItems: initialItems }: ShootingPageClientProps) {
  const defaultItems = initialItems && initialItems.length > 0 ? initialItems : DEFAULT_K4_ITEMS;
  const [items, setItems] = useState<ContentItem[]>(defaultItems);
  const [selectedId, setSelectedId] = useState<string | null>(defaultItems[0]?.id ?? null);

  // Sync with localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("teleprompter_k4_scripts");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setItems(parsed);
          setSelectedId(parsed[0].id);
        }
      }
    } catch (e) {
      console.warn("Failed to load local scripts:", e);
    }
  }, []);

  useEffect(() => {
    try {
      if (items.length > 0) {
        localStorage.setItem("teleprompter_k4_scripts", JSON.stringify(items));
      }
    } catch (e) {
      console.warn("Failed to save local scripts:", e);
    }
  }, [items]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [wpm, setWpm] = useState(150); // Words per minute
  const [fontSize, setFontSize] = useState(38);
  const [theme, setTheme] = useState<"dark" | "matrix" | "gold" | "light">("dark");
  const [isMirrored, setIsMirrored] = useState(false);
  const [isVerticalMirrored, setIsVerticalMirrored] = useState(false);
  const [rotationAngle, setRotationAngle] = useState(0); // 0, 90, 180, 270 degrees
  const [showReadingZone, setShowReadingZone] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Responsive mobile sidebar & settings modal state
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Help & Onboarding Modal state
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Active word index for Karaoke mode
  const [currentWordIndex, setCurrentWordIndex] = useState(0);

  // Image zoom scale
  const [imageZoom, setImageZoom] = useState(100);

  // Voice Follow / STT
  const [isVoiceFollow, setIsVoiceFollow] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Camera & Video Recorder
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // Countdown overlay
  const [countdown, setCountdown] = useState<number | null>(null);

  // Upload modal & State
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [manualText, setManualText] = useState("");
  const [manualTitle, setManualTitle] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  // Edit Script modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editText, setEditText] = useState("");

  // Drag & drop state
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);

  const activeItem = items.find((i) => i.id === selectedId);
  const activeVersion = activeItem?.versions[0];
  const payload = activeVersion?.payload as {
    spokenText?: string;
    title?: string;
    fileType?: string;
    imageUrl?: string | null;
    hooks?: Array<{ textUz: string }>;
    ctas?: Array<{ textUz: string }>;
    segments?: Array<{ spokenText: string }>;
  } | null;

  const isImageMode = payload?.fileType === "image" || Boolean(payload?.imageUrl);

  // Raw text string
  const fullText = useMemo(() => {
    if (!payload) return "";
    const main = payload.spokenText ?? payload.segments?.map((s) => s.spokenText).join("\n\n") ?? "";
    const hook = payload.hooks?.[0]?.textUz ?? "";
    const cta = payload.ctas?.[0]?.textUz ?? "";
    return [hook, main, cta].filter(Boolean).join("\n\n");
  }, [payload]);

  // Words breakdown with Speaker Cue Markers support ([Пауза], [Улыбнитесь!], [Акцент!])
  const words = useMemo(() => {
    if (!fullText) return [];

    // Tokenize text into bracketed cues [ ... ], spaces, or normal text
    const rawTokens = fullText.split(/(\[[^\]]+\]|\s+)/);

    return rawTokens.filter(Boolean).map((token, idx) => {
      const isSpace = /^\s+$/.test(token);
      const isCueMarker = /^\[[^\]]+\]$/.test(token);

      let cueType: "pause" | "smile" | "accent" | "general" | null = null;
      if (isCueMarker) {
        const lower = token.toLowerCase();
        if (lower.includes("пауза") || lower.includes("pause")) {
          cueType = "pause";
        } else if (lower.includes("улыб") || lower.includes("эмоц") || lower.includes("smile")) {
          cueType = "smile";
        } else if (lower.includes("акцент") || lower.includes("важно") || lower.includes("вниман")) {
          cueType = "accent";
        } else {
          cueType = "general";
        }
      }

      return {
        id: idx,
        text: token,
        isSpace,
        isCueMarker,
        cueType,
      };
    });
  }, [fullText]);

  const nonSpaceWordIndices = useMemo(() => {
    return words
      .map((w, idx) => (!w.isSpace ? idx : null))
      .filter((idx): idx is number => idx !== null);
  }, [words]);

  // Reset when item changes
  useEffect(() => {
    setIsPlaying(false);
    setCurrentWordIndex(0);
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [selectedId]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error("Error attempting to enable fullscreen:", err);
      });
    } else {
      document.exitFullscreen().catch((err) => console.error(err));
    }
  };

  // Auto-scroll Timer based on WPM
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;

    if (isPlaying) {
      if (isImageMode && scrollRef.current) {
        // Image smooth scroll
        timer = setInterval(() => {
          if (scrollRef.current) {
            scrollRef.current.scrollTop += 2;
          }
        }, 30);
      } else if (nonSpaceWordIndices.length > 0) {
        const msPerWord = (60 / wpm) * 1000;

        timer = setInterval(() => {
          setCurrentWordIndex((prevIdx) => {
            const currentPosInNonSpace = nonSpaceWordIndices.indexOf(prevIdx);
            if (currentPosInNonSpace === -1 || currentPosInNonSpace >= nonSpaceWordIndices.length - 1) {
              setIsPlaying(false);
              return prevIdx;
            }
            return nonSpaceWordIndices[currentPosInNonSpace + 1];
          });
        }, msPerWord);
      }
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying, wpm, nonSpaceWordIndices, isImageMode]);

  // Auto-scroll current word into focus box
  useEffect(() => {
    if (!isImageMode && currentWordIndex >= 0 && wordRefs.current[currentWordIndex] && scrollRef.current) {
      const element = wordRefs.current[currentWordIndex];
      if (element) {
        element.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "nearest",
        });
      }
    }
  }, [currentWordIndex, isImageMode]);

  // Keyboard controls
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === "Space") {
        e.preventDefault();
        togglePlay();
      } else if (e.code === "KeyR") {
        resetTeleprompter();
      } else if (e.code === "KeyF") {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.code === "ArrowUp") {
        e.preventDefault();
        setWpm((prev) => Math.min(prev + 15, 400));
      } else if (e.code === "ArrowDown") {
        e.preventDefault();
        setWpm((prev) => Math.max(prev - 15, 50));
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        jumpWord(-5);
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        jumpWord(5);
      } else if (e.code === "KeyM") {
        setIsMirrored((prev) => !prev);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPlaying, nonSpaceWordIndices, currentWordIndex]);

  const togglePlay = () => {
    if (!isPlaying) {
      if (currentWordIndex === 0) {
        setCountdown(3);
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev === 1) {
              clearInterval(timer);
              setIsPlaying(true);
              return null;
            }
            return prev ? prev - 1 : null;
          });
        }, 1000);
      } else {
        setIsPlaying(true);
      }
    } else {
      setIsPlaying(false);
    }
  };

  const resetTeleprompter = () => {
    setIsPlaying(false);
    setCurrentWordIndex(0);
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  };

  const jumpWord = (delta: number) => {
    const currentPos = nonSpaceWordIndices.indexOf(currentWordIndex);
    const newPos = Math.max(0, Math.min(nonSpaceWordIndices.length - 1, (currentPos === -1 ? 0 : currentPos) + delta));
    if (nonSpaceWordIndices[newPos] !== undefined) {
      setCurrentWordIndex(nonSpaceWordIndices[newPos]);
    }
  };

  const handleOpenEditModal = () => {
    if (!activeItem) return;
    setEditTitle(activeItem.title || "Сценарий");
    setEditText(fullText || "");
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedId) return;
    const newTitle = editTitle.trim() || "Сценарий";
    const newText = editText.trim();

    setItems((prev) =>
      prev.map((item) => {
        if (item.id === selectedId) {
          const updatedVersions = item.versions ? [...item.versions] : [];
          if (updatedVersions[0]) {
            updatedVersions[0] = {
              ...updatedVersions[0],
              payload: {
                ...(updatedVersions[0].payload as any),
                title: newTitle,
                spokenText: newText,
              },
            };
          } else {
            updatedVersions.push({
              id: `ver-${Date.now()}`,
              versionNumber: 1,
              payload: { title: newTitle, spokenText: newText },
            });
          }
          return { ...item, title: newTitle, versions: updatedVersions };
        }
        return item;
      })
    );

    setCurrentWordIndex(0);
    setShowEditModal(false);

    try {
      await fetch("/api/scripts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedId, title: newTitle, text: newText }),
      });
    } catch (err) {
      console.warn("Background edit sync warning:", err);
    }
  };

  const handleDeleteScript = async (idToDelete: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!window.confirm("Удалить этот сценарий из Телесуфлёра?")) return;

    setItems((prev) => {
      const nextItems = prev.filter((item) => item.id !== idToDelete);
      if (selectedId === idToDelete) {
        setSelectedId(nextItems[0]?.id ?? null);
      }
      return nextItems;
    });

    try {
      await fetch(`/api/scripts?id=${idToDelete}`, {
        method: "DELETE",
      });
    } catch (err) {
      console.warn("Background delete sync warning:", err);
    }
  };

  const handleExportScript = (format: "txt" | "docx") => {
    if (!fullText) return;
    const rawTitle = activeItem?.title || "scenariy";
    const cleanTitle = rawTitle.replace(/[^\w\sа-яА-ЯўқғҳЎҚҒҲ-]/gi, "_").trim();
    const fileName = `${cleanTitle || "scenariy"}.${format}`;

    let blob: Blob;
    if (format === "docx") {
      const htmlContent = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${activeItem?.title || "Сценарий"}</title></head><body><h2>${activeItem?.title || "Сценарий"}</h2><p style="font-family:Arial,sans-serif;font-size:14pt;line-height:1.8;white-space:pre-wrap;">${fullText.replace(/\n/g, "<br>")}</p></body></html>`;
      blob = new Blob([htmlContent], { type: "application/msword;charset=utf-8" });
    } else {
      blob = new Blob([fullText], { type: "text/plain;charset=utf-8" });
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Upload File handler with clean async/await & guaranteed instant display
  // Upload File handler with instant client display & background database sync
  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    setUploadError(null);
    try {
      const fileTitle = file.name.replace(/\.[^/.]+$/, "");
      const ext = file.name.toLowerCase().includes(".") ? file.name.toLowerCase().split(".").pop() : "";

      let scriptText = "";
      let fileType = "text";
      let imageUrl: string | null = null;

      // 1. If image file
      if (["png", "jpg", "jpeg", "webp", "gif", "svg"].includes(ext ?? "") || file.type.startsWith("image/")) {
        fileType = "image";
        const arrayBuffer = await file.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString("base64");
        const mime = file.type || `image/${ext || "jpeg"}`;
        imageUrl = `data:${mime};base64,${base64}`;
        scriptText = `[Изображение: ${file.name}]`;
      } else {
        // 2. Try Mammoth arrayBuffer parsing FIRST for any document
        try {
          const arrayBuffer = await file.arrayBuffer();
          const result = await mammoth.extractRawText({ arrayBuffer });
          if (result.value && result.value.trim().length > 0) {
            scriptText = result.value.trim();
          }
        } catch (mErr) {
          console.warn("Client mammoth extraction warning:", mErr);
        }

        // 3. If mammoth didn't extract text (e.g. .txt, .md, .csv), read text with file.text()
        if (!scriptText) {
          try {
            const rawText = await file.text();
            scriptText = rawText.trim();
          } catch (tErr) {
            console.warn("file.text() error:", tErr);
          }
        }
      }

      // Fallback text if still empty
      if (!scriptText && !imageUrl) {
        scriptText = `Сценарий из файла ${file.name}`;
      }

      // 4. Create local item and update state IMMEDIATELY for zero delay & 100% reliability
      const tempId = `local-${Date.now()}`;
      const tempItem: ContentItem = {
        id: tempId,
        title: fileTitle || "Документ Word",
        type: fileType,
        editorialStatus: "approved",
        productionStatus: "ready_to_shoot",
        versions: [
          {
            id: `ver-${Date.now()}`,
            versionNumber: 1,
            payload: {
              title: fileTitle,
              spokenText: scriptText,
              fileType,
              imageUrl,
            },
          },
        ],
      };

      setItems((prev) => [tempItem, ...prev]);
      setSelectedId(tempId);
      setCurrentWordIndex(0);
      setShowAddModal(false);

      // 5. Sync to database in background
      try {
        const res = await fetch("/api/scripts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: fileTitle, text: scriptText }),
        });
        const data = await res.json();
        if (data.item) {
          if (fileType === "image" && imageUrl) {
            data.item.versions[0].payload.fileType = "image";
            data.item.versions[0].payload.imageUrl = imageUrl;
          }
          setItems((prev) => prev.map((item) => (item.id === tempId ? data.item : item)));
          setSelectedId((current) => (current === tempId ? data.item.id : current));
        }
      } catch (dbErr) {
        console.warn("Database sync warning:", dbErr);
      }
    } catch (err: any) {
      console.error("Upload error:", err);
      setUploadError("Ошибка чтения файла");
    } finally {
      setIsUploading(false);
    }
  };

  // Create Manual Text Script
  const handleCreateManualScript = async () => {
    if (!manualText.trim()) return;
    setIsUploading(true);
    try {
      const scriptTitle = manualTitle || "Мой сценарий";
      const scriptText = manualText.trim();
      const tempId = `local-${Date.now()}`;
      const tempItem: ContentItem = {
        id: tempId,
        title: scriptTitle,
        type: "text",
        editorialStatus: "approved",
        productionStatus: "ready_to_shoot",
        versions: [
          {
            id: `ver-${Date.now()}`,
            versionNumber: 1,
            payload: {
              title: scriptTitle,
              spokenText: scriptText,
              fileType: "text",
            },
          },
        ],
      };

      setItems((prev) => [tempItem, ...prev]);
      setSelectedId(tempId);
      setManualText("");
      setManualTitle("");
      setShowAddModal(false);

      try {
        const res = await fetch("/api/scripts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: scriptTitle, text: scriptText }),
        });
        const data = await res.json();
        if (data.item) {
          setItems((prev) => prev.map((item) => (item.id === tempId ? data.item : item)));
          setSelectedId((current) => (current === tempId ? data.item.id : current));
        }
      } catch (dbErr) {
        console.warn("Manual script DB sync warning:", dbErr);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  // WebCam Toggle
  const toggleCamera = async () => {
    if (isCameraActive) {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }
      setIsCameraActive(false);
      setIsRecording(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setIsCameraActive(true);
        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        }, 100);
      } catch (err) {
        alert("Не удалось получить доступ к веб-камере и микрофону");
      }
    }
  };

  // MediaRecorder Video Recording
  const startRecording = () => {
    if (!videoRef.current?.srcObject) return;
    const stream = videoRef.current.srcObject as MediaStream;
    recordedChunksRef.current = [];

    const recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) recordedChunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      setRecordedVideoUrl(url);
    };

    recorder.start();
    mediaRecorderRef.current = recorder;
    setIsRecording(true);
    togglePlay();
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPlaying(false);
    }
  };

  // Voice Follow / Web Speech API
  const toggleVoiceFollow = () => {
    if (isVoiceFollow) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsVoiceFollow(false);
    } else {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        alert("Распознавание речи поддерживается в Google Chrome");
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "ru-RU";

      recognition.onresult = (event: any) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript.toLowerCase() + " ";
        }

        const lastSpokenWords = transcript.trim().split(/\s+/).slice(-3);
        for (const spokenWord of lastSpokenWords) {
          const matchIndex = words.findIndex((w, idx) => idx >= currentWordIndex && w.text.toLowerCase().includes(spokenWord));
          if (matchIndex !== -1) {
            setCurrentWordIndex(matchIndex);
            break;
          }
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
      setIsVoiceFollow(true);
      setIsPlaying(true);
    }
  };

  // Theme style mapping
  const themeStyles = {
    dark: { bg: "#09090b", text: "#f4f4f5", activeBg: "#facc15", activeText: "#000000", zoneBg: "rgba(250, 204, 21, 0.12)" },
    matrix: { bg: "#051508", text: "#4ade80", activeBg: "#22c55e", activeText: "#051508", zoneBg: "rgba(34, 197, 94, 0.15)" },
    gold: { bg: "#120c02", text: "#fde047", activeBg: "#eab308", activeText: "#000000", zoneBg: "rgba(234, 179, 8, 0.18)" },
    light: { bg: "#ffffff", text: "#18181b", activeBg: "#2563eb", activeText: "#ffffff", zoneBg: "rgba(37, 99, 235, 0.12)" },
  }[theme];

  return (
    <div
      style={{
        display: "flex",
        height: isFullscreen ? "100vh" : "calc(100vh - 4rem)",
        position: "relative",
        overflow: "hidden",
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDraggingFile(true);
      }}
      onDragLeave={() => setIsDraggingFile(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDraggingFile(false);
        if (e.dataTransfer.files?.[0]) {
          handleFileUpload(e.dataTransfer.files[0]);
        }
      }}
    >
      {/* Drag overlay notice */}
      {isDraggingFile && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 999,
            background: "rgba(99, 102, 241, 0.92)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            backdropFilter: "blur(8px)",
          }}
        >
          <Upload size={64} style={{ marginBottom: "1rem", animation: "bounce 1s infinite" }} />
          <h2 style={{ fontSize: "1.8rem", fontWeight: 700 }}>Отпустите файл для загрузки</h2>
          <p style={{ opacity: 0.9 }}>Поддерживаются Word (.docx), PowerPoint (.pptx), Фото (.png, .jpg), .txt</p>
        </div>
      )}

      {/* Uploading loading overlay */}
      {isUploading && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 999,
            background: "rgba(9, 9, 11, 0.88)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            color: "#facc15",
            backdropFilter: "blur(6px)",
          }}
        >
          <div className="spinner" style={{ width: 48, height: 48, borderWidth: 4, borderColor: "rgba(250, 204, 21, 0.3)", borderTopColor: "#facc15", marginBottom: "1.5rem" }} />
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#ffffff" }}>Читаю файл Word...</h2>
          <p style={{ color: "#a1a1aa", marginTop: "0.5rem" }}>Извлекаю текст и добавляю в Телесуфлёр k4</p>
        </div>
      )}

      {/* Sidebar List (Hidden in Fullscreen for maximum viewing space) */}
      {!isFullscreen && (
        <div
          style={{
            width: 310,
            borderRight: "1px solid var(--color-border)",
            background: "var(--color-surface)",
            display: "flex",
            flexDirection: "column",
            zIndex: 40,
          }}
        >
          {/* Logo Header */}
          <div style={{ padding: "0.85rem 1rem", borderBottom: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <img
                src="/logo.png"
                alt="Телесуфлёр k4 Logo"
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: "10px",
                  objectFit: "cover",
                  boxShadow: "0 0 12px rgba(99, 102, 241, 0.4)",
                  border: "1px solid rgba(99, 102, 241, 0.5)",
                }}
              />
              <div>
                <h2 style={{ fontSize: "1.05rem", margin: 0, fontWeight: 700, color: "var(--color-brand-600)", lineHeight: 1.2 }}>
                  Телесуфлёр k4
                </h2>
                <span style={{ fontSize: "0.72rem", color: "var(--color-text-tertiary)", fontWeight: 500 }}>
                  Профессиональная версия
                </span>
              </div>
            </div>

            <button
              className="btn btn-primary btn-sm"
              onClick={() => setShowAddModal(true)}
              style={{ borderRadius: "50%", width: 34, height: 34, padding: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
              title="Загрузить новый документ (Word, PPTX, Фото, Текст)"
            >
              <Plus size={18} />
            </button>
          </div>

          {/* Quick Upload Drop Area */}
          <div style={{ padding: "0.75rem" }}>
            <label
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "0.85rem 0.5rem",
                border: "2px dashed var(--color-border)",
                borderRadius: "var(--radius-md)",
                background: "var(--color-surface-hover)",
                cursor: "pointer",
                textAlign: "center",
                transition: "all 0.2s",
              }}
            >
              <Upload size={20} color="var(--color-brand-500)" style={{ marginBottom: "0.25rem" }} />
              <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--color-text-primary)" }}>
                Загрузить документ / Фото
              </span>
              <span style={{ fontSize: "0.68rem", color: "var(--color-text-tertiary)", marginTop: "0.15rem" }}>
                Word (.docx), PowerPoint, Фото, Text
              </span>
              <input
                type="file"
                accept="*/*"
                style={{ display: "none" }}
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    handleFileUpload(e.target.files[0]);
                    e.target.value = "";
                  }
                }}
              />
            </label>
          </div>

          {/* Items List */}
          <div style={{ flex: 1, overflowY: "auto", padding: "0.5rem" }}>
            {items.length === 0 ? (
              <div className="empty-state" style={{ padding: "2rem 1rem" }}>
                <p style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)" }}>
                  Загрузите Word (.docx), PowerPoint или картинку для чтения.
                </p>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    setSelectedId(item.id);
                    resetTeleprompter();
                  }}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0.65rem 0.75rem",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid",
                    borderColor: selectedId === item.id ? "var(--color-brand-300)" : "transparent",
                    background: selectedId === item.id ? "var(--color-brand-50)" : "transparent",
                    color: selectedId === item.id ? "var(--color-brand-700)" : "var(--color-text-primary)",
                    cursor: "pointer",
                    marginBottom: "0.35rem",
                    transition: "all 0.15s",
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0, paddingRight: "0.5rem" }}>
                    <div style={{ fontWeight: 600, fontSize: "0.875rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {item.type === "image" ? "🖼️ " : "📄 "}
                      {item.title || "Документ Телесуфлёра"}
                    </div>
                    <div style={{ fontSize: "0.72rem", color: "var(--color-text-tertiary)", marginTop: "0.15rem" }}>
                      Готов к чтению в k4
                    </div>
                  </div>

                  <button
                    onClick={(e) => handleDeleteScript(item.id, e)}
                    title="Удалить сценарий"
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "#ef4444",
                      padding: "4px 6px",
                      borderRadius: "4px",
                      cursor: "pointer",
                      opacity: 0.8,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.8")}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Advertiser & Contact Footer Info */}
          <div
            style={{
              padding: "0.75rem 1rem",
              borderTop: "1px solid var(--color-border)",
              background: "var(--color-surface-secondary)",
              fontSize: "0.75rem",
            }}
          >
            <div style={{ fontWeight: 700, color: "var(--color-brand-600)", marginBottom: "0.25rem" }}>
              📢 Biznes uchun / Реклама:
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem", color: "var(--color-text-secondary)" }}>
              <a href="mailto:shokxk@gmail.com" style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                <Mail size={12} /> shokxk@gmail.com
              </a>
              <a href="https://t.me/headsales" target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: "0.3rem", color: "#0088cc", fontWeight: 600 }}>
                <Send size={12} /> Telegram: @headsales
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Main Prompter Workspace */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          background: themeStyles.bg,
          color: themeStyles.text,
          position: "relative",
          userSelect: "none",
        }}
      >
        {/* Responsive Top Control Bar */}
        <div
          style={{
            padding: "0.6rem 1rem",
            borderBottom: `1px solid ${theme === "light" ? "#e4e4e7" : "#27272a"}`,
            background: theme === "light" ? "#ffffff" : "#121215",
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "0.6rem",
            zIndex: 10,
          }}
        >
          {/* Main Play / Edit / Delete Controls */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
            <button
              className="btn"
              onClick={togglePlay}
              style={{
                background: isPlaying ? "#ef4444" : "#4f46e5",
                color: "#ffffff",
                fontWeight: 700,
                padding: "0.45rem 1.1rem",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                boxShadow: isPlaying ? "0 0 15px rgba(239, 68, 68, 0.4)" : "0 0 15px rgba(79, 70, 229, 0.4)",
              }}
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} />}
              {isPlaying ? "ПАУЗА" : "СТАРТ"}
            </button>

            <button
              className="btn btn-secondary btn-sm"
              onClick={resetTeleprompter}
              title="Сбросить в начало (Клавиша R)"
              style={{ background: "#27272a", color: "#e4e4e7", border: "none", padding: "0.45rem 0.6rem" }}
            >
              <RotateCcw size={16} />
            </button>

            {/* Edit Text Button */}
            {activeItem && !isImageMode && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={handleOpenEditModal}
                title="Редактировать текст сценария"
                style={{
                  background: "#312e81",
                  color: "#e0e7ff",
                  border: "1px solid #4338ca",
                  fontSize: "0.8rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  padding: "0.45rem 0.75rem",
                  fontWeight: 600,
                }}
              >
                <Edit3 size={15} />
                <span className="hide-mobile">Редактировать</span>
              </button>
            )}

            {/* Delete Script Button */}
            {activeItem && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={(e) => selectedId && handleDeleteScript(selectedId, e)}
                title="Удалить текущий сценарий"
                style={{
                  background: "rgba(239, 68, 68, 0.15)",
                  color: "#ef4444",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  fontSize: "0.8rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  padding: "0.45rem 0.65rem",
                  fontWeight: 600,
                }}
              >
                <Trash2 size={15} />
                <span className="hide-mobile">Удалить</span>
              </button>
            )}
          </div>

          {/* Sliders: Speed WPM & Font Size */}
          {!isImageMode && (
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <span style={{ fontSize: "0.75rem", opacity: 0.8, color: "#a1a1aa" }}>Скорость:</span>
                <input
                  type="range"
                  min="50"
                  max="350"
                  step="10"
                  value={wpm}
                  onChange={(e) => setWpm(Number(e.target.value))}
                  style={{ width: 80, accentColor: "#6366f1" }}
                />
                <span style={{ fontWeight: 700, fontSize: "0.78rem", background: "#27272a", color: "#facc15", padding: "0.15rem 0.4rem", borderRadius: "4px" }}>
                  {wpm} WPM
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <span style={{ fontSize: "0.75rem", opacity: 0.8, color: "#a1a1aa" }}>Шрифт:</span>
                <input
                  type="range"
                  min="20"
                  max="64"
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  style={{ width: 75, accentColor: "#6366f1" }}
                />
                <span style={{ fontWeight: 700, fontSize: "0.78rem", background: "#27272a", color: "#60a5fa", padding: "0.15rem 0.4rem", borderRadius: "4px" }}>
                  {fontSize}px
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons: Voice Follow, Fullscreen, Settings & Help */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
            {/* Voice Follow Toggle */}
            <button
              className={`btn btn-sm ${isVoiceFollow ? "btn-success" : "btn-secondary"}`}
              onClick={toggleVoiceFollow}
              title="Слежение за голосом (Web Speech)"
              style={{
                background: isVoiceFollow ? "#16a34a" : "#27272a",
                color: "#ffffff",
                border: "none",
                fontSize: "0.78rem",
              }}
            >
              <Mic size={14} />
              <span className="hide-mobile">{isVoiceFollow ? "Голос ВКЛ" : "Авто-Голос"}</span>
            </button>

            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              className="btn btn-secondary btn-sm"
              title="Весь экран (Клавиша F)"
              style={{ background: isFullscreen ? "#4f46e5" : "#27272a", color: "#fff", border: "none" }}
            >
              {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            </button>

            {/* Settings Modal Toggle Button */}
            <button
              onClick={() => setShowSettingsModal(true)}
              className="btn btn-secondary btn-sm"
              title="Настройки зеркала, поворота, темы и экспорта"
              style={{
                background: "#27272a",
                color: "#f4f4f5",
                border: "1px solid #3f3f46",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "0.3rem",
              }}
            >
              <Settings size={15} />
              <span>Настройки</span>
            </button>

            {/* Help / Guide Button */}
            <button
              onClick={() => setShowHelpModal(true)}
              className="btn btn-secondary btn-sm"
              title="Инструкция пользователя"
              style={{
                background: "#4338ca",
                color: "#ffffff",
                border: "none",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "0.3rem",
              }}
            >
              <HelpCircle size={15} />
              <span className="hide-mobile">Инструкция</span>
            </button>
          </div>
        </div>

        {/* Camera Preview Overlay if Active */}
        {isCameraActive && (
          <div
            style={{
              position: "absolute",
              top: 70,
              right: 20,
              width: 240,
              height: 180,
              borderRadius: 12,
              overflow: "hidden",
              border: "2px solid #4f46e5",
              zIndex: 30,
              boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
              background: "#000",
            }}
          >
            <video ref={videoRef} autoPlay playsInline muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            <div style={{ position: "absolute", bottom: 8, left: 8, right: 8, display: "flex", justifyContent: "space-between" }}>
              {!isRecording ? (
                <button onClick={startRecording} className="btn btn-danger btn-sm" style={{ fontSize: "0.75rem", width: "100%" }}>
                  ● Записать
                </button>
              ) : (
                <button onClick={stopRecording} className="btn btn-secondary btn-sm" style={{ fontSize: "0.75rem", width: "100%", background: "#dc2626" }}>
                  ■ Стоп
                </button>
              )}
            </div>
          </div>
        )}

        {/* Countdown overlay */}
        {countdown !== null && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 50,
              background: "rgba(0,0,0,0.85)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "8rem",
              fontWeight: 900,
              color: "#facc15",
              animation: "pulse 1s infinite",
            }}
          >
            {countdown}
          </div>
        )}

        {/* Focus Reading Zone Highlight Overlay */}
        {!isImageMode && showReadingZone && (
          <div
            style={{
              position: "absolute",
              top: "46%",
              left: "5%",
              right: "5%",
              height: `${fontSize * 2.2}px`,
              transform: "translateY(-50%)",
              background: themeStyles.zoneBg,
              borderTop: "2px solid rgba(99, 102, 241, 0.4)",
              borderBottom: "2px solid rgba(99, 102, 241, 0.4)",
              borderRadius: 8,
              pointerEvents: "none",
              zIndex: 5,
            }}
          />
        )}

        {/* Prompter Reader View */}
        <div
          ref={scrollRef}
          style={{
            flex: 1,
            overflowY: "auto",
            padding: isImageMode ? "2rem" : "35vh 4rem 45vh",
            transform: `rotate(${rotationAngle}deg) ${isMirrored ? "scaleX(-1)" : ""} ${isVerticalMirrored ? "scaleY(-1)" : ""}`.trim() || "none",
            fontSize: `${fontSize}px`,
            lineHeight: 1.8,
            fontFamily: "'Outfit', 'Inter', sans-serif",
            fontWeight: 600,
            maxWidth: 1050,
            margin: "0 auto",
            width: "100%",
            textAlign: "center",
            scrollBehavior: "smooth",
          }}
        >
          {isImageMode && payload?.imageUrl ? (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100%" }}>
              <img
                src={payload.imageUrl}
                alt="Изображение телесуфлёра"
                style={{
                  maxWidth: `${imageZoom}%`,
                  height: "auto",
                  borderRadius: 12,
                  boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                }}
              />
            </div>
          ) : words.length === 0 ? (
            <div style={{ opacity: 0.6, fontSize: "1.2rem", marginTop: "5rem" }}>
              Выберите или загрузите документ Word, PowerPoint или Картинку слева
            </div>
          ) : (
            words.map((w, idx) => {
              const isActive = idx === currentWordIndex;

              if (w.isSpace) {
                return <span key={idx}>{w.text}</span>;
              }

              // Cue Marker rendering ([Пауза], [Улыбнитесь!], [Акцент!])
              if (w.isCueMarker) {
                const cueStyle =
                  w.cueType === "pause"
                    ? { bg: "rgba(234, 179, 8, 0.25)", color: "#facc15", border: "2px dashed #eab308" }
                    : w.cueType === "smile"
                    ? { bg: "rgba(34, 197, 94, 0.25)", color: "#4ade80", border: "2px dashed #22c55e" }
                    : w.cueType === "accent"
                    ? { bg: "rgba(239, 68, 68, 0.25)", color: "#f87171", border: "2px dashed #ef4444" }
                    : { bg: "rgba(168, 85, 247, 0.25)", color: "#c084fc", border: "2px dashed #a855f7" };

                return (
                  <span
                    key={idx}
                    ref={(el) => {
                      wordRefs.current[idx] = el;
                    }}
                    onClick={() => setCurrentWordIndex(idx)}
                    style={{
                      display: "inline-block",
                      padding: "0.15em 0.55em",
                      margin: "0 0.25em",
                      borderRadius: "8px",
                      fontSize: "0.85em",
                      fontWeight: 700,
                      cursor: "pointer",
                      background: isActive ? themeStyles.activeBg : cueStyle.bg,
                      color: isActive ? themeStyles.activeText : cueStyle.color,
                      border: cueStyle.border,
                      transform: isActive ? "scale(1.15)" : "scale(1)",
                      boxShadow: isActive ? "0 4px 20px rgba(250, 204, 21, 0.5)" : "none",
                      transition: "all 0.15s ease-in-out",
                    }}
                  >
                    📌 {w.text}
                  </span>
                );
              }

              return (
                <span
                  key={idx}
                  ref={(el) => {
                    wordRefs.current[idx] = el;
                  }}
                  onClick={() => setCurrentWordIndex(idx)}
                  style={{
                    display: "inline-block",
                    padding: "0.1em 0.25em",
                    borderRadius: "6px",
                    cursor: "pointer",
                    transition: "all 0.15s ease-in-out",
                    background: isActive ? themeStyles.activeBg : "transparent",
                    color: isActive ? themeStyles.activeText : "inherit",
                    transform: isActive ? "scale(1.15)" : "scale(1)",
                    boxShadow: isActive ? "0 4px 20px rgba(250, 204, 21, 0.4)" : "none",
                  }}
                >
                  {w.text}
                </span>
              );
            })
          )}
        </div>
      </div>

      {/* Manual Add Script Modal */}
      {showAddModal && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 100,
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            backdropFilter: "blur(4px)",
          }}
        >
          <div className="card" style={{ width: "100%", maxWidth: 540, padding: "1.5rem" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1rem" }}>
              Добавить документ в Телесуфлёр k4
            </h3>

            {uploadError && (
              <div style={{ background: "#fee2e2", color: "#dc2626", padding: "0.75rem", borderRadius: "8px", marginBottom: "1rem", fontSize: "0.85rem" }}>
                {uploadError}
              </div>
            )}

            <div style={{ marginBottom: "1rem" }}>
              <label className="label">Файл (Word .docx, PowerPoint .pptx, Фото, Text)</label>
              <input
                type="file"
                accept="*/*"
                className="input"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    handleFileUpload(e.target.files[0]);
                    e.target.value = "";
                  }
                }}
              />
            </div>

            <div className="divider" style={{ margin: "1rem 0" }} />

            <div style={{ marginBottom: "1rem" }}>
              <label className="label">Или введите название</label>
              <input
                className="input"
                placeholder="Название файла"
                value={manualTitle}
                onChange={(e) => setManualTitle(e.target.value)}
              />
            </div>

            <div style={{ marginBottom: "1.25rem" }}>
              <label className="label">Текст сценария</label>
              <textarea
                className="input textarea"
                rows={6}
                placeholder="Вставьте готовый текст..."
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
              />
            </div>

            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
              <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                Отмена
              </button>
              <button
                className="btn btn-primary"
                onClick={handleCreateManualScript}
                disabled={isUploading || !manualText.trim()}
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Script Modal */}
      {showEditModal && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 100,
            background: "rgba(0,0,0,0.75)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            backdropFilter: "blur(4px)",
          }}
        >
          <div className="card" style={{ width: "100%", maxWidth: 680, padding: "1.5rem" }}>
            <h3 style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: "1rem", color: "var(--color-brand-600)" }}>
              ✏️ Редактирование сценария
            </h3>

            <div style={{ marginBottom: "1rem" }}>
              <label className="label">Название документа</label>
              <input
                className="input"
                placeholder="Название сценария"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
              />
            </div>

            <div style={{ marginBottom: "1.25rem" }}>
              <label className="label">Текст для Телесуфлёра (можно изменять, добавлять или удалять слова)</label>
              <textarea
                className="input textarea"
                rows={12}
                style={{ fontSize: "1rem", lineHeight: 1.6, fontFamily: "inherit" }}
                placeholder="Текст сценария..."
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
              />
            </div>

            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
              <button className="btn btn-secondary" onClick={() => setShowEditModal(false)}>
                Отмена
              </button>
              <button className="btn btn-primary" onClick={handleSaveEdit}>
                Сохранить изменения
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 110,
            background: "rgba(0,0,0,0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            backdropFilter: "blur(6px)",
          }}
        >
          <div
            className="card"
            style={{
              width: "100%",
              maxWidth: 620,
              maxHeight: "85vh",
              overflowY: "auto",
              padding: "1.75rem",
              background: "#18181b",
              border: "1px solid #3f3f46",
              borderRadius: "16px",
              color: "#f4f4f5",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", borderBottom: "1px solid #27272a", paddingBottom: "0.75rem" }}>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 700, margin: 0, color: "#ffffff", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                ⚙️ Настройки Телесуфлёра k4
              </h3>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setShowSettingsModal(false)}
                style={{ background: "#27272a", color: "#fff", border: "none", borderRadius: "50%", width: 30, height: 30, padding: 0 }}
              >
                ✕
              </button>
            </div>

            {/* 1. Theme Selection */}
            <div style={{ marginBottom: "1.25rem" }}>
              <label className="label" style={{ color: "#a1a1aa", marginBottom: "0.5rem" }}>🎨 Тема оформления экрана</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
                {(["dark", "matrix", "gold", "light"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTheme(t)}
                    style={{
                      padding: "0.6rem 0.5rem",
                      borderRadius: "8px",
                      fontSize: "0.82rem",
                      fontWeight: 600,
                      border: theme === t ? "2px solid #6366f1" : "1px solid #3f3f46",
                      background: t === "dark" ? "#09090b" : t === "matrix" ? "#051508" : t === "gold" ? "#120c02" : "#ffffff",
                      color: t === "dark" ? "#fff" : t === "matrix" ? "#4ade80" : t === "gold" ? "#fde047" : "#000",
                      cursor: "pointer",
                      textAlign: "center",
                    }}
                  >
                    {t === "dark" ? "🌙 Тёмный" : t === "matrix" ? "🟢 Матрица" : t === "gold" ? "🟡 Золото" : "☀️ Светлый"}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Mirroring & Rotation */}
            <div style={{ marginBottom: "1.25rem" }}>
              <label className="label" style={{ color: "#a1a1aa", marginBottom: "0.5rem" }}>🔄 Оптическое зеркало и Поворот экрана</label>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <button
                  onClick={() => setIsMirrored(!isMirrored)}
                  className="btn btn-secondary"
                  style={{ background: isMirrored ? "#4f46e5" : "#27272a", color: "#fff", border: "none", flex: 1 }}
                >
                  <FlipHorizontal size={16} /> Зеркало H ({isMirrored ? "ВКЛ" : "ВЫКЛ"})
                </button>
                <button
                  onClick={() => setIsVerticalMirrored(!isVerticalMirrored)}
                  className="btn btn-secondary"
                  style={{ background: isVerticalMirrored ? "#4f46e5" : "#27272a", color: "#fff", border: "none", flex: 1 }}
                >
                  <FlipVertical size={16} /> Зеркало V ({isVerticalMirrored ? "ВКЛ" : "ВЫКЛ"})
                </button>
                <button
                  onClick={() => setRotationAngle((r) => (r + 90) % 360)}
                  className="btn btn-secondary"
                  style={{ background: rotationAngle !== 0 ? "#4f46e5" : "#27272a", color: "#fff", border: "none", flex: 1 }}
                >
                  <RotateCw size={16} /> Поворот {rotationAngle}°
                </button>
              </div>
            </div>

            {/* 3. Camera preview toggle */}
            <div style={{ marginBottom: "1.25rem" }}>
              <label className="label" style={{ color: "#a1a1aa", marginBottom: "0.5rem" }}>📹 Веб-камера и Запись видео</label>
              <button
                onClick={toggleCamera}
                className="btn btn-secondary"
                style={{ width: "100%", background: isCameraActive ? "#059669" : "#27272a", color: "#fff", border: "none" }}
              >
                {isCameraActive ? <Video size={16} /> : <VideoOff size={16} />}
                {isCameraActive ? "Выключить Веб-камеру" : "Включить Веб-камеру для записи"}
              </button>
            </div>

            {/* 4. Export script */}
            {activeItem && !isImageMode && (
              <div style={{ marginBottom: "1.25rem" }}>
                <label className="label" style={{ color: "#a1a1aa", marginBottom: "0.5rem" }}>📥 Скачать текущий сценарий с правками</label>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={() => handleExportScript("docx")}
                    className="btn btn-secondary"
                    style={{ flex: 1, background: "#27272a", color: "#38bdf8", border: "none" }}
                  >
                    <Download size={16} /> Скачать в Word (.DOCX)
                  </button>
                  <button
                    onClick={() => handleExportScript("txt")}
                    className="btn btn-secondary"
                    style={{ flex: 1, background: "#27272a", color: "#a1a1aa", border: "none" }}
                  >
                    <Download size={16} /> Скачать Текст (.TXT)
                  </button>
                </div>
              </div>
            )}

            {/* 5. Contact Section */}
            <div style={{ padding: "0.85rem", background: "#09090b", borderRadius: "10px", border: "1px solid #27272a" }}>
              <div style={{ fontWeight: 700, color: "#6366f1", marginBottom: "0.3rem", fontSize: "0.85rem" }}>
                📢 Biznes uchun / Реклама и сотрудничество:
              </div>
              <div style={{ display: "flex", gap: "1.5rem", fontSize: "0.82rem", flexWrap: "wrap" }}>
                <a href="mailto:shokxk@gmail.com" style={{ color: "#d4d4d8", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                  <Mail size={14} /> shokxk@gmail.com
                </a>
                <a href="https://t.me/headsales" target="_blank" rel="noreferrer" style={{ color: "#38bdf8", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.3rem" }}>
                  <Send size={14} /> Telegram: @headsales
                </a>
              </div>
            </div>

            <div style={{ marginTop: "1.25rem", display: "flex", justifyContent: "flex-end" }}>
              <button className="btn btn-primary" onClick={() => setShowSettingsModal(false)}>
                Готово
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Help & Visual User Guide Modal */}
      {showHelpModal && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 120,
            background: "rgba(0,0,0,0.85)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1.5rem",
            backdropFilter: "blur(8px)",
          }}
        >
          <div
            className="card"
            style={{
              width: "100%",
              maxWidth: 840,
              maxHeight: "85vh",
              overflowY: "auto",
              padding: "1.75rem",
              background: "#18181b",
              border: "1px solid #3f3f46",
              borderRadius: "16px",
              color: "#f4f4f5",
              boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <img
                  src="/logo.png"
                  alt="Телесуфлёр k4 Logo"
                  style={{ width: 42, height: 42, borderRadius: "10px", border: "1px solid #6366f1" }}
                />
                <div>
                  <h2 style={{ fontSize: "1.4rem", fontWeight: 700, margin: 0, color: "#ffffff" }}>
                    Инструкция пользователя — Телесуфлёр k4
                  </h2>
                  <p style={{ fontSize: "0.85rem", color: "#a1a1aa", margin: 0, marginTop: "0.15rem" }}>
                    Все возможности и функции вашей студии чтения
                  </p>
                </div>
              </div>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setShowHelpModal(false)}
                style={{ background: "#27272a", color: "#fff", border: "none", borderRadius: "50%", width: 34, height: 34, padding: 0, fontSize: "1.1rem" }}
              >
                ✕
              </button>
            </div>

            {/* Visual Header Banner Graphic */}
            <img
              src="/help_illustration.png"
              alt="Инструкция Телесуфлёр k4"
              style={{ width: "100%", maxHeight: 190, objectFit: "cover", borderRadius: "12px", marginBottom: "1.25rem", border: "1px solid #3f3f46" }}
            />

            {/* Guide Grid Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
              {/* Card 1: File Upload */}
              <div style={{ background: "#09090b", padding: "1.25rem", borderRadius: "12px", border: "1px solid #27272a" }}>
                <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#818cf8", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  📄 1. Загрузка документов
                </h3>
                <p style={{ fontSize: "0.85rem", color: "#d4d4d8", lineHeight: 1.5 }}>
                  Перетащите файл прямо на экран или нажмите кнопку <b>«Загрузить документ»</b>. Поддерживаются <b>Word (.docx)</b>, <b>PowerPoint (.pptx)</b>, <b>Картинки (.png, .jpg)</b> и <b>.txt</b>.
                </p>
              </div>

              {/* Card 2: Cue Markers */}
              <div style={{ background: "#09090b", padding: "1.25rem", borderRadius: "12px", border: "1px solid #27272a" }}>
                <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#facc15", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  📌 2. Цветные маркеры спикера
                </h3>
                <p style={{ fontSize: "0.82rem", color: "#d4d4d8", lineHeight: 1.4, marginBottom: "0.6rem" }}>
                  Вставляйте указания в квадратных скобках <code>[...]</code> прямо в текст:
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", fontSize: "0.78rem" }}>
                  <span style={{ background: "rgba(234, 179, 8, 0.2)", color: "#facc15", padding: "0.25rem 0.5rem", borderRadius: "6px", border: "1px dashed #eab308" }}>
                    📌 [Пауза 2 сек] — Пауза в речи
                  </span>
                  <span style={{ background: "rgba(34, 197, 94, 0.2)", color: "#4ade80", padding: "0.25rem 0.5rem", borderRadius: "6px", border: "1px dashed #22c55e" }}>
                    📌 [Улыбнитесь!] — Напоминание об эмоции
                  </span>
                  <span style={{ background: "rgba(239, 68, 68, 0.2)", color: "#f87171", padding: "0.25rem 0.5rem", borderRadius: "6px", border: "1px dashed #ef4444" }}>
                    📌 [Акцент!] — Интонационный акцент
                  </span>
                </div>
              </div>

              {/* Card 3: Rotation & Mirroring */}
              <div style={{ background: "#09090b", padding: "1.25rem", borderRadius: "12px", border: "1px solid #27272a" }}>
                <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#38bdf8", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  🔄 3. Переворот и Зеркало (Optical Rig)
                </h3>
                <p style={{ fontSize: "0.85rem", color: "#d4d4d8", lineHeight: 1.5 }}>
                  Используйте <b>Зеркало H</b>, <b>Зеркало V</b> и <b>90°</b> для съемки через физическое стекло телесуфлёра или при любом повороте планшета и ноутбука.
                </p>
              </div>

              {/* Card 4: Keyboard Shortcuts */}
              <div style={{ background: "#09090b", padding: "1.25rem", borderRadius: "12px", border: "1px solid #27272a" }}>
                <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#4ade80", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  🎹 4. Горячие клавиши
                </h3>
                <ul style={{ fontSize: "0.8rem", color: "#d4d4d8", paddingLeft: "1.2rem", margin: 0, lineHeight: 1.6 }}>
                  <li><b>Пробел</b> — СТАPT / ПАУЗА</li>
                  <li><b>R</b> — Перезапуск в начало</li>
                  <li><b>F</b> — Полноэкранный режим</li>
                  <li><b>M</b> — Зеркальный режим</li>
                  <li><b>↑ / ↓</b> — Изменить скорость WPM</li>
                  <li><b>← / →</b> — Переход на 5 слов</li>
                </ul>
              </div>
            </div>

            <div style={{ marginTop: "1.5rem", display: "flex", justifyContent: "center" }}>
              <button
                className="btn btn-primary"
                onClick={() => setShowHelpModal(false)}
                style={{ padding: "0.75rem 2.5rem", fontWeight: 700, fontSize: "1rem", borderRadius: "10px" }}
              >
                Всё понятно! Перейти к чтению
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
