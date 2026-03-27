import { useEffect, useRef, useState } from 'react';
import { apiUpdateSettings } from '@/lib/api';
import { dlog } from '@/lib/constants';

export interface SettingsState {
  gptVoice: string;
  claudeVoice: string;
  interactionStyle: string;
  topic: string;
  gptResponseLength: string;
  claudeResponseLength: string;
  gptPersonality: string;
  claudePersonality: string;
  gptQuirks: string[];
  claudeQuirks: string[];
  gptCustom: string;
  claudeCustom: string;
  gptCustomTrait: string;
  claudeCustomTrait: string;
  gptPersonalityStrength: number;
  claudePersonalityStrength: number;
  gptQuirkStrength: number;
  claudeQuirkStrength: number;
  gptTtsSpeed: number;
  claudeTtsSpeed: number;
}

export interface SettingsActions {
  setGptVoice: (v: string) => void;
  setClaudeVoice: (v: string) => void;
  setInteractionStyle: (v: string) => void;
  setTopic: (v: string) => void;
  setGptResponseLength: (v: string) => void;
  setClaudeResponseLength: (v: string) => void;
  setGptPersonality: (v: string) => void;
  setClaudePersonality: (v: string) => void;
  setGptQuirks: React.Dispatch<React.SetStateAction<string[]>>;
  setClaudeQuirks: React.Dispatch<React.SetStateAction<string[]>>;
  setGptCustom: (v: string) => void;
  setClaudeCustom: (v: string) => void;
  setGptCustomTrait: (v: string) => void;
  setClaudeCustomTrait: (v: string) => void;
  setGptPersonalityStrength: (v: number) => void;
  setClaudePersonalityStrength: (v: number) => void;
  setGptQuirkStrength: (v: number) => void;
  setClaudeQuirkStrength: (v: number) => void;
  setGptTtsSpeed: (v: number) => void;
  setClaudeTtsSpeed: (v: number) => void;
  toggleQuirk: (bot: 'gpt' | 'claude', quirk: string) => void;
  getSettings: () => Record<string, unknown>;
  resetSettingsInit: () => void;
}

export function useSettings(
  sessionId: string | null,
  onSettingsChanged: (bots: ('gpt' | 'claude')[]) => void,
): SettingsState & SettingsActions {
  const [gptVoice, _setGptVoice] = useState('shimmer');
  const [claudeVoice, _setClaudeVoice] = useState('onyx');
  const [interactionStyle, _setInteractionStyle] = useState('conversation');
  const [topic, _setTopic] = useState('');
  const [gptResponseLength, _setGptResponseLength] = useState('avg_20');
  const [claudeResponseLength, _setClaudeResponseLength] = useState('avg_20');
  const [gptPersonality, _setGptPersonality] = useState('default');
  const [claudePersonality, _setClaudePersonality] = useState('default');
  const [gptQuirks, _setGptQuirks] = useState<string[]>([]);
  const [claudeQuirks, _setClaudeQuirks] = useState<string[]>([]);
  const [gptCustom, _setGptCustom] = useState('');
  const [claudeCustom, _setClaudeCustom] = useState('');
  const [gptCustomTrait, _setGptCustomTrait] = useState('');
  const [claudeCustomTrait, _setClaudeCustomTrait] = useState('');
  const [gptPersonalityStrength, _setGptPersonalityStrength] = useState(1);
  const [claudePersonalityStrength, _setClaudePersonalityStrength] = useState(1);
  const [gptQuirkStrength, _setGptQuirkStrength] = useState(1);
  const [claudeQuirkStrength, _setClaudeQuirkStrength] = useState(1);
  const [gptTtsSpeed, _setGptTtsSpeed] = useState(1.0);
  const [claudeTtsSpeed, _setClaudeTtsSpeed] = useState(1.0);

  const settingsInitRef = useRef(false);
  const settingsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionIdRef = useRef(sessionId);
  sessionIdRef.current = sessionId;

  // Simple change flags — set by wrapped setters, read + cleared by the debounced effect
  const gptChangedRef = useRef(false);
  const claudeChangedRef = useRef(false);

  // Wrap setters to tag which bot changed
  const setGptVoice = (v: string) => { gptChangedRef.current = true; _setGptVoice(v); };
  const setClaudeVoice = (v: string) => { claudeChangedRef.current = true; _setClaudeVoice(v); };
  const setInteractionStyle = (v: string) => { gptChangedRef.current = true; claudeChangedRef.current = true; _setInteractionStyle(v); };
  const setTopic = (v: string) => { gptChangedRef.current = true; claudeChangedRef.current = true; _setTopic(v); };
  const setGptResponseLength = (v: string) => { gptChangedRef.current = true; _setGptResponseLength(v); };
  const setClaudeResponseLength = (v: string) => { claudeChangedRef.current = true; _setClaudeResponseLength(v); };
  const setGptPersonality = (v: string) => { gptChangedRef.current = true; _setGptPersonality(v); };
  const setClaudePersonality = (v: string) => { claudeChangedRef.current = true; _setClaudePersonality(v); };
  const setGptQuirks: React.Dispatch<React.SetStateAction<string[]>> = (v) => { gptChangedRef.current = true; _setGptQuirks(v); };
  const setClaudeQuirks: React.Dispatch<React.SetStateAction<string[]>> = (v) => { claudeChangedRef.current = true; _setClaudeQuirks(v); };
  const setGptCustom = (v: string) => { gptChangedRef.current = true; _setGptCustom(v); };
  const setClaudeCustom = (v: string) => { claudeChangedRef.current = true; _setClaudeCustom(v); };
  const setGptCustomTrait = (v: string) => { gptChangedRef.current = true; _setGptCustomTrait(v); };
  const setClaudeCustomTrait = (v: string) => { claudeChangedRef.current = true; _setClaudeCustomTrait(v); };
  const setGptPersonalityStrength = (v: number) => { gptChangedRef.current = true; _setGptPersonalityStrength(v); };
  const setClaudePersonalityStrength = (v: number) => { claudeChangedRef.current = true; _setClaudePersonalityStrength(v); };
  const setGptQuirkStrength = (v: number) => { gptChangedRef.current = true; _setGptQuirkStrength(v); };
  const setClaudeQuirkStrength = (v: number) => { claudeChangedRef.current = true; _setClaudeQuirkStrength(v); };
  const setGptTtsSpeed = (v: number) => { gptChangedRef.current = true; _setGptTtsSpeed(v); };
  const setClaudeTtsSpeed = (v: number) => { claudeChangedRef.current = true; _setClaudeTtsSpeed(v); };

  const getSettings = () => ({
    gpt_response_length: gptResponseLength,
    claude_response_length: claudeResponseLength,
    gpt_voice: gptVoice,
    claude_voice: claudeVoice,
    mode: interactionStyle,
    topic: topic || 'random',
    gpt_personality: gptPersonality,
    claude_personality: claudePersonality,
    gpt_quirks: gptQuirks,
    claude_quirks: claudeQuirks,
    gpt_custom: gptCustom,
    claude_custom: claudeCustom,
    gpt_custom_trait: gptCustomTrait,
    claude_custom_trait: claudeCustomTrait,
    gpt_personality_strength: gptPersonalityStrength,
    claude_personality_strength: claudePersonalityStrength,
    gpt_quirk_strength: gptQuirkStrength,
    claude_quirk_strength: claudeQuirkStrength,
    gpt_tts_speed: gptTtsSpeed,
    claude_tts_speed: claudeTtsSpeed,
  });

  // Hot-swap: push to backend on change (debounced API call, instant countdown)
  useEffect(() => {
    if (!sessionIdRef.current) return;
    if (!settingsInitRef.current) { settingsInitRef.current = true; return; }

    // Fire countdown IMMEDIATELY — don't wait for debounce
    const bots: ('gpt' | 'claude')[] = [];
    if (gptChangedRef.current) bots.push('gpt');
    if (claudeChangedRef.current) bots.push('claude');
    if (bots.length > 0) onSettingsChanged(bots);

    // Debounce the API call
    if (settingsTimerRef.current) clearTimeout(settingsTimerRef.current);
    settingsTimerRef.current = setTimeout(async () => {
      const sid = sessionIdRef.current;
      if (!sid) return;

      // Clear change flags after API push
      gptChangedRef.current = false;
      claudeChangedRef.current = false;

      dlog('settings', `Pushing update for ${bots.join(', ') || 'unknown'}`);
      try {
        await apiUpdateSettings(sid, getSettings());
        dlog('settings', 'Update confirmed by backend');
      } catch (err) {
        console.error('Settings update failed:', err);
        dlog('settings', `Update FAILED: ${err}`);
      }
    }, 300);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gptVoice, claudeVoice, interactionStyle, topic, gptResponseLength, claudeResponseLength,
      gptPersonality, claudePersonality, gptQuirks, claudeQuirks, gptCustom, claudeCustom, gptCustomTrait, claudeCustomTrait,
      gptPersonalityStrength, claudePersonalityStrength, gptQuirkStrength, claudeQuirkStrength, gptTtsSpeed, claudeTtsSpeed]);

  const toggleQuirk = (bot: 'gpt' | 'claude', quirk: string) => {
    const setter = bot === 'gpt' ? setGptQuirks : setClaudeQuirks;
    setter(prev => prev.includes(quirk) ? prev.filter(q => q !== quirk) : [...prev, quirk]);
  };

  const resetSettingsInit = () => {
    settingsInitRef.current = false;
  };

  return {
    gptVoice, setGptVoice,
    claudeVoice, setClaudeVoice,
    interactionStyle, setInteractionStyle,
    topic, setTopic,
    gptResponseLength, setGptResponseLength,
    claudeResponseLength, setClaudeResponseLength,
    gptPersonality, setGptPersonality,
    claudePersonality, setClaudePersonality,
    gptQuirks, setGptQuirks,
    claudeQuirks, setClaudeQuirks,
    gptCustom, setGptCustom,
    claudeCustom, setClaudeCustom,
    gptCustomTrait, setGptCustomTrait,
    claudeCustomTrait, setClaudeCustomTrait,
    gptPersonalityStrength, setGptPersonalityStrength,
    claudePersonalityStrength, setClaudePersonalityStrength,
    gptQuirkStrength, setGptQuirkStrength,
    claudeQuirkStrength, setClaudeQuirkStrength,
    gptTtsSpeed, setGptTtsSpeed,
    claudeTtsSpeed, setClaudeTtsSpeed,
    toggleQuirk,
    getSettings,
    resetSettingsInit,
  };
}
