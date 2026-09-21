import { FormEvent, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Bird, CheckCheck, ImagePlus, Loader2, MessageCircle, Mic, Paperclip, Send, ShieldCheck, Square, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import SiteShell from "@/components/SiteShell";

type Attachment = { data: string; type: string; name: string };
type AttachmentType = "image/png" | "image/jpeg" | "image/webp" | "audio/webm" | "audio/ogg" | "audio/mp4";

function readAsDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

async function prepareImageAttachment(file: File) {
  try {
    const source = await readAsDataUrl(file);
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("Could not decode image"));
      element.src = source;
    });
    const scale = Math.min(1, 1600 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    canvas.getContext("2d")?.drawImage(image, 0, 0, canvas.width, canvas.height);
    const compressed = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/webp", 0.82));
    if (!compressed) return { data: source, type: file.type };
    return { data: await readAsDataUrl(compressed), type: "image/webp" };
  } catch {
    return { data: await readAsDataUrl(file), type: file.type };
  }
}

export default function Messages() {
  const { isAuthenticated, loading, user } = useAuth();
  const { isArabic } = useLanguage();
  const [, navigate] = useLocation();
  const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const listingId = Number(params.get("listing"));
  const queryConversationId = Number(params.get("conversation"));
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [body, setBody] = useState("");
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const [recording, setRecording] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const conversations = trpc.messages.conversations.useQuery(undefined, { enabled: isAuthenticated, refetchInterval: 10000 });
  const activeId = listingId
    ? (selectedId || (queryConversationId > 0 ? queryConversationId : null))
    : (selectedId || (queryConversationId > 0 ? queryConversationId : conversations.data?.[0]?.id || null));
  const canCompose = Boolean(activeId || listingId);
  const canWrite = isAuthenticated;
  const messages = trpc.messages.byConversation.useQuery({ conversationId: activeId as number }, { enabled: Boolean(activeId), refetchInterval: 5000 });
  const utils = trpc.useUtils();
  const clearComposer = () => { setBody(""); setAttachment(null); };
  const onSuccess = (conversationId?: number) => {
    clearComposer();
    if (conversationId) navigate(`/messages?conversation=${conversationId}`);
    const refreshedId = conversationId || activeId;
    if (refreshedId) utils.messages.byConversation.invalidate({ conversationId: refreshedId });
    conversations.refetch();
    toast.success(isArabic ? "تم إرسال الرسالة بأمان" : "Message sent securely");
  };
  const start = trpc.messages.start.useMutation({ onSuccess: data => onSuccess(data.conversationId), onError: error => toast.error(error.message) });
  const send = trpc.messages.send.useMutation({ onSuccess: () => onSuccess(), onError: error => toast.error(error.message) });

  if (loading) return <SiteShell><div className="shell py-24 text-center"><Loader2 className="mx-auto animate-spin" /></div></SiteShell>;
  if (!isAuthenticated) return <SiteShell><div className="shell py-24"><div className="auth-card"><span className="brand-mark mx-auto"><MessageCircle size={20} /></span><h1 className="mt-5 font-display text-3xl font-semibold">{isArabic ? "محادثاتك في أمان." : "Private conversations, safely."}</h1><p className="mt-3 text-sm leading-6 text-[#718780]">{isArabic ? "سجّل الدخول لمراسلة البائعين وإرسال الصور والتسجيلات الصوتية." : "Log in to message sellers and send photos or voice notes."}</p><Button className="cta-primary mt-7" onClick={() => startLogin()}>{isArabic ? "تسجيل دخول آمن" : "Log in securely"}</Button></div></div></SiteShell>;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!body.trim() && !attachment) { toast.info(isArabic ? "اكتب رسالة أو أرفق صورة/تسجيلًا صوتيًا" : "Write a message or attach a photo or voice note"); return; }
    const input = { body, attachmentData: attachment?.data, attachmentType: attachment?.type as AttachmentType | undefined };
    if (listingId && !activeId) start.mutate({ listingId, ...input });
    else if (activeId) send.mutate({ conversationId: activeId, ...input });
    else toast.info(isArabic ? "افتح إعلانًا لبدء محادثة" : "Open a listing to start a conversation");
  };

  const chooseFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) { toast.error(isArabic ? "استخدم صورة PNG أو JPG أو WebP" : "Use a PNG, JPEG, or WebP image"); return; }
    if (file.size > 7_000_000) { toast.error(isArabic ? "حجم الصورة يجب أن يكون أقل من 7 ميجابايت" : "Image must be under 7MB"); return; }
    try { const prepared = await prepareImageAttachment(file); setAttachment({ ...prepared, name: file.name }); } catch { toast.error(isArabic ? "تعذر قراءة الصورة" : "Could not read the image"); }
  };

  const startRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") { toast.info(isArabic ? "التسجيل الصوتي غير مدعوم في هذا المتصفح" : "Voice recording is not supported in this browser"); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = event => { if (event.data.size) chunksRef.current.push(event.data); };
      recorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        const audioType = recorder.mimeType?.includes("ogg") ? "audio/ogg" : "audio/webm";
        const blob = new Blob(chunksRef.current, { type: audioType });
        setAttachment({ data: await readAsDataUrl(blob), type: audioType, name: isArabic ? "تسجيل صوتي" : "Voice note" });
        setRecording(false);
      };
      recorder.start(); recorderRef.current = recorder; setRecording(true);
    } catch { toast.error(isArabic ? "اسمح للمتصفح باستخدام الميكروفون" : "Please allow microphone access"); }
  };
  const stopRecording = () => { recorderRef.current?.stop(); recorderRef.current = null; };
  const enableNotifications = async () => {
    if (!("Notification" in window)) { toast.info(isArabic ? "المتصفح لا يدعم إشعارات سطح المكتب" : "This browser does not support desktop notifications"); return; }
    const permission = await Notification.requestPermission();
    toast.info(permission === "granted" ? (isArabic ? "تم تفعيل إشعارات الرسائل" : "Message notifications are enabled") : (isArabic ? "يمكنك تفعيلها من إعدادات المتصفح" : "You can enable them from browser settings"));
  };

  return <SiteShell><section className="shell py-10 sm:py-14"><Link href="/marketplace" className="back-link"><ArrowLeft size={16} /> {isArabic ? "العودة للسوق" : "Back to marketplace"}</Link><div className="mt-8 flex items-end justify-between gap-4"><div><p className="eyebrow">{isArabic ? "الرسائل" : "Messages"} / {isArabic ? "محادثات آمنة" : "safe conversations"}</p><h1 className="page-title mt-3">{isArabic ? <>ابدأ الحديث<br /><em>بوضوح.</em></> : <>Good conversations<br /><em>start here.</em></>}</h1></div><div className="flex items-center gap-2"><Button variant="outline" size="sm" className="border-[#dce7df] bg-white text-xs" onClick={enableNotifications}>{isArabic ? "تفعيل إشعارات الرسائل" : "Enable message alerts"}</Button><div className="hidden items-center gap-2 text-xs text-[#799087] sm:flex"><ShieldCheck size={16} className="text-[#76a68f]" /> {isArabic ? "محادثات مصرح بها" : "Secure conversations"}</div></div></div><div className="messages-shell messages-page-shell mt-9"><aside className="messages-list"><div className="border-b border-[#dce7df] px-5 py-4"><p className="eyebrow">{isArabic ? "صندوق الوارد" : "Your inbox"}</p><p className="mt-1 text-sm text-[#7c918b]">{conversations.data?.length || 0} {isArabic ? "محادثة" : "conversations"}</p></div>{conversations.data?.length ? conversations.data.map(conversation => <button key={conversation.id} className={`conversation-row ${activeId === conversation.id ? "conversation-row-active" : ""}`} onClick={() => { setSelectedId(conversation.id); navigate(`/messages?conversation=${conversation.id}`); }}><span className="avatar-placeholder"><Bird size={16} /></span><span className="min-w-0 text-left"><strong className="block truncate text-sm text-[#183b39]">{conversation.listingTitle}</strong><small className="mt-1 block text-xs text-[#82948e]">{conversation.status}</small></span></button>) : <div className="p-6 text-sm leading-6 text-[#82948e]">{isArabic ? "ابدأ من أي إعلان بالضغط على راسل البائع." : "Start from any listing by tapping “Message seller”."}</div>}</aside><section className={`message-thread ${canCompose ? "md:min-h-[610px]" : "min-h-0"}`}><div className="border-b border-[#dce7df] px-5 py-4"><p className="message-thread-title font-display text-lg font-semibold">{conversations.data?.find(item => item.id === activeId)?.listingTitle || (isArabic ? "لا توجد محادثة بعد" : "No conversation yet")}</p><p className="mt-1 text-xs text-[#82948e]">{canCompose ? (isArabic ? "اكتب رسالتك بوضوح، ويمكنك إرفاق صورة أو تسجيل صوتي." : "Write your message clearly. You can also attach a photo or voice note.") : (isArabic ? "اختر إعلاناً من السوق، ثم اضغط «راسل البائع» لبدء المحادثة." : "Choose a listing from the marketplace, then tap Message seller to start.")}</p></div><div className={`thread-body ${canCompose ? "md:min-h-[260px]" : "md:min-h-[220px]"}`}>{activeId ? (messages.isLoading ? <Loader2 className="mx-auto animate-spin text-[#76a68f]" /> : messages.data?.map(message => <div key={message.id} className={`message-bubble ${message.senderId === user?.id ? "message-outgoing" : "message-incoming"}`}>{message.body && <p>{message.body}</p>}{message.attachmentPath && (message.attachmentType?.startsWith("image/") ? <a href={message.attachmentPath} target="_blank" rel="noreferrer" className="message-image-link"><img src={message.attachmentPath} alt={isArabic ? "صورة مرفقة" : "Attached image"} className="message-image" /></a> : <audio controls src={message.attachmentPath} className="message-audio" />)}<small>{message.senderName || (isArabic ? "عضو" : "Member")} · {new Date(message.createdAt).toLocaleString(isArabic ? "ar-EG" : "en-EG")}</small></div>)) : <div className="new-conversation-intro"><MessageCircle size={27} /><p>{isArabic ? "مكان كتابة الرسالة بالأسفل." : "The message box is below."}</p><small>{isArabic ? "بعد اختيار إعلان، اكتب رسالتك هنا وأرسلها للبائع." : "After choosing a listing, write your message here and send it to the seller."}<br /><Button type="button" variant="outline" className="mt-4 rounded-xl border-[#76a68f] bg-white" onClick={() => navigate("/marketplace")}>{isArabic ? "تصفح الإعلانات وابدأ محادثة" : "Browse listings to start"}</Button></small></div>}</div><ChatComposer isArabic={isArabic} body={body} setBody={setBody} attachment={attachment} setAttachment={setAttachment} recording={recording} startRecording={startRecording} stopRecording={stopRecording} chooseFile={chooseFile} submit={submit} busy={send.isPending || start.isPending} disabled={!canWrite} needsConversation={!canCompose} /></section></div></section></SiteShell>;
}

function ChatComposer({ isArabic, body, setBody, attachment, setAttachment, recording, startRecording, stopRecording, chooseFile, submit, busy, disabled = false, needsConversation = false }: { isArabic: boolean; body: string; setBody: (value: string) => void; attachment: Attachment | null; setAttachment: (value: Attachment | null) => void; recording: boolean; startRecording: () => void; stopRecording: () => void; chooseFile: (event: React.ChangeEvent<HTMLInputElement>) => void; submit: (event: FormEvent) => void; busy: boolean; disabled?: boolean; needsConversation?: boolean }) {
  return <form onSubmit={submit} className="thread-composer"><div className="composer-tools"><label className={`attachment-button ${disabled ? "pointer-events-none opacity-50" : ""}`} title={isArabic ? "إرفاق صورة" : "Attach photo"}><Paperclip size={17} /><ImagePlus size={15} /><input type="file" accept="image/png,image/jpeg,image/webp" onChange={chooseFile} hidden disabled={disabled} /></label><button type="button" disabled={disabled} className={`attachment-button ${recording ? "recording-button" : ""}`} onClick={recording ? stopRecording : startRecording} title={recording ? (isArabic ? "إيقاف التسجيل" : "Stop recording") : (isArabic ? "تسجيل صوتي" : "Record voice note")}>{recording ? <Square size={16} /> : <Mic size={17} />}</button></div><div className="composer-field"><Textarea disabled={disabled} value={body} onChange={event => setBody(event.target.value)} placeholder={needsConversation ? (isArabic ? "اكتب رسالتك هنا… ثم اختر إعلانًا لإرسالها" : "Write your message here… then choose a listing to send it") : (isArabic ? "اكتب رسالتك هنا… اسأل عن الحالة أو السعر أو مكان الاستلام" : "Write your message here… ask about condition, price, or pickup")} className="min-h-14 resize-none rounded-xl border-[#dce7df] bg-[#fbfcfa]" />{attachment && <div className="attachment-preview">{attachment.type.startsWith("image/") ? <img src={attachment.data} alt="" /> : <Mic size={15} />}<span>{attachment.name}</span><button type="button" onClick={() => setAttachment(null)} aria-label={isArabic ? "إزالة المرفق" : "Remove attachment"}><X size={15} /></button></div>}<small className="composer-hint">{needsConversation ? (isArabic ? "المحرر جاهز — افتح إعلانًا واضغط راسل البائع لبدء المحادثة" : "Composer ready — open a listing and tap Message seller to start") : recording ? (isArabic ? "جاري التسجيل… اضغط الميكروفون للإيقاف" : "Recording… tap the microphone to stop") : (isArabic ? "يمكنك الكتابة أو إرفاق صورة أو إرسال تسجيل صوتي" : "You can type, attach a photo, or send a voice note")}</small></div><Button type="submit" className="cta-primary h-12" disabled={disabled || busy || recording}>{busy ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />} {isArabic ? "إرسال" : "Send"}</Button></form>;
}
