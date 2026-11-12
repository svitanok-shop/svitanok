// ===== НАЛАШТУВАННЯ =====
const firebaseConfig={apiKey:"AIzaSyB2qAWXjhRsKASf9Urz_j3OtX_ERv9LKGk",authDomain:"sonechko-c1d59.firebaseapp.com",databaseURL:"https://sonechko-c1d59-default-rtdb.firebaseio.com",projectId:"sonechko-c1d59",storageBucket:"sonechko-c1d59.firebasestorage.app",messagingSenderId:"154000560138",appId:"1:154000560138:web:2b1e804c70f06549b58ff3",measurementId:"G-B6B8NBZ5VD"};
const CLD={cloud:'drmnljqex',preset:'svitanok_products'}; // preset має бути Unsigned
const NP_KEY='';                    // API-ключ Нової Пошти (необов'язково): список міст і відділень
const CARD='0000 0000 0000 0000';   // ваша картка для переказів
// GitHub Pages serves static files. Protected delivery APIs run on a separate server.
const BACKEND_ORIGIN=(window.SVITANOK_CONFIG?.backendOrigin||'').replace(/\/$/,'');
function apiEndpoint(name){
 if(!BACKEND_ORIGIN)throw Error('Для автоматичного пошуку відділень та ТТН налаштуйте backendOrigin у config.js (див. README).');
 return BACKEND_ORIGIN+'/.netlify/functions/'+name;
}
// ========================
firebase.initializeApp(firebaseConfig);
const auth=firebase.auth(),db=firebase.database();
// Адміністратор визначається за Firebase Auth UID. Захист дублюється у database.rules.json.
const ADMIN_UID='XCD8tXDhLuNw9sTviWowTD86Myg2';
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>Number(n).toLocaleString('uk-UA')+' ₴';
const ST={new:'Нове',confirmed:'Підтверджено',packing:'Збирається',shipped:'Передано перевізнику',delivered:'Доставлено',cancelled:'Скасовано',paid:'Оплачено',sent:'Відправлено',done:'Виконано',cancel:'Скасовано'};
const R=h=>$('#app').innerHTML=h;
let P={},U=null,isAdmin=false,cat='',q='',editId=null,cart={},favs={};
let pendingPhotos=[];
const productPhotos=p=>[...(Array.isArray(p?.images)?p.images:[]),p?.img].filter((v,i,a)=>typeof v==='string'&&v&&a.indexOf(v)===i);
try{cart=JSON.parse(localStorage.cart||'{}')}catch(e){}
const saveCart=()=>{localStorage.cart=JSON.stringify(cart);const c=$('#cc');if(c)c.textContent=Object.values(cart).reduce((a,b)=>a+b,0);mobileNav()};
const toast=m=>{const t=$('#toast');t.textContent=m;t.hidden=false;clearTimeout(toast.t);toast.t=setTimeout(()=>t.hidden=true,2800)};
const msg=e=>({'auth/invalid-credential':'Невірний email або пароль','auth/email-already-in-use':'Цей email уже зареєстровано','auth/weak-password':'Пароль закороткий','auth/invalid-email':'Некоректний email'}[e.code]||e.message);
const np=async(model,m,p)=>{const r=await fetch('https://api.novaposhta.ua/v2.0/json/',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({apiKey:NP_KEY,modelName:model,calledMethod:m,methodProperties:p})});if(!r.ok)throw Error('Помилка мережі');const j=await r.json();if(j.success===false)throw Error((j.errors||[]).join(', ')||'Помилка API');return j.data||[]};
async function up(f){const d=new FormData();d.append('file',f);d.append('upload_preset',CLD.preset);const r=await fetch(`https://api.cloudinary.com/v1_1/${CLD.cloud}/image/upload`,{method:'POST',body:d}),j=await r.json();if(!j.secure_url)throw new Error(j.error?.message||'Не вдалося завантажити фото');return j.secure_url}

// ===== Авторизація =====
// Іконки навігації: підписи збережені для доступності та підказок.
const navIcon=(name)=>{const paths={home:'<path d="M3 10.5 12 3l9 7.5V21h-6v-7H9v7H3V10.5Z"/>',chat:'<path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8A8.5 8.5 0 0 1 12.5 20a8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8A8.5 8.5 0 0 1 12.5 3H13a8.5 8.5 0 0 1 8 8v.5Z"/>',heart:'<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>',cart:'<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"/>',user:'<circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>',admin:'<path d="M12 2 4 5v6c0 5 3.4 8.7 8 11 4.6-2.3 8-6 8-11V5l-8-3Z"/><path d="m9 12 2 2 4-4"/>',login:'<path d="M10 17l5-5-5-5M15 12H3"/><path d="M12 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7"/>'};return `<svg class="nav-icon" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]}</svg>`};
function nav(){
 const link=(url,icon,label,badge='')=>`<a class="nav-action" href="${url}" title="${label}" aria-label="${label}">${navIcon(icon)}<span class="nav-label">${label}</span>${badge}</a>`;
 const favCount=Object.keys(favs).filter(k=>favs[k]).length;
 $('#nav').innerHTML=link('#/support','chat','Чат із продавцем')+link('#/favorites','heart','Обране',`<span class="badge" aria-label="${favCount} в обраному">${favCount}</span>`)+link('#/cart','cart','Кошик','<span class="badge" id="cc">0</span>')+(U?link('#/profile','user','Мій профіль')+(isAdmin?link('#/admin','admin','Адмін-панель'):''):`<button id="lg" class="nav-action" type="button" title="Увійти" aria-label="Увійти">${navIcon('login')}<span class="nav-label">Увійти</span></button>`);
 const b=$('#lg');if(b)b.onclick=authModal;
 saveCart(); mobileNav();
}
function mobileNav(){
 const holder=$('#mobileNav');if(!holder)return;
 const active=location.hash||'#/';
 const items=[['#/','home','Головна'],['#/favorites','heart','Обране'],['#/cart','cart','Кошик'],['#/support','chat','Чат'],[U?'#/profile':'#login','user','Кабінет']];
 holder.innerHTML=items.map(([href,icon,label])=>{
  const selected=href==='#/'?active==='#/'||active==='':active.startsWith(href);
  const count=icon==='cart'?Object.values(cart).reduce((a,b)=>a+Number(b||0),0):icon==='heart'?Object.values(favs).filter(Boolean).length:0;
  return `<a href="${href}" class="mobile-tab ${selected?'active':''}" ${selected?'aria-current="page"':''} aria-label="${label}">${navIcon(icon)}<span>${label}</span>${count?`<b class="mobile-count">${count>99?'99+':count}</b>`:''}</a>`;
 }).join('');
 const login=holder.querySelector('[href="#login"]');if(login)login.onclick=e=>{e.preventDefault();authModal()};
}


auth.onAuthStateChanged(async u=>{U=u;isAdmin=false;favs={};if(u){try{isAdmin=u.uid===ADMIN_UID;const ref=db.ref('users/'+u.uid),snap=await ref.get(),profile=snap.val()||{};if(!profile.customerId){const customerId='SV-'+Date.now().toString(36).toUpperCase()+'-'+Math.random().toString(36).slice(2,6).toUpperCase();await ref.update({customerId});profile.customerId=customerId}favs=profile.favorites||{}}catch(e){console.warn('Не вдалося завантажити профіль',e)}}else{try{favs=JSON.parse(localStorage.getItem('svitanok_favorites')||'{}')}catch(e){favs={}}}nav();route()});
function authModal(){
 if($('.modal'))return;
 let reg=false,view='auth';
 const m=document.createElement('div');m.className='modal';document.body.append(m);
 const close=()=>m.remove();
 const draw=()=>{
  if(view==='reset'){
   m.innerHTML=`<form class="card row" id="resetForm"><h3>Відновлення пароля</h3><p class="muted" style="margin:0">Вкажіть email, з яким ви реєструвалися. Ми надішлемо посилання для створення нового пароля.</p><input name="email" type="email" placeholder="Ваш email" value="${esc(m.dataset.email||'')}" autocomplete="email" required><button class="btn" id="resetSubmit">Надіслати посилання</button><button type="button" class="chip" id="backLogin">Повернутися до входу</button><button type="button" class="chip" id="x">Закрити</button><p id="resetInfo" class="muted" style="margin:0" aria-live="polite"></p></form>`;
   const f=m.querySelector('#resetForm');
   f.onsubmit=async e=>{e.preventDefault();const email=f.elements.email.value.trim(),b=$('#resetSubmit'),info=$('#resetInfo');b.disabled=true;b.textContent='Надсилаємо…';info.textContent='';
    try{await auth.sendPasswordResetEmail(email);info.textContent='Якщо для цієї адреси існує акаунт, лист із посиланням для відновлення вже надіслано. Перевірте також папку «Спам».';f.elements.email.value=email;b.textContent='Надіслати ще раз';}
    catch(err){const errors={'auth/invalid-email':'Перевірте правильність email.','auth/user-not-found':'Акаунт із таким email не знайдено.','auth/too-many-requests':'Забагато спроб. Спробуйте пізніше.','auth/network-request-failed':'Немає з’єднання. Перевірте інтернет.'};info.textContent=errors[err.code]||'Не вдалося надіслати лист. Спробуйте ще раз.';b.textContent='Спробувати ще раз';}
    finally{b.disabled=false;}
   };
   m.querySelector('#backLogin').onclick=()=>{view='auth';reg=false;draw()};
   m.querySelector('#x').onclick=close;
   return;
  }
  m.innerHTML=`<form class="card row"><h3>${reg?'Реєстрація':'Вхід'}</h3>${reg?'<input name="name" placeholder="Імʼя" autocomplete="name" required>':''}<input name="email" type="email" placeholder="Email" autocomplete="email" required><input name="pw" type="password" minlength="6" placeholder="Пароль (від 6 символів)" autocomplete="${reg?'new-password':'current-password'}" required><button class="btn">${reg?'Створити акаунт':'Увійти'}</button><button type="button" class="btn ghost" id="g"><img class="google-brand-logo" src="assets/google-transparent.png" alt="" aria-hidden="true"> Увійти через Google</button><button type="button" class="chip" id="sw">${reg?'Уже є акаунт? Увійти':'Немає акаунта? Зареєструватись'}</button>${reg?'':'<button type="button" class="chip" id="fp">Забули пароль?</button>'}<button type="button" class="chip" id="x">Закрити</button></form>`;
  const f=m.querySelector('form');
  f.onsubmit=async e=>{e.preventDefault();const d=Object.fromEntries(new FormData(f));
   try{if(reg){const c=await auth.createUserWithEmailAndPassword(d.email,d.pw);await c.user.updateProfile({displayName:d.name});await db.ref('users/'+c.user.uid).update({name:d.name,email:d.email});nav()}else await auth.signInWithEmailAndPassword(d.email,d.pw);close();toast('Вітаємо!')}catch(err){toast(msg(err))}};
  m.querySelector('#g').onclick=async()=>{try{const c=await auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());await db.ref('users/'+c.user.uid).update({name:c.user.displayName||'',email:c.user.email||''});close()}catch(err){const errors={'auth/popup-blocked':'Браузер заблокував спливаюче вікно. Дозвольте його для цього сайту.','auth/operation-not-allowed':'Вхід через Google не увімкнено у Firebase Authentication.','auth/unauthorized-domain':'Додайте домен сайту до Authorized domains у Firebase.'};toast(errors[err.code]||msg(err))}};
  m.querySelector('#sw').onclick=()=>{reg=!reg;draw()};
  m.querySelector('#x').onclick=close;
  const fp=m.querySelector('#fp');if(fp)fp.onclick=()=>{m.dataset.email=f.elements.email.value.trim();view='reset';draw()};
 };
 m.addEventListener('click',e=>{if(e.target===m)close()});
 draw();
}

// ===== Роутер =====
const V={};
function route(){clearInterval(bannerTimer);const[,r,a]=(location.hash||'#/').split('/');mobileNav();(V[r||'home']||V.home)(a)}
addEventListener('hashchange',()=>{route();scrollTo(0,0)});
db.ref('products').on('value',s=>{P=s.val()||{};route()});
const searchInput=$('#q'),searchSuggestions=$('#searchSuggestions');
const normSearch=t=>String(t||'').toLocaleLowerCase('uk-UA').normalize('NFKD').replace(/[\\u0300-\\u036f]/g,'').trim();
function searchMatches(term){
 const words=normSearch(term).split(/\\s+/).filter(Boolean);
 if(!words.length)return [];
 return Object.entries(P).map(([id,p])=>({id,...p})).filter(p=>{
  const hay=normSearch([p.name,p.cat,p.desc,p.brand,p.barcode].join(' '));
  return words.every(w=>hay.includes(w));
 }).sort((a,b)=>Number(normSearch(a.name).startsWith(words[0]))-Number(normSearch(b.name).startsWith(words[0]))).reverse().slice(0,6);
}
function updateSearchSuggestions(){
 const term=searchInput.value.trim(),matches=searchMatches(term);
 if(!term){searchSuggestions.hidden=true;searchSuggestions.innerHTML='';return}
 searchSuggestions.innerHTML=`<div class="suggest-title">Знайдені товари</div>`+(matches.map(p=>`<a class="suggest-item" href="#/p/${encodeURIComponent(p.id)}"><img src="${esc(p.img||'')}" alt=""><span><strong>${esc(p.name)}</strong><small>${esc(p.cat||'Товар')}</small></span><b>${money(p.price)}</b></a>`).join('')||'<p class="suggest-empty">Нічого не знайдено. Спробуйте іншу назву.</p>')+`<button type="button" class="suggest-all" id="searchAll">Переглянути всі результати →</button>`;
 searchSuggestions.hidden=false;
 searchSuggestions.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{searchSuggestions.hidden=true}));
 searchSuggestions.querySelector('#searchAll').onclick=()=>{searchSuggestions.hidden=true;cat='';if(location.hash!=='#/')location.hash='#/';else route()};
}
searchInput.oninput=e=>{q=normSearch(e.target.value);cat='';updateSearchSuggestions();if(location.hash==='#/'||!location.hash){const start=e.target.selectionStart;V.home();searchInput.focus();searchInput.setSelectionRange(start,start)}};
searchInput.onfocus=updateSearchSuggestions;
searchInput.onkeydown=e=>{if(e.key==='Escape')searchSuggestions.hidden=true;if(e.key==='Enter'){searchSuggestions.hidden=true;if(location.hash!=='#/')location.hash='#/';else V.home()}};
document.addEventListener('click',e=>{if(!e.target.closest('.search-wrap'))searchSuggestions.hidden=true});



let banners={},bannerIndex=0,bannerTimer;
db.ref('banners').on('value',snap=>{banners=snap.val()||{};if(['','#/','#/home'].includes(location.hash))V.home();if(isAdmin)drawBanners()});
function bannerView(){const a=Object.entries(banners).filter(([id,b])=>b&&b.image&&b.enabled!==false).sort((x,y)=>(x[1].order||0)-(y[1].order||0));if(!a.length)return `<section class="hero"><h1>Товари на кожен день</h1><p>Продукти, побутова хімія, товари для дітей і тварин — замовляйте з доставкою по Україні.</p><button class="btn" onclick="$('#chips').scrollIntoView({behavior:'smooth'})">До каталогу</button></section>`;bannerIndex=Math.min(bannerIndex,a.length-1);return `<section class="banner-slider">${a.map(([id,b],i)=>`<div class="banner-slide ${i===bannerIndex?'active':''}" style="background-image:linear-gradient(90deg,#071b42b8,#071b4208),url('${encodeURI(b.image).replace(/'/g,'%27')}')"><div class="banner-copy"><h2>${esc(b.title||'Світанок')}</h2><p>${esc(b.subtitle||'')}</p>${b.link?`<a class="btn" href="${esc(b.link)}">${esc(b.button||'Переглянути')}</a>`:''}</div></div>`).join('')}${a.length>1?`<button class="banner-prev" onclick="moveBanner(-1)" aria-label="Попередній">‹</button><button class="banner-next" onclick="moveBanner(1)" aria-label="Наступний">›</button><div class="banner-dots">${a.map((_,i)=>`<button class="${i===bannerIndex?'active':''}" onclick="showBanner(${i})" aria-label="Банер ${i+1}"></button>`).join('')}</div>`:''}</section>`}
function showBanner(i){let slides=[...document.querySelectorAll('.banner-slide')];if(!slides.length)return;bannerIndex=(i+slides.length)%slides.length;slides.forEach((x,j)=>x.classList.toggle('active',j===bannerIndex));document.querySelectorAll('.banner-dots button').forEach((x,j)=>x.classList.toggle('active',j===bannerIndex))}
function moveBanner(n){showBanner(bannerIndex+n)}
function runBannerTimer(){clearInterval(bannerTimer);if(document.querySelectorAll('.banner-slide').length>1)bannerTimer=setInterval(()=>{if(['','#/','#/home'].includes(location.hash))moveBanner(1)},6500)}
function adminSection(name){document.querySelectorAll('.admin-panel-section').forEach(x=>x.hidden=x.dataset.section!==name);document.querySelectorAll('.admin-tab').forEach(x=>x.classList.toggle('active',x.dataset.tab===name));const h=document.getElementById('adminHeading');if(h)h.textContent=({products:'Товари',banners:'Банери',orders:'Замовлення',stats:'Статистика',chats:'Повідомлення',customers:'Покупці'})[name]||'Адмін-панель';}
async function saveBanner(e){e.preventDefault();if(!isAdmin)return;const f=e.target,b=f.querySelector('button[type=submit]');b.disabled=true;try{let file=f.elements.photo.files[0];if(!file)throw Error('Оберіть фото');if(file.size>8e6)throw Error('Фото завелике (до 8 МБ)');let link=f.elements.link.value.trim();if(link&&!/^#\/[a-zA-Z0-9_/%\-]*$/.test(link))throw Error('Посилання повинно починатися з #/');let image=await up(file);await db.ref('banners').push({image,title:f.elements.title.value.trim(),subtitle:f.elements.subtitle.value.trim(),link,button:f.elements.buttonText.value.trim(),order:Date.now(),enabled:true});f.reset();toast('Банер додано');drawBanners()}catch(err){toast('Помилка: '+err.message)}finally{b.disabled=false}}
async function removeBanner(id){if(!isAdmin||!confirm('Видалити банер?'))return;try{await db.ref('banners/'+id).remove();drawBanners();toast('Банер видалено')}catch(e){toast(e.message)}}
async function toggleBanner(id){if(!isAdmin)return;try{await db.ref('banners/'+id+'/enabled').set(banners[id].enabled===false);drawBanners()}catch(e){toast(e.message)}}
function drawBanners(){let el=document.getElementById('adminBanners');if(!el)return;el.innerHTML=Object.entries(banners).map(([id,b])=>`<div class="admin-banner"><img src="${esc(b.image)}" alt=""><div><b>${esc(b.title)}</b><small>${b.enabled===false?'Приховано':'Опубліковано'}</small></div><button class="btn ghost" onclick="toggleBanner('${id}')">${b.enabled===false?'Показати':'Приховати'}</button><button class="btn ghost" onclick="removeBanner('${id}')">Видалити</button></div>`).join('')||'<p>Банерів поки немає.</p>'}

// ===== Каталог =====
const tile=p=>`<article class="tile"><a href="#/p/${p.id}"><img src="${esc(p.img||'')}" alt="${esc(p.name)}" loading="lazy"><h3>${esc(p.name)}</h3></a><div class="pr">${money(p.price)}</div><div class="tile-actions"><button class="btn dark" onclick="add('${p.id}')">У кошик</button><button class="btn ghost heart ${favs[p.id]?'active':''}" onclick="toggleFav('${p.id}')" aria-label="${favs[p.id]?'Прибрати з обраного':'Додати в обране'}" title="Обране">${favs[p.id]?'♥':'♡'}</button></div></article>`;
V.home=()=>{const all=Object.entries(P).map(([id,p])=>({id,...p})).sort((a,b)=>b.ts-a.ts),cats=[...new Set(all.map(p=>p.cat).filter(Boolean))];
 const list=all.filter(p=>(!cat||p.cat===cat)&&(!q||normSearch([p.name,p.desc,p.cat,p.brand,p.barcode].join(' ')).includes(q)||q.split(/\\s+/).every(w=>normSearch([p.name,p.desc,p.cat,p.brand,p.barcode].join(' ')).includes(w))));
 R(`${bannerView()}<div class="chips" id="chips"><button class="chip ${cat?'':'on'}" data-c="">Усе</button>${cats.map(c=>`<button class="chip ${c===cat?'on':''}" data-c="${esc(c)}">${esc(c)}</button>`).join('')}</div><div class="grid">${list.map(tile).join('')||'<p>Нічого не знайдено. Спробуйте інший запит чи категорію.</p>'}</div>`);
 document.querySelectorAll('.chip[data-c]').forEach(b=>b.onclick=()=>{cat=b.dataset.c;route()});runBannerTimer()};
V.p=id=>{const p=P[id];if(!p)return R('<p>Товар не знайдено. <a href="#/">До каталогу</a></p>');
 const photos=productPhotos(p);const gallery=`<div class="product-gallery"><div class="gallery-main"><img id="galleryMain" src="${esc(photos[0]||'')}" alt="${esc(p.name)}"></div>${photos.length>1?`<div class="gallery-thumbs">${photos.map((url,i)=>`<button type="button" class="gallery-thumb ${i===0?'selected':''}" onclick="choosePhoto(this)" aria-label="Фото ${i+1}"><img src="${esc(url)}" alt=""></button>`).join('')}</div>`:''}</div>`;
 R(`<p><a href="#/">Каталог</a> / ${esc(p.cat||'Без категорії')}</p><div class="pd">${gallery}<div><h1>${esc(p.name)}</h1><p class="pr big">${money(p.price)}</p><p style="margin-bottom:16px">${esc(p.desc||'')}</p><button class="btn" onclick="add('${id}')">Додати в кошик</button> <button class="btn ghost heart ${favs[id]?'active':''}" onclick="toggleFav('${id}')">${favs[id]?'♥ У обраному':'♡ В обране'}</button></div></div><section class="card row" id="reviews"><h2>Відгуки покупців</h2><div id="reviewList">Завантаження…</div><div id="reviewForm"></div></section>`);loadReviews(id)};

function choosePhoto(button){const main=document.getElementById('galleryMain');if(!main)return;main.src=button.querySelector('img').src;document.querySelectorAll('.gallery-thumb').forEach(b=>b.classList.toggle('selected',b===button))}
// ===== Відгуки =====
async function loadReviews(id){
 const list=$('#reviewList'),form=$('#reviewForm');if(!list||!form)return;
 try{const snap=await db.ref('reviews/'+id).get(),rows=Object.entries(snap.val()||{}).sort((a,b)=>(b[1].ts||0)-(a[1].ts||0));
  const avg=rows.length?(rows.reduce((n,[,r])=>n+Number(r.rating||0),0)/rows.length).toFixed(1):null;
  list.innerHTML=(avg?`<p><b>⭐ ${avg}/5</b> · ${rows.length} відгуків</p><div class="review-bars">${[5,4,3,2,1].map(n=>{const count=rows.filter(([,r])=>Number(r.rating)===n).length;return `<div><span>${n} ★</span><meter min="0" max="${rows.length}" value="${count}"></meter><small>${count}</small></div>`}).join('')}</div>`:'<p>Відгуків поки немає.</p>')+rows.map(([uid,r])=>`<div class="review-item"><b>${esc(r.name||'Покупець')}</b> <span>${'★'.repeat(Math.max(1,Math.min(5,Number(r.rating)||1)))}</span><small> ${new Date(r.ts||Date.now()).toLocaleDateString('uk-UA')}</small><p>${esc(r.text||'')}</p>${r.photo?`<a href="${esc(r.photo)}" target="_blank" rel="noopener"><img class="review-photo" src="${esc(r.photo)}" alt="Фото покупця" loading="lazy"></a>`:''}${isAdmin?`<button class="chip" onclick="removeReview('${id}','${uid}')">Видалити</button>`:''}</div>`).join('');
  form.innerHTML=U?`<form id="reviewSubmit" class="row"><h3>Залишити відгук</h3><select name="rating" required>${[5,4,3,2,1].map(n=>`<option value="${n}">${'★'.repeat(n)} (${n})</option>`).join('')}</select><textarea name="text" maxlength="1500" required placeholder="Ваш відгук про товар"></textarea><label>Фото товару (необов’язково) <input type="file" name="photo" accept="image/*"></label><button class="btn">Опублікувати</button></form>`:'<p>Щоб залишити відгук, увійдіть у свій акаунт.</p>';
  const f=$('#reviewSubmit');if(f)f.onsubmit=async e=>{e.preventDefault();const b=f.querySelector('button');b.disabled=true;try{const file=f.elements.photo.files[0];if(file&&file.size>5*1024*1024)throw Error('Фото має бути до 5 МБ');const photo=file?await up(file):'';await db.ref(`reviews/${id}/${U.uid}`).set({name:(U.displayName||'Покупець').slice(0,80),rating:Number(f.elements.rating.value),text:f.elements.text.value.trim(),photo,ts:Date.now()});toast('Відгук збережено');loadReviews(id)}catch(err){toast('Помилка відгуку: '+err.message);b.disabled=false}};
 }catch(err){list.textContent='Не вдалося завантажити відгуки: '+err.message;form.textContent=''}
}
async function removeReview(id,uid){if(!isAdmin||!confirm('Видалити відгук?'))return;try{await db.ref(`reviews/${id}/${uid}`).remove();loadReviews(id)}catch(err){toast(err.message)}}

// ===== Чат підтримки =====
V.support=async()=>{if(!U){R('<div class="card"><h2>Чат із продавцем</h2><p>Увійдіть, щоб написати повідомлення.</p><button class="btn" onclick="authModal()">Увійти</button></div>');return}
 R('<h2>Чат із продавцем</h2><div class="card row"><div id="chatMessages" class="chat-messages">Завантаження…</div><form id="chatForm" class="row"><textarea name="message" maxlength="2000" placeholder="Напишіть повідомлення" required></textarea><button class="btn">Надіслати</button></form></div>');await openChat(U.uid)};
async function openChat(uid){const box=$('#chatMessages'),form=$('#chatForm');if(!box||!form)return;
 const ref=db.ref('chats/'+uid+'/messages');try{const snap=await ref.get();const rows=Object.values(snap.val()||{}).sort((a,b)=>a.ts-b.ts);box.innerHTML=rows.map(m=>`<div class="chat-bubble ${m.sender===ADMIN_UID?'seller':'buyer'}"><small>${m.sender===ADMIN_UID?'Продавець':'Покупець'}</small><p>${esc(m.text)}</p><small>${new Date(m.ts||Date.now()).toLocaleString('uk-UA')}</small></div>`).join('')||'<p>Напишіть перше повідомлення.</p>';box.scrollTop=box.scrollHeight}catch(e){box.textContent='Помилка чату: '+e.message}
 form.onsubmit=async e=>{e.preventDefault();const val=form.elements.message.value.trim();if(!val)return;const b=form.querySelector('button');b.disabled=true;try{await db.ref('chats/'+uid).update({customerName:U.displayName||U.email||'Покупець',updatedAt:Date.now()});await ref.push({sender:U.uid,text:val,ts:Date.now()});form.reset();openChat(uid)}catch(err){toast('Не вдалося надіслати: '+err.message)}finally{b.disabled=false}};
}
async function adminChatList(){const el=$('#adminChats');if(!el)return;try{const snap=await db.ref('chats').get();const chats=Object.entries(snap.val()||{}).sort((a,b)=>(b[1].updatedAt||0)-(a[1].updatedAt||0));el.innerHTML=chats.map(([uid,c])=>`<button class="chip" onclick="adminOpenChat('${uid}')">${esc(c.customerName||uid)}</button>`).join(' ')||'<p>Повідомлень поки немає.</p>'}catch(e){el.textContent='Помилка чату: '+e.message}}
async function adminOpenChat(uid){if(!isAdmin)return;const box=$('#adminChatMessages');if(!box)return;box.dataset.uid=uid;try{const snap=await db.ref(`chats/${uid}/messages`).get();box.innerHTML=Object.values(snap.val()||{}).sort((a,b)=>a.ts-b.ts).map(m=>`<div class="chat-bubble ${m.sender===ADMIN_UID?'seller':'buyer'}"><small>${m.sender===ADMIN_UID?'Ви':'Покупець'}</small><p>${esc(m.text)}</p></div>`).join('')||'<p>Поки порожньо</p>';box.scrollTop=box.scrollHeight}catch(e){box.textContent=e.message}}
async function adminSendChat(e){e.preventDefault();const f=e.target,uid=$('#adminChatMessages').dataset.uid,text=f.elements.message.value.trim();if(!uid)return toast('Спочатку виберіть покупця');if(!text)return;try{await db.ref(`chats/${uid}/messages`).push({sender:ADMIN_UID,text,ts:Date.now()});await db.ref(`chats/${uid}/updatedAt`).set(Date.now());f.reset();adminOpenChat(uid)}catch(err){toast(err.message)}}

// ===== Обране =====
async function toggleFav(id){if(!P[id])return;const next=!favs[id];if(next)favs[id]=true;else delete favs[id];try{if(U)await db.ref('users/'+U.uid+'/favorites/'+id).set(next?true:null);else localStorage.setItem('svitanok_favorites',JSON.stringify(favs));nav();route();toast(next?'Додано в обране':'Видалено з обраного')}catch(e){if(next)delete favs[id];else favs[id]=true;toast('Не вдалося зберегти обране: '+e.message)}}
V.favorites=()=>{const list=Object.keys(favs).filter(id=>favs[id]&&P[id]).map(id=>({id,...P[id]}));R(`<h2>Обране</h2><p class="muted">Тут зберігаються товари, які вам сподобалися.</p><div class="grid">${list.map(tile).join('')||'<p>Поки що тут порожньо. Натисніть ♡ на товарі, щоб додати його сюди.</p>'}</div>`)};

// ===== Кошик =====
function add(id,n=1){cart[id]=(cart[id]||0)+n;saveCart();toast('Додано в кошик')}
function chg(id,d){cart[id]=(cart[id]||0)+d;if(cart[id]<=0)delete cart[id];saveCart();route()}
const items=()=>Object.entries(cart).filter(([id])=>P[id]);
const total=it=>it.reduce((s,[id,n])=>s+P[id].price*n,0);
V.cart=()=>{const it=items();
 R(`<h2>Кошик</h2>${it.length?`<div class="card">${it.map(([id,n])=>`<div class="ci"><img src="${esc(P[id].img||'')}" alt=""><div style="flex:1"><b>${esc(P[id].name)}</b><br>${money(P[id].price)}</div><button class="btn ghost" onclick="chg('${id}',-1)" aria-label="Менше">−</button><b>${n}</b><button class="btn ghost" onclick="chg('${id}',1)" aria-label="Більше">+</button></div>`).join('')}<p style="text-align:right;font-size:20px;margin:14px 0"><b>Разом: ${money(total(it))}</b></p><a class="btn" href="#/checkout">Оформити замовлення</a></div>`:'<p>Кошик порожній. <a href="#/"><u>Обрати товари</u></a></p>'}`)};

// ===== Оформлення =====
V.checkout=()=>{const it=items();if(!it.length)return location.hash='#/cart';
 if(!U){authModal();return R('<p>Щоб оформити замовлення, увійдіть або зареєструйтесь.</p>')}
 const tot=total(it);
 R(`<h2>Оформлення замовлення</h2><form id="co" class="card row"><div class="two row"><input name="name" placeholder="Імʼя та прізвище" value="${esc(U.displayName||'')}" required><input name="phone" type="tel" placeholder="Телефон +380…" required></div><b>Доставка</b><label><input type="radio" name="dl" value="Нова Пошта" checked><img class="brand-logo" src="assets/nova-poshta.jpg" alt="" aria-hidden="true"> Нова Пошта, відділення</label><label><input type="radio" name="dl" value="Укрпошта"><img class="brand-logo" src="assets/ukrposhta-transparent.png" alt="" aria-hidden="true"> Укрпошта, адреса та індекс</label><label><input type="radio" name="dl" value="Самовивіз"><span class="delivery-logo pickup-logo" aria-hidden="true">⌂</span> Самовивіз</label><div id="dlf" class="row"></div><b>Оплата</b><div class="card-pay-unavailable" role="status"><span aria-hidden="true">💳</span><span><strong>Оплата карткою онлайн</strong><small>Тимчасово недоступна. Скоро додамо!</small></span><span class="card-pay-lock" aria-hidden="true">🔒</span></div><label><input type="radio" name="pay" value="Накладений платіж" checked><span class="pay-symbol" aria-hidden="true">₴</span> Накладений платіж, при отриманні</label><label><input type="radio" name="pay" value="Переказ на картку"><span class="pay-symbol" aria-hidden="true">↗</span> Переказ на картку</label><textarea name="note" placeholder="Коментар до замовлення"></textarea><p style="font-size:20px"><b>До сплати: ${money(tot)}</b></p><button class="btn">Підтвердити замовлення</button></form>`);
 const f=$('#co'),dlf=$('#dlf');
 const setDl=()=>{const t=f.elements.dl.value;
  if(t==='Самовивіз')dlf.innerHTML='<p>Адресу самовивозу уточнимо за телефоном.</p>';
  else if(t==='Нова Пошта')npForm(dlf);
  else dlf.innerHTML=`<input name="city" placeholder="Місто" list="ukr-city-list" autocomplete="address-level2" required><datalist id="ukr-city-list">${['Київ','Львів','Харків','Одеса','Дніпро','Запоріжжя','Вінниця','Тернопіль','Івано-Франківськ','Чернівці','Ужгород','Луцьк','Рівне','Житомир','Хмельницький','Полтава','Черкаси','Чернігів','Суми','Миколаїв','Херсон','Кропивницький','Бортятин','Судова Вишня'].map(x=>`<option value="${x}">`).join('')}</datalist><input name="point" placeholder="${t==='Укрпошта'?'Вулиця, будинок, поштовий індекс':'Номер відділення Нової Пошти'}" required><small class="delivery-hint">Укрпошта: введіть населений пункт, адресу та індекс вручну. Автоматичний довідник відділень потребує окремого API Укрпошти.</small>`};
 f.querySelectorAll('[name=dl]').forEach(r=>r.onchange=setDl);setDl();
 f.onsubmit=async e=>{e.preventDefault();const d=Object.fromEntries(new FormData(f)),b=f.querySelector('.btn'),id=db.ref('orders').push().key;b.disabled=true;
  let customerId='';try{customerId=((await db.ref('users/'+U.uid).get()).val()||{}).customerId||''}catch(err){console.warn('Не вдалося отримати ID покупця',err)}
  const o={uid:U.uid,customerId,email:U.email||'',name:d.name,phone:d.phone,items:it.map(([i,n])=>({id:i,name:P[i].name,price:P[i].price,qty:n})),total:tot,delivery:d.dl,city:d.city||'',point:d.point||'',pay:d.pay,note:d.note||'',status:'new',ts:Date.now()};
  try{await db.ref().update({['orders/'+id]:o,[`users/${U.uid}/orders/${id}`]:o,[`users/${U.uid}/phone`]:d.phone});cart={};saveCart();
   R(`<div class="card"><h2>Дякуємо! Замовлення прийнято</h2><p>Номер замовлення: <b>${id.slice(-6).toUpperCase()}</b></p>${d.pay==='Переказ на картку'?`<p>Сплатіть ${money(tot)} на картку <b>${CARD}</b>, у призначенні вкажіть номер замовлення.</p>`:''}<p style="margin-top:12px"><a class="btn" href="#/profile">Мої замовлення</a></p></div>`)}
  catch(err){toast('Помилка: '+err.message);b.disabled=false}}};
// Пошук доставки з випадаючими списками. Запити йдуть через Netlify Function.
async function deliveryLookup(type,params={}){
 const url=apiEndpoint('novaposhta')+'?'+new URLSearchParams({type,...params});
 const response=await fetch(url,{headers:{Accept:'application/json'}});
 const body=await response.json().catch(()=>({}));
 if(!response.ok)throw Error(body.error||'Не вдалося завантажити дані доставки');
 return body.data||[];
}
function npForm(box){
 box.innerHTML=`<div class="delivery-picker"><label for="np-city">Місто або населений пункт</label><div class="delivery-field"><input id="np-city" name="city" placeholder="Наприклад, Львів" autocomplete="off" required aria-autocomplete="list" aria-controls="np-cities" aria-expanded="false"><div id="np-cities" class="delivery-suggestions" role="listbox" hidden></div></div><small id="np-city-hint" class="delivery-hint">Почніть вводити назву міста (від 2 літер)</small><label for="np-point">Відділення або поштомат</label><div class="delivery-field"><input id="np-point" name="point" placeholder="Спочатку виберіть місто" autocomplete="off" required disabled aria-autocomplete="list" aria-controls="np-points" aria-expanded="false"><div id="np-points" class="delivery-suggestions" role="listbox" hidden></div></div><small id="np-point-hint" class="delivery-hint">Після вибору міста покажемо доступні відділення</small></div>`;
 const city=box.querySelector('#np-city'),point=box.querySelector('#np-point'),cities=box.querySelector('#np-cities'),points=box.querySelector('#np-points'),cityHint=box.querySelector('#np-city-hint'),hint=box.querySelector('#np-point-hint');
 let cityRef='',warehouses=[],timer,citySeq=0,warehouseSeq=0,selectedPoint='';
 const lower=x=>String(x||'').toLocaleLowerCase('uk-UA');
 const hide=(field,list)=>{list.hidden=true;field.setAttribute('aria-expanded','false')};
 const show=(field,list,items,onChoose)=>{
  list.replaceChildren();
  if(!items.length){hide(field,list);return}
  items.forEach(item=>{const btn=document.createElement('button');btn.type='button';btn.className='delivery-option';btn.setAttribute('role','option');btn.textContent=item.label;btn.addEventListener('click',()=>{onChoose(item);hide(field,list)});list.append(btn)});
  list.hidden=false;field.setAttribute('aria-expanded','true');
 };
 const filterPoints=()=>{
  if(!cityRef){hide(point,points);return}
  const q=lower(point.value.trim());
  const matches=warehouses.filter(w=>lower(w.label).includes(q)).slice(0,60);
  show(point,points,matches,item=>{point.value=item.label;selectedPoint=item.ref;hint.textContent='Відділення вибрано'});
  if(!matches.length)hint.textContent='Нічого не знайдено. Спробуйте інший номер або адресу';
 };
 const loadPoints=async(ref)=>{
  const request=++warehouseSeq;point.disabled=true;point.placeholder='Завантажуємо відділення…';hint.textContent='Завантажуємо актуальні відділення';
  try{
   const rows=await deliveryLookup('warehouses',{cityRef:ref});if(request!==warehouseSeq)return;
   warehouses=rows.map(w=>({label:w.Description||w.DescriptionRu||'',ref:w.Ref})).filter(w=>w.label);
   point.disabled=false;point.placeholder='Оберіть або знайдіть відділення';hint.textContent=warehouses.length?'Натисніть на поле для списку або введіть номер':'Відділення не знайдено';
  }catch(e){if(request!==warehouseSeq)return;point.disabled=false;point.placeholder='Введіть номер та адресу вручну';hint.textContent=e.message+' — можна ввести відділення вручну';}
 };
 city.addEventListener('input',()=>{
  clearTimeout(timer);const q=city.value.trim(),request=++citySeq;warehouseSeq++;cityRef='';warehouses=[];selectedPoint='';point.value='';point.disabled=true;point.placeholder='Спочатку виберіть місто';hide(point,points);
  if(q.length<2){hide(city,cities);cityHint.textContent='Введіть щонайменше 2 літери';return}
  cityHint.textContent='Шукаємо населені пункти…';
  timer=setTimeout(async()=>{try{
   const rows=await deliveryLookup('cities',{q});if(request!==citySeq)return;
   const found=rows.map(c=>({label:c.Present||c.MainDescription||c.Description||'',ref:c.DeliveryCity||c.Ref})).filter(c=>c.label&&c.ref);
   cityHint.textContent=found.length?'Виберіть населений пункт зі списку':'Населений пункт не знайдено';
   show(city,cities,found,item=>{city.value=item.label;cityRef=item.ref;cityHint.textContent='Місто вибрано';loadPoints(cityRef)});
  }catch(e){if(request!==citySeq)return;hide(city,cities);cityHint.textContent=e.message+' — перевірте Netlify Functions і NOVA_POSHTA_API_KEY. Місто можна ввести вручну';point.disabled=false;point.placeholder='Введіть номер та адресу вручну';}},300);
 });
 city.addEventListener('keydown',e=>{if(e.key==='Escape')hide(city,cities);if(e.key==='Enter'&&!cities.hidden){e.preventDefault();cities.querySelector('button')?.click()}});
 point.addEventListener('focus',filterPoints);
 point.addEventListener('input',()=>{selectedPoint='';filterPoints()});
 point.addEventListener('keydown',e=>{if(e.key==='Escape')hide(point,points);if(e.key==='Enter'&&!points.hidden){e.preventDefault();points.querySelector('button')?.click()}});
 box.addEventListener('focusout',e=>{if(!box.contains(e.relatedTarget)){setTimeout(()=>{hide(city,cities);hide(point,points)},150)}});
}

// ===== Сповіщення =====
async function markNotificationRead(id){if(!U)return;try{await db.ref(`users/${U.uid}/notifications/${id}/read`).set(true);route()}catch(err){toast('Не вдалося оновити сповіщення: '+err.message)}}
window.markNotificationRead=markNotificationRead;

// ===== Профіль =====
V.profile=async()=>{
 if(!U){authModal();R('<p>Увійдіть, щоб відкрити профіль.</p>');return}
 R('<div class="card"><p>Завантажуємо профіль…</p></div>');
 let s={},loadError='';
 try{s=(await db.ref('users/'+U.uid).get()).val()||{}}
 catch(err){console.error('Помилка завантаження профілю:',err);loadError='Не вдалося завантажити дані профілю з Firebase. Перевірте підключення та правила доступу.'}
 const os=Object.entries(s.orders||{}).sort((a,b)=>b[1].ts-a[1].ts),notifications=Object.entries(s.notifications||{}).sort((a,b)=>b[1].ts-a[1].ts);
 R(`<h2>Профіль</h2>${loadError?`<div class="card" role="alert">${esc(loadError)}</div>`:''}<form id="pf" class="card row"><input name="name" value="${esc(U.displayName||s.name||'')}" placeholder="Імʼя"><input name="phone" value="${esc(s.phone||'')}" placeholder="Телефон"><p>${esc(U.email)}</p><div class="customer-id"><span>Ваш ID покупця</span><b>${esc(s.customerId||'Поки не створено')}</b><button type="button" class="btn ghost" id="copyid" ${s.customerId?'':'disabled'}>Копіювати ID</button></div><div><button class="btn">Зберегти</button> <button type="button" class="btn ghost" id="out">Вийти</button></div></form><h3>Сповіщення ${notifications.some(([,n])=>!n.read)?'<span class="badge">Нові</span>':''}</h3>${notifications.slice(0,20).map(([nid,n])=>`<div class="card notification ${n.read?'read':'unread'}"><b>${esc(n.title||'Сповіщення')}</b><p>${esc(n.text||'')}</p><small>${new Date(n.ts||Date.now()).toLocaleString('uk-UA')}</small>${!n.read?` <button class="chip" type="button" onclick="markNotificationRead('${nid}')">Позначити прочитаним</button>`:''}</div>`).join('')||'<p>Поки немає сповіщень.</p>'}<h3>Мої замовлення</h3>${os.map(([id,o])=>`<div class="card order-card"><div class="order-head"><b>Замовлення № ${id.slice(-6).toUpperCase()}</b><span class="status-pill">${esc(ST[o.status]||o.status||'Нове')}</span></div><small>${new Date(o.ts).toLocaleDateString('uk-UA')}</small><p>${(o.items||[]).map(i=>esc(i.name)+' × '+i.qty).join(', ')}</p><b>${money(o.total)}</b>${orderTimeline(o)}${trackingCustomer({...o,orderId:id})}<p class="muted">${esc(o.delivery)} ${esc(o.city||'')} ${esc(o.point||'')} · ${esc(o.pay)}</p></div>`).join('')||'<p>Замовлень ще немає.</p>'}`);
 $('#out').onclick=()=>auth.signOut().then(()=>location.hash='#/').catch(err=>toast('Не вдалося вийти: '+err.message));
 const copyBtn=$('#copyid');if(copyBtn&&s.customerId)copyBtn.onclick=async()=>{try{await navigator.clipboard.writeText(s.customerId);toast('ID скопійовано')}catch(e){toast('Не вдалося скопіювати ID')}};
 $('#pf').onsubmit=async e=>{e.preventDefault();const d=Object.fromEntries(new FormData(e.target)),b=e.target.querySelector('.btn');b.disabled=true;try{await U.updateProfile({displayName:d.name});await db.ref('users/'+U.uid).update({name:d.name,phone:d.phone});nav();toast('Профіль збережено')}catch(err){console.error(err);toast('Не вдалося зберегти профіль: '+err.message)}finally{b.disabled=false}};
};

// ===== Автоматичне відстеження =====
async function shipmentRequest(action,orderId,extra={}){
 if(!U)throw Error('Потрібно увійти');
 const token=await U.getIdToken();
 const response=await fetch(apiEndpoint('shipment'),{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify({action,orderId,...extra})});
 const data=await response.json().catch(()=>({}));
 if(!response.ok)throw Error(data.error||'Не вдалося оновити відстеження');
 return data;
}
async function saveTracking(e,orderId){e.preventDefault();if(!isAdmin)return;const f=e.currentTarget,btn=f.querySelector('button');btn.disabled=true;try{
 const carrier=f.elements.carrier.value,number=f.elements.number.value.trim().toUpperCase().replace(/\s/g,'');
 const data=await shipmentRequest('save',orderId,{carrier,number});toast('ТТН збережено. '+(data.warning||'Статус отримано.'));
 const row=window.adminOrdersCache?.find(([id])=>id===orderId);if(row){row[1].tracking={carrier,number,...(data.tracking||{})};drawAdminOrders(window.adminOrdersCache)}
 }catch(err){toast(err.message)}finally{btn.disabled=false}}
async function refreshTracking(orderId){try{const d=await shipmentRequest('refresh',orderId);toast(d.tracking?.status||d.warning||'Статус перевірено');const row=window.adminOrdersCache?.find(([id])=>id===orderId);if(row){row[1].tracking=d.tracking;drawAdminOrders(window.adminOrdersCache)}}catch(e){toast(e.message)}}
function trackingAdminForm(id,o){if(!/нова|укрпошта/i.test(o.delivery||''))return '<small>Самовивіз — без ТТН</small>';
 const carrier=o.tracking?.carrier||(/укрпошта/i.test(o.delivery)?'ukrposhta':'novaposhta');
 return `<form class="tracking-admin-form" onsubmit="saveTracking(event,'${id}')"><select name="carrier"><option value="novaposhta" ${carrier==='novaposhta'?'selected':''}>Нова пошта</option><option value="ukrposhta" ${carrier==='ukrposhta'?'selected':''}>Укрпошта</option></select><input name="number" maxlength="24" value="${esc(o.tracking?.number||'')}" placeholder="Номер ТТН" required><button class="btn" type="submit">Зберегти ТТН</button></form>${o.tracking?.number?`<div class="tracking-status"><small>${esc(o.tracking.status||'Очікуємо дані перевізника')}</small><button class="btn ghost" type="button" onclick="refreshTracking('${id}')">↻ Перевірити</button></div>`:''}`}
function trackingCustomer(o){const t=o.tracking;if(!t?.number)return '';
 const provider=t.carrier==='ukrposhta'?'Укрпошта':'Нова пошта';
 return `<section class="tracking-customer"><strong>📦 Відстеження: ${provider}</strong><p>ТТН: <b>${esc(t.number)}</b></p><p>${esc(t.status||'Очікуємо дані перевізника')}</p>${t.location?`<small>Місце: ${esc(t.location)}</small>`:''}${t.eventDate?`<small>Подія: ${esc(t.eventDate)}</small>`:''}${t.checkedAt?`<small>Перевірено: ${new Date(t.checkedAt).toLocaleString('uk-UA')}</small>`:''}<button type="button" class="btn ghost" onclick="refreshMyTracking('${esc(o.orderId||'')}')" ${o.orderId?'':'disabled'}>↻ Оновити статус</button></section>`}
async function refreshMyTracking(orderId){try{await shipmentRequest('refresh',orderId);toast('Статус оновлено');V.profile()}catch(e){toast(e.message)}}
window.saveTracking=saveTracking;window.refreshTracking=refreshTracking;window.refreshMyTracking=refreshMyTracking;
// ===== Адмін-панель =====
function ed(id){const p=P[id],x=$('#pf').elements;editId=id;pendingPhotos=productPhotos(p);renderPhotoPreviews();x.name.value=p.name;x.price.value=p.price;x.cat.value=p.cat||'';x.desc.value=p.desc||'';x.img.value=p.img||'';$('#ft').textContent='Редагування: '+p.name;scrollTo(0,0)}
function renderPhotoPreviews(){const el=document.getElementById('photoPreviews');if(!el)return;el.innerHTML=pendingPhotos.map((url,i)=>`<div class="photo-preview"><img src="${esc(url)}" alt="Фото ${i+1}"><button type="button" onclick="removeProductPhoto(${i})" aria-label="Видалити фото ${i+1}">×</button>${i===0?'<small>Головне</small>':''}</div>`).join('')}
function removeProductPhoto(i){pendingPhotos.splice(i,1);renderPhotoPreviews()}
function del(id){if(confirm('Видалити товар?'))db.ref('products/'+id).remove()}
async function setSt(id,uid,v){
 try{
  const label=ST[v]||v,ts=Date.now(),nid=db.ref(`users/${uid}/notifications`).push().key;
  await db.ref().update({
   [`orders/${id}/status`]:v,[`orders/${id}/updatedAt`]:ts,
   [`users/${uid}/orders/${id}/status`]:v,[`users/${uid}/orders/${id}/updatedAt`]:ts,
   [`users/${uid}/notifications/${nid}`]:{title:'Оновлено статус замовлення',text:`Замовлення №${id.slice(-6).toUpperCase()}: ${label}`,orderId:id,status:v,ts,read:false}
  });
  toast('Статус оновлено. Покупцю надіслано сповіщення.');
 }catch(err){console.error(err);toast('Не вдалося змінити статус: '+err.message)}
}
window.setSt=setSt;
function adminOrdersMarkup(os){
 return `<h3>Замовлення</h3><div class="card row"><div class="two row"><input id="orderSearch" type="search" placeholder="Пошук: номер, ім’я, телефон, email або ID покупця"><select id="orderStatus"><option value="">Усі статуси</option>${Object.entries(ST).map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}</select></div><div id="ordersTable" class="scroll"></div></div>`;
}
function drawAdminOrders(os){
 const term=($('#orderSearch')?.value||'').trim().toLowerCase(),status=$('#orderStatus')?.value||'';
 const filtered=os.filter(([id,o])=>{const hay=[id,id.slice(-6),o.name,o.phone,o.email,o.uid,o.customerId].join(' ').toLowerCase();return (!term||hay.includes(term))&&(!status||o.status===status)});
 $('#ordersTable').innerHTML=`<table><tr><th>№ / дата</th><th>Клієнт</th><th>Товари</th><th>Сума</th><th>Доставка й оплата</th><th>Статус / ТТН</th></tr>${filtered.map(([id,o])=>`<tr><td>${id.slice(-6).toUpperCase()}<br>${new Date(o.ts).toLocaleString('uk-UA')}</td><td>${esc(o.name)}<br>${esc(o.phone)}<br>${esc(o.email)}<br><small>ID: ${esc(o.customerId||o.uid)}</small></td><td>${(o.items||[]).map(i=>esc(i.name)+' × '+i.qty).join('<br>')}</td><td>${money(o.total)}</td><td>${esc(o.delivery)}<br>${esc(o.city)} ${esc(o.point)}<br>${esc(o.pay)}<br>${esc(o.note)}</td><td><select onchange="setSt('${id}','${esc(o.uid)}',this.value)">${Object.entries(ST).map(([k,v])=>`<option value="${k}" ${k===o.status?'selected':''}>${v}</option>`).join('')}</select>${trackingAdminForm(id,o)}</td></tr>`).join('')||'<tr><td colspan="6">Замовлень за цими умовами не знайдено.</td></tr>'}</table>`;
}
V.admin=async()=>{editId=null;if(!isAdmin)return R('<div class="card"><h2>Немає доступу до адмін-панелі</h2><p>Увійдіть у Google-акаунт адміністратора. Якщо ви вже увійшли, перевірте, чи збігається UID у Firebase Authentication.</p></div>');
 let os=[],ordersError='';
  try {os=Object.entries((await db.ref('orders').get()).val()||{}).sort((a,b)=>(b[1].ts||0)-(a[1].ts||0));}
  catch(err){console.error('Помилка завантаження замовлень:',err);ordersError=err.code==='PERMISSION_DENIED'||err.code==='permission_denied'?'Firebase заборонив читання замовлень. Перевір правила Realtime Database та UID акаунта.':'Не вдалося завантажити замовлення: '+err.message;}
  const cats=[...new Set(Object.values(P).map(p=>p.cat).filter(Boolean))];
 pendingPhotos=[];R(`<div class="admin-dashboard"><aside class="admin-side"><div class="admin-brand">Сонечко <span>ADMIN</span></div><nav class="admin-tabs">${[['stats','▥ Статистика'],['products','▣ Товари'],['banners','▧ Банери'],['orders','▤ Замовлення'],['chats','▢ Повідомлення'],['customers','♙ Покупці']].map(([id,label],i)=>`<button class="admin-tab ${id==='stats'?'active':''}" data-tab="${id}" onclick="adminSection('${id}')">${label}</button>`).join('')}</nav><div class="admin-side-note">Панель керування магазином</div></aside><div class="admin-workspace"><div class="admin-topline"><div><small>Панель керування / Сонечко</small><h2 id="adminHeading">Статистика</h2></div><div class="admin-online">● Firebase</div></div><section class="admin-panel-section" data-section="products" hidden>${ordersError?`<div class="card" role="alert" style="border:1px solid #e9a0a0;padding:16px;margin-bottom:16px"><strong>Помилка замовлень:</strong> ${esc(ordersError)}</div>`:''}<form id="pf" class="card row"><h3 id="ft">Новий товар</h3><input name="name" placeholder="Назва" required><div class="two row"><input name="price" type="number" min="0" step="0.01" placeholder="Ціна, ₴" required><input name="cat" placeholder="Категорія" list="cats"></div><datalist id="cats">${cats.map(c=>`<option value="${esc(c)}">`).join('')}</datalist><textarea name="desc" placeholder="Опис"></textarea><label>Фотографії товару (до 10)</label><input name="file" type="file" accept="image/*" multiple><div id="photoPreviews" class="photo-previews"></div><small>Можна додати кілька фото. Перше фото буде головним. Щоб змінити головне, видаліть перше та завантажте його знову в потрібному порядку.</small><input name="img" type="hidden"><div><button class="btn">Зберегти товар</button> <button type="button" class="btn ghost" onclick="route()">Очистити форму</button></div></form>
 <h3>Товари</h3><div class="card">${Object.entries(P).map(([id,p])=>`<div class="ci"><img src="${esc(p.img||'')}" alt=""><div style="flex:1">${esc(p.name)}<br>${money(p.price)}, ${esc(p.cat||'без категорії')}</div><button class="btn ghost" onclick="ed('${id}')">Змінити</button><button class="btn ghost" onclick="del('${id}')">Видалити</button></div>`).join('')||'<p>Товарів ще немає. Додайте перший вище.</p>'}</div>
</section><section class="admin-panel-section" data-section="banners" hidden><h3>Банери головної сторінки</h3><p>Рекомендований розмір 1600 × 600 px. Зображення завантажуються в Cloudinary.</p><form class="card row" onsubmit="saveBanner(event)"><input name="title" maxlength="90" placeholder="Заголовок" required><input name="subtitle" maxlength="160" placeholder="Опис"><input name="link" placeholder="Посилання, наприклад #/"><input name="buttonText" placeholder="Текст кнопки"><label>Фото банера <input name="photo" type="file" accept="image/*" required></label><button type="submit" class="btn">Додати банер</button></form><div id="adminBanners" class="card row"></div></section><section class="admin-panel-section" data-section="orders" hidden>${adminOrdersMarkup(os)}</section><section class="admin-panel-section" data-section="stats"><h3>Статистика магазину</h3><label>Період <select id="statsPeriod" onchange="drawStats(window.adminOrdersCache||[])"><option value="7">7 днів</option><option value="30">30 днів</option><option value="90">90 днів</option><option value="all">Увесь час</option></select></label><div id="adminStats" class="card">Завантаження статистики…</div></section><section class="admin-panel-section" data-section="customers" hidden><h3>Керування покупцями</h3><p class="muted">Пошук за ім’ям, email, телефоном або ID. Блокування обмежує відгуки, нові замовлення та повідомлення, але не вимикає Firebase Authentication.</p><input id="customerSearch" type="search" placeholder="Знайти покупця" oninput="filterCustomers()"><div id="adminCustomers" class="card row">Завантаження…</div></section><section class="admin-panel-section" data-section="chats" hidden><h3>Чати покупців</h3><div class="card row"><div id="adminChats"></div><div id="adminChatMessages" class="chat-messages">Виберіть покупця</div><form onsubmit="adminSendChat(event)" class="row"><textarea name="message" maxlength="2000" placeholder="Відповідь покупцю" required></textarea><button class="btn">Надіслати відповідь</button></form></div></section></div></div>`);
 window.adminOrdersCache=os;drawAdminOrders(os);drawStats(os);adminChatList();drawBanners();loadAdminCustomers();$('#orderSearch').oninput=()=>drawAdminOrders(os);$('#orderStatus').onchange=()=>drawAdminOrders(os);
 $('#pf').onsubmit=async e=>{e.preventDefault();const f=e.target,x=f.elements,b=f.querySelector('.btn');b.disabled=true;
  try{const files=Array.from(x.file.files||[]);if(pendingPhotos.length+files.length>10)throw new Error('Максимум 10 фотографій');let images=[...pendingPhotos];for(let i=0;i<files.length;i++){toast(`Завантаження фото ${i+1} із ${files.length}…`);images.push(await up(files[i]))}if(!images.length)throw new Error('Додайте хоча б одне фото');
   const p={name:x.name.value,price:+x.price.value,cat:x.cat.value.trim(),desc:x.desc.value,img:images[0],images,ts:Date.now()};
   if(editId){p.ts=P[editId].ts||p.ts;await db.ref('products/'+editId).set(p)}else await db.ref('products').push(p);
   toast('Товар збережено')}catch(err){toast('Помилка: '+err.message);b.disabled=false}}};
saveCart();

function drawStats(os){
 const el=$('#adminStats');if(!el)return;const period=$('#statsPeriod')?.value||'7';const filteredOrders=period==='all'?os:os.filter(([,o])=>Number(o.ts||0)>=Date.now()-Number(period)*86400000);os=filteredOrders;
 const done=o=>['delivered','done','paid'].includes(o.status);
 const completed=os.filter(([,o])=>done(o));
 const revenue=completed.reduce((n,[,o])=>n+Number(o.total||0),0);
 const cancelled=os.filter(([,o])=>['cancelled','cancel'].includes(o.status)).length;
 const processing=os.length-completed.length-cancelled;
 const customerIds=new Set(os.map(([,o])=>o.uid||o.customerId).filter(Boolean));
 const counts={};completed.forEach(([,o])=>(o.items||[]).forEach(i=>{let key=i.name||i.id||'Товар';counts[key]=(counts[key]||0)+Number(i.qty||0)}));
 const best=Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,5);
 const now=new Date(), days=Array.from({length:7},(_,i)=>{let d=new Date(now.getFullYear(),now.getMonth(),now.getDate()-6+i);return d});
 const vals=days.map(d=>completed.filter(([,o])=>{let t=new Date(o.ts||0);return t.toDateString()===d.toDateString()}).reduce((n,[,o])=>n+Number(o.total||0),0));
 const max=Math.max(1,...vals),w=640,h=190,points=vals.map((v,i)=>`${30+i*96},${h-25-(v/max)*145}`);
 const poly=points.join(' '),area=`30,${h-25} ${poly} ${30+6*96},${h-25}`;
 const pct=n=>os.length?Math.round(n/os.length*100):0;
 const total=completed.length+processing+cancelled;
 const donut=total?`conic-gradient(#9565ff 0 ${pct(completed.length)}%,#27c17a ${pct(completed.length)}% ${pct(completed.length+processing)}%,#ffb82e ${pct(completed.length+processing)}% 100%)`:'conic-gradient(#34334c 0 100%)';
 el.innerHTML=`<div class="dash-metrics">
 <div class="dash-card"><span class="dash-symbol">▤</span><small>Замовлення</small><strong>${os.length}</strong><span class="dash-caption">Усього в базі</span></div>
 <div class="dash-card"><span class="dash-symbol">◉</span><small>Дохід</small><strong>${money(revenue)}</strong><span class="dash-caption">Виконані й оплачені</span></div>
 <div class="dash-card"><span class="dash-symbol">♙</span><small>Покупці</small><strong>${customerIds.size}</strong><span class="dash-caption">Унікальні в замовленнях</span></div>
 <div class="dash-card"><span class="dash-symbol">▣</span><small>Товари</small><strong>${Object.keys(P).length}</strong><span class="dash-caption">У каталозі</span></div></div>
 <div class="dash-panels"><article class="dash-panel dash-chart"><h3>Дохід за останні 7 днів (у вибраному періоді)</h3><strong>${money(vals.reduce((a,b)=>a+b,0))}</strong><svg viewBox="0 0 640 190" role="img" aria-label="Графік доходу за 7 днів"><defs><linearGradient id="dashArea" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#9565ff" stop-opacity=".55"/><stop offset="1" stop-color="#9565ff" stop-opacity=".03"/></linearGradient></defs>${[35,75,115,155].map(y=>`<line x1="25" x2="620" y1="${y}" y2="${y}" stroke="#2c2e45"/>`).join('')}<polygon points="${area}" fill="url(#dashArea)"/><polyline points="${poly}" fill="none" stroke="#986bff" stroke-width="3" stroke-linejoin="round"/>${points.map(pt=>{const [x,y]=pt.split(',');return `<circle cx="${x}" cy="${y}" r="4" fill="#a47cff"/>`}).join('')}</svg><div class="dash-days">${days.map(d=>`<span>${['Нд','Пн','Вт','Ср','Чт','Пт','Сб'][d.getDay()]}</span>`).join('')}</div></article>
 <article class="dash-panel"><h3>Замовлення за статусом</h3><div class="dash-donut-wrap"><div class="dash-donut" style="background:${donut}"><div><strong>${os.length}</strong><small>разом</small></div></div><div class="dash-legend"><div><i style="background:#9565ff"></i>Виконано <b>${completed.length} (${pct(completed.length)}%)</b></div><div><i style="background:#27c17a"></i>В обробці <b>${processing} (${pct(processing)}%)</b></div><div><i style="background:#ffb82e"></i>Скасовано <b>${cancelled} (${pct(cancelled)}%)</b></div></div></div></article></div>
 <div class="dash-panels dash-lower"><article class="dash-panel"><h3>Топ товарів</h3>${best.map(([name,n],i)=>`<div class="dash-product"><span>${i+1}</span><b>${esc(name)}</b><small>${n} шт.</small></div>`).join('')||'<p class="dash-empty">Продажів ще немає</p>'}</article><article class="dash-panel"><h3>Огляд магазину</h3><div class="dash-summary"><strong>${completed.length}</strong><span>завершених замовлень</span></div><div class="dash-summary"><strong>${processing}</strong><span>замовлень у роботі</span></div><div class="dash-summary"><strong>${Object.keys(banners).filter(k=>banners[k].enabled!==false).length}</strong><span>активних банерів</span></div></article></div>
 <p class="dash-footnote">Дані з Firebase Realtime Database. Дохід обчислюється за сумами замовлень зі статусами «Доставлено», «Виконано» або «Оплачено», а не за банківськими транзакціями. Покупці — унікальні ID в замовленнях, не загальна кількість зареєстрованих користувачів.</p>`;
}

// ===== Покупці / історія замовлення =====
const ORDER_STEPS=[['new','Прийнято'],['confirmed','Підтверджено'],['packing','Збирається'],['shipped','Відправлено'],['delivered','Доставлено']];
function orderTimeline(o){
 const aliases={paid:1,sent:3,done:4};const current=ORDER_STEPS.findIndex(([k])=>k===o.status);const at=current>=0?current:(aliases[o.status]??0);
 if(['cancelled','cancel'].includes(o.status))return '<div class="order-cancelled">Замовлення скасовано</div>';
 return `<div class="order-timeline" aria-label="Етапи замовлення">${ORDER_STEPS.map(([k,label],i)=>`<div class="order-step ${i<=at?'completed':''}" ${i===at?'aria-current="step"':''}><span>${i<at?'✓':i+1}</span><small>${label}</small></div>`).join('')}</div>`;
}
let adminCustomerRows=[];
async function loadAdminCustomers(){
 const el=$('#adminCustomers');if(!el||!isAdmin)return;
 try{const [u,b]=await Promise.all([db.ref('users').get(),db.ref('blockedUsers').get()]);const blocked=b.val()||{};
 adminCustomerRows=Object.entries(u.val()||{}).map(([uid,v])=>({uid,...v,blocked:blocked[uid]===true}));filterCustomers();}
 catch(e){el.innerHTML='<p class="delivery-hint">Немає доступу до списку покупців. Опублікуйте оновлені правила Realtime Database з файлу database.rules.json і переконайтеся, що ввійшли під адмін-акаунтом. Код: '+esc(e.code||e.message)+'</p>';}
}
function filterCustomers(){const el=$('#adminCustomers');if(!el)return;const term=($('#customerSearch')?.value||'').trim().toLowerCase();const rows=adminCustomerRows.filter(x=>[x.name,x.email,x.phone,x.customerId,x.uid].join(' ').toLowerCase().includes(term));el.innerHTML=rows.map(x=>`<div class="customer-admin-row"><div><strong>${esc(x.name||'Покупець')}</strong><small>${esc(x.email||'')} · ${esc(x.phone||'')}</small><small>ID: ${esc(x.customerId||x.uid)}</small><small>Замовлень у профілі: ${Object.keys(x.orders||{}).length}</small></div><button type="button" class="btn ghost" onclick="toggleCustomerBlock('${x.uid}',${!x.blocked})" ${x.uid===ADMIN_UID?'disabled':''}>${x.blocked?'Розблокувати':'Заблокувати'}</button></div>`).join('')||'<p>Покупців не знайдено.</p>'}
async function toggleCustomerBlock(uid,value){if(!isAdmin||uid===ADMIN_UID)return;if(!confirm(value?'Обмежити дії покупця?':'Зняти обмеження?'))return;try{await db.ref('blockedUsers/'+uid).set(value);toast(value?'Покупця обмежено':'Обмеження знято');await loadAdminCustomers()}catch(e){toast('Помилка: '+e.message)}}
