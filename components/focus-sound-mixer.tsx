"use client";

import { useState, useRef, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Volume2,
  VolumeX,
  Play,
  RotateCcw,
  Leaf,
  Wind,
  Music,
  Droplets,
  Cloud,
  Waves,
  Radio,
  Piano,
  Headphones,
} from "lucide-react";

let Howler: any = null;
let Howl: any = null;

if (typeof window !== "undefined") {
  try {
    const howler = require("howler");
    Howler = howler.Howler;
    Howl = howler.Howl;
  } catch (error) {
    console.error("Failed to load Howler:", error);
  }
}

const SOUND_CATEGORIES = {
  nature: [
    {
      id: "rain",
      name: "Rain",
      icon: <Droplets className="h-3.5 w-3.5 md:h-4 md:w-4 mr-0.5 md:mr-1" />,
    },
    {
      id: "forest",
      name: "Forest",
      icon: <Leaf className="h-3.5 w-3.5 md:h-4 md:w-4 mr-0.5 md:mr-1" />,
    },
    {
      id: "ocean",
      name: "Ocean",
      icon: <Waves className="h-3.5 w-3.5 md:h-4 md:w-4 mr-0.5 md:mr-1" />,
    },
  ],
  whiteNoise: [
    {
      id: "white",
      name: "White",
      icon: <Cloud className="h-3.5 w-3.5 md:h-4 md:w-4 mr-0.5 md:mr-1" />,
    },
    {
      id: "brown",
      name: "Brown",
      icon: <Wind className="h-3.5 w-3.5 md:h-4 md:w-4 mr-0.5 md:mr-1" />,
    },
    {
      id: "pink",
      name: "Pink",
      icon: <Radio className="h-3.5 w-3.5 md:h-4 md:w-4 mr-0.5 md:mr-1" />,
    },
  ],
  melody: [
    {
      id: "ambient",
      name: "Ambient",
      icon: <Music className="h-3.5 w-3.5 md:h-4 md:w-4 mr-0.5 md:mr-1" />,
    },
    {
      id: "piano",
      name: "Piano",
      icon: <Piano className="h-3.5 w-3.5 md:h-4 md:w-4 mr-0.5 md:mr-1" />,
    },
    {
      id: "lofi",
      name: "Lo-Fi",
      icon: <Headphones className="h-3.5 w-3.5 md:h-4 md:w-4 mr-0.5 md:mr-1" />,
    },
  ],
};

interface SoundSource {
  local: string;
  fallback?: string;
  alternate?: string;
}

interface CategorySounds {
  [key: string]: SoundSource;
}

const SOUND_URLS: {
  nature: CategorySounds;
  whiteNoise: CategorySounds;
  melody: CategorySounds;
} = {
  nature: {
    rain: {
      local: "/sounds/rain.mp3",
      fallback:
        "https://assets.mixkit.co/sfx/preview/mixkit-light-rain-loop-2393.mp3",
      alternate:
        "https://assets.mixkit.co/sfx/download/mixkit-rain-and-thunder-storm-2390.wav",
    },
    forest: {
      local: "/sounds/forest.mp3",
      fallback:
        "https://assets.mixkit.co/sfx/preview/mixkit-forest-birds-ambience-1210.mp3",
      alternate:
        "https://assets.mixkit.co/sfx/download/mixkit-forest-birds-chirping-1211.wav",
    },
    ocean: {
      local: "/sounds/ocean.mp3",
      fallback:
        "https://assets.mixkit.co/sfx/preview/mixkit-ocean-waves-1178.mp3",
      alternate:
        "https://assets.mixkit.co/sfx/download/mixkit-sea-waves-1196.wav",
    },
  },
  whiteNoise: {
    white: {
      local: "/sounds/white.mp3",
      fallback:
        "https://assets.mixkit.co/sfx/preview/mixkit-white-noise-ambience-loop-1236.mp3",
    },
    brown: {
      local: "/sounds/brown.mp3",
      fallback:
        "https://assets.mixkit.co/sfx/preview/mixkit-calm-forest-ambience-loop-1216.mp3",
    },
    pink: {
      local: "/sounds/pink.mp3",
      fallback:
        "https://assets.mixkit.co/sfx/preview/mixkit-campfire-crackles-1330.mp3",
    },
  },
  melody: {
    ambient: {
      local: "/sounds/ambient.mp3",
      fallback:
        "https://assets.mixkit.co/sfx/preview/mixkit-ethereal-fairy-win-sound-2019.mp3",
    },
    piano: {
      local: "/sounds/piano.mp3",
      fallback:
        "https://assets.mixkit.co/sfx/preview/mixkit-piano-zen-notification-919.mp3",
    },
    lofi: {
      local: "/sounds/lofi.mp3",
      fallback:
        "https://assets.mixkit.co/sfx/preview/mixkit-tech-house-vibes-130.mp3",
    },
  },
};

const ClientOnly = ({ children }: { children: React.ReactNode }) => {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) return null;
  return <>{children}</>;
};

export default function FocusSoundMixer() {
  const [natureVolume, setNatureVolume] = useState(50);
  const [whiteNoiseVolume, setWhiteNoiseVolume] = useState(30);
  const [melodyVolume, setMelodyVolume] = useState(20);
  const [masterVolume, setMasterVolume] = useState(80);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeCategory, setActiveCategory] = useState<
    "nature" | "whiteNoise" | "melody"
  >("nature");
  const [audioContextUnlocked, setAudioContextUnlocked] = useState(false);

  const [selectedTracks, setSelectedTracks] = useState({
    nature: SOUND_CATEGORIES.nature[0].id,
    whiteNoise: SOUND_CATEGORIES.whiteNoise[0].id,
    melody: SOUND_CATEGORIES.melody[0].id,
  });

  const [audioStatus, setAudioStatus] = useState({
    nature: { loaded: false, error: null as string | null },
    whiteNoise: { loaded: false, error: null as string | null },
    melody: { loaded: false, error: null as string | null },
  });

  const natureHowlRef = useRef<any | null>(null);
  const whiteNoiseHowlRef = useRef<any | null>(null);
  const melodyHowlRef = useRef<any | null>(null);

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
    return () => {
      setIsMounted(false);
    };
  }, []);

  useEffect(() => {
    if (!isMounted || typeof window === "undefined") return;

    if (!Howler) {
      try {
        const howler = require("howler");
        Howler = howler.Howler;
        Howl = howler.Howl;
      } catch (error) {
        console.error("Failed to load Howler:", error);
        return;
      }
    }

    const unlockAudioContext = () => {
      try {
        if (Howler && Howler.ctx && Howler.ctx.state !== "running") {
          Howler.ctx
            .resume()
            .then(() => {
              setAudioContextUnlocked(true);
            })
            .catch(() => {});
        } else {
          setAudioContextUnlocked(true);
        }
      } catch (e) {}
    };

    unlockAudioContext();

    const userInteractionEvents = ["click", "touchstart", "keydown"];
    const handleUserInteraction = () => {
      try {
        if (Howler && Howler.ctx && Howler.ctx.state !== "running") {
          Howler.ctx
            .resume()
            .then(() => {
              setAudioContextUnlocked(true);
              userInteractionEvents.forEach((event) => {
                document.removeEventListener(event, handleUserInteraction);
              });
            })
            .catch(() => {});
        } else {
          setAudioContextUnlocked(true);
          userInteractionEvents.forEach((event) => {
            document.removeEventListener(event, handleUserInteraction);
          });
        }
      } catch (e) {}
    };

    userInteractionEvents.forEach((event) => {
      document.addEventListener(event, handleUserInteraction, { once: true });
    });

    return () => {
      userInteractionEvents.forEach((event) => {
        document.removeEventListener(event, handleUserInteraction);
      });
    };
  }, [isMounted]);

  const stopAllSounds = () => {
    try {
      if (natureHowlRef.current) {
        natureHowlRef.current.stop();
        natureHowlRef.current.unload();
        natureHowlRef.current = null;
      }
    } catch {}
    try {
      if (whiteNoiseHowlRef.current) {
        whiteNoiseHowlRef.current.stop();
        whiteNoiseHowlRef.current.unload();
        whiteNoiseHowlRef.current = null;
      }
    } catch {}
    try {
      if (melodyHowlRef.current) {
        melodyHowlRef.current.stop();
        melodyHowlRef.current.unload();
        melodyHowlRef.current = null;
      }
    } catch {}
  };

  const createHowl = (
    sources: string[],
    category: "nature" | "whiteNoise" | "melody",
    onSuccess: (howl: any) => void
  ) => {
    if (!isMounted || typeof window === "undefined" || !Howl) return null;

    setAudioStatus((prev) => ({
      ...prev,
      [category]: { loaded: false, error: null },
    }));

    const howl = new Howl({
      src: sources,
      html5: true,
      loop: true,
      preload: true,
      volume: 0,
      format: ["mp3", "wav", "ogg"],
      onload: () => {
        setAudioStatus((prev) => ({
          ...prev,
          [category]: { loaded: true, error: null },
        }));
        onSuccess(howl);
      },
      onloaderror: () => {
        setAudioStatus((prev) => ({
          ...prev,
          [category]: { loaded: false, error: "Failed to load audio" },
        }));
      },
      onplayerror: () => {
        try {
          if (Howler && Howler.ctx && Howler.ctx.state !== "running") {
            Howler.ctx
              .resume()
              .then(() => {
                setAudioContextUnlocked(true);
                setTimeout(() => {
                  howl.play();
                }, 100);
              })
              .catch(() => {
                setAudioStatus((prev) => ({
                  ...prev,
                  [category]: {
                    ...prev[category],
                    error:
                      "Please interact with the page first (tap or click anywhere) to enable audio playback",
                  },
                }));
              });
          } else {
            setAudioStatus((prev) => ({
              ...prev,
              [category]: { ...prev[category], error: "Failed to play audio" },
            }));
          }
        } catch (e) {
          setAudioStatus((prev) => ({
            ...prev,
            [category]: { ...prev[category], error: "Failed to play audio" },
          }));
        }
      },
    });

    return howl;
  };

  const updateSoundVolume = (
    category: "nature" | "whiteNoise" | "melody",
    howl?: any
  ) => {
    if (!isMounted) return;
    const masterVolumeMultiplier = masterVolume / 100;
    let volume = 0;
    let targetHowl = howl;

    switch (category) {
      case "nature":
        volume = (natureVolume / 100) * masterVolumeMultiplier;
        if (!targetHowl && natureHowlRef.current) {
          targetHowl = natureHowlRef.current;
        }
        break;
      case "whiteNoise":
        volume = (whiteNoiseVolume / 100) * masterVolumeMultiplier;
        if (!targetHowl && whiteNoiseHowlRef.current) {
          targetHowl = whiteNoiseHowlRef.current;
        }
        break;
      case "melody":
        volume = (melodyVolume / 100) * masterVolumeMultiplier;
        if (!targetHowl && melodyHowlRef.current) {
          targetHowl = melodyHowlRef.current;
        }
        break;
    }

    if (targetHowl) {
      targetHowl.volume(volume);
    }
  };

  useEffect(() => {
    if (!isMounted || typeof window === "undefined" || !Howl) return;

    if (!isPlaying) {
      stopAllSounds();
      return;
    }

    stopAllSounds();

    const loadAudio = (
      category: "nature" | "whiteNoise" | "melody",
      trackId: string,
      ref: React.MutableRefObject<any | null>
    ) => {
      const soundData =
        SOUND_URLS[category][trackId as keyof (typeof SOUND_URLS)[typeof category]];
      if (!soundData) {
        setAudioStatus((prev) => ({
          ...prev,
          [category]: { loaded: false, error: `No URL found for ${trackId}` },
        }));
        return;
      }

      const sources: string[] = [];
      if (soundData.local) sources.push(soundData.local);
      if (soundData.fallback) sources.push(soundData.fallback);
      if (soundData.alternate) sources.push(soundData.alternate);

      const howlInstance = createHowl(sources, category, (howl) => {
        updateSoundVolume(category, howl);
        if (category === activeCategory && isPlaying && audioContextUnlocked) {
          howl.play();
        }
      });

      ref.current = howlInstance;
    };

    loadAudio("nature", selectedTracks.nature, natureHowlRef);
    loadAudio("whiteNoise", selectedTracks.whiteNoise, whiteNoiseHowlRef);
    loadAudio("melody", selectedTracks.melody, melodyHowlRef);
  }, [
    isMounted,
    isPlaying,
    selectedTracks,
    activeCategory,
    audioContextUnlocked,
  ]);

  useEffect(() => {
    if (!isMounted) return;
    updateSoundVolume("nature");
    updateSoundVolume("whiteNoise");
    updateSoundVolume("melody");
  }, [isMounted, natureVolume, whiteNoiseVolume, melodyVolume, masterVolume]);

  const togglePlayback = () => {
    setIsPlaying((prev) => !prev);
  };

  const handleTabChange = (value: string) => {
    if (!isMounted) return;
    const newCategory = value as "nature" | "whiteNoise" | "melody";
    if (newCategory !== activeCategory) {
      toast(`Changing to ${newCategory} sounds`, { duration: 1500 });
      setActiveCategory(newCategory);
    }
  };

  const handleTrackChange = (
    category: keyof typeof selectedTracks,
    trackId: string
  ) => {
    if (selectedTracks[category] === trackId) {
      if (category !== activeCategory) {
        toast(`Changing to ${category} sounds`, { duration: 1500 });
        setActiveCategory(category);
      }
      return;
    }

    const trackName = SOUND_CATEGORIES[category].find((t) => t.id === trackId)
      ?.name;
    if (trackName) {
      toast(`Switching to ${trackName} sound`, { duration: 1500 });
    }
    setSelectedTracks((prev) => ({ ...prev, [category]: trackId }));
    setAudioStatus((prev) => ({
      ...prev,
      [category]: { loaded: false, error: null },
    }));
    setActiveCategory(category);
  };

  return (
    <Card className="shadow-lg w-full max-w-[95vw] sm:max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-foreground">
          <span>Sound Mixer</span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={togglePlayback}
              className="h-10 w-10"
              aria-label={isPlaying ? "Pause sound" : "Play sound"}
            >
              {isPlaying ? (
                <RotateCcw className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5" />
              )}
            </Button>
          </div>
        </CardTitle>
        <CardDescription>
          Adjust the sliders to mix your perfect focus sound environment
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {masterVolume > 0 ? (
                <Volume2 className="h-5 w-5 text-primary" />
              ) : (
                <VolumeX className="h-5 w-5 text-muted-foreground" />
              )}
              <Label htmlFor="master-volume">Master Volume</Label>
            </div>
            <span className="text-sm text-muted-foreground w-8 text-right">
              {masterVolume}%
            </span>
          </div>
          <Slider
            id="master-volume"
            min={0}
            max={100}
            step={1}
            value={[masterVolume]}
            onValueChange={(v) => setMasterVolume(v[0])}
            className="cursor-pointer"
            aria-label="Master volume"
          />
        </div>

        <Tabs
          defaultValue="nature"
          value={activeCategory}
          onValueChange={handleTabChange}
          className="w-full"
        >
          <TabsList className="grid grid-cols-3 mb-4 gap-1">
            <TabsTrigger
              value="nature"
              className="flex items-center justify-center gap-1 md:gap-2 text-xs md:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-1 py-1.5"
            >
              <Leaf className="h-3.5 w-3.5 md:h-4 md:w-4 mr-0.5 md:mr-1" />
              <span>Nature</span>
            </TabsTrigger>
            <TabsTrigger
              value="whiteNoise"
              className="flex items-center justify-center gap-1 md:gap-2 text-xs md:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-1 py-1.5"
            >
              <Wind className="h-3.5 w-3.5 md:h-4 md:w-4 mr-0.5 md:mr-1" />
              <span>White Noise</span>
            </TabsTrigger>
            <TabsTrigger
              value="melody"
              className="flex items-center justify-center gap-1 md:gap-2 text-xs md:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-1 py-1.5"
            >
              <Music className="h-3.5 w-3.5 md:h-4 md:w-4 mr-0.5 md:mr-1" />
              <span>Melody</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="nature" className="space-y-4">
            <div className="grid grid-cols-3 gap-1 md:gap-2">
              {SOUND_CATEGORIES.nature.map((track) => (
                <Button
                  key={track.id}
                  variant={
                    selectedTracks.nature === track.id ? "default" : "outline"
                  }
                  onClick={() => handleTrackChange("nature", track.id)}
                  className={`w-full flex items-center justify-center text-xs md:text-sm py-1.5 md:py-2 px-1 md:px-3 h-auto ${
                    selectedTracks.nature === track.id
                      ? "bg-primary text-primary-foreground"
                      : ""
                  }`}
                >
                  <span className="flex items-center">
                    {track.icon}
                    <span>{track.name}</span>
                  </span>
                </Button>
              ))}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="nature-volume">Volume</Label>
                <span className="text-sm text-muted-foreground w-8 text-right">
                  {natureVolume}%
                </span>
              </div>
              <Slider
                id="nature-volume"
                min={0}
                max={100}
                step={1}
                value={[natureVolume]}
                onValueChange={(v) => setNatureVolume(v[0])}
                className="cursor-pointer"
                aria-label="Nature volume"
              />
              {audioStatus.nature.error && (
                <p className="text-xs text-destructive mt-1">
                  {audioStatus.nature.error}
                </p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="whiteNoise" className="space-y-4">
            <div className="grid grid-cols-3 gap-1 md:gap-2">
              {SOUND_CATEGORIES.whiteNoise.map((track) => (
                <Button
                  key={track.id}
                  variant={
                    selectedTracks.whiteNoise === track.id ? "default" : "outline"
                  }
                  onClick={() => handleTrackChange("whiteNoise", track.id)}
                  className={`w-full flex items-center justify-center text-xs md:text-sm py-1.5 md:py-2 px-1 md:px-3 h-auto ${
                    selectedTracks.whiteNoise === track.id
                      ? "bg-primary text-primary-foreground"
                      : ""
                  }`}
                >
                  <span className="flex items-center">
                    {track.icon}
                    <span>{track.name}</span>
                  </span>
                </Button>
              ))}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="whitenoise-volume">Volume</Label>
                <span className="text-sm text-muted-foreground w-8 text-right">
                  {whiteNoiseVolume}%
                </span>
              </div>
              <Slider
                id="whitenoise-volume"
                min={0}
                max={100}
                step={1}
                value={[whiteNoiseVolume]}
                onValueChange={(v) => setWhiteNoiseVolume(v[0])}
                className="cursor-pointer"
                aria-label="White noise volume"
              />
              {audioStatus.whiteNoise.error && (
                <p className="text-xs text-destructive mt-1">
                  {audioStatus.whiteNoise.error}
                </p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="melody" className="space-y-4">
            <div className="grid grid-cols-3 gap-1 md:gap-2">
              {SOUND_CATEGORIES.melody.map((track) => (
                <Button
                  key={track.id}
                  variant={
                    selectedTracks.melody === track.id ? "default" : "outline"
                  }
                  onClick={() => handleTrackChange("melody", track.id)}
                  className={`w-full flex items-center justify-center text-xs md:text-sm py-1.5 md:py-2 px-1 md:px-3 h-auto ${
                    selectedTracks.melody === track.id
                      ? "bg-primary text-primary-foreground"
                      : ""
                  }`}
                >
                  <span className="flex items-center">
                    {track.icon}
                    <span>{track.name}</span>
                  </span>
                </Button>
              ))}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="melody-volume">Volume</Label>
                <span className="text-sm text-muted-foreground w-8 text-right">
                  {melodyVolume}%
                </span>
              </div>
              <Slider
                id="melody-volume"
                min={0}
                max={100}
                step={1}
                value={[melodyVolume]}
                onValueChange={(v) => setMelodyVolume(v[0])}
                className="cursor-pointer"
                aria-label="Melody volume"
              />
              {audioStatus.melody.error && (
                <p className="text-xs text-destructive mt-1">
                  {audioStatus.melody.error}
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>

      <CardFooter className="flex flex-col items-center gap-2">
        <p className="text-sm text-muted-foreground">
          Adjust sliders to create your perfect sound mix
        </p>

        <ClientOnly>

          {!audioContextUnlocked && isMounted && (
            <div className="text-xs text-amber-500 text-center mt-2">
              <p>Tap anywhere on the page to enable audio playback</p>
            </div>
          )}
        </ClientOnly>
      </CardFooter>
    </Card>
  );
}
