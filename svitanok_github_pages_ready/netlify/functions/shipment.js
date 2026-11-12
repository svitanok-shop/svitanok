const corsHeaders=(event)=>{
 const origin=event.headers?.origin||event.headers?.Origin||'';
 const allowed=/^https:\/\/[a-z0-9-]+\.github\.io$/i.test(origin)||/^http:\/\/localhost(?::\d+)?$/i.test(origin);
 return allowed?{'Access-Control-Allow-Origin':origin,'Vary':'Origin','Access-Control-Allow-Headers':'Content-Type, Authorization','Access-Control-Allow-Methods':'GET, POST, OPTIONS'}:{};
};
const {ADMIN_UID,database,verify,updateStatus}=require('./shipment-core');
exports.handler=async event=>{
 const respond=(code,body)=>({statusCode:code,headers:{'Content-Type':'application/json','Cache-Control':'no-store',...corsHeaders(event)},body:JSON.stringify(body)});
 if(event.httpMethod==='OPTIONS')return {statusCode:204,headers:corsHeaders(event),body:''};
 if(event.httpMethod!=='POST')return respond(405,{error:'Тільки POST'});
 try{
  const user=await verify(event),body=JSON.parse(event.body||'{}');const orderId=String(body.orderId||'');
  if(!/^[A-Za-z0-9_-]{8,80}$/.test(orderId))return respond(400,{error:'Неправильний ID замовлення'});
  const ref=database().ref('orders/'+orderId),snap=await ref.get(),o=snap.val();if(!o)return respond(404,{error:'Замовлення не знайдено'});
  if(user.uid!==ADMIN_UID&&user.uid!==o.uid)return respond(403,{error:'Немає доступу до цього замовлення'});
  if(body.action==='save'){
   if(user.uid!==ADMIN_UID)return respond(403,{error:'Лише адміністратор може змінити ТТН'});
   const carrier=String(body.carrier||''),number=String(body.number||'').toUpperCase().replace(/\s/g,'');
   if(!['novaposhta','ukrposhta'].includes(carrier)||!(carrier==='novaposhta'?/^\d{14}$/:/^[A-Z0-9]{13,24}$/).test(number))return respond(400,{error:'Перевір номер ТТН та службу доставки'});
   if(!((carrier==='novaposhta'&&/нова/i.test(o.delivery||''))||(carrier==='ukrposhta'&&/укрпошта/i.test(o.delivery||''))))return respond(400,{error:'Перевізник не збігається з доставкою замовлення'});
   const tracking={carrier,number,status:'Очікуємо реєстрації у перевізника',checkedAt:0};
   await database().ref().update({['orders/'+orderId+'/tracking']:tracking,['users/'+o.uid+'/orders/'+orderId+'/tracking']:tracking});o.tracking=tracking;
   return respond(200,await updateStatus(orderId,o));
  }
  if(body.action==='refresh'){
   if(!o.tracking?.number)return respond(400,{error:'ТТН ще не додана'});
   if(user.uid!==ADMIN_UID&&o.tracking.checkedAt&&Date.now()-o.tracking.checkedAt<60000)return respond(200,{tracking:o.tracking,warning:'Оновлення доступне раз на хвилину'});
   return respond(200,await updateStatus(orderId,o));
  }
  return respond(400,{error:'Невідома дія'});
 }catch(e){console.error('Shipment function:',e.message);return respond(/авторизац|token|auth/i.test(e.message)?401:500,{error:'Не вдалося обробити запит. Перевір налаштування Netlify та API.'})}
};
