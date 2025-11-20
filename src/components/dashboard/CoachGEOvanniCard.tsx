import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Bot, Send, Maximize2, Minimize2, Sparkles, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface CoachGEOvanniCardProps {
  brandId: string;
  userPlan: string;
}

const CoachGEOvanniCard = ({ brandId, userPlan }: CoachGEOvanniCardProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const isPro = userPlan === "pro" || userPlan === "giftedPro" || userPlan === "business" || userPlan === "giftedAgency";

  useEffect(() => {
    if (isPro && brandId) {
      loadHistory();
      checkMessageCount();
    }
  }, [brandId, isPro]);

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
      .limit(20);

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
            description: "Upgrade to Pro to use Coach GEOvanni",
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

  const suggestedQuestions = [
    "Why is my score low?",
    "How do I improve?",
    "What should I publish?",
  ];

  const renderChatContent = () => (
    <>
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        <ScrollArea className="flex-1 pr-4 mb-4 h-full">
          {messages.length === 0 ? (
            <div className="space-y-3">
              <div className="text-center py-4">
                <Bot className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Hi! I'm Coach GEOvanni. Ask me anything about improving your visibility.
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Quick questions:</p>
                {suggestedQuestions.map((q, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-left text-xs"
                    onClick={() => setInput(q)}
                  >
                    {q}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg p-3 ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
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
      </div>

      <div className="space-y-2 flex-shrink-0">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask Coach GEOvanni..."
            maxLength={500}
            disabled={isLoading}
            className="text-sm"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          {50 - messageCount} messages left today
        </p>
      </div>
    </>
  );

  if (!isPro) {
    return (
      <div className="bg-card rounded-xl p-6 border border-border shadow-sm h-full flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Bot className="h-6 w-6 text-primary" />
            <h3 className="text-lg font-semibold">Chat with Coach GEOvanni</h3>
          </div>
        </div>
        
        <div className="text-center py-6 space-y-4 flex-1 flex flex-col justify-center">
          <div className="p-4 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg">
            <Sparkles className="h-12 w-12 mx-auto text-primary mb-2" />
            <p className="font-medium">AI Optimization Coach</p>
            <p className="text-sm text-muted-foreground mt-2">
              Get personalized advice on improving your GEO
            </p>
          </div>
          
          <Button onClick={() => navigate("/pricing")} className="w-full">
            Upgrade to Pro
          </Button>
        </div>
      </div>
    );
  }


  return (
    <>
      <div className="bg-card rounded-xl p-6 border border-border shadow-sm flex flex-col h-full">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Bot className="h-6 w-6 text-primary" />
            <div>
              <h3 className="text-lg font-semibold">Chat with Coach GEOvanni</h3>
              <p className="text-xs text-muted-foreground">Your AI visibility advisor</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsExpanded(true)}
            className="h-8 w-8"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>

        {renderChatContent()}
      </div>

      {/* Fullscreen Dialog */}
      <Dialog open={isExpanded} onOpenChange={setIsExpanded}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="h-6 w-6 text-primary" />
                <div>
                  <DialogTitle>Chat with Coach GEOvanni</DialogTitle>
                  <p className="text-xs text-muted-foreground">Your AI visibility advisor</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsExpanded(false)}
                className="h-8 w-8"
              >
                <Minimize2 className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>
          <div className="flex-1 flex flex-col px-6 pb-6 overflow-hidden">
            {renderChatContent()}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CoachGEOvanniCard;
