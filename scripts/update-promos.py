from pathlib import Path

site_shell = Path("client/src/components/SiteShell.tsx")
text = site_shell.read_text()
old = '<AdSlot variant="compact" title="خليك قريب من السرب" description="سجّل دخولك لتراسل البائعين وتحفظ إعلاناتك المفضلة." cta="سجّل الآن" href="/messages" image="/images/hurghada-budgie-card.jpg" imageAlt={isArabic ? "بادجيان ملونان" : "Two colourful budgies"} />'
new = '<AdSlot variant="compact" title="جروب Bird Lovers Hurghada" description="انضم إلى محبي الطيور في الغردقة وتبادل الخبرات والإعلانات." cta="انضم للجروب" href={FACEBOOK_GROUP_URL} external image="/images/bird-lovers-group.jpg" imageAlt={isArabic ? "طيور بادجي ملونة" : "Colourful budgies"} />'
if old not in text:
    raise SystemExit("SiteShell promotion call not found")
site_shell.write_text(text.replace(old, new, 1))

home = Path("client/src/pages/Home.tsx")
text = home.read_text()
old = '<AdSlot image="/images/hurghada-parrot-hero.jpg" imageAlt={isArabic ? "كوكاتو على شاطئ الغردقة" : "Cockatoo by the Hurghada coast"} title={isArabic ? "صورة مميزة لمجتمع الطيور" : "A brighter home for bird lovers"} description={isArabic ? "شاهد الإعلانات المصورة وشارك إعلان طيرك مع أهل الغردقة." : "Browse photo listings and share your bird with the Hurghada community."} cta={isArabic ? "شاهد السوق" : "Browse listings"} href="/marketplace" />'
new = '<AdSlot image="/images/bird-lovers-group.jpg" imageAlt={isArabic ? "طيور بادجي ملونة" : "Colourful budgies"} title={isArabic ? "جروب Bird Lovers Hurghada" : "Bird Lovers Hurghada group"} description={isArabic ? "انضم إلى الجروب المحلي لمحبي الطيور وتبادل الخبرات." : "Join the local bird-lovers group and share useful tips."} cta={isArabic ? "انضم للجروب" : "Join the group"} href="https://www.facebook.com/groups/798363001904219/?ref=share_group_link" external />'
if old not in text:
    raise SystemExit("Home promotion call not found")
home.write_text(text.replace(old, new, 1))
