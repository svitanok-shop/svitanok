const corsHeaders=(event)=>{
 const origin=event.headers?.origin||event.headers?.Origin||'';
 const allowed=/^https:\/\/[a-z0-9-]+\.github\.io$/i.test(origin)||/^http:\/\/localhost(?::\d+)?$/i.test(origin);
 return allowed?{'Access-Control-Allow-Origin':origin,'Vary':'Origin','Access-Control-Allow-Headers':'Content-Type, Authorization','Access-Control-Allow-Methods':'GET, POST, OPTIONS'}:{};
};
// Netlify Function: API key stays on server, not in app.js.
exports.handler=async(event)=>{
 const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'public, max-age=60',...corsHeaders(event)};
 const respond=(statusCode,obj)=>({statusCode,headers,body:JSON.stringify(obj)});
 if(event.httpMethod==='OPTIONS')return {statusCode:204,headers:corsHeaders(event),body:''};
 if(event.httpMethod!=='GET')return respond(405,{error:'Method not allowed'});
 const key=process.env.NOVA_POSHTA_API_KEY;
 if(!key)return respond(503,{error:'API Нової пошти ще не налаштовано на Netlify'});
 const {type,q='',cityRef=''}=event.queryStringParameters||{};
 if(type==='cities'&&(q.trim().length<2||q.length>80))return respond(400,{error:'Введіть назву міста'});
 if(type==='warehouses'&&!/^[a-zA-Z0-9-]{8,64}$/.test(cityRef))return respond(400,{error:'Спочатку виберіть місто'});
 if(!['cities','warehouses'].includes(type))return respond(400,{error:'Невідомий тип запиту'});
 const body=type==='cities'?{apiKey:key,modelName:'AddressGeneral',calledMethod:'searchSettlements',methodProperties:{CityName:q.trim(),Limit:30}}:{apiKey:key,modelName:'AddressGeneral',calledMethod:'getWarehouses',methodProperties:{CityRef:cityRef,Limit:500}};
 try{
  const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),12000);
  let response;try{response=await fetch('https://api.novaposhta.ua/v2.0/json/',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:controller.signal})}finally{clearTimeout(timeout)}
  if(!response.ok)return respond(502,{error:'Сервіс доставки тимчасово недоступний'});
  const result=await response.json();
  if(result.success===false)return respond(502,{error:'Помилка API Нової пошти: '+(result.errors||[]).join(', ').slice(0,180)});
  const rows=type==='cities'?(result.data?.[0]?.Addresses||[]):(result.data||[]);
  return respond(200,{data:rows});
 }catch(e){return respond(502,{error:'Не вдалося отримати дані Нової пошти'})}
};
