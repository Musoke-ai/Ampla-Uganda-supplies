import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  ChatDots,
  QuestionCircle,
  Send,
  X,
} from "react-bootstrap-icons";

import { useSendHelpQuestionMutation } from "../features/api/agentSlice";
import TypewriterResponse from "./misc/TypewriterResponse";
import "./FloatingHelpBubble.css";

const pageLabels = [
  { match: "/home/dashboard", label: "Dashboard" },
  { match: "/home/production", label: "Production" },
  { match: "/home/inventory", label: "Products and inventory" },
  { match: "/home/stock", label: "Stock management" },
  { match: "/home/customers", label: "Customers and debt" },
  { match: "/home/branches", label: "Branches" },
  { match: "/home/sales", label: "Sales records" },
  { match: "/home/pos", label: "Sales desk" },
  { match: "/home/reports", label: "Reports" },
  { match: "/home/history", label: "History" },
  { match: "/home/documents", label: "Documents" },
  { match: "/home/settings", label: "Settings" },
  { match: "/home/staff", label: "Staff management" },
  { match: "/home/imports", label: "Imports" },
  { match: "/home/assistant", label: "Ampla Copilot" },
];

const quickQuestions = [
  "What should I do on this page?",
  "Guide me step by step",
  "What mistakes should I avoid?",
];

const welcomeMessage = {
  id: "help-welcome",
  role: "assistant",
  text:
    "Hi, I am here if you need a quick hand. Ask me what you are trying to do on this page and I will guide you without moving you away.",
};

const HELP_STORAGE_KEY = "ampla-floating-help-thread";
const HELP_SESSION_KEY = "ampla-floating-help-session";
const HELP_POSITION_KEY = "ampla-floating-help-position";
const MAX_STORED_MESSAGES = 40;

const createHelpSessionId = () =>
  `help-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const readStoredMessages = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(HELP_STORAGE_KEY) || "[]");
    if (!Array.isArray(parsed) || parsed.length === 0) return [welcomeMessage];

    return parsed
      .filter((item) => item && ["user", "assistant"].includes(item.role) && item.text)
      .slice(-MAX_STORED_MESSAGES);
  } catch (error) {
    return [welcomeMessage];
  }
};

const readHelpSessionId = () => {
  try {
    const existing = localStorage.getItem(HELP_SESSION_KEY);
    if (existing) return existing;

    const next = createHelpSessionId();
    localStorage.setItem(HELP_SESSION_KEY, next);
    return next;
  } catch (error) {
    return createHelpSessionId();
  }
};

const readHelpPosition = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(HELP_POSITION_KEY) || "null");
    if (
      parsed &&
      Number.isFinite(parsed.x) &&
      Number.isFinite(parsed.y)
    ) {
      return parsed;
    }
  } catch (error) {
  }

  return null;
};

const getPageLabel = (pathname) =>
  pageLabels.find((item) => pathname.startsWith(item.match))?.label ||
  "Current workspace page";

const FloatingHelpBubble = ({ roles = [] }) => {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState(() => readStoredMessages());
  const [animatedId, setAnimatedId] = useState(welcomeMessage.id);
  const [sessionId, setSessionId] = useState(() => readHelpSessionId());
  const [position, setPosition] = useState(() => readHelpPosition());
  const [sendHelpQuestion, { isLoading }] = useSendHelpQuestionMutation();
  const threadRef = useRef(null);
  const widgetRef = useRef(null);
  const dragRef = useRef(null);

  const roleLabel = useMemo(() => {
    const primaryRole = Array.isArray(roles) && roles.length ? roles[0] : "general user";
    return String(primaryRole || "general user");
  }, [roles]);

  const moduleLabel = useMemo(
    () => getPageLabel(location.pathname),
    [location.pathname]
  );

  const scrollThreadToBottom = () => {
    window.setTimeout(() => {
      if (threadRef.current) {
        threadRef.current.scrollTop = threadRef.current.scrollHeight;
      }
    }, 40);
  };

  const savePosition = (nextPosition) => {
    setPosition(nextPosition);
    try {
      localStorage.setItem(HELP_POSITION_KEY, JSON.stringify(nextPosition));
    } catch (error) {
    }
  };

  const clampPosition = (x, y, width, height) => {
    const margin = 12;
    const maxX = Math.max(margin, window.innerWidth - width - margin);
    const maxY = Math.max(margin, window.innerHeight - height - margin);

    return {
      x: Math.min(Math.max(margin, x), maxX),
      y: Math.min(Math.max(margin, y), maxY),
    };
  };

  const startDrag = (event) => {
    if (event.target.closest("button, textarea, input, a")) return;
    if (!widgetRef.current) return;

    const rect = widgetRef.current.getBoundingClientRect();
    const startingPosition = position || { x: rect.left, y: rect.top };

    dragRef.current = {
      pointerId: event.pointerId,
      offsetX: event.clientX - startingPosition.x,
      offsetY: event.clientY - startingPosition.y,
      width: rect.width,
      height: rect.height,
    };

    event.currentTarget.setPointerCapture?.(event.pointerId);
    event.preventDefault();
  };

  const startBubbleDrag = (event) => {
    if (!widgetRef.current) return;

    const rect = widgetRef.current.getBoundingClientRect();
    const startingPosition = position || { x: rect.left, y: rect.top };

    dragRef.current = {
      pointerId: event.pointerId,
      offsetX: event.clientX - startingPosition.x,
      offsetY: event.clientY - startingPosition.y,
      startX: event.clientX,
      startY: event.clientY,
      width: rect.width,
      height: rect.height,
      moved: false,
      target: "bubble",
    };

    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const handleDragMove = (event) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    const next = clampPosition(
      event.clientX - drag.offsetX,
      event.clientY - drag.offsetY,
      drag.width,
      drag.height
    );

    if (
      Math.abs(event.clientX - (drag.startX ?? event.clientX)) > 4 ||
      Math.abs(event.clientY - (drag.startY ?? event.clientY)) > 4
    ) {
      drag.moved = true;
    }

    drag.lastPosition = next;
    setPosition(next);
  };

  const endDrag = (event) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    dragRef.current = null;
    if (drag.lastPosition) {
      savePosition(drag.lastPosition);
    }
  };

  const endBubbleDrag = (event) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    const wasDragged = Boolean(drag.moved);
    endDrag(event);

    if (!wasDragged) {
      setOpen((value) => !value);
    }
  };

  useEffect(() => {
    try {
      localStorage.setItem(
        HELP_STORAGE_KEY,
        JSON.stringify(messages.slice(-MAX_STORED_MESSAGES))
      );
    } catch (error) {
    }
  }, [messages]);

  useEffect(() => {
    scrollThreadToBottom();
  }, [open]);

  useEffect(() => {
    if (!open || !widgetRef.current) return undefined;

    const frame = window.requestAnimationFrame(() => {
      if (!widgetRef.current) return;

      const rect = widgetRef.current.getBoundingClientRect();
      const currentPosition = position || { x: rect.left, y: rect.top };
      const next = clampPosition(currentPosition.x, currentPosition.y, rect.width, rect.height);

      if (next.x !== currentPosition.x || next.y !== currentPosition.y || !position) {
        savePosition(next);
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, [open, position]);

  useEffect(() => {
    const handleResize = () => {
      if (!position || !widgetRef.current) return;

      const rect = widgetRef.current.getBoundingClientRect();
      const next = clampPosition(position.x, position.y, rect.width, rect.height);

      if (next.x !== position.x || next.y !== position.y) {
        savePosition(next);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [position]);

  const askHelp = async (value = question) => {
    const text = String(value || "").trim();
    if (!text || isLoading) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text,
    };

    setQuestion("");
    const conversationBeforeReply = [...messages, userMessage].slice(-12);
    setMessages((current) => [...current, userMessage]);
    setAnimatedId(null);
    scrollThreadToBottom();

    try {
      const response = await sendHelpQuestion({
        question: text,
        role: roleLabel,
        module: moduleLabel,
        page: location.pathname,
        session_id: sessionId,
        conversation: conversationBeforeReply.map((item) => ({
          role: item.role,
          text: item.text,
        })),
      }).unwrap();
      const assistantMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        text:
          response?.answer ||
          "I could not find a clear guide for that yet. Try asking it another way, or mention the exact action you are trying to complete.",
      };

      setMessages((current) => [...current, assistantMessage]);
      setAnimatedId(assistantMessage.id);
      scrollThreadToBottom();
    } catch (error) {
      const assistantMessage = {
        id: `assistant-error-${Date.now()}`,
        role: "assistant",
        text:
          error?.data?.message ||
          "I am having trouble reaching the help assistant right now. The quick rule is: confirm the correct branch, check required fields, and save only when the details match the real operation.",
      };

      setMessages((current) => [...current, assistantMessage]);
      setAnimatedId(assistantMessage.id);
      scrollThreadToBottom();
    }
  };

  return (
    <div
      ref={widgetRef}
      className={`floating-help ${open ? "floating-help-open" : ""}`}
      style={
        position
          ? {
              left: `${position.x}px`,
              top: `${position.y}px`,
              right: "auto",
              bottom: "auto",
            }
          : undefined
      }
    >
      {open ? (
        <section className="floating-help-panel" aria-label="Ampla quick help">
          <header
            className="floating-help-header"
            onPointerDown={startDrag}
            onPointerMove={handleDragMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            title="Drag to move help"
          >
            <div>
              <span className="floating-help-kicker">Quick Help</span>
              <strong>Ampla Guide</strong>
              <small>{moduleLabel} - remembers this conversation</small>
            </div>
            <div className="floating-help-header-actions">
              <button
                type="button"
                className="floating-help-reset-btn"
                onClick={() => {
                  const nextSession = createHelpSessionId();
                  setMessages([welcomeMessage]);
                  setAnimatedId(welcomeMessage.id);
                  setSessionId(nextSession);
                  try {
                    localStorage.removeItem(HELP_STORAGE_KEY);
                    localStorage.setItem(HELP_SESSION_KEY, nextSession);
                  } catch (error) {
                  }
                }}
                aria-label="Start a new help conversation"
                title="Start a new help conversation"
              >
                New
              </button>
              <button
                type="button"
                className="floating-help-icon-btn"
                onClick={() => setOpen(false)}
                aria-label="Close help"
                title="Close help"
              >
                <X size={20} />
              </button>
            </div>
          </header>

          <div className="floating-help-thread" ref={threadRef}>
            {messages.map((message) => {
              const isUser = message.role === "user";

              return (
                <article
                  key={message.id}
                  className={`floating-help-message ${
                    isUser ? "floating-help-message-user" : "floating-help-message-agent"
                  }`}
                >
                  <span>{isUser ? "You" : "Guide"}</span>
                  {isUser ? (
                    <p>{message.text}</p>
                  ) : (
                    <TypewriterResponse
                      answer={message.text}
                      speed={12}
                      animate={message.id === animatedId}
                      className="floating-help-typewriter"
                    />
                  )}
                </article>
              );
            })}
            {isLoading ? (
              <article className="floating-help-message floating-help-message-agent">
                <span>Guide</span>
                <p>Let me check the guide for this page...</p>
              </article>
            ) : null}
          </div>

          <div className="floating-help-prompts">
            {quickQuestions.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => askHelp(item)}
                disabled={isLoading}
              >
                {item}
              </button>
            ))}
          </div>

          <form
            className="floating-help-composer"
            onSubmit={(event) => {
              event.preventDefault();
              askHelp();
            }}
          >
            <textarea
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Ask how to use this page..."
              rows={2}
            />
            <button
              type="submit"
              disabled={isLoading || !question.trim()}
              aria-label="Ask help"
              title="Ask help"
            >
              <Send size={18} />
            </button>
          </form>
        </section>
      ) : null}

      <button
        type="button"
        className="floating-help-bubble"
        onPointerDown={startBubbleDrag}
        onPointerMove={handleDragMove}
        onPointerUp={endBubbleDrag}
        onPointerCancel={endDrag}
        aria-label={open ? "Close help" : "Open help"}
        title={open ? "Close help" : "Open help"}
      >
        {open ? <QuestionCircle size={24} /> : <ChatDots size={24} />}
        <span>Help</span>
      </button>
    </div>
  );
};

export default FloatingHelpBubble;
