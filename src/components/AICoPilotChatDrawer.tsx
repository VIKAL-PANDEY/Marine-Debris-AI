import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Sparkles,
  Send,
  X,
  Bot,
  User,
  Copy,
  Check,
  Minimize2,
  Maximize2,
  Trash2,
  Compass,
  Cpu,
  ChevronDown,
} from 'lucide-react';
import Markdown from 'react-markdown';
import { DetectionItem, DetectionResult, ChatMessage } from '../types/detection';
import { sendHydrographicAIChat } from '../services/api';

interface AICoPilotChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  result: DetectionResult | null;
  selectedDetection: DetectionItem | null;
  initialPrompt?: string;
}

const PRESET_PROMPTS = [
  'Draft an official NOAA Marine Debris Salvage Manifest for this survey.',
  'Analyze the ghost-fishing risk and marine mammal danger from detected nets.',
  'Recommend the optimal ROV tooling and vessel crane specs for recovery.',
  'Calculate safe towfish altitude and heading to prevent acoustic cable snagging.',
];

export const AICoPilotChatDrawer: React.FC<AICoPilotChatDrawerProps> = ({
  isOpen,
  onClose,
  result,
  selectedDetection,
  initialPrompt,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `**AQUAVISION AI Hydrographic Co-Pilot Online.**\n\nI am connected to the active side-scan sonar telemetry and acoustic detection engine. Ask me about **benthic threat modeling, ROV salvage logistics, acoustic shadow geometry, or NOAA/IMO compliance reporting**.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && initialPrompt) {
      setInput(initialPrompt);
    }
  }, [isOpen, initialPrompt]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input.trim();
    if (!query || loading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInput('');
    setLoading(true);

    try {
      const apiMessages = newHistory.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const reply = await sendHydrographicAIChat(
        apiMessages,
        result,
        selectedDetection
      );

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        content: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `⚠️ **AI Hydrographer Notice:** ${err.message || 'Failed to complete query. Please verify connection.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClear = () => {
    setMessages([
      {
        id: 'welcome-reset',
        role: 'assistant',
        content: `**Session context reset.** Telemetry synchronized with active survey: \`${result?.metadata.filename || 'No Scan'}\`. How can I assist?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <div className="fixed bottom-3 right-3 sm:bottom-5 sm:right-5 z-50 w-[95vw] sm:w-[460px] h-[580px] max-h-[85vh] bg-[#FEFEFE] border border-[#F2E8DF] rounded-lg shadow-2xl flex flex-col overflow-hidden font-sans text-[#415111] backdrop-blur-md">
      {/* Header */}
      <div className="p-3 border-b border-[#F2E8DF] bg-[#FEFEFE] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-[#F2E8DF] border border-[#D2E186] flex items-center justify-center text-[#415111]">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-tech font-bold text-[#415111] uppercase tracking-wider flex items-center gap-1.5">
              <span>AQUAVISION AI CO-PILOT</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#D2E186] border border-[#415111]/30 animate-pulse" />
            </h3>
            <p className="text-[9px] font-sans text-[#415111]/70">
              {result ? `${result.detections.length} Target(s) Context Loaded` : 'Ready for Ingestion'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleClear}
            className="p-1 rounded text-[#415111] hover:bg-[#F2E8DF] transition cursor-pointer"
            title="Clear Chat History"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded text-[#415111] hover:bg-[#F2E8DF] transition cursor-pointer"
            title="Close Assistant"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Selected Target Live Context Banner */}
      {selectedDetection && (
        <div className="px-3 py-1.5 bg-[#F2E8DF] border-b border-[#D2E186] flex items-center justify-between text-[10px] text-[#415111] font-sans">
          <div className="flex items-center gap-1 truncate">
            <Compass className="w-3 h-3 shrink-0 text-[#415111]" />
            <span className="font-bold">Active Focus:</span>
            <span className="text-[#415111] font-tech font-bold uppercase truncate">
              {selectedDetection.id} ({selectedDetection.class_name.replace(/_/g, ' ')})
            </span>
          </div>
          <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#FEFEFE] border border-[#D2E186] text-[#415111] font-tech font-bold shrink-0 tabular-nums">
            {(selectedDetection.confidence * 100).toFixed(0)}% CONF
          </span>
        </div>
      )}

      {/* Chat Messages Log */}
      <div className="flex-1 p-3 overflow-y-auto space-y-3 text-xs bg-[#FEFEFE]">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${
              m.role === 'user' ? 'items-end' : 'items-start'
            }`}
          >
            <div className="flex items-center gap-1 text-[9px] text-[#415111]/70 mb-0.5 px-1 font-tech uppercase tracking-wider">
              {m.role === 'assistant' ? (
                <>
                  <Bot className="w-2.5 h-2.5 text-[#415111]" />
                  <span>AQUAVISION AI</span>
                </>
              ) : (
                <>
                  <User className="w-2.5 h-2.5 text-[#415111]/70" />
                  <span>HYDROGRAPHER</span>
                </>
              )}
              <span>•</span>
              <span className="tabular-nums">{m.timestamp}</span>
            </div>

            <div
              className={`p-2.5 rounded-lg max-w-[90%] relative group ${
                m.role === 'user'
                  ? 'bg-[#F2E8DF] border border-[#D2E186] text-[#415111]'
                  : 'bg-[#FEFEFE] border border-[#F2E8DF] shadow-sm text-[#415111]'
              }`}
            >
              <div className="markdown-body max-w-none text-[11px] font-sans leading-relaxed space-y-1.5 text-[#415111]">
                <Markdown>{m.content}</Markdown>
              </div>

              {/* Copy action */}
              <button
                onClick={() => handleCopy(m.id, m.content)}
                className="absolute top-1 right-1 p-1 rounded bg-[#F2E8DF] text-[#415111] hover:bg-[#D2E186] opacity-0 group-hover:opacity-100 transition cursor-pointer"
                title="Copy text"
              >
                {copiedId === m.id ? (
                  <Check className="w-3 h-3 text-[#415111]" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </button>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-[#415111] text-xs py-2">
            <Bot className="w-3.5 h-3.5 text-[#415111] animate-spin" />
            <span className="text-[11px] font-sans animate-pulse">
              Consulting hydrographic models & generating response...
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Preset Action Pills */}
      <div className="p-2 border-t border-[#F2E8DF] bg-[#FEFEFE] flex items-center gap-1.5 overflow-x-auto text-[9px] no-scrollbar">
        <span className="text-[#415111] font-tech font-bold uppercase tracking-wider shrink-0">Prompts:</span>
        {PRESET_PROMPTS.map((prompt, i) => (
          <button
            key={i}
            onClick={() => handleSend(prompt)}
            disabled={loading}
            className="px-2 py-1 rounded bg-[#F2E8DF] hover:bg-[#D2E186] border border-[#D2E186] text-[#415111] font-sans font-medium whitespace-nowrap transition cursor-pointer shrink-0"
          >
            {prompt.length > 32 ? prompt.slice(0, 30) + '...' : prompt}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-2.5 border-t border-[#F2E8DF] bg-[#FEFEFE] flex items-center gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask AI about acoustic targets, salvage methods, or NOAA protocols..."
          disabled={loading}
          className="flex-1 bg-[#F2E8DF] border border-[#D2E186] rounded px-3 py-1.5 text-xs font-sans text-[#415111] placeholder-[#415111]/50 focus:outline-none focus:border-[#415111]"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className={`p-2 rounded font-bold transition cursor-pointer ${
            !input.trim() || loading
              ? 'bg-[#F2E8DF] text-[#415111]/30 cursor-not-allowed border border-[#D2E186]'
              : 'bg-[#415111] text-[#FEFEFE] hover:bg-[#415111]/90'
          }`}
          title="Send query"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
