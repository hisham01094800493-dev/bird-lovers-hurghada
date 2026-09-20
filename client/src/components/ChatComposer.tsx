import { ChangeEvent, FormEvent, useRef, useState } from "react";
import { ImagePlus, Loader2, Mic, Paperclip, Send, Square, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export type ChatAttachment = { kind: "image" | "audio"; file: File; preview?: string };

export default function ChatComposer({ disabled, sending, onSend }: { disabled?: boolean; sending?: boolean; onSend: (body: string, attachment?: ChatAttachment) => void }) {
  const imageInput = useRef<HTMLInputElement>(null);
  const [body, setBody] = useState("");
  const [attachment, setAttachment] = useState<ChatAttachment>();
  const [recording, setRecording] = useState(false);
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const chooseImage = (event: ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; if (!file) return; if (!file.type.startsWith("image/")) return; if (file.size > 8_000_000) return; setAttachment({ kind: "image", file, preview: URL.createObjectURL(file) }); event.target.value = ""; };
  const startRecording = async () => { if (!navigator.mediaDevices?.getUserMedia) return; const stream = await navigator.mediaDevices.getUserMedia({ audio: true }); const media = new MediaRecorder(stream); chunks.current = []; media.ondataavailable = event => chunks.current.push(event.data); media.onstop = () => { stream.getTracks().forEach(track => track.stop()); const file = new File([new Blob(chunks.current, { type: media.mimeType || "audio/webm" })], `voice-${Date.now()}.webm`, { type: media.mimeType || "audio/webm" }); setAttachment({ kind: "audio", file }); }; recorder.current = media; media.start(); setRecording(true); };
  const stopRecording = () => { recorder.current?.stop(); setRecording(false); };
  const submit = (event: FormEvent) => { event.preventDefault(); if (!body.trim() && !attachment) return; onSend(body.trim(), attachment); setBody(""); setAttachment(undefined); };
  return <form onSubmit={submit} className="space-y-2">
    {attachment && <div className="flex items-center gap-3 rounded-xl border border-[#dce7df] bg-[#f7faf5] p-2 text-xs"><span className="min-w-0 flex-1 truncate">{attachment.kind === "audio" ? "Voice recording ready" : attachment.file.name}</span>{attachment.preview && <img src={attachment.preview} alt="Attachment preview" className="size-10 rounded object-cover" />}<button type="button" aria-label="Remove attachment" onClick={() => setAttachment(undefined)}><X size={16} /></button></div>}
    <div className="flex items-end gap-2"><input ref={imageInput} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={chooseImage} /><Button type="button" variant="outline" size="icon" disabled={disabled || sending} aria-label="Attach image" onClick={() => imageInput.current?.click()}><ImagePlus size={17} /></Button><Button type="button" variant="outline" size="icon" disabled={disabled || sending || recording} aria-label={recording ? "Recording" : "Record voice"} onClick={recording ? stopRecording : startRecording}>{recording ? <Square size={15} className="text-[#bd5941]" /> : <Mic size={17} />}</Button><Textarea value={body} onChange={event => setBody(event.target.value)} disabled={disabled || sending} placeholder="Write a message…" className="min-h-11 flex-1 resize-none" maxLength={3000} /><Button type="submit" className="cta-primary" disabled={disabled || sending || (!body.trim() && !attachment)}>{sending ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} />}</Button></div>
  </form>;
}
