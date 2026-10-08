// Genera index.html (IT), de/, fr/, en/ prerenderizzati per i motori di ricerca.
// Uso: node src/build.js   (serve playwright)
const fs = require('fs'), path = require('path'), http = require('http');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const SITE = 'https://xthreem.ch';
const IMG = 'https://res.cloudinary.com/mial2ln4/image/upload/f_jpg,q_auto,w_1200/render_24_arancio_tre_quarti';
const LANGS = {
  it:{path:'/', locale:'it_CH', title:'xthreem 24 – MTB biammortizzata per ragazzi, montata a mano in Ticino', desc:'Mountain bike biammortizzata 24" per ragazzi, montata e regolata a mano in Ticino. Edizione di lancio: 10 bici numerate a CHF 1.700, pronta in 6-8 settimane.', name:'xthreem 24 – mountain bike biammortizzata per ragazzi'},
  de:{path:'/de/', locale:'de_CH', title:'xthreem 24 – vollgefedertes Kinder-Mountainbike, im Tessin von Hand montiert', desc:'Vollgefedertes 24"-Mountainbike für Kinder und Jugendliche, im Tessin von Hand montiert und eingestellt. Launch-Edition: 10 nummerierte Bikes für CHF 1.700, fertig in 6-8 Wochen.', name:'xthreem 24 – vollgefedertes Mountainbike für Kinder'},
  fr:{path:'/fr/', locale:'fr_CH', title:'xthreem 24 – VTT tout-suspendu pour enfants, monté à la main au Tessin', desc:'VTT tout-suspendu 24" pour jeunes, monté et réglé à la main au Tessin. Édition de lancement : 10 vélos numérotés à CHF 1.700, prêt en 6-8 semaines.', name:'xthreem 24 – VTT tout-suspendu pour enfants'},
  en:{path:'/en/', locale:'en_GB', title:'xthreem 24 – kids full-suspension MTB, hand-built in Ticino', desc:'24" full-suspension mountain bike for young riders, assembled and tuned by hand in Ticino, Switzerland. Launch edition: 10 numbered bikes at CHF 1,700, ready in 6-8 weeks.', name:'xthreem 24 – full-suspension mountain bike for kids'}
};
function esc(s){return s.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');}
function head(l){
  const L = LANGS[l], url = SITE + L.path;
  const alts = Object.entries(LANGS).map(([k,v])=>`<link rel="alternate" hreflang="${k}-CH" href="${SITE+v.path}">`).join('\n')
    + `\n<link rel="alternate" hreflang="x-default" href="${SITE}/">`;
  const ld = {
    "@context":"https://schema.org",
    "@graph":[
      {"@type":"Organization","@id":SITE+"/#org","name":"xthreem","url":SITE+"/","email":"info@xthreem.ch",
       "founder":{"@type":"Person","name":"Davide Dolorero"},"areaServed":"CH"},
      {"@type":"Product","@id":url+"#product","name":L.name,"brand":{"@type":"Brand","name":"xthreem"},
       "image":[IMG],"description":L.desc,"category":"Kids mountain bike",
       "offers":{"@type":"Offer","url":url,"price":"1700.00","priceCurrency":"CHF",
         "availability":"https://schema.org/PreOrder","seller":{"@id":SITE+"/#org"}}}
    ]};
  return `<title>${esc(L.title)}</title>
<meta name="description" content="${esc(L.desc)}">
<link rel="canonical" href="${url}">
${alts}
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<meta property="og:type" content="website">
<meta property="og:url" content="${url}">
<meta property="og:locale" content="${L.locale}">
<meta property="og:title" content="${esc(L.title)}">
<meta property="og:description" content="${esc(L.desc)}">
<meta property="og:image" content="${IMG}">
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">${JSON.stringify(ld)}</script>`;
}
(async()=>{
  const tpl = fs.readFileSync(path.join(__dirname,'template.html'),'utf8');
  const tmp = path.join(ROOT,'.build'); fs.mkdirSync(tmp,{recursive:true});
  for (const l of Object.keys(LANGS)) fs.writeFileSync(path.join(tmp,l+'.html'), tpl.replace('<!--HEAD-->', head(l)).replace(/__LANG__/g,l));
  fs.copyFileSync(path.join(ROOT,'config.js'), path.join(tmp,'config.js'));
  const srv = http.createServer((req,res)=>{ const f=path.join(tmp, req.url.split('?')[0]==='/config.js'?'config.js':decodeURIComponent(req.url.split('?')[0]).slice(1)); fs.readFile(f,(e,d)=>{ if(e){res.writeHead(404);res.end();return;} res.writeHead(200,{'Content-Type':f.endsWith('.js')?'text/javascript':'text/html'}); res.end(d);}); }).listen(8765);
  const b = await chromium.launch();
  const p = await b.newPage({userAgent:'prerender-bot'});
  await p.route(/^https?:\/\/(?!localhost)/, r=>r.abort());
  for (const l of Object.keys(LANGS)) {
    await p.goto(`http://localhost:8765/${l}.html`);
    await p.waitForFunction(()=>document.getElementById('plates').children.length>0);
    let html = '<!doctype html>\n' + await p.evaluate(()=>document.documentElement.outerHTML);
    const out = l==='it' ? path.join(ROOT,'index.html') : path.join(ROOT,l,'index.html');
    fs.mkdirSync(path.dirname(out),{recursive:true}); fs.writeFileSync(out, html);
    console.log('ok', l, html.length);
  }
  await b.close(); srv.close(); fs.rmSync(tmp,{recursive:true});
})();
