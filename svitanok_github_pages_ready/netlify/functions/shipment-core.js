const admin=require('firebase-admin');
const ADMIN_UID='XCD8tXDhLuNw9sTviWowTD86Myg2';
function getApp(){if(!admin.apps.length){const raw=process.env.FIREBASE_SERVICE_ACCOUNT_JSON;if(!raw)throw Error('FIREBASE_SERVICE_ACCOUNT_JSON не налаштовано');const credential=admin.credential.cert(JSON.parse(raw));admin.initializeApp({credential,databaseURL:'https://sonechko-c1d59-default-rtdb.firebaseio.com'});}return admin.app()}
const database=()=>getApp().database();
async function verify(event){const token=(event.headers.authorization||event.headers.Authorization||'').match(/^Bearer (.+)$/)?.[1];if(!token)throw Error('Необхідна авторизація');return getApp().auth().verifyIdToken(token)}
const clean=x=>String(x||'').trim();
async function carrierStatus(carrier,number){
 const ctrl=new AbortController(),timeout=setTimeout(()=>ctrl.abort(),12000);
 try{
 if(carrier==='novaposhta'){
  const key=process.env.NOVA_POSHTA_API_KEY;if(!key)throw Error('Не налаштований NOVA_POSHTA_API_KEY');
  const r=await fetch('https://api.novaposhta.ua/v2.0/json/',{method:'POST',headers:{'Content-Type':'application/json'},signal:ctrl.signal,body:JSON.stringify({apiKey:key,modelName:'TrackingDocument',calledMethod:'getStatusDocuments',methodProperties:{Documents:[{DocumentNumber:number}]}})});
  if(!r.ok)throw Error('Нова пошта тимчасово недоступна');const j=await r.json();if(!j.success||!j.data?.[0]||j.data[0].StatusCode==='3')throw Error((j.errors||[]).join('; ')||'ТТН ще не знайдено у Новій пошті');const x=j.data[0];return {status:clean(x.Status).slice(0,250),statusCode:clean(x.StatusCode),location:clean(x.CityRecipient||x.WarehouseRecipient).slice(0,120),eventDate:clean(x.ActualDeliveryDate||x.RecipientDateTime||x.DateCreated).slice(0,60)};
 }
 const bearer=process.env.UKRPOSHTA_TRACKING_BEARER;if(!bearer)throw Error('Не налаштований UKRPOSHTA_TRACKING_BEARER');
 const r=await fetch('https://www.ukrposhta.ua/status-tracking/0.0.1/statuses/last?barcode='+encodeURIComponent(number),{headers:{'Authorization':'Bearer '+bearer,'Accept':'application/json'},signal:ctrl.signal});if(!r.ok)throw Error(r.status===404?'Укрпошта ще не зареєструвала цю посилку':'Помилка API Укрпошти ('+r.status+')');const x=await r.json();if(!x||!x.eventName)throw Error('Немає статусу Укрпошти');return {status:clean(x.eventName).slice(0,250),statusCode:String(x.event||''),location:clean(x.name).slice(0,120),eventDate:clean(x.date).slice(0,60)};
 }finally{clearTimeout(timeout)}
}
async function updateStatus(orderId,o){const old=o.tracking;if(!old?.number)return {warning:'ТТН ще не вказана'};let info,warning='';try{info=await carrierStatus(old.carrier,old.number)}catch(e){warning=e.message}
 const tracking={...old,...(info||{}),checkedAt:Date.now(),...(warning?{lastError:warning}:{lastError:null})};
 const updates={['orders/'+orderId+'/tracking']:tracking,['users/'+o.uid+'/orders/'+orderId+'/tracking']:tracking};
 await database().ref().update(updates);return {tracking,warning};
}
module.exports={ADMIN_UID,database,verify,updateStatus};
