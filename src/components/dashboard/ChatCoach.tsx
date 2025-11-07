import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Bot, Send, X, Minimize2, Sparkles, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ChatCoachProps {
  brandId: string;
  userPlan: string;
}

const ChatCoach = ({ brandId, userPlan }: ChatCoachProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const isPro = userPlan === "pro" || userPlan === "giftedPro" || userPlan === "business" || userPlan === "giftedAgency";

  // Load conversation history
  useEffect(() => {
    if (isOpen && isPro && brandId) {
      loadHistory();
      checkMessageCount();
    }
  }, [isOpen, brandId, isPro]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const loadHistory = async () => {
    const { data, error } = await supabase
      .from("coach_conversations")
      .select("role, message, created_at")
      .eq("brand_id", brandId)
      .order("created_at", { ascending: true })
      .limit(50);

    if (error) {
      console.error("Error loading history:", error);
      return;
    }

    if (data && data.length > 0) {
      setMessages(
        data.map((msg) => ({
          role: msg.role as "user" | "assistant",
          content: msg.message,
          timestamp: new Date(msg.created_at),
        }))
      );
    }
  };

  const checkMessageCount = async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const { count } = await supabase
      .from("coach_conversations")
      .select("*", { count: "exact", head: true })
      .eq("brand_id", brandId)
      .gte("created_at", yesterday.toISOString());

    setMessageCount(count || 0);
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("chat-coach", {
        body: { message: userMessage.content, brandId },
      });

      if (error) {
        if (error.message.includes("Pro plan required")) {
          toast({
            title: "Pro Feature",
            description: "Upgrade to Pro to use the AI Coach",
            variant: "destructive",
          });
          navigate("/pricing");
          return;
        }

        if (error.message.includes("rate limit") || error.message.includes("Daily message limit")) {
          toast({
            title: "Daily Limit Reached",
            description: "You've used all 50 messages today. Resets in 24 hours.",
            variant: "destructive",
          });
          return;
        }

        throw error;
      }

      const assistantMessage: Message = {
        role: "assistant",
        content: data.reply,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setMessageCount((prev) => prev + 1);
    } catch (error: any) {
      console.error("Chat error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    setInput(question);
  };

  const suggestedQuestions = [
    "Why is my score low?",
    "How do I improve on ChatGPT?",
    "What should I publish next?",
    "Analyze my competitors",
  ];

  // Free user: show upgrade prompt
  if (!isPro && isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Card className="w-96 p-6 shadow-2xl border-primary/20">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2">
              <Bot className="h-6 w-6 text-primary" />
              <h3 className="font-semibold">GEORISE Coach</h3>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="text-center py-6 space-y-4">
            <div className="p-4 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg">
              <Sparkles className="h-12 w-12 mx-auto text-primary mb-2" />
              <p className="font-medium">AI Optimization Coach</p>
              <p className="text-sm text-muted-foreground mt-2">
                Get personalized advice on improving your AI visibility
              </p>
            </div>
            
            <div className="space-y-2 text-left">
              <p className="text-sm font-medium">Pro features include:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Personalized recommendations</li>
                <li>• Real-time analysis insights</li>
                <li>• Content strategy advice</li>
                <li>• 50 messages per day</li>
              </ul>
            </div>

            <Button onClick={() => navigate("/pricing")} className="w-full">
              Upgrade to Pro
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Chat bubble (collapsed)
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 flex items-center gap-2 bg-gradient-to-br from-primary to-secondary text-white px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 animate-[pulse_20s_ease-in-out_infinite] hover:animate-none"
      >
        <Bot className="h-5 w-5" />
        <span className="font-medium">Ask Coach</span>
        <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs">Pro</span>
      </button>
    );
  }

  // Chat interface (expanded)
  return (
    <Card
      className={`fixed bottom-4 right-4 z-50 shadow-2xl border-primary/20 transition-all ${
        isMinimized ? "w-80 h-14" : "w-96 h-[600px]"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          <div>
            <h3 className="font-semibold text-sm">GEORISE Coach</h3>
            <p className="text-xs text-muted-foreground">Your AI visibility advisor</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMinimized(!isMinimized)}
          >
            <Minimize2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <ScrollArea className="h-[calc(600px-140px)] p-4" ref={scrollRef}>
            {messages.length === 0 ? (
              <div className="space-y-4">
                <div className="text-center py-6">
                  <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Hi! I'm your AI Coach. Ask me anything about improving your visibility.
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Suggested questions:</p>
                  {suggestedQuestions.map((q, i) => (
                    <Button
                      key={i}
                      variant="outline"
                      size="sm"
                      className="w-full justify-start text-left"
                      onClick={() => handleSuggestedQuestion(q)}
                    >
                      {q}
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {msg.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-lg p-3">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Ask me about your AI visibility..."
                maxLength={500}
                disabled={isLoading}
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                size="icon"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            {userPlan === "pro" || userPlan === "giftedPro" ? (
              <p className="text-xs text-muted-foreground mt-2">
                {50 - messageCount} messages left today
              </p>
            ) : null}
          </div>
        </>
      )}
    </Card>
  );
};

export default ChatCoach;
