import { Bell, Check, Loader2, LogIn } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import SiteShell from "@/components/SiteShell";

export default function Notifications() {
  const { isAuthenticated, loading } = useAuth();
  const notifications = trpc.notifications.list.useQuery(undefined, { enabled: isAuthenticated });
  const utils = trpc.useUtils();
  const markRead = trpc.notifications.markRead.useMutation({ onSuccess: () => { utils.notifications.list.invalidate(); utils.notifications.unreadCount.invalidate(); } });
  if (loading) return <SiteShell><div className="shell py-24 text-center"><Loader2 className="mx-auto animate-spin" /></div></SiteShell>;
  return <SiteShell><section className="shell page-hero"><div><p className="eyebrow">Notifications / الإشعارات</p><h1 className="page-title">Stay in the<br /><em>loop.</em></h1><p className="page-lede">Listing updates, new messages and community moments in one place.</p></div></section><section className="shell pb-20">{!isAuthenticated ? <div className="auth-card"><span className="brand-mark mx-auto"><Bell size={20} /></span><h2 className="mt-5 font-display text-2xl font-semibold">Notifications follow your account.</h2><p className="mt-3 text-sm leading-6 text-[#718780]">Log in to keep track of listings, messages and moderation updates.</p><Button className="cta-primary mt-6" onClick={() => startLogin()}><LogIn size={16} /> Log in securely</Button></div> : notifications.isLoading ? <div className="py-12 text-center"><Loader2 className="mx-auto animate-spin" /></div> : notifications.data?.length ? <div className="mx-auto max-w-3xl space-y-3">{notifications.data.map(item => <article key={item.id} className={`notification-card ${item.readAt ? "notification-read" : ""}`}><span className="join-icon"><Bell size={17} /></span><div className="min-w-0 flex-1"><p className="font-semibold text-[#183b39]">{item.title}</p><p className="mt-1 text-sm leading-6 text-[#718780]">{item.body}</p><div className="mt-2 flex items-center gap-3 text-xs text-[#8b9d97]"><span>{new Date(item.createdAt).toLocaleString()}</span>{item.link && <Link href={item.link} className="text-link">Open</Link>}</div></div>{!item.readAt && <Button variant="ghost" size="icon" className="rounded-full text-[#76a68f]" onClick={() => markRead.mutate({ id: item.id })} aria-label="Mark as read"><Check size={17} /></Button>}</article>)}</div> : <div className="empty-state"><Bell size={30} /><h3 className="font-display text-lg font-semibold">All quiet for now.</h3><p>We’ll keep the good news here.</p></div>}</section></SiteShell>;
}
